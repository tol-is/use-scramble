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
  const [sample, setSample] = React.useState(generateWords());

  const [values, set] = useControls(() => ({
    speed: { value: 0.75, min: 0, max: 1, step: 0.01 },
    scramble: { value: 3, min: 0, max: 42, step: 1 },
    step: { value: 8, min: 1, max: 42, step: 1 },
    tick: { value: 1, min: 1, max: 10, step: 1 },
    seed: { value: 1, min: 0, max: 10, step: 1 },
    overwrite: false,
  }));

  const { ...params } = values;

  const { ref, play } = useScramble({
    ...params,
    text: sample,
  });

  useControls(
    {
      play: button(() => play()),
      Randomize: button(() => {
        setSample(generateWords());
      }),
    },
    [play]
  );

  return (
    <>
      <p ref={ref} />
    </>
  );
};
