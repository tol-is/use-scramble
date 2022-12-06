import { useEffect, useRef } from 'react';

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min);
}

function getRandomChar() {
  const rand = getRandomInt(0, 60);
  return String.fromCharCode(rand + 65);
}

export type UseScrambleProps = {
  text: string;
  speed?: number;
  seed?: number;
  step?: number;
  interval?: number;
  scramble?: number;
  loop?: boolean;
  onComplete?: Function;
};

export const useScramble = (props: UseScrambleProps) => {
  //
  const {
    text,
    speed = 0.5,
    seed = 0,
    step = 1,
    interval = 1,
    scramble = 8,
    onComplete,
  } = props;

  // text node ref
  const textRef = useRef<any>(null);

  // animation frame request
  const rafRef = useRef<number>(0);

  // compute
  const elapsedRef = useRef(0);
  const fpsInterval = 1000 / (60 * speed);

  // scramble step
  const stepRef = useRef<number>(0);

  // current character index ref
  const idxRef = useRef<number>(0);

  // scramble controller
  const controlRef = useRef<Array<string | number | undefined>>(
    new Array(text.length)
  );

  // dice role with 20%
  const getRandomScramble = () => {
    const diceRoll = getRandomInt(0, 10);
    return scramble > 0
      ? scramble + (diceRoll < 2 ? getRandomInt(0, scramble) : 0)
      : 0;
  };

  // pick random character ahead in the string, and add them to the randomizer
  const seedRandomCharacters = () => {
    for (var i = 0; i < seed; i++) {
      const pos = getRandomInt(idxRef.current, text.length - 1);
      controlRef.current[pos] = getRandomScramble();
    }
  };

  // add `step` characters to the randomizer, and increase the idxRef pointer
  const moveCharIndex = () => {
    for (var i = 0; i < step; i++) {
      if (idxRef.current < controlRef.current.length) {
        const currentIndex = idxRef.current;
        controlRef.current[currentIndex] = getRandomScramble();
        idxRef.current += 1;
      }
    }
  };

  const addMissingCharacters = () => {
    if (text.length > controlRef.current.length) {
      for (var i = 0; i < step; i++) {
        if (controlRef.current.length + 1 < text.length) {
          controlRef.current.push(undefined);
        }
      }
    }
  };

  const removeSurplus = () => {
    if (text.length < controlRef.current.length) {
      controlRef.current.splice(text.length, step);
    }
  };

  // draw when fpsInterval time has passed. fpsInterval is computed by the `speed` prop
  const animate = (time: number) => {
    console.log('animate');
    const timeElapsed = time - elapsedRef.current;

    rafRef.current = requestAnimationFrame(animate);

    if (timeElapsed > fpsInterval) {
      elapsedRef.current = time;
      draw();
    }
  };

  // redraw text on every step and increment stepRef
  const draw = () => {
    if (!textRef.current) return;

    if (stepRef.current % interval === 0) {
      addMissingCharacters();
      removeSurplus();
      moveCharIndex();
      seedRandomCharacters();
    }

    let newString = '';
    let charsDone = 0;

    for (var i = 0; i < controlRef.current.length; i++) {
      const currChar = controlRef.current[i];

      if (typeof currChar === 'undefined') {
        newString += '<span>&nbsp;</span>';
      } else {
        switch (true) {
          case i >= text.length && typeof currChar === 'string':
            newString += currChar;
            break;
          case i >= text.length:
            newString += getRandomChar();
            controlRef.current[i] = (controlRef.current[i] as number) - 1;
            break;

          case typeof currChar === 'string' && i > idxRef.current:
            newString += currChar;
            break;

          case typeof currChar === 'string' && i <= idxRef.current:
            newString += text[i];
            charsDone++;
            break;

          case currChar === 0 || text[i] === ' ':
            newString += text[i];
            controlRef.current[i] = text[i];
            charsDone++;
            break;

          case currChar > 0 && i <= idxRef.current:
            newString += getRandomChar();
            controlRef.current[i] = (controlRef.current[i] as number) - 1;
            break;
          case currChar > 0:
            newString += getRandomChar();
            break;
          default:
            newString += '<span>&nbsp;</span>';
        }
      }
    }
    textRef.current.innerHTML = newString;

    if (charsDone === text.length) {
      if (onComplete) {
        onComplete();
      }
      cancelAnimationFrame(rafRef.current);
    }

    stepRef.current += 1;
  };

  // reset step when text is changed
  useEffect(() => {
    stepRef.current = 0;
    idxRef.current = 0;
  }, [text]);

  //
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    if (speed > 0.001) {
      rafRef.current = requestAnimationFrame(animate);
    }
    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [animate, speed]); // Make sure the effect runs only once

  return { ref: textRef };
};
