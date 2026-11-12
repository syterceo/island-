/** Geometry of the island silhouette, in canvas px. */
export interface IslandShape {
  /** Horizontal centre. */
  cx: number;
  top: number;
  width: number;
  height: number;
  /** Radius of the bottom corners. */
  radius: number;
  /** Radius of the top corners when floating. Ignored while `ear` is above zero. */
  topRadius: number;
  /** Radius of the concave fillets that join a notch to the screen edge. 0 when floating. */
  ear: number;
  /** Continuous corner smoothing, 0 (circular arcs) to 1. */
  smoothing: number;
}

// Handle length of a cubic that approximates a quarter circle.
const KAPPA = 0.5523;

const n = (value: number) => Math.round(value * 100) / 100;

/**
 * A smoothed corner is one cubic that still passes through the apex of the circular arc but
 * starts further along the edge, so curvature ramps up instead of switching on.
 * Returns the reach along each edge and the handle length as a fraction of that reach.
 */
function smoothCorner(radius: number, smoothing: number, limit: number): { reach: number; handle: number } {
  if (radius < 0.5) return { reach: 0, handle: 0 };
  const reach = Math.min(radius * (1 + 0.8 * smoothing), limit);
  return { reach, handle: Math.max(0, (2.3431 * radius) / reach - 1) / 3 };
}

/** Path of the main shape. Winds left side down, along the bottom, right side up. */
export function islandPath(shape: IslandShape): string {
  const width = Math.max(shape.width, 2);
  const height = Math.max(shape.height, 2);
  const left = shape.cx - width / 2;
  const right = shape.cx + width / 2;
  const top = shape.top;
  const bottom = top + height;
  const half = Math.min(width / 2, height / 2);

  const b = smoothCorner(Math.min(shape.radius, half), shape.smoothing, half);
  const ear = Math.min(shape.ear, half);
  const t = ear > 0.01 ? { reach: 0, handle: 0 } : smoothCorner(Math.min(shape.topRadius, half), shape.smoothing, half);

  const parts: string[] = [];

  if (ear > 0.01) {
    parts.push(
      `M${n(left - ear)} ${n(top)}`,
      `C${n(left - ear + ear * KAPPA)} ${n(top)} ${n(left)} ${n(top + ear - ear * KAPPA)} ${n(left)} ${n(top + ear)}`,
    );
  } else if (t.reach > 0) {
    parts.push(
      `M${n(left + t.reach)} ${n(top)}`,
      `C${n(left + t.reach * t.handle)} ${n(top)} ${n(left)} ${n(top + t.reach * t.handle)} ${n(left)} ${n(top + t.reach)}`,
    );
  } else {
    parts.push(`M${n(left)} ${n(top)}`);
  }

  if (b.reach > 0) {
    parts.push(
      `L${n(left)} ${n(bottom - b.reach)}`,
      `C${n(left)} ${n(bottom - b.reach * b.handle)} ${n(left + b.reach * b.handle)} ${n(bottom)} ${n(left + b.reach)} ${n(bottom)}`,
      `L${n(right - b.reach)} ${n(bottom)}`,
      `C${n(right - b.reach * b.handle)} ${n(bottom)} ${n(right)} ${n(bottom - b.reach * b.handle)} ${n(right)} ${n(bottom - b.reach)}`,
    );
  } else {
    parts.push(`L${n(left)} ${n(bottom)}`, `L${n(right)} ${n(bottom)}`);
  }

  if (ear > 0.01) {
    parts.push(
      `L${n(right)} ${n(top + ear)}`,
      `C${n(right)} ${n(top + ear - ear * KAPPA)} ${n(right + ear - ear * KAPPA)} ${n(top)} ${n(right + ear)} ${n(top)}`,
    );
  } else if (t.reach > 0) {
    parts.push(
      `L${n(right)} ${n(top + t.reach)}`,
      `C${n(right)} ${n(top + t.reach * t.handle)} ${n(right - t.reach * t.handle)} ${n(top)} ${n(right - t.reach)} ${n(top)}`,
    );
  } else {
    parts.push(`L${n(right)} ${n(top)}`);
  }

  parts.push('Z');
  return parts.join('');
}

