import { Composition } from 'remotion';
import { HeroIntro } from './compositions/HeroIntro';
import { ProductDemo } from './compositions/ProductDemo';
import { FeatureRundown } from './compositions/FeatureRundown';
import { FinalCTA } from './compositions/FinalCTA';
import { SocialProof } from './compositions/SocialProof';
import { ProductClip, clipDuration } from './compositions/ProductClip';
import { demoClips } from './clips';

export const RemotionRoot = () => {
  return (
    <>
      {/* Vídeos demonstrativos das páginas públicas (prints reais): ids = chaves de demoClips */}
      {Object.entries(demoClips).map(([id, props]) => (
        <Composition
          key={id}
          id={id}
          component={ProductClip}
          defaultProps={props}
          durationInFrames={clipDuration(props)}
          fps={30}
          width={1280}
          height={720}
        />
      ))}
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
