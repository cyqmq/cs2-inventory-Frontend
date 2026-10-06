/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, expect, it } from "vitest";
import {
  backgrounds,
  DEFAULT_BACKGROUND,
  getBackgroundPreset,
  isVideoBackground,
  randomGradientBackground
} from "./backgrounds";

describe("backgrounds", () => {
  it("ships only gradient presets (no broken video files)", () => {
    expect(backgrounds.length).toBeGreaterThan(0);
    for (const background of backgrounds) {
      expect(background.type).toBe("gradient");
    }
  });

  it("defines a css value for every gradient preset", () => {
    const gradients = backgrounds.filter(
      (background) => background.type === "gradient"
    );
    expect(gradients.length).toBeGreaterThan(0);
    for (const gradient of gradients) {
      expect(gradient.css).toMatch(/^(linear|radial)-gradient\(/);
    }
  });

  it("keeps background values unique", () => {
    const values = backgrounds.map((background) => background.value);
    expect(new Set(values).size).toBe(values.length);
  });

  it("uses a gradient as the default background", () => {
    expect(getBackgroundPreset(DEFAULT_BACKGROUND)?.type).toBe("gradient");
  });

  it("returns the correct preset type for known values", () => {
    expect(getBackgroundPreset("gradient-night")?.type).toBe("gradient");
  });

  it("returns undefined for unknown values", () => {
    expect(getBackgroundPreset("not-a-background")).toBeUndefined();
    expect(getBackgroundPreset("ancient")).toBeUndefined();
  });

  it("does not detect video backgrounds when none are shipped", () => {
    expect(isVideoBackground("ancient")).toBe(false);
    expect(isVideoBackground("gradient-night")).toBe(false);
    expect(isVideoBackground(null)).toBe(false);
  });

  it("always picks a gradient for the random gradient helper", () => {
    for (let i = 0; i < 20; i++) {
      const gradient = randomGradientBackground();
      expect(gradient.type).toBe("gradient");
      expect(gradient.css).toMatch(/^(linear|radial)-gradient\(/);
    }
  });
});