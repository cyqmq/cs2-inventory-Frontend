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
  it("contains both gradient and video presets", () => {
    const types = new Set(backgrounds.map((background) => background.type));
    expect(types.has("gradient")).toBe(true);
    expect(types.has("video")).toBe(true);
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
    expect(getBackgroundPreset("ancient")?.type).toBe("video");
  });

  it("returns undefined for unknown values", () => {
    expect(getBackgroundPreset("not-a-background")).toBeUndefined();
  });

  it("detects video backgrounds", () => {
    expect(isVideoBackground("ancient")).toBe(true);
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