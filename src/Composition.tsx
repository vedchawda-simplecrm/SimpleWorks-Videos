import { Composition } from "remotion";
import { IntroScene } from "./scenes/IntroScene";
import { ConnectorScene } from "./scenes/ConnectorScene";

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const DURATION_IN_FRAMES = FPS * 8;
export const CONNECTOR_DURATION_IN_FRAMES = 195;

export const MyComposition = () => {
  return (
    <>
      <Composition
        id="IntroScene"
        component={IntroScene}
        durationInFrames={DURATION_IN_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="ConnectorScene"
        component={ConnectorScene}
        durationInFrames={CONNECTOR_DURATION_IN_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
