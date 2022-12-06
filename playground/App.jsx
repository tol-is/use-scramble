import React from 'react';
import { useControls, button } from 'leva';

import tragedy from 'iphigenia-in-aulis';

import { useScramble } from '../dist';

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

const generateWords = index =>
  tragedy[index || getRandomInt(0, tragedy.length)];

export const App = () => {
  const [sample, setSample] = React.useState(generateWords());
  const values = useControls({
    Randomize: button(() => setSample(generateWords())),
    speed: { value: 0.5, min: 0.1, max: 1, step: 0.1 },
    scramble: { value: 1, min: 0, max: 42, step: 1 },
    step: { value: 4, min: 1, max: 10, step: 1 },
    interval: { value: 1, min: 1, max: 20, step: 1 },
    seed: { value: 1, min: 0, max: 42, step: 1 },
    overwrite: false,
  });

  const { ref, replay } = useScramble({
    text: sample,
    ...values,
  });

  return (
    <>
      <button onClick={replay}>replay</button>
      <p ref={ref} />
    </>
  );
};
