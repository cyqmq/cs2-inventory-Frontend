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

const videoBackgrounds: VideoBackground[] = [
  { type: "video", label: "Ancient 1", value: "ancient" },
  { type: "video", label: "Ancient 2", value: "cs2_ancient_t" },
  { type: "video", label: "Anubis 1", value: "anubis" },
  { type: "video", label: "Anubis 2", value: "cs2_anubis_a" },
  { type: "video", label: "Anubis 3", value: "cs2_anubis_ct" },
  { type: "video", label: "Anubis 4", value: "cs2_anubis_water" },
  { type: "video", label: "Apollo", value: "apollo" },
  { type: "video", label: "Blacksite", value: "blacksite" },
  { type: "video", label: "Cobblestone", value: "cbble" },
  { type: "video", label: "Chlorine", value: "chlorine" },
  { type: "video", label: "County", value: "county" },
  { type: "video", label: "Engage", value: "engage" },
  { type: "video", label: "Guard", value: "guard" },
  { type: "video", label: "Inferno 1", value: "cs2_inferno_a" },
  { type: "video", label: "Inferno 2", value: "cs2_inferno_caverna" },
  { type: "video", label: "Mutiny", value: "mutiny" },
  { type: "video", label: "Nuke 1", value: "nuke" },
  { type: "video", label: "Nuke 2", value: "cs2_nuke_outside" },
  { type: "video", label: "Overpass", value: "cs2_overpass_monster" },
  { type: "video", label: "Sirocco 1", value: "sirocco" },
  { type: "video", label: "Sirocco 2", value: "sirocco_night" },
  { type: "video", label: "Swamp", value: "swamp" },
  { type: "video", label: "Train", value: "cs2_train" },
  { type: "video", label: "Vertigo", value: "vertigo" }
];

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