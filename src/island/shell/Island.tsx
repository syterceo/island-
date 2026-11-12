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
 * The silhouette is one SVG path drawn on a fixed canvas, and the same path clips the content.
 * Springs drive plain numbers (width, height, radius, offset, bubble) and the path is rebuilt
 * from them every frame. Views never take part in layout while the shape moves: each one sits
 * at its final size at a fixed position, so text stays on whole pixels and nothing reflows,
 * snaps or re-rasterises when an animation ends.
 */

const MARGIN_X = 120;
const PAD_TOP = 48;
const PAD_BOTTOM = 96;
const CANVAS_W = MAX_SIZE.width + MARGIN_X * 2;
const CANVAS_H = MAX_SIZE.height + PAD_TOP + PAD_BOTTOM;
const CX = CANVAS_W / 2;
const EAR = 7;
const MIN_RADIUS = 6;
const LIGHT_HEIGHT = 22;

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

interface Morph {
  /** Scale the incoming view starts from. */
  enter: number;
  /** Scale the outgoing view leaves towards. */
  exit: number;
}

// Content follows the shape part of the way, so a swap reads as one material changing size.
const follow = (ratio: number) => Math.min(1.1, Math.max(0.86, 1 + (ratio - 1) * 0.35));

// Content uses tweens: they land exactly on their target, so the last frame of a swap is the
// resting frame and nothing creeps into place afterwards. Only the shape is a spring.
const viewVariants = {
  [VIEW_STATE.initial]: (morph: Morph) => ({ opacity: 0, scale: fx.scale(morph.enter), filter: fx.blur(10) }),
  [VIEW_STATE.enter]: () => ({
    opacity: 1,
    scale: 1,
    filter: fx.blur(0),
    transition: {
      opacity: tween(0.24, { delay: 0.06 }),
      filter: tween(0.3, { delay: 0.04 }),
      scale: tween(0.4, { delay: 0.02 }),
    },
  }),
  [VIEW_STATE.exit]: (morph: Morph) => ({
    opacity: 0,
    scale: fx.scale(morph.exit),
    filter: fx.blur(10),
    transition: { opacity: tween(0.14), filter: tween(0.18), scale: tween(0.22) },
  }),
};

const bubbleVariants = {
  [VIEW_STATE.initial]: () => ({ opacity: 0, scale: fx.scale(0.7), filter: fx.blur(6) }),
  [VIEW_STATE.enter]: () => ({ opacity: 1, scale: 1, filter: fx.blur(0), transition: tween(0.3) }),
  [VIEW_STATE.exit]: () => ({ opacity: 0, scale: fx.scale(0.7), filter: fx.blur(6), transition: tween(0.14) }),
};

