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
const EAR = 8;

type GeoKey = 'w' | 'h' | 'r' | 'x' | 'att' | 'bx' | 'bs';
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
const follow = (ratio: number) => Math.min(1.14, Math.max(0.8, 1 + (ratio - 1) * 0.45));

const viewVariants = {
  [VIEW_STATE.initial]: (morph: Morph) => ({ opacity: 0, scale: fx.scale(morph.enter), filter: fx.blur(10) }),
  [VIEW_STATE.enter]: () => ({
    opacity: 1,
    scale: 1,
    filter: fx.blur(0),
    transition: {
      opacity: tween(0.24, { delay: 0.06 }),
      filter: tween(0.32, { delay: 0.04 }),
      scale: spring('content', { delay: 0.02 }),
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
  [VIEW_STATE.initial]: () => ({ opacity: 0, scale: fx.scale(0.6), filter: fx.blur(6) }),
  [VIEW_STATE.enter]: () => ({ opacity: 1, scale: 1, filter: fx.blur(0), transition: spring('content') }),
  [VIEW_STATE.exit]: () => ({ opacity: 0, scale: fx.scale(0.6), filter: fx.blur(6), transition: tween(0.14) }),
};

export function Island() {
  const { mode, main, bubble } = usePresentation();
  const settings = useIslandStore((state) => state.settings);
  const rootRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<SVGPathElement>(null);
  const outlineRef = useRef<SVGPathElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [hovered, setHovered] = useState(false);

  useFileDrop();

  const expanded = mode === 'expanded';
  const floating = settings.attachment === 'floating';
  const { width, height, radius } = main.size;
  // With a bubble the pair is centred, so the main pill shifts left by half the bubble footprint.
  const shift = bubble ? -(BUBBLE_GAP + BUBBLE_SIZE) / 2 : 0;
  const lift = hovered && !expanded && mode !== 'transient' && settings.expandTrigger === 'click' ? 1 : 0;

  const target: Record<GeoKey, number> = {
    w: width + lift * 8,
    h: height + lift * 2,
    r: radius + lift,
    x: shift,
    att: floating ? 1 : 0,
    // Hidden, the bubble rests inside the right end of the main shape and grows out of it.
    bx: bubble ? shift + width / 2 + BUBBLE_GAP + BUBBLE_SIZE / 2 : width / 2 - BUBBLE_SIZE / 2,
    bs: bubble ? 1 : 0.5,
  };
  const geo = useGeometry(target);

  const previous = useRef({ area: target.w * target.h, lift });
  useEffect(() => {
    const area = target.w * target.h;
    const transition =
      previous.current.lift !== lift ? spring('snappy') : spring(area >= previous.current.area ? 'morph' : 'collapse');
    previous.current = { area, lift };
    for (const key of Object.keys(target) as GeoKey[]) animate(geo[key], target[key], transition);
    // The target is fully described by its numbers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.w, target.h, target.r, target.x, target.att, target.bx, target.bs]);

  const { cornerSmoothing, surface } = settings;
  useLayoutEffect(() => {
    const draw = () => {
      const att = geo.att.get();
      const r = geo.r.get();
      const scale = geo.bs.get();
      const d =
        islandPath({
          cx: CX + geo.x.get(),
          top: PAD_TOP,
          width: geo.w.get(),
          height: geo.h.get(),
          radius: r,
          // Halfway through an attachment change the top corners are square.
          ear: EAR * Math.max(0, 1 - att * 2),
          topRadius: r * Math.max(0, att * 2 - 1),
          smoothing: cornerSmoothing,
        }) +
        // The bubble is a small island of its own, so it meets the screen edge the same way.
        islandPath({
          cx: CX + geo.bx.get(),
          top: PAD_TOP,
          width: BUBBLE_SIZE * scale,
          height: BUBBLE_SIZE * scale,
          radius: (BUBBLE_SIZE / 2) * scale,
          ear: EAR * scale * Math.max(0, 1 - att * 2),
          topRadius: (BUBBLE_SIZE / 2) * scale * Math.max(0, att * 2 - 1),
          smoothing: cornerSmoothing,
        });
      fillRef.current?.setAttribute('d', d);
      outlineRef.current?.setAttribute('d', d);
      const clip = `path("${d}")`;
      if (clipRef.current) clipRef.current.style.clipPath = clip;
      if (backdropRef.current) backdropRef.current.style.clipPath = clip;
    };
    draw();
    const stops = Object.values(geo).map((value) => value.on('change', () => frame.render(draw)));
    return () => {
      for (const stop of stops) stop();
      cancelFrame(draw);
    };
  }, [geo, cornerSmoothing, surface]);

  // One shot gestures of the whole island.
  const fxScale = useRef(motionValue(1)).current;
  const fxX = useRef(motionValue(0)).current;
  useEffect(
    () =>
      onEffect((effect) => {
        if (fx.scale(0) !== 0) return;
        if (effect === 'bump') {
          animate(fxScale, [1, 1.07, 1], { duration: scaled(0.42), ease: [0.22, 1, 0.36, 1], times: [0, 0.3, 1] });
        } else {
          animate(fxX, [0, -11, 9, -6, 3, 0], { duration: scaled(0.45), ease: 'easeOut' });
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
    animate(fxScale, 1, spring('snappy'));
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

  const rootStyle = {
    top: floating ? FLOATING_TOP : 0,
    transform: settings.scale === 1 ? undefined : `scale(${settings.scale})`,
    '--island-time-scale': settings.timeScale,
    '--island-accent': settings.accent === 'fg' ? 'var(--island-fg)' : settings.accent,
  } as CSSProperties;

  return (
    <div
      ref={rootRef}
      data-island-root
      data-mode={mode}
      data-surface={surface}
      data-shadow={settings.shadow}
      data-outline={settings.outline}
      data-glow={settings.glow && mode !== 'idle'}
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
          x: fxX,
          transformOrigin: `50% ${PAD_TOP}px`,
        }}
      >
        <svg className={css.paint} width={CANVAS_W} height={CANVAS_H} aria-hidden>
          <path ref={outlineRef} className={css.outline} />
          <path ref={fillRef} className={css.fill} />
        </svg>
        {surface === 'glass' && <div ref={backdropRef} className={css.backdrop} />}
        <div
          ref={clipRef}
          className={css.clip}
          onPointerEnter={onPointerEnter}
          onPointerLeave={onPointerLeave}
          onPointerDown={() => {
            if (!expanded) animate(fxScale, fx.scale(0.97), spring('snappy'));
          }}
          onPointerUp={() => animate(fxScale, 1, spring('snappy'))}
          onClick={() => {
            const store = useIslandStore.getState();
            if (mode === 'transient') store.dismissTransient();
            else if (!expanded) store.expand();
          }}
        >
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
