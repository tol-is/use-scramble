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
  overwrite?: boolean;
  onComplete?: Function;
};

export const useScramble = (props: UseScrambleProps) => {
  //
  const {
    text = '',
    speed = 0.5,
    seed = 0,
    step = Math.ceil(text.length / 10),
    interval = 1,
    scramble = 4,
    overwrite = true,
    onComplete,
  } = props;

  // text node ref
  const nodeRef = useRef<any>(null);

  // animation frame request
  const rafRef = useRef<number>(0);

  // compute
  const elapsedRef = useRef(0);
  const fpsInterval = 1000 / (30 * speed);

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
    if (idxRef.current === text.length) return;

    for (var i = 0; i < seed; i++) {
      const index = getRandomInt(idxRef.current, text.length - 1);
      if (typeof controlRef.current[index] !== 'number') {
        // console.log(index);
        controlRef.current[index] = getRandomScramble();
      }
    }
  };

  // add `step` characters to the randomizer, and increase the idxRef pointer
  const moveControlIndex = () => {
    for (var i = 0; i < step; i++) {
      if (idxRef.current < controlRef.current.length) {
        const currentIndex = idxRef.current;
        controlRef.current[currentIndex] = getRandomScramble();
        idxRef.current += 1;
      }
    }
  };

  const increaseControl = () => {
    if (text.length > controlRef.current.length) {
      for (var i = 0; i < step; i++) {
        if (controlRef.current.length + 1 < text.length) {
          controlRef.current.push(undefined);
        }
      }
    }
  };

  const decreaseControl = () => {
    if (text.length < controlRef.current.length) {
      controlRef.current.splice(text.length, step);
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
    if (!nodeRef.current) return;

    if (stepRef.current % interval === 0) {
      increaseControl();
      decreaseControl();
      moveControlIndex();
      seedRandomCharacters();
    }

    let newString = '';
    let charsDone = 0;

    for (var i = 0; i < controlRef.current.length; i++) {
      const currChar = controlRef.current[i];

      if (typeof currChar === 'undefined') {
        newString += '';
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
            newString += '';
        }
      }
    }
    nodeRef.current.innerHTML = newString;

    if (charsDone === text.length) {
      if (onComplete) {
        onComplete();
      }
      cancelAnimationFrame(rafRef.current);
    }

    stepRef.current += 1;
  };

  const reset = () => {
    stepRef.current = 0;
    idxRef.current = 0;
    if (overwrite) {
      controlRef.current = new Array(text.length);
    }
  };

  const replay = () => {
    cancelAnimationFrame(rafRef.current);
    reset();
    rafRef.current = requestAnimationFrame(animate);
  };

  // reset step when text is changed
  useEffect(() => {
    nodeRef.current.ariaLabel = text;
    reset();
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
  }, [replay, animate, speed]);

  return { ref: nodeRef, replay };
};
