import {
  TransitionSeries,
  linearTiming,
  springTiming,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { IntroScene } from "./IntroScene";
import { ProblemScene } from "./ProblemScene";
import { FeatureBlockers } from "./FeatureBlockers";
import { FeatureTranscript } from "./FeatureTranscript";
import { FeatureAI } from "./FeatureAI";
import { OutroScene } from "./OutroScene";

export const ProductiveYouTubeDemo = () => {
  return (
    <TransitionSeries>
      {/* Scene 1: Intro - Brand reveal */}
      <TransitionSeries.Sequence durationInFrames={90}>
        <IntroScene />
      </TransitionSeries.Sequence>

      {/* Transition: Glitch/shake into problem */}
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 15 })}
      />

      {/* Scene 2: Problem - YouTube distractions */}
      <TransitionSeries.Sequence durationInFrames={90}>
        <ProblemScene />
      </TransitionSeries.Sequence>

      {/* Transition: Wipe away the chaos */}
      <TransitionSeries.Transition
        presentation={wipe({ direction: "from-right" })}
        timing={linearTiming({ durationInFrames: 20 })}
      />

      {/* Scene 3: Solution - Algorithm Blockers */}
      <TransitionSeries.Sequence durationInFrames={150}>
        <FeatureBlockers />
      </TransitionSeries.Sequence>

      {/* Transition: Slide to transcript */}
      <TransitionSeries.Transition
        presentation={slide({ direction: "from-bottom" })}
        timing={springTiming({ config: { damping: 200 }, durationInFrames: 25 })}
      />

      {/* Scene 4: Feature - Transcripts */}
      <TransitionSeries.Sequence durationInFrames={120}>
        <FeatureTranscript />
      </TransitionSeries.Sequence>

      {/* Transition: Fade to AI */}
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 20 })}
      />

      {/* Scene 5: Feature - AI Integration */}
      <TransitionSeries.Sequence durationInFrames={120}>
        <FeatureAI />
      </TransitionSeries.Sequence>

      {/* Transition: Elegant fade to outro */}
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 25 })}
      />

      {/* Scene 6: Outro - CTA */}
      <TransitionSeries.Sequence durationInFrames={90}>
        <OutroScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
