import { Composition } from 'remotion';
import { HeroIntro } from './compositions/HeroIntro';
import { ProductDemo } from './compositions/ProductDemo';
import { FeatureRundown } from './compositions/FeatureRundown';
import { FinalCTA } from './compositions/FinalCTA';
import { SocialProof } from './compositions/SocialProof';

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="HeroIntro"
        component={HeroIntro}
        durationInFrames={150}  // 5s @ 30fps
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ProductDemo"
        component={ProductDemo}
        durationInFrames={900}  // 30s @ 30fps
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="FeatureRundown"
        component={FeatureRundown}
        durationInFrames={450}  // 15s @ 30fps
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="SocialProof"
        component={SocialProof}
        durationInFrames={300}  // 10s @ 30fps
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="FinalCTA"
        component={FinalCTA}
        durationInFrames={90}   // 3s @ 30fps
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
