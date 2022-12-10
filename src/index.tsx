import { useEffect, useRef } from 'react';

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min);
}

function getRandomChar(range: RangeOrCharCodes) {
  let rand = 0;
  if (range.length === 2) {
    rand = getRandomInt(range[0], range[1] + 1);
  } else {
    rand = range[getRandomInt(0, range.length - 1)];
  }

  return String.fromCharCode(rand);
}

type RangeOrCharCodes = {
  0: number;
  1: number;
} & Array<number>;

export type UseScrambleProps = {
  /**
   * Optional text input
   */
  text?: string;
  /**
   * 0-1 range that determines the scramble speed. A speed of 1 will redraw 60 times a second. A speed of 0 will pause the animation
   *
   * @default 1
   */
  speed?: number;
  /**
   * The controller will move forward along the text input and scramble more characters, at a pace of `tick` frames. Combined with the `speed` prop, you can control the animation rate
   *
   * @default 1
   */
  tick?: number;
  /**
   * Step forward on every tick
   *
   * @default 1
   */
  step?: number;
  /**
   * Randomize `seed` characters at random text positions
   *
   * @default 1
   */
  seed?: number;
  /**
   * How many times to scramble each character?
   *
   * @default 1
   */
  scramble?: number;

  /**
   * Unicode character range for scrambler.
   *
   * If a tupple is provided [60,125], it will randomly choose a unicode character code within that range.
   *
   * If the array contains more than two unicode values, it will choose randomly from the array values only.
   *
   * To randomize with only two values, you can repeat them in the array [91,93,91,93]
   *
   * @default [65,125]
   */
  range?: RangeOrCharCodes;
  /**
   * Set the animation to overdrive mode, and set the unicode character code to use in the animation
   */
  overdrive?: boolean | number;
  /**
   * Always start text animation from an empty string
   *
   * @default false
   */
  overflow?: boolean;
  /**
   * onComplete callback
   */
  onComplete?: Function;

  /**
   * onFrame callback
   */
  onFrame?: (result: string) => void;
};

export const useScramble = (props: UseScrambleProps) => {
  let {
    text,
    speed = 1,
    seed = 1,
    step = 1,
    tick = 1,
    scramble = 1,
    overflow = true,
    range = [65, 125],
    overdrive = true,
    onStart,
    onFrame,
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
  const controlRef = useRef<Array<string | number | null>>([]);

  // overdrive control index
  const overdriveRef = useRef<number>(0);

  // pick random character ahead in the string, and add them to the randomizer
  const seedForward = () => {
    if (!text) return;
    if (scrambleIndexRef.current === text.length) return;

    for (var i = 0; i < seed; i++) {
      const index = getRandomInt(
        scrambleIndexRef.current,
        controlRef.current.length
      );
      if (
        typeof controlRef.current[index] !== 'number' &&
        typeof controlRef.current[index] !== 'undefined'
      ) {
        controlRef.current[index] =
          controlRef.current[index] === ' ' ? ' ' : scramble || seed;
      }
    }
  };

  // add `step` characters to the randomizer, and increase the scrambleIndexRef pointer
  const stepForward = () => {
    if (!text) return;
    for (var i = 0; i < step; i++) {
      if (scrambleIndexRef.current < text.length) {
        const currentIndex = scrambleIndexRef.current;

        controlRef.current[currentIndex] =
          text[scrambleIndexRef.current] === ' ' ? ' ' : scramble;
        scrambleIndexRef.current += 1;
      }
    }
  };

  const increaseControl = () => {
    if (!text) return;
    for (var i = 0; i < step; i++) {
      if (controlRef.current.length + 1 <= text.length) {
        controlRef.current.push(
          text[controlRef.current.length + 1] === ' ' ? ' ' : null
        );
      }
    }
  };

  const decreaseControl = () => {
    if (!text) return;
    if (text.length < controlRef.current.length) {
      controlRef.current.splice(text.length, step);
    }
  };

  const handleOverdrive = () => {
    if (!overdrive || !text) return;

    for (var i = 0; i < step; i++) {
      if (overdriveRef.current < controlRef.current.length + 1) {
        controlRef.current[overdriveRef.current] =
          text[overdriveRef.current] === ' '
            ? ' '
            : String.fromCharCode(
                typeof overdrive === 'boolean' ? 95 : overdrive
              );
        overdriveRef.current += 1;
      }
    }
  };

  const handleTick = () => {
    increaseControl();
    decreaseControl();
    stepForward();
    seedForward();
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

    if (overdrive) {
      handleOverdrive();
    }

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
    if (!nodeRef.current || !text) return;

    let result = '';

    for (var i = 0; i < controlRef.current.length; i++) {
      const controlValue = controlRef.current[i];

      switch (true) {
        /**
         * a positive integer value, get a random character
         */
        case controlValue && controlValue > 0:
          result += getRandomChar(range);

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

    // set text
    nodeRef.current.innerHTML = result;

    if (onFrame) {
      onFrame(result);
    }

    /**
     * Exit if the result is equal to the input
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
   * if overflow is true, overflow the control to the an empty array, the size of the text input. This will cause the animation to play from an empty string
   */
  const reset = () => {
    stepRef.current = 0;
    scrambleIndexRef.current = 0;
    overdriveRef.current = 0;
    if (!overflow) {
      controlRef.current = new Array(text?.length);
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
    play();
  }, [text, overdrive]);

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
  }, [text, speed, animate]);

  return { ref: nodeRef, play };
};
