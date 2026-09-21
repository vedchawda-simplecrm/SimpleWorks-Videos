import { createContext, useContext } from "react";
import { Audio, getRemotionEnvironment, staticFile } from "remotion";

/**
 * True while a scene is being rendered inside the assembled FullVideo.
 * The assembled cut plays one continuous track of its own, so the
 * per-scene tracks must stay silent there - otherwise the music restarts
 * at every scene boundary.
 */
export const InsideFullVideo = createContext(false);

/**
 * Plays a scene's finished audio track, but ONLY in Remotion Studio.
 *
 * This Remotion (4.0.526) / Node 24 / Windows combination crashes on any
 * render of a composition containing an audio asset - a minimal 30-frame
 * composition with one <Audio> reproduces it. Rendering therefore stays
 * video-only and the track is muxed in afterwards by
 * scripts/build-audio-track.mjs. Returning null while rendering keeps the
 * asset out of the render entirely, so preview gets sound without
 * breaking the renderer.
 */
export const PreviewAudio: React.FC<{ track: string; always?: boolean }> = ({
  track,
  always = false,
}) => {
  const { isStudio } = getRemotionEnvironment();
  const insideFullVideo = useContext(InsideFullVideo);
  if (!isStudio || (insideFullVideo && !always)) {
    return null;
  }
  return <Audio src={staticFile(`assets/audio/${track}.wav`)} />;
};
