/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useMemo } from "react";
import {
  DEFAULT_BACKGROUND,
  getBackgroundPreset,
  randomGradientBackground
} from "~/data/backgrounds";
import { usePreferences } from "./app-context";

export function Background() {
  const { background: current } = usePreferences();

  const preset = useMemo(() => {
    if (current === null) {
      // No preference saved yet: use a fixed lightweight gradient so the first
      // paint never waits on a full-screen video download.
      return getBackgroundPreset(DEFAULT_BACKGROUND);
    }
    if (current === "") {
      // The explicit "Random" option: pick a gradient, never a video, so the
      // background stays free of large media by default.
      return randomGradientBackground();
    }
    return getBackgroundPreset(current) ?? getBackgroundPreset(DEFAULT_BACKGROUND);
  }, [current]);

  if (preset?.type === "gradient") {
    return (
      <div
        className="fixed top-0 left-0 -z-10 h-screen w-screen opacity-50"
        style={{ backgroundImage: preset.css }}
        suppressHydrationWarning
      />
    );
  }

  return (
    <video
      autoPlay
      className="fixed top-0 left-0 -z-10 h-screen w-screen object-cover opacity-50 saturate-200 lg:blur-xs"
      disablePictureInPicture={true}
      loop
      muted
      onContextMenu={(event) => event.preventDefault()}
      src={`/videos/bg-${preset?.value ?? DEFAULT_BACKGROUND}.webm`}
      suppressHydrationWarning
    />
  );
}