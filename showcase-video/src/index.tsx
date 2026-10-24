import { Composition } from 'remotion';
import { OrderFlow } from './OrderFlow';

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="Showcase"
        component={OrderFlow}
        durationInFrames={180}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
