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
  increment?: number;
  interval?: number;
  scramble?: number;
  overwrite?: boolean;
  onComplete?: Function;
};

export const useScramble = (props: UseScrambleProps) => {
  //
  let {
    text = '',
    speed = 0.5,
    seed = 0,
    increment = Math.ceil(text.length / 10),
    interval = 1,
    scramble = 4,
    overwrite = true,
    onComplete,
  } = props;

  if (speed === 0) {
    increment = 1;
    console.error('speed 0 will stop the animation');
  }

  if (increment < 1) {
    increment = 1;
    console.error('increment must be at least 1. ');
  }

  if (interval < 1) {
    interval = 1;
    console.error('interval must be at least 1');
  }

  // text node ref
  const nodeRef = useRef<any>(null);

  // animation frame request
  const rafRef = useRef<number>(0);

  // compute
  const elapsedRef = useRef(0);
  const fpsInterval = 1000 / (30 * speed);

  // scramble increment
  const incrementRef = useRef<number>(0);

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
        // controlRef.current[index] = getRandomScramble();
      }
    }
  };

  // add `increment` characters to the randomizer, and increase the idxRef pointer
  const moveControlIndex = () => {
    for (var i = 0; i < increment; i++) {
      if (idxRef.current < controlRef.current.length) {
        const currentIndex = idxRef.current;
        controlRef.current[currentIndex] = getRandomScramble();
        idxRef.current += 1;
      }
    }
  };

  const increaseControl = () => {
    if (text.length > controlRef.current.length) {
      for (var i = 0; i < increment; i++) {
        if (controlRef.current.length + 1 < text.length) {
          controlRef.current.push(undefined);
        }
      }
    }
  };

  const decreaseControl = () => {
    if (text.length < controlRef.current.length) {
      controlRef.current.splice(text.length, increment);
    }
  };

  // draw when fpsInterval time has passed. fpsInterval is computed by the `speed` prop
  const animate = (time: number) => {
    // console.log('animate');
    const timeElapsed = time - elapsedRef.current;

    rafRef.current = requestAnimationFrame(animate);

    if (timeElapsed > fpsInterval) {
      elapsedRef.current = time;
      draw();
    }
  };

  // redraw text on every increment and increment incrementRef
  const draw = () => {
    if (!nodeRef.current) return;

    if (incrementRef.current % interval === 0) {
      increaseControl();
      decreaseControl();
      moveControlIndex();
      seedRandomCharacters();
    }

    let result = '';

    // controlRef.current.forEach(v => {
    //   if (v === undefined) {
    //     console.log('boom');
    //     debugger;
    //   }
    // });
    // console.log(controlRef.current);

    for (var i = 0; i < controlRef.current.length; i++) {
      const idxControl = controlRef.current[i];

      if (typeof idxControl === 'undefined') {
        result += '';
      } else {
        switch (true) {
          case typeof idxControl === 'string' && i >= text.length:
            result += idxControl;
            break;

          case typeof idxControl === 'string' && i > idxRef.current:
            result += idxControl;
            break;

          case typeof idxControl === 'string' && i <= idxRef.current:
            result += text[i];
            break;

          case idxControl > 0:
            result += getRandomChar();
            controlRef.current[i] = (controlRef.current[i] as number) - 1;
            break;

          case idxControl === 0 || text[i] === ' ':
            result += text[i];
            controlRef.current[i] = text[i];
            break;

          default:
            result += '';
        }
      }
    }
    nodeRef.current.innerHTML = result;

    if (result === text) {
      if (onComplete) {
        onComplete();
      }
      cancelAnimationFrame(rafRef.current);
    }

    incrementRef.current += 1;
  };

  const reset = () => {
    incrementRef.current = 0;
    idxRef.current = 0;
    if (overwrite) {
      controlRef.current = new Array(text.length);
    }
  };

  const play = () => {
    cancelAnimationFrame(rafRef.current);
    reset();
    rafRef.current = requestAnimationFrame(animate);
  };

  // reset increment when text is changed
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
  }, [animate, speed]);

  return { ref: nodeRef, play };
};
