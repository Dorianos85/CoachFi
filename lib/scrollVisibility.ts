/** Scroll distance that must accumulate before a bottom bar changes state, so it does not flicker. */
export const SCROLL_THRESHOLD = 10;

export interface ScrollSample {
  /** Current scroll offset of the scrolling element. */
  y: number;
  /** Largest possible scroll offset (scrollHeight − visible height). */
  max: number;
}

export interface BarScrollState {
  visible: boolean;
  /** Offset the next movement is measured from; it only moves once the threshold is passed. */
  anchorY: number;
}

/**
 * Hide-on-scroll rule for a bottom bar: visible at the top and at the very end of the page,
 * hidden while scrolling down, shown again while scrolling up.
 * Returns the same object when nothing changes.
 */
export function nextBarState(
  state: BarScrollState,
  { y, max }: ScrollSample,
  threshold = SCROLL_THRESHOLD
): BarScrollState {
  if (y <= 0) return state.visible && state.anchorY === 0 ? state : { visible: true, anchorY: 0 };
  // A 2 px tolerance covers fractional offsets on high-density screens.
  if (y >= max - 2) return state.visible && state.anchorY === y ? state : { visible: true, anchorY: y };

  const delta = y - state.anchorY;
  if (Math.abs(delta) < threshold) return state;
  return { visible: delta < 0, anchorY: y };
}
