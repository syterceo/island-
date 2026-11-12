import {
  animate,
  AnimatePresence,
  cancelFrame,
  frame,
  motion,
  motionValue,
  useTransform,
  type MotionValue,
} from 'motion/react';
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { ActivityView, IslandControllers } from '../ActivityView';
import { nudgeVolume } from '../activities/volume/actions';
import { IDLE_ID } from '../definitions';
import { onEffect } from '../effects';
import { useFileDrop } from '../hooks/useFileDrop';
import { usePresentation } from '../hooks/usePresentation';
import { BUBBLE_GAP, BUBBLE_SIZE, FLOATING_TOP, MAX_SIZE } from '../metrics';
import { fx, scaled, spring, tween } from '../motion/springs';
import { VIEW_STATE } from '../motion/variants';
import type { ResolvedView } from '../presentation';
import { useIslandStore } from '../store';
import css from './Island.module.css';
import { islandPath } from './shape';
import { useGestures } from './useGestures';

/*
 * Morph engine.
 *
 * Springs drive plain numbers (width, height, radius, offset, bubble). Every frame they are
 * turned into the silhouette, an SVG path on a fixed canvas, and into a rounded box that clips
 * the content. Three rules keep it steady:
 *
 * - Views never take part in layout while the shape moves. Each sits at its final size at a
 *   fixed whole pixel position, and the clip box cancels its own offset for them.
 * - Only the edges of the shape may overshoot. Everything that carries content (the sideways
 *   shift, the bubble) is critically damped, and content itself fades and rises with tweens,
 *   so nothing passes its resting place and comes back.
 * - Content is clipped by a rounded box, not by the path. The compositor clips rounded boxes
 *   directly, while a path clip is redrawn as a mask on every frame.
 */

const MARGIN_X = 120;
const PAD_TOP = 48;
const PAD_BOTTOM = 96;
const CANVAS_W = MAX_SIZE.width + MARGIN_X * 2;
const CANVAS_H = MAX_SIZE.height + PAD_TOP + PAD_BOTTOM;
const CX = CANVAS_W / 2;
const EAR = 7;
const MIN_RADIUS = 6;
const LIGHT_WIDTH = 400;
const LIGHT_HEIGHT = 22;
// The shadow box sits a little inside the shape, so it never shows between the smoothed
// corners of the silhouette and its own circular ones.
const SHADOW_INSET = 2;

type GeoKey = 'w' | 'h' | 'r' | 'x' | 'att' | 'bx' | 'bs' | 'br';
type Geometry = Record<GeoKey, MotionValue<number>>;

function useGeometry(initial: Record<GeoKey, number>): Geometry {
  const ref = useRef<Geometry | null>(null);
  if (!ref.current) {
    ref.current = Object.fromEntries(
      Object.entries(initial).map(([key, value]) => [key, motionValue(value)]),
    ) as Geometry;
  }
  return ref.current;
}

const viewVariants = {
  [VIEW_STATE.initial]: () => ({ opacity: 0, filter: fx.blur(8) }),
  [VIEW_STATE.enter]: () => ({
    opacity: 1,
    filter: fx.blur(0),
    transition: { opacity: tween(0.22, { delay: 0.05 }), filter: tween(0.26, { delay: 0.04 }) },
  }),
  [VIEW_STATE.exit]: () => ({
    opacity: 0,
    filter: fx.blur(8),
    transition: { opacity: tween(0.13), filter: tween(0.16) },
  }),
};

const bubbleVariants = {
  [VIEW_STATE.initial]: () => ({ opacity: 0, filter: fx.blur(6) }),
  [VIEW_STATE.enter]: () => ({ opacity: 1, filter: fx.blur(0), transition: tween(0.26) }),
  [VIEW_STATE.exit]: () => ({ opacity: 0, filter: fx.blur(6), transition: tween(0.13) }),
};

// Layout positions are stored in 1/64 px. Quantising first makes an offset and its negation
// cancel exactly, which keeps the views on whole pixels while the clip box moves.
const quantise = (value: number) => Math.round(value * 64) / 64;

function place(element: HTMLElement | null, left: number, top: number, width: number, height: number, radii: string) {
  if (!element) return;
  element.style.left = `${left}px`;
  element.style.top = `${top}px`;
  element.style.width = `${Math.max(0, width)}px`;
  element.style.height = `${Math.max(0, height)}px`;
  element.style.borderRadius = radii;
}