/** Sizes the blurred backdrop of the glass surface to a shape. */
function placeBackdrop(
  element: HTMLDivElement | null,
  cx: number,
  width: number,
  height: number,
  radius: number,
  att: number,
) {
  if (!element) return;
  const bottom = Math.min(radius, width / 2, height / 2);
  const top = bottom * Math.max(0, att * 2 - 1);
  element.style.left = `${cx - width / 2}px`;
  element.style.top = `${PAD_TOP}px`;
  element.style.width = `${width}px`;
  element.style.height = `${height}px`;
  element.style.borderRadius = `${top}px ${top}px ${bottom}px ${bottom}px`;
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
  const clipRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const bubbleBackdropRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [hovered, setHovered] = useState(false);

  useFileDrop();

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
    const transition =
      previous.current.lift !== lift
        ? spring('snappy', { bounce: 0 })
        : spring(area >= previous.current.area ? 'morph' : 'collapse');
    previous.current = { area, lift };
    for (const key of Object.keys(target) as GeoKey[]) animate(geo[key], target[key], transition);
    // The target is fully described by its numbers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.w, target.h, target.r, target.x, target.att, target.bx, target.bs, target.br]);

  const { surface } = settings;
  // The blur behind glass can only be clipped by a border radius, so glass uses circular corners.
  const cornerSmoothing = surface === 'glass' ? 0 : settings.cornerSmoothing;
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
      const side = bubbleOut ? BUBBLE_SIZE * scale : 0;
      const bubbleRadius = geo.br.get() * scale;

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
          radius: bubbleRadius,
          ear: EAR * scale * ear,
          topRadius: bubbleRadius * top,
          smoothing: cornerSmoothing,
        });
      }

      fillRef.current?.setAttribute('d', d);
      outlineRef.current?.setAttribute('d', d);
      if (clipRef.current) clipRef.current.style.clipPath = `path("${d}")`;
      if (lightRef.current) {
        lightRef.current.style.transform = `translate(${cx - w / 2}px, ${PAD_TOP + h - LIGHT_HEIGHT}px)`;
        lightRef.current.style.width = `${w}px`;
      }
      placeBackdrop(backdropRef.current, cx, w, h, r, att);
      placeBackdrop(bubbleBackdropRef.current, CX + geo.bx.get(), side, side, bubbleRadius, att);
    };
    draw();
    const stops = Object.values(geo).map((value) => value.on('change', () => frame.render(draw)));
    return () => {
      for (const stop of stops) stop();
      cancelFrame(draw);
    };
  }, [geo, cornerSmoothing, surface, settings.edgeLight]);

  // One shot gestures of the whole island.
  const fxScale = useRef(motionValue(1)).current;
  const fxX = useRef(motionValue(0)).current;
  useEffect(
    () =>
      onEffect((effect) => {
        if (fx.scale(0) !== 0) return;
        if (effect === 'bump') {
          animate(fxScale, [1, 1.05, 1], { duration: scaled(0.42), ease: [0.22, 1, 0.36, 1], times: [0, 0.3, 1] });
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

  // Scales for the running swap, fixed at the moment the main view changes.
  const swap = useRef<{ key: string; width: number; morph: Morph }>({
    key: main.key,
    width,
    morph: { enter: 1, exit: 1 },
  });
  if (swap.current.key !== main.key) {
    const from = swap.current.width;
    swap.current = { key: main.key, width, morph: { enter: follow(from / width), exit: follow(width / from) } };
  }
  const morph = swap.current.morph;

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
    top: floating ? FLOATING_TOP : 0,
    transform: settings.scale === 1 ? undefined : `scale(${settings.scale})`,
    '--island-time-scale': settings.timeScale,
    '--island-accent': accent,
    '--island-tint': tint,
    ...(surface === 'custom' ? { '--island-bg': settings.surfaceColor } : null),
  } as CSSProperties;

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
          transformOrigin: `50% ${PAD_TOP}px`,
        }}
      >
        <svg className={css.paint} width={CANVAS_W} height={CANVAS_H} aria-hidden>
          <path ref={outlineRef} className={css.outline} />
          <path ref={fillRef} className={css.fill} />
        </svg>
        {surface === 'glass' && (
          <>
            <div ref={backdropRef} className={css.backdrop} />
            <div ref={bubbleBackdropRef} className={css.backdrop} />
          </>
        )}
        <div
          ref={clipRef}
          className={css.clip}
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
          {settings.edgeLight && <div ref={lightRef} className={css.light} style={{ height: LIGHT_HEIGHT }} />}
          <AnimatePresence initial={false} custom={morph}>
            <motion.div
              key={main.key}
              className={css.view}
              style={{ width, height, left: CX - width / 2, top: PAD_TOP, x: viewX }}
              custom={morph}
              variants={viewVariants}
              initial={VIEW_STATE.initial}
              animate={VIEW_STATE.enter}
              exit={VIEW_STATE.exit}
            >
              <ActivityView view={main} />
            </motion.div>
          </AnimatePresence>
          {shownBubble && (
            <motion.div
              className={css.bubble}
              data-no-gesture
              style={{
                left: CX - BUBBLE_SIZE / 2,
                top: PAD_TOP,
                x: bubbleX,
                scale: bubbleScale,
                opacity: bubbleOpacity,
                pointerEvents: bubble ? 'auto' : 'none',
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
