import { Composition, Folder } from "remotion";
import { ProductiveYouTubeDemo } from "./compositions/ProductiveYouTubeDemo";
import { IntroScene } from "./compositions/IntroScene";
import { ProblemScene } from "./compositions/ProblemScene";
import { FeatureBlockers } from "./compositions/FeatureBlockers";
import { FeatureTranscript } from "./compositions/FeatureTranscript";
import { FeatureAI } from "./compositions/FeatureAI";
import { OutroScene } from "./compositions/OutroScene";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="ProductiveYouTubeDemo"
        component={ProductiveYouTubeDemo}
        durationInFrames={600}
        fps={30}
        width={1920}
        height={1080}
      />
      <Folder name="Scenes">
        <Composition
          id="IntroScene"
          component={IntroScene}
          durationInFrames={90}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="ProblemScene"
          component={ProblemScene}
          durationInFrames={90}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="FeatureBlockers"
          component={FeatureBlockers}
          durationInFrames={150}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="FeatureTranscript"
          component={FeatureTranscript}
          durationInFrames={120}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="FeatureAI"
          component={FeatureAI}
          durationInFrames={120}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="OutroScene"
          component={OutroScene}
          durationInFrames={90}
          fps={30}
          width={1920}
          height={1080}
        />
      </Folder>
    </>
  );
};
