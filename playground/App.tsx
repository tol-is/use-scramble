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
  const [sample, setSample] = React.useState(
    'Mi2nim in no1strud reprehender3it exerci4tation repre2henderit duis. Reprehe3nderit ad et m2inim com3modo consectetu12r. Aute2 cup3idatat des3erunt laboris dolore velit enim anim. Magna labore eu ut in eu esse ad.'
  );

  const params = useControls({
    overdrive: false,
    speed: { value: 0.85, min: 0, max: 1, step: 0.01 },
    tick: { value: 1, min: 1, max: 10, step: 1 },
    step: { value: 1, min: 1, max: 42, step: 1 },
    scramble: { value: 0, min: 0, max: 42, step: 1 },
    seed: { value: 1, min: 0, max: 10, step: 1 },
    overflow: false,
  });

  const { ref, replay } = useScramble({
    text: sample,
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
