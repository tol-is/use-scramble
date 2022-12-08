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
    speed: { value: 0.5, min: 0.01, max: 1, step: 0.01 },
    scramble: { value: 1, min: 0, max: 42, step: 1 },
    increment: { value: 4, min: 1, max: 42, step: 1 },
    interval: { value: 1, min: 1, max: 10, step: 1 },
    seed: { value: 1, min: 0, max: 10, step: 1 },
    overwrite: false,
    //   text: {
    //     value: '',
    //     onChange: value => {
    //       console.log('play', value);
    //       if (value) {
    //         setSample('POTATO');
    //       }
    //     },
    //   },
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
        // set({ text: '' });
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
