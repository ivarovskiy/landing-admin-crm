import { describe, it, expect } from "vitest";
import {
  isElementLocked,
  setGroupLock,
  splitTextElement,
  nudgeElement,
  getOrderedKeys,
  parsePx,
} from "./slide-layout-utils";
import type { Slide } from "./hero-slider-presets";

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makeSlide(overrides: Partial<Slide> = {}): Slide {
  return {
    id: "test-slide",
    template: "copy-left-image-right",
    title: "LINE ONE\nLINE TWO\nLINE THREE",
    titleStyle: { mt: "100px", ml: "20px", typo: "typo-content-header" },
    ...overrides,
  };
}

// ─── parsePx ─────────────────────────────────────────────────────────────────

describe("parsePx", () => {
  it("parses integer px strings", () => expect(parsePx("120px")).toBe(120));
  it("parses float px strings", () => expect(parsePx("12.5px")).toBe(12.5));
  it("returns 0 for undefined", () => expect(parsePx(undefined)).toBe(0));
  it("returns 0 for empty string", () => expect(parsePx("")).toBe(0));
  it("returns 0 for non-numeric", () => expect(parsePx("auto")).toBe(0));
});

// ─── isElementLocked ─────────────────────────────────────────────────────────

describe("isElementLocked", () => {
  it("returns false when no style is set", () => {
    const slide = makeSlide({ titleStyle: undefined });
    expect(isElementLocked(slide, "title")).toBe(false);
  });

  it("returns false when locked is not set", () => {
    const slide = makeSlide({ titleStyle: { mt: "10px" } });
    expect(isElementLocked(slide, "title")).toBe(false);
  });

  it("returns true when locked is true on a fixed element", () => {
    const slide = makeSlide({ titleStyle: { mt: "10px", locked: true } });
    expect(isElementLocked(slide, "title")).toBe(true);
  });

  it("returns true when locked is true on an extra element", () => {
    const slide = makeSlide({
      extras: [{ id: "ex-1", kind: "text", text: "hello", style: { locked: true } }],
    });
    expect(isElementLocked(slide, "ex-1")).toBe(true);
  });

  it("returns false for an extra without lock", () => {
    const slide = makeSlide({
      extras: [{ id: "ex-1", kind: "text", text: "hello", style: { mt: "50px" } }],
    });
    expect(isElementLocked(slide, "ex-1")).toBe(false);
  });
});

// ─── nudgeElement — lock protection ──────────────────────────────────────────

describe("nudgeElement — locked elements must not move", () => {
  it("does not change mt/ml when element is locked", () => {
    const style = { mt: "100px", ml: "20px", locked: true as const };
    const result = nudgeElement(style, 10, 10);
    expect(result.mt).toBe("100px");
    expect(result.ml).toBe("20px");
    expect(result.locked).toBe(true);
  });

  it("updates mt/ml when element is not locked", () => {
    const style = { mt: "100px", ml: "20px" };
    const result = nudgeElement(style, 5, -10);
    expect(result.mt).toBe("90px");
    expect(result.ml).toBe("25px");
  });

  it("does not change position for zero delta on locked element", () => {
    const style = { mt: "50px", ml: "30px", locked: true as const };
    const result = nudgeElement(style, 0, 0);
    expect(result.mt).toBe("50px");
    expect(result.ml).toBe("30px");
  });

  it("handles undefined style (treats as unlocked, zero base)", () => {
    const result = nudgeElement(undefined, 3, 7);
    expect(result.mt).toBe("7px");
    expect(result.ml).toBe("3px");
  });

  it("preserves other style fields when nudging", () => {
    const style = { mt: "10px", ml: "0px", typo: "typo-subtitle" as const, align: "left" as const };
    const result = nudgeElement(style, 0, 5);
    expect(result.typo).toBe("typo-subtitle");
    expect(result.align).toBe("left");
  });
});

// ─── setGroupLock ────────────────────────────────────────────────────────────

