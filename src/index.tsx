import { useEffect, useRef } from 'react';

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min);
}

function getRandomChar() {
  const rand = getRandomInt(0, 60);
  return String.fromCharCode(rand + 65);
}

export type UseScrambleProps = {
  /**
   * Text input
   */
  text: string;
  /**
   * A speed of 1, will redraw every 16ms, or 60 times a second
   */
  speed?: number;
  /**
   * Over how many frames tick the animation?
   */
  tick?: number;

  /**
   * Step forward on every tick
   */
  step?: number;

  /**
   * Randomize `seed` characters at random text positions
   */
  seed?: number;
  /**
   * How many times to scramble each character?
   */
  scramble?: number;
  /**
   * Start text animation from an empty string
   */
  overwrite?: boolean;
  /**
   * onComplete callback
   */
  onComplete?: Function;
};

export const useScramble = (props: UseScrambleProps) => {
  //
  let {
    text = '',
    speed = 0.5,
    seed = 0,
    step = Math.ceil(text.length / 10),
    tick = 1,
    scramble = 4,
    overwrite = true,
    onComplete,
  } = props;

  if (speed === 0) {
    console.error('speed 0 will stop the animation');
  }

  if (step < 1) {
    step = 1;
    console.error('step must be at least 1. ');
  }

  if (tick < 1) {
    tick = 1;
    console.error('tick must be at least 1');
  }

  // text node ref
  const nodeRef = useRef<any>(null);

  // animation frame request
  const rafRef = useRef<number>(0);

  // compute
  const elapsedRef = useRef(0);
  const fpsInterval = 1000 / (60 * speed);

  // scramble step
  const stepRef = useRef<number>(0);

  // current character index ref
  const scrambleIndexRef = useRef<number>(0);

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
    if (scrambleIndexRef.current === text.length) return;

    for (var i = 0; i < seed; i++) {
      const index = getRandomInt(
        scrambleIndexRef.current,
        controlRef.current.length - 1
      );
      if (typeof controlRef.current[index] !== 'number') {
        controlRef.current[index] =
          controlRef.current[index] === ' ' ? ' ' : getRandomScramble();
      }
    }
  };

  // add `step` characters to the randomizer, and increase the scrambleIndexRef pointer
  const moveControlIndex = () => {
    for (var i = 0; i < step; i++) {
      if (scrambleIndexRef.current < text.length) {
        const currentIndex = scrambleIndexRef.current;

        controlRef.current[currentIndex] =
          text[scrambleIndexRef.current] === ' ' ? ' ' : getRandomScramble();
        scrambleIndexRef.current += 1;
      }
    }
  };

  const increaseControl = () => {
    for (var i = 0; i < step; i++) {
      if (controlRef.current.length + 1 <= text.length) {
        controlRef.current.push(
          text[controlRef.current.length + 1] === ' ' ? ' ' : undefined
        );
      }
    }
  };

  const decreaseControl = () => {
    if (text.length < controlRef.current.length) {
      controlRef.current.splice(text.length, step);
    }
  };

  const handleTick = () => {
    increaseControl();
    decreaseControl();
    moveControlIndex();
    seedRandomCharacters();
  };

  /**
   * Control the animation framerate, from the speed prop
   *
   * if speed is 0, stop the animation
   */
  const animate = (time: number) => {
    if (speed === 0) {
      return;
    }

    const timeElapsed = time - elapsedRef.current;

    rafRef.current = requestAnimationFrame(animate);

    if (timeElapsed > fpsInterval) {
      elapsedRef.current = time;

      if (stepRef.current % tick === 0) {
        handleTick();
      }

      draw();
    }
  };

  /**
   * Redraw text on every animation frame
   */
  const draw = () => {
    if (!nodeRef.current) return;

    let result = '';

    for (var i = 0; i < controlRef.current.length; i++) {
      const controlValue = controlRef.current[i];

      switch (true) {
        /**
         * a positive integer value, get a random character
         */
        case controlValue && controlValue > 0:
          result += getRandomChar();

          if (i <= scrambleIndexRef.current) {
            // reduce scramble index only if it's past the scrambleIndexRef
            controlRef.current[i] = (controlRef.current[i] as number) - 1;
          }
          break;

        /**
         * a string from the previous text
         */
        case typeof controlValue === 'string' &&
          (i >= text.length || i > scrambleIndexRef.current):
          result += controlValue;
          break;

        /**
         * before scramble index, and equal to the string
         */
        case controlValue === text[i] && i <= scrambleIndexRef.current:
          result += text[i];
          break;

        /**
         * scramble has finished
         */
        case controlValue === 0 && i < text.length:
          result += text[i];
          controlRef.current[i] = text[i];
          break;

        default:
          result += '';
      }
    }

    // apply
    nodeRef.current.innerHTML = result;

    /**
     * Condition to exit:
     * Result is equal to text input
     *
     * - Trim control to text length
     * - fire onComplete
     */
    if (result === text) {
      controlRef.current.splice(text.length, controlRef.current.length);
      if (onComplete) {
        onComplete();
      }
      cancelAnimationFrame(rafRef.current);
    }

    stepRef.current += 1;
  };

  /**
   * Reset scramble controls
   *
   * if overwrite is true, reset the control to the an empty array, the size of the text input. This will cause the animation to play from an empty string
   */
  const reset = () => {
    stepRef.current = 0;
    scrambleIndexRef.current = 0;
    if (overwrite) {
      controlRef.current = new Array(text.length);
    }
  };

  /**
   * Restarts the animation
   *
   * Cancels the current animation frame, resets the scramble index and other controls, and requests a new animation
   */
  const play = () => {
    cancelAnimationFrame(rafRef.current);
    reset();
    rafRef.current = requestAnimationFrame(animate);
  };

  /**
   * reset scramble when text input is changed
   */
  useEffect(() => {
    nodeRef.current.ariaLabel = text;
    reset();
  }, [text]);

  /**
   * start or stop animation when text and speed change
   */
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);

    if (speed > 0) {
      rafRef.current = requestAnimationFrame(animate);
    }

    // cancel raf on unmount
    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [text, speed]);

  return { ref: nodeRef, play };
};