/** Whether a `#rrggbb` colour is light enough to need dark content on it. */
function isLight(hex: string): boolean {
  const value = Number.parseInt(hex.slice(1), 16);
  if (Number.isNaN(value)) return false;
  const [r, g, b] = [value >> 16, (value >> 8) & 255, value & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 150;
}

function resolveTint(view: ResolvedView): string | null {
  const { tint } = view.definition;
  return (typeof tint === 'function' ? tint(view.instance.data) : tint) ?? null;
}

export function Island() {
  const { mode, main, bubble } = usePresentation();
  const settings = useIslandStore((state) => state.settings);
  const rootRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<SVGPathElement>(null);
  const outlineRef = useRef<SVGPathElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const bubbleShadowRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [hovered, setHovered] = useState(false);

  useFileDrop();

  // Half a pixel off and every layer is resampled: soft at rest, and it visibly snaps when an
  // animation ends. Keep the origin on a device pixel whatever the width of the container.
  useLayoutEffect(() => {
    const root = rootRef.current;
    const parent = root?.offsetParent;
    if (!root || !(parent instanceof HTMLElement)) return;
    const snap = () => {
      const rect = parent.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      const originX = rect.left + parent.clientLeft;
      const originY = rect.top + parent.clientTop;
      root.style.left = `${Math.round((originX + parent.clientWidth / 2) * ratio) / ratio - originX}px`;
      root.style.top = `${Math.round(originY * ratio) / ratio - originY}px`;
    };
    snap();
    const observer = new ResizeObserver(snap);
    observer.observe(parent);
    window.addEventListener('resize', snap);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', snap);
    };
  }, []);

  const expanded = mode === 'expanded';
  const floating = settings.attachment === 'floating';
  const { width, height, radius } = main.size;
  // Roundness pulls every radius from a full pill towards a tight rounded rectangle.
  const soften = (value: number) => Math.min(value, MIN_RADIUS + (value - MIN_RADIUS) * settings.roundness);
  // With a bubble the pair is centred, so the main shape shifts left by half the bubble footprint.
  const shift = bubble ? -(BUBBLE_GAP + BUBBLE_SIZE) / 2 : 0;
  const lift = hovered && !expanded && mode !== 'transient' && settings.expandTrigger === 'click' ? 1 : 0;

  const target: Record<GeoKey, number> = {
    w: width + lift * 6,
    h: height + lift * 2,
    r: soften(radius),
    x: shift,
    att: floating ? 1 : 0,
    // Hidden, the bubble rests inside the right end of the main shape and grows out of it.
    bx: bubble ? shift + width / 2 + lift * 3 + BUBBLE_GAP + BUBBLE_SIZE / 2 : width / 2 - BUBBLE_SIZE / 2,
    bs: bubble ? 1 : 0.5,
    br: soften(BUBBLE_SIZE / 2),
  };
  const geo = useGeometry(target);

  const previous = useRef({ area: target.w * target.h, lift });
  useEffect(() => {
    const area = target.w * target.h;
    const edges =
      previous.current.lift !== lift
        ? spring('snappy', { bounce: 0 })
        : spring(area >= previous.current.area ? 'morph' : 'collapse');
    // Same timing without the overshoot, for everything that moves content.
    const steady = { ...edges, bounce: 0 };
    previous.current = { area, lift };
    for (const key of Object.keys(target) as GeoKey[]) {
      animate(geo[key], target[key], key === 'w' || key === 'h' ? edges : steady);
    }
    // The target is fully described by its numbers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.w, target.h, target.r, target.x, target.att, target.bx, target.bs, target.br]);

  const { surface } = settings;
  // The blur behind glass follows the clip box, which has circular corners.
  const cornerSmoothing = surface === 'glass' ? 0 : settings.cornerSmoothing;
  const shadowInset = surface === 'glass' ? 0 : SHADOW_INSET;
  useLayoutEffect(() => {
    const draw = () => {
      const att = geo.att.get();
      const r = geo.r.get();
      const scale = geo.bs.get();
      const cx = CX + geo.x.get();
      const w = geo.w.get();
      const h = geo.h.get();
      // Halfway through an attachment change the top corners are square.
      const ear = Math.max(0, 1 - att * 2);
      const top = Math.max(0, att * 2 - 1);
      // At rest inside the main shape the bubble is left out, so translucent surfaces show no seam.
      const bubbleOut = scale > 0.505;
      const side = BUBBLE_SIZE * scale;
      const bubbleRadius = geo.br.get();

      let d = islandPath({
        cx,
        top: PAD_TOP,
        width: w,
        height: h,
        radius: r,
        ear: EAR * ear,
        topRadius: r * top,
        smoothing: cornerSmoothing,
      });
      if (bubbleOut) {
        // The bubble is a small island of its own, so it meets the screen edge the same way.
        d += islandPath({
          cx: CX + geo.bx.get(),
          top: PAD_TOP,
          width: side,
          height: side,
          radius: bubbleRadius * scale,
          ear: EAR * scale * ear,
          topRadius: bubbleRadius * scale * top,
          smoothing: cornerSmoothing,
        });
      }
      fillRef.current?.setAttribute('d', d);
      outlineRef.current?.setAttribute('d', d);

      const left = quantise(cx - w / 2);
      const bottom = Math.min(r, w / 2, h / 2);
      const corners = (value: number) => `${value * top}px ${value * top}px ${value}px ${value}px`;
      place(boxRef.current, left, PAD_TOP, w, h, corners(bottom));
      if (innerRef.current) innerRef.current.style.left = `${-left}px`;
      place(
        shadowRef.current,
        left + shadowInset,
        PAD_TOP + shadowInset,
        w - shadowInset * 2,
        h - shadowInset * 2,
        corners(Math.max(0, bottom - shadowInset)),
      );
      if (bubbleRef.current) bubbleRef.current.style.borderRadius = corners(bubbleRadius);
      if (bubbleShadowRef.current) {
        bubbleShadowRef.current.style.borderRadius = corners(Math.max(0, bubbleRadius - shadowInset));
      }
      if (lightRef.current) {
        // A transform only, so the light follows the shape without any layout.
        lightRef.current.style.transform = `translate(${cx - w / 2}px, ${PAD_TOP + h - LIGHT_HEIGHT}px) scaleX(${w / LIGHT_WIDTH})`;
      }
    };
    draw();
    // Immediate: drawn in the frame in which the values changed. Scheduled normally the shape
    // would trail the content, which follows the same values, by one frame.
    const stops = Object.values(geo).map((value) => value.on('change', () => frame.render(draw, false, true)));
    return () => {
      for (const stop of stops) stop();
      cancelFrame(draw);
    };
  }, [geo, cornerSmoothing, shadowInset, settings.edgeLight]);

  // One shot gestures of the whole island.
  const fxScale = useRef(motionValue(1)).current;
  const fxX = useRef(motionValue(0)).current;
  useEffect(
    () =>
      onEffect((effect) => {
        if (fx.scale(0) !== 0) return;
        if (effect === 'bump') {
          animate(fxScale, [1, 1.04, 1], { duration: scaled(0.42), ease: [0.22, 1, 0.36, 1], times: [0, 0.3, 1] });
        } else {
          animate(fxX, [0, -10, 8, -5, 2, 0], { duration: scaled(0.45), ease: 'easeOut' });
        }
      }),
    [fxScale, fxX],
  );

  useEffect(() => {
    if (!expanded) return;
    const collapse = () => useIslandStore.getState().collapse();
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) collapse();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') collapse();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [expanded]);

  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  const release = () => animate(fxScale, 1, tween(0.22));

  // Sideways pull of a swipe, added to the shake offset.
  const pull = useRef(motionValue(0)).current;
  const canvasX = useTransform(() => fxX.get() + pull.get());
  const canvasY = useTransform(geo.att, (value) => value * FLOATING_TOP);
  const gestures = useGestures(pull, {
    onSwipe: (direction) => {
      const { id, kind, data } = main.instance;
      const store = useIslandStore.getState();
      main.definition.onSwipe?.(
        {
          id,
          kind,
          data,
          update: (patch) => store.update(id, patch),
          dismiss: () => store.end(id),
          expand: () => store.expand(id),
          collapse: () => store.collapse(),
        },
        direction,
      );
    },
    // The hub stays reachable while activities occupy the island.
    onHold: () => {
      if (!expanded) useIslandStore.getState().expand(IDLE_ID);
    },
    onWheel: (step) => {
      if (!expanded) nudgeVolume(step * 0.05);
    },
  });

  const onPointerEnter = () => {
    setHovered(true);
    clearTimeout(hoverTimer.current);
    const store = useIslandStore.getState();
    if (store.transient) store.holdTransient(true);
    else if (settings.expandTrigger === 'hover' && !expanded) {
      hoverTimer.current = setTimeout(() => useIslandStore.getState().expand(), 140);
    }
  };
  const onPointerLeave = () => {
    setHovered(false);
    clearTimeout(hoverTimer.current);
    const store = useIslandStore.getState();
    if (store.transient) store.holdTransient(false);
    else if (settings.expandTrigger === 'hover' && store.expandedId !== null) {
      hoverTimer.current = setTimeout(() => useIslandStore.getState().collapse(), 320);
    }
    release();
  };

  // The last bubble stays rendered while its shape retreats into the main one.
  const lastBubble = useRef<ResolvedView | null>(bubble);
  if (bubble) lastBubble.current = bubble;
  const shownBubble = bubble ?? lastBubble.current;
  const bubbleOpacity = useTransform(geo.bs, [0.62, 1], [0, 1]);
  // Elements get derived copies: a motion element stops the values it is bound to when it unmounts,
  // which would cancel the geometry springs in the middle of a swap.
  const viewX = useTransform(geo.x, (value) => value);
  const bubbleX = useTransform(geo.bx, (value) => value);
  const bubbleScale = useTransform(geo.bs, (value) => value);

  const accent = settings.accent === 'fg' ? 'var(--island-fg)' : settings.accent;
  const ink = surface === 'light' || (surface === 'custom' && isLight(settings.surfaceColor)) ? 'dark' : 'light';
  const tint = mode === 'idle' ? 'transparent' : (resolveTint(main) ?? accent);

  const rootStyle = {
    transform: settings.scale === 1 ? undefined : `scale(${settings.scale})`,
    '--island-time-scale': settings.timeScale,
    '--island-accent': accent,
    '--island-tint': tint,
    ...(surface === 'custom' ? { '--island-bg': settings.surfaceColor } : null),
  } as CSSProperties;

  const bubbleMotion = { x: bubbleX, scale: bubbleScale, opacity: bubbleOpacity };

  return (
    <div
      ref={rootRef}
      data-island-root
      data-mode={mode}
      data-surface={surface}
      data-ink={ink}
      data-shadow={settings.shadow}
      data-outline={settings.outline}
      data-glow={settings.glow}
      className={css.root}
      style={rootStyle}
    >
      <IslandControllers />
      <motion.div
        className={css.canvas}
        style={{
          left: -CX,
          top: -PAD_TOP,
          width: CANVAS_W,
          height: CANVAS_H,
          scale: fxScale,
          x: canvasX,
          y: canvasY,
          transformOrigin: `50% ${PAD_TOP}px`,
        }}
      >
        <div ref={shadowRef} className={css.shadow} />
        {shownBubble && (
          <motion.div
            ref={bubbleShadowRef}
            className={css.shadow}
            style={{
              left: CX - BUBBLE_SIZE / 2 + shadowInset,
              top: PAD_TOP + shadowInset,
              width: BUBBLE_SIZE - shadowInset * 2,
              height: BUBBLE_SIZE - shadowInset * 2,
              transformOrigin: `50% ${-shadowInset}px`,
              ...bubbleMotion,
            }}
          />
        )}
        <svg className={css.paint} width={CANVAS_W} height={CANVAS_H} aria-hidden>
          <path ref={outlineRef} className={css.outline} />
          <path ref={fillRef} className={css.fill} />
        </svg>
        <div
          className={css.hit}
          onPointerEnter={onPointerEnter}
          onPointerLeave={onPointerLeave}
          onPointerDown={(event) => {
            if (!expanded) animate(fxScale, fx.scale(0.975), tween(0.12));
            gestures.onPointerDown(event);
          }}
          onPointerMove={gestures.onPointerMove}
          onPointerUp={() => {
            release();
            gestures.onPointerUp();
          }}
          onPointerCancel={gestures.onPointerCancel}
          onWheel={gestures.onWheel}
          onClick={() => {
            if (gestures.consumeClick()) return;
            const store = useIslandStore.getState();
            if (mode === 'transient') store.dismissTransient();
            else if (!expanded) store.expand();
          }}
        >
          <div ref={boxRef} className={css.box}>
            <div ref={innerRef} className={css.inner} style={{ top: -PAD_TOP, width: CANVAS_W, height: CANVAS_H }}>
              {settings.edgeLight && (
                <div ref={lightRef} className={css.light} style={{ width: LIGHT_WIDTH, height: LIGHT_HEIGHT }} />
              )}
              <AnimatePresence initial={false}>
                <motion.div
                  key={main.key}
                  className={css.view}
                  style={{ width, height, left: CX - width / 2, top: PAD_TOP, x: viewX }}
                  variants={viewVariants}
                  initial={VIEW_STATE.initial}
                  animate={VIEW_STATE.enter}
                  exit={VIEW_STATE.exit}
                >
                  <ActivityView view={main} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          {shownBubble && (
            <motion.div
              ref={bubbleRef}
              className={`${css.box} ${css.bubble}`}
              data-no-gesture
              style={{
                left: CX - BUBBLE_SIZE / 2,
                top: PAD_TOP,
                pointerEvents: bubble ? 'auto' : 'none',
                ...bubbleMotion,
              }}
              onClick={(event) => {
                event.stopPropagation();
                useIslandStore.getState().expand(shownBubble.instance.id);
              }}
            >
              <AnimatePresence initial={false}>
                <motion.div
                  key={shownBubble.key}
                  className={css.bubbleView}
                  variants={bubbleVariants}
                  initial={VIEW_STATE.initial}
                  animate={VIEW_STATE.enter}
                  exit={VIEW_STATE.exit}
                >
                  <ActivityView view={shownBubble} />
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
