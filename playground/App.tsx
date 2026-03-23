import React from 'react';
import { useControls, button, buttonGroup } from 'leva';

import tragedy from 'iphigenia-in-aulis';

import { useScramble } from '../src';

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min);
}

const generateWords = (index: number | null = null) =>
  tragedy[index || getRandomInt(0, tragedy.length)];

export const App = () => {
  const [sample, setSample] = React.useState(generateWords());

  const params = useControls('Animation', {
    speed: { value: 0.85, min: 0, max: 1, step: 0.01 },
    tick: { value: 1, min: 1, max: 10, step: 1 },
    step: { value: 1, min: 1, max: 42, step: 1 },
    scramble: { value: 4, min: 0, max: 42, step: 1 },
    seed: { value: 0, min: 0, max: 10, step: 1 },
    chance: { value: 0.85, min: 0, max: 1, step: 0.01 },
  });

  const features = useControls('Features', {
    overdrive: false,
    overflow: false,
    delay: { value: 0, min: 0, max: 2000, step: 50 },
    direction: { value: 'ltr', options: ['ltr', 'rtl', 'random'] },
  });

  const { ref, replay } = useScramble<HTMLParagraphElement>({
    text: sample,
    ...params,
    ...features,
    direction: features.direction as 'ltr' | 'rtl' | 'random',
  });

  useControls(
    'Actions',
    {
      Replay: button(() => replay()),
      Randomize: button(() => setSample(generateWords())),
    },
    [replay]
  );

  return (
    <>
      <p ref={ref} />
    </>
  );
};
