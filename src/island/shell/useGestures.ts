import { animate, type MotionValue } from 'motion/react';
import { useEffect, useRef, type PointerEvent, type WheelEvent } from 'react';
import { fx, tween } from '../motion/springs';

const SLOP = 6;
const SWIPE = 44;
const HOLD_MS = 460;
const WHEEL_STEP = 50;
const MAX_PULL = 26;

interface GestureHandlers {
  /** 1 for a swipe to the left (forwards), -1 for a swipe to the right. */
  onSwipe: (direction: 1 | -1) => void;
  onHold: () => void;
  /** 1 for scrolling up. Fires once per notch. */
  onWheel: (step: 1 | -1) => void;
}

/**
 * Swipe, press and hold, and wheel on the island. `pull` receives the rubber band offset while
 * a finger or the mouse drags the island sideways.
 */
export function useGestures(pull: MotionValue<number>, handlers: GestureHandlers) {
  const latest = useRef(handlers);
  const state = useRef({ active: false, x: 0, dx: 0, consumed: false, wheel: 0 });
  const hold = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    latest.current = handlers;
  });
  useEffect(() => () => clearTimeout(hold.current), []);

  const finish = (completed: boolean) => {
    const gesture = state.current;
    clearTimeout(hold.current);
    if (!gesture.active) return;
    gesture.active = false;
    if (Math.abs(gesture.dx) > SLOP) gesture.consumed = true;
    if (completed && Math.abs(gesture.dx) >= SWIPE) latest.current.onSwipe(gesture.dx < 0 ? 1 : -1);
    animate(pull, 0, tween(0.3));
  };

  return {
    /** True once after a press that was a gesture, so the click that follows it is ignored. */
    consumeClick(): boolean {
      const consumed = state.current.consumed;
      state.current.consumed = false;
      return consumed;
    },

    onPointerDown(event: PointerEvent<HTMLElement>) {
      const gesture = state.current;
      gesture.consumed = false;
      // Controls inside the island keep their own presses.
      if (event.button !== 0 || (event.target as Element).closest('button, input, label, [data-no-gesture]')) return;
      gesture.active = true;
      gesture.x = event.clientX;
      gesture.dx = 0;
      clearTimeout(hold.current);
      hold.current = setTimeout(() => {
        if (!gesture.active) return;
        gesture.active = false;
        gesture.consumed = true;
        latest.current.onHold();
      }, HOLD_MS);
    },

    onPointerMove(event: PointerEvent<HTMLElement>) {
      const gesture = state.current;
      if (!gesture.active) return;
      gesture.dx = event.clientX - gesture.x;
      if (Math.abs(gesture.dx) <= SLOP) return;
      clearTimeout(hold.current);
      // Captured only once it is a drag, so plain clicks still reach whatever was pressed.
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      pull.set(fx.offset(Math.max(-MAX_PULL, Math.min(MAX_PULL, gesture.dx * 0.3))));
    },

    onPointerUp: () => finish(true),
    onPointerCancel: () => finish(false),

    onWheel(event: WheelEvent<HTMLElement>) {
      const gesture = state.current;
      gesture.wheel += event.deltaY;
      if (Math.abs(gesture.wheel) < WHEEL_STEP) return;
      latest.current.onWheel(gesture.wheel < 0 ? 1 : -1);
      gesture.wheel = 0;
    },
  };
}