describe("setGroupLock", () => {
  it("locks all elements in the target group", () => {
    const slide: Slide = {
      ...makeSlide(),
      titleStyle: { mt: "10px", groupId: "header" },
      subtitleStyle: { mt: "60px", groupId: "header" },
      kickerStyle: { mt: "5px", groupId: "other-group" },
    };
    const result = setGroupLock(slide, "header", true);
    expect(result.titleStyle?.locked).toBe(true);
    expect(result.subtitleStyle?.locked).toBe(true);
    // Different group — must not be affected
    expect(result.kickerStyle?.locked).toBeUndefined();
  });

  it("unlocks all elements in the target group", () => {
    const slide: Slide = {
      ...makeSlide(),
      titleStyle: { mt: "10px", groupId: "header", locked: true },
      subtitleStyle: { mt: "60px", groupId: "header", locked: true },
    };
    const result = setGroupLock(slide, "header", false);
    expect(result.titleStyle?.locked).toBeUndefined();
    expect(result.subtitleStyle?.locked).toBeUndefined();
  });

  it("locks extra elements with the matching groupId", () => {
    const slide: Slide = {
      ...makeSlide(),
      extras: [
        { id: "ex-1", kind: "text", text: "A", style: { groupId: "design" } },
        { id: "ex-2", kind: "text", text: "B", style: { groupId: "other" } },
      ],
    };
    const result = setGroupLock(slide, "design", true);
    expect(result.extras?.[0].style?.locked).toBe(true);
    expect(result.extras?.[1].style?.locked).toBeUndefined();
  });

  it("does not move or change non-group elements", () => {
    const slide = makeSlide({ titleStyle: { mt: "10px" } }); // no groupId
    const result = setGroupLock(slide, "nonexistent", true);
    expect(result.titleStyle?.locked).toBeUndefined();
    expect(result.titleStyle?.mt).toBe("10px");
  });

  it("moving unlocked elements must not affect locked group members (isolation check)", () => {
    // Simulate: two elements, one locked, we nudge only the unlocked one
    const slide: Slide = {
      ...makeSlide(),
      titleStyle: { mt: "100px", ml: "20px", groupId: "group-a", locked: true },
      subtitleStyle: { mt: "200px", ml: "20px" }, // unlocked, different group
    };
    // Nudge the subtitle (unlocked)
    const nudgedSubtitle = nudgeElement(slide.subtitleStyle, 10, 10);
    // Apply only subtitle nudge
    const result = { ...slide, subtitleStyle: nudgedSubtitle };
    // Title (locked) must be untouched
    expect(result.titleStyle?.mt).toBe("100px");
    expect(result.titleStyle?.ml).toBe("20px");
    // Subtitle (unlocked) was nudged
    expect(result.subtitleStyle?.mt).toBe("210px");
    expect(result.subtitleStyle?.ml).toBe("30px");
  });
});

// ─── splitTextElement ─────────────────────────────────────────────────────────

