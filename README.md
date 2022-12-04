# Scramble

A scramble text UI component for react.

The animation maintains an internal ticking clock, that runs up to 60 times per second, or once per animation frame. The animation starts from the beginning of the text, and scrambles until the end of the input, given a set of parameters that allow you to control how many characters are added and over how many ticks, and how many times each character is randomized.

Live demo at [https://use-scramble.vercel.app/](https://use-scramble.vercel.app/)

### Props

| Property   | type     | default | description                                                           |
| ---------- | -------- | ------- | --------------------------------------------------------------------- |
| text       | string   | -       | text to scramble.                                                     |
| speed      | number   | 0.4     | 0-1 range that determines the ticking speed. 1 means 1 tick per frame |
| scramble   | number   | 8       | how many times each character will randomize                          |
| step       | number   | 1       | how many characters are added to the scramble on each tick            |
| interval   | number   | 1       | how many ticks it requires to increment the step index                |
| seed       | number   | 3       | adds random characters to the scramble, ahead of the ticking loop     |
| onComplete | function | -       | callback invoked on completion                                        |

### Installation

```js
  yarn add use-scramble
  //or
  npm install use-scramble
```

### Usage

```jsx
import { useScramble } from 'use-scramble';

export const App = () => {
  const ref = useScramble({
    text: 'Fugiat ullamco non magna dolor excepteur.',
    play: true,
    speed: 0.4,
    scramble: 8,
    seed: 3,
    seedInterval: 10,
    step: 1,
    stepInterval: 1,
    onComplete: () => {
      window.alert('scramble is done');
    },
  });

  return <p ref={ref} />;
};
```
