import { describe, expect, it } from "vitest";

import { nextBarState, type BarScrollState } from "./scrollVisibility";

const MAX = 2000;
const start: BarScrollState = { visible: true, anchorY: 0 };

describe("nextBarState", () => {
  it("hides the bar when scrolling down past the threshold", () => {
    expect(nextBarState(start, { y: 40, max: MAX })).toEqual({ visible: false, anchorY: 40 });
  });

  it("shows the bar again when scrolling up past the threshold", () => {
    const hidden = nextBarState(start, { y: 600, max: MAX });
    expect(nextBarState(hidden, { y: 580, max: MAX })).toEqual({ visible: true, anchorY: 580 });
  });

  it("ignores movements smaller than the threshold", () => {
    const hidden = nextBarState(start, { y: 600, max: MAX });
    expect(nextBarState(hidden, { y: 595, max: MAX })).toBe(hidden);
    expect(nextBarState(hidden, { y: 609, max: MAX })).toBe(hidden);
  });

  it("adds up small movements until they pass the threshold", () => {
    let state = nextBarState(start, { y: 600, max: MAX });
    for (const y of [596, 592]) state = nextBarState(state, { y, max: MAX });
    expect(state.visible).toBe(false);
    state = nextBarState(state, { y: 589, max: MAX });
    expect(state.visible).toBe(true);
  });

  it("is always visible at the top, including overscroll", () => {
    const hidden = nextBarState(start, { y: 600, max: MAX });
    expect(nextBarState(hidden, { y: 0, max: MAX }).visible).toBe(true);
    expect(nextBarState(hidden, { y: -30, max: MAX }).visible).toBe(true);
  });

  it("shows the bar at the very end of the page even while scrolling down", () => {
    const hidden = nextBarState(start, { y: 1500, max: MAX });
    expect(nextBarState(hidden, { y: 1999, max: MAX }).visible).toBe(true);
    expect(nextBarState(hidden, { y: 2010, max: MAX }).visible).toBe(true);
  });

  it("keeps the bar visible on pages that do not scroll", () => {
    expect(nextBarState(start, { y: 0, max: 0 })).toBe(start);
  });
});