describe("splitTextElement", () => {
  it("returns slide unchanged when element has only one line", () => {
    const slide = makeSlide({ title: "SINGLE LINE" });
    const result = splitTextElement(slide, "title");
    expect(result).toBe(slide); // same reference — unchanged
  });

  it("returns slide unchanged when element has only blank lines", () => {
    const slide = makeSlide({ title: "\n\n" });
    const result = splitTextElement(slide, "title");
    expect(result).toBe(slide);
  });

  it("splits a 3-line title into 1 fixed + 2 extras", () => {
    const slide = makeSlide();
    const result = splitTextElement(slide, "title");

    expect(result.title).toBe("LINE ONE");
    const newExtras = result.extras ?? [];
    expect(newExtras.length).toBe(2);
    expect(newExtras[0].text).toBe("LINE TWO");
    expect(newExtras[1].text).toBe("LINE THREE");
  });

  it("each split extra gets a unique id", () => {
    const slide = makeSlide();
    const result = splitTextElement(slide, "title");
    const ids = (result.extras ?? []).map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("split extras are inserted right after the original key in element order", () => {
    const slide = makeSlide({ subtitle: "SUB\nLINE" });
    const result = splitTextElement(slide, "subtitle");
    const order = result.elementOrder ?? [];
    const subtitleIdx = order.indexOf("subtitle");
    const newId = result.extras?.[0]?.id ?? "";
    expect(order.indexOf(newId)).toBe(subtitleIdx + 1);
  });

  it("inherits ALL style fields from original (typo, align, size, strokeW, locked, groupId)", () => {
    const slide = makeSlide({
      titleStyle: {
        mt: "100px",
        ml: "20px",
        typo: "typo-content-header",
        align: "right",
        size: "48px",
        strokeW: "3.6px",
        locked: true,
        groupId: "header",
      },
    });
    const result = splitTextElement(slide, "title");
    const ex = result.extras?.[0];
    expect(ex?.style?.typo).toBe("typo-content-header");
    expect(ex?.style?.align).toBe("right");
    expect(ex?.style?.size).toBe("48px");
    expect(ex?.style?.strokeW).toBe("3.6px");
    expect(ex?.style?.locked).toBe(true);
    expect(ex?.style?.groupId).toBe("header");
  });

  it("does not carry over snapToBaseline (each split line is free)", () => {
    const slide = makeSlide({
      titleStyle: { mt: "100px", snapToBaseline: true },
    });
    const result = splitTextElement(slide, "title");
    expect(result.extras?.[0]?.style?.snapToBaseline).toBeUndefined();
  });

  it("staggers split extras vertically by lineSpacingPx", () => {
    const spacing = 50;
    const slide = makeSlide({ titleStyle: { mt: "100px" } });
    const result = splitTextElement(slide, "title", spacing);
    const extras = result.extras ?? [];
    expect(parsePx(extras[0].style?.mt)).toBe(100 + spacing);
    expect(parsePx(extras[1].style?.mt)).toBe(100 + spacing * 2);
  });

  it("split extra elements can be locked independently", () => {
    const slide = makeSlide();
    const result = splitTextElement(slide, "title");
    const extras = result.extras ?? [];
    // Lock just the first split extra
    const lockedExtra = { ...extras[0], style: { ...extras[0].style, locked: true } };
    // Second extra must remain unlocked
    expect(extras[1].style?.locked).toBeUndefined();
    expect(lockedExtra.style?.locked).toBe(true);
  });

  it("splits an extra element", () => {
    const slide: Slide = {
      ...makeSlide(),
      extras: [{ id: "ex-1", kind: "text", text: "TOP\nBOTTOM", style: { mt: "50px" } }],
    };
    const result = splitTextElement(slide, "ex-1");
    const ex1 = result.extras?.find((e) => e.id === "ex-1");
    const newExtras = result.extras?.filter((e) => e.id !== "ex-1") ?? [];
    expect(ex1?.text).toBe("TOP");
    expect(newExtras.length).toBe(1);
    expect(newExtras[0].text).toBe("BOTTOM");
  });

  it("split result preserves existing extras from the slide", () => {
    const slide: Slide = {
      ...makeSlide(),
      extras: [
        { id: "pre-existing", kind: "text", text: "EXISTING", style: {} },
      ],
    };
    const result = splitTextElement(slide, "title");
    const ids = (result.extras ?? []).map((e) => e.id);
    expect(ids).toContain("pre-existing");
  });
});

// ─── getOrderedKeys ───────────────────────────────────────────────────────────

describe("getOrderedKeys", () => {
  it("always includes title", () => {
    const slide = makeSlide({ title: "T" });
    expect(getOrderedKeys(slide)).toContain("title");
  });

  it("respects stored elementOrder", () => {
    const slide = makeSlide({
      subtitle: "S",
      elementOrder: ["subtitle", "title"],
    });
    const keys = getOrderedKeys(slide);
    expect(keys[0]).toBe("subtitle");
    expect(keys[1]).toBe("title");
  });

  it("includes extras in order after fixed elements when no stored order", () => {
    const slide = makeSlide({
      extras: [{ id: "ex-1", kind: "text", text: "X" }],
      elementOrder: undefined,
    });
    const keys = getOrderedKeys(slide);
    expect(keys).toContain("ex-1");
    expect(keys.indexOf("title")).toBeLessThan(keys.indexOf("ex-1"));
  });

  it("filters out unknown keys from stored elementOrder", () => {
    const slide = makeSlide({ elementOrder: ["nonexistent", "title"] });
    const keys = getOrderedKeys(slide);
    expect(keys).not.toContain("nonexistent");
    expect(keys).toContain("title");
  });
});
