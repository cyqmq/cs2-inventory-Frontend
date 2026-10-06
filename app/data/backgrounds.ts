/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export type GradientBackground = {
  type: "gradient";
  value: string;
  label: string;
  css: string;
};

export type VideoBackground = {
  type: "video";
  value: string;
  label: string;
};

export type BackgroundPreset = GradientBackground | VideoBackground;

const gradientBackgrounds: GradientBackground[] = [
  {
    type: "gradient",
    label: "Gradient Night",
    value: "gradient-night",
    css: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)"
  },
  {
    type: "gradient",
    label: "Gradient Ember",
    value: "gradient-ember",
    css: "linear-gradient(135deg, #1a0a00 0%, #5a1a0a 50%, #1c1c1c 100%)"
  },
  {
    type: "gradient",
    label: "Gradient Steel",
    value: "gradient-steel",
    css: "linear-gradient(135deg, #141e30 0%, #243b55 50%, #0f2027 100%)"
  },
  {
    type: "gradient",
    label: "Gradient Dust",
    value: "gradient-dust",
    css: "linear-gradient(135deg, #3e2723 0%, #6d4c41 50%, #1c1c1c 100%)"
  }
];

/**
 * No video backgrounds are shipped: this project has no `/videos/bg-*.webm`
 * media files in the repository or in the deployed bundle, so they would render
 * as broken/blank backgrounds. The type and the video branch in `Background`
 * are kept so a future deployment that adds the actual video files can restore
 * them here.
 */
const videoBackgrounds: VideoBackground[] = [];

export const backgrounds: BackgroundPreset[] = [
  ...gradientBackgrounds,
  ...videoBackgrounds
];

export const DEFAULT_BACKGROUND = gradientBackgrounds[0].value;

export function getBackgroundPreset(
  value: string | null | undefined
): BackgroundPreset | undefined {
  return backgrounds.find((background) => background.value === value);
}

export function isVideoBackground(
  value: string | null | undefined
): boolean {
  return getBackgroundPreset(value)?.type === "video";
}

export function randomGradientBackground(): GradientBackground {
  return gradientBackgrounds[
    Math.floor(Math.random() * gradientBackgrounds.length)
  ];
}

export const backgroundValues = backgrounds.map(({ value }) => value);