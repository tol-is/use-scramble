import React from 'react';
import { useControls, button } from 'leva';

import tragedy from 'iphigenia-in-aulis';

import { useScramble } from '../dist';

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

const generateWords = (index = null) =>
  tragedy[index || getRandomInt(0, tragedy.length)];

export const App = () => {
  const [sample, setSample] = React.useState(null);

  const params = useControls({
    overdrive: true,
    speed: { value: 0.75, min: 0, max: 1, step: 0.01 },
    tick: { value: 1, min: 1, max: 10, step: 1 },
    step: { value: 8, min: 1, max: 42, step: 1 },
    scramble: { value: 3, min: 0, max: 42, step: 1 },
    seed: { value: 1, min: 0, max: 10, step: 1 },
    overflow: true,
  });

  const { ref, replay } = useScramble({
    text: sample,
    initialText: generateWords(),
    ...params,
  });

  useControls(
    {
      Replay: button(() => replay()),
      Randomize: button(() => {
        setSample(generateWords());
      }),
    },
    [replay]
  );

  return (
    <>
      <p ref={ref} />
    </>
  );
};
