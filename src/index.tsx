import { useEffect, useRef } from 'react';

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min);
}

function getRandomChar() {
  const rand = getRandomInt(0, 60);
  return String.fromCharCode(rand + 65);
}

type useScrambleProps = {
  text: string;
  speed?: number;
  seed?: number;
  step?: number;
  interval?: number;
  scramble?: number;
  loop?: boolean;
  onComplete?: Function;
};

export const useScramble = (props: useScrambleProps) => {
  //
  const {
    text,
    speed = 0.5,
    seed = 0,
    step = 1,
    interval = 1,
    scramble = 0,
    loop = false,
    onComplete,
  } = props;

  // text node ref
  const textRef = useRef<any>(null);

  // animation frame request
  const rafRef = useRef<number>(0);

  // compute
  const elapsedRef = useRef(0);
  const fpsInterval = 1000 / (120 * speed);

  // scramble step
  const stepRef = useRef<number>(0);

  // current character index ref
  const idxRef = useRef<number>(0);

  // scramble controller
  const scrambleRef = useRef<number[]>([]);

  // dice role with 20%
  const getRandomScramble = () => {
    const diceRoll = getRandomInt(0, 10);
    return scramble > 0
      ? scramble + 1 + (diceRoll < 2 ? getRandomInt(0, scramble) : 1)
      : 0;
  };

  // pick random character ahead in the string, and add them to the randomizer
  const seedRandomCharacters = () => {
    for (var i = 0; i < seed; i++) {
      const pos = getRandomInt(idxRef.current, text.length);
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

  // draw when fpsInterval time has passed. fpsInterval is computed by the `speed` prop
  const animate = (time: number) => {
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
      moveCharIndex();
      seedRandomCharacters();
    }

    let newString = '';
    let charsDone = 0;

    for (var i = 0; i < text.length; i++) {
      const cPos = scrambleRef.current[i];

      switch (true) {
        case text[i] === ' ':
          newString += ' ';
          charsDone++;
          break;
        case cPos <= 0:
          newString += text[i];
          charsDone++;
          break;
        case cPos > 0 && i <= idxRef.current:
          newString += getRandomChar();
          scrambleRef.current[i] -= 1;
          break;
        case cPos > 0:
          newString += getRandomChar();
          break;
        default:
          newString += '<span>&nbsp;</span>';
      }
    }

    textRef.current.innerHTML = newString;

    if (charsDone === text.length) {
      if (onComplete) {
        onComplete();
      }
      if (loop) {
        stepRef.current = 0;
        idxRef.current = 0;
        elapsedRef.current = 0;
        scrambleRef.current = new Array(text.length);
      } else {
        cancelAnimationFrame(rafRef.current);
      }
    }

    stepRef.current += 1;
  };

  // reset step when text is changed
  useEffect(() => {
    // clearTimeout(loopRef.current)
    stepRef.current = 0;
    idxRef.current = 0;
    elapsedRef.current = 0;
    scrambleRef.current = new Array(text.length);
  }, [text]);

  //
  useEffect(() => {
    if (speed > 0.001) {
      rafRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(rafRef.current);
    }
    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [animate, speed]); // Make sure the effect runs only once

  return { ref: textRef };
};
