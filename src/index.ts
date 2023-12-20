import { useEffect, useRef } from 'react';

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomChar(range: RangeOrCharCodes) {
  let rand = 0;
  if (range.length === 2) {
    rand = getRandomInt(range[0], range[1]);
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
   * When playOnMount is true, the animation will not play the first time a text input is provided.
   */
  playOnMount?: boolean;
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
   * Chance of scrambling a character, range from 0 to 1, 0 being no chance, and 1 being 100% chance
   */
  chance?: number;
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
   * Characters to avoid scrambling
   */
  ignore?: string[];

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
   * Callback when animation starts drawing
   */
  onAnimationStart?: Function;

  /**
   * Callback for when the animation finished
   */
  onAnimationEnd?: Function;

  /**
   * onRedraw callback
   */
  onAnimationFrame?: (result: string) => void;
};

export const useScramble = (props: UseScrambleProps) => {
  let {
    playOnMount = true,
    text = '',
    speed = 1,
    seed = 1,
    step = 1,
    tick = 1,
    scramble = 1,
    chance = 1,
    overflow = true,
    range = [65, 125],
    overdrive = true,
    onAnimationStart,
    onAnimationFrame,
    onAnimationEnd,
    ignore = [' '],
  } = props;

  const prefersReducedMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  if (prefersReducedMotion) {
    step = text.length;
    chance = 0;
    overdrive = false;
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

  const setIfNotIgnored = (
    value: string | number | null | number,
    replace: string | number | null
  ) => (ignore.includes(`${value}`) ? value : replace);

  // pick random character ahead in the string, and add them to the randomizer
  const seedForward = () => {
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
        controlRef.current[index] = setIfNotIgnored(
          controlRef.current[index],
          getRandomInt(0, 10) >= (1 - chance) * 10 ? scramble || seed : 0
        );
      }
    }
  };

  // add `step` characters to the randomizer, and increase the scrambleIndexRef pointer
  const stepForward = () => {
    for (var i = 0; i < step; i++) {
      if (scrambleIndexRef.current < text.length) {
        const currentIndex = scrambleIndexRef.current;

        const shouldScramble = getRandomInt(0, 10) >= (1 - chance) * 10;

        controlRef.current[currentIndex] = setIfNotIgnored(
          text[scrambleIndexRef.current],
          shouldScramble
            ? scramble + getRandomInt(0, Math.ceil(scramble / 2))
            : 0
        );
        scrambleIndexRef.current++;
      }
    }
  };

  const resizeControl = () => {
    if (text.length < controlRef.current.length) {
      controlRef.current.pop();
      controlRef.current.splice(text.length, step);
    }
    for (var i = 0; i < step; i++) {
      if (controlRef.current.length < text.length) {
        controlRef.current.push(
          setIfNotIgnored(text[controlRef.current.length + 1], null)
        );
      }
    }
  };

  const onOverdrive = () => {
    if (!overdrive) return;

    for (var i = 0; i < step; i++) {
      const max = Math.max(controlRef.current.length, text.length);
      if (overdriveRef.current < max) {
        controlRef.current[overdriveRef.current] = setIfNotIgnored(
          text[overdriveRef.current],
          String.fromCharCode(typeof overdrive === 'boolean' ? 95 : overdrive)
        );
        overdriveRef.current++;
      }
    }
  };

  const onTick = () => {
    stepForward();
    resizeControl();
    seedForward();
  };

  /**
   * Control the animation framerate, from the speed prop
   *
   * if speed is 0, stop the animation
   */
  const animate = (time: number) => {
    if (!speed) return;

    rafRef.current = requestAnimationFrame(animate);

    onOverdrive();

    const timeElapsed = time - elapsedRef.current;
    if (timeElapsed > fpsInterval) {
      elapsedRef.current = time;

      if (stepRef.current % tick === 0) {
        onTick();
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
        case typeof controlValue === 'number' && controlValue > 0:
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
          (i >= text.length || i >= scrambleIndexRef.current):
          result += controlValue;
          break;

        /**
         * before scramble index, and equal to the string
         */
        case controlValue === text[i] && i < scrambleIndexRef.current:
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

    onAnimationFrame && onAnimationFrame(result);

    /**
     * Exit if the result is equal to the input
     *
     * - Trim control to text length
     * - fire onAnimationEnd
     */
    if (result === text) {
      controlRef.current.splice(text.length, controlRef.current.length);
      onAnimationEnd && onAnimationEnd();

      cancelAnimationFrame(rafRef.current);
    }

    stepRef.current++;
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
    onAnimationStart && onAnimationStart();
    rafRef.current = requestAnimationFrame(animate);
  };

  /**
   * reset scramble when text input is changed
   */
  useEffect(() => {
    reset();
  }, [text]);

  /**
   * start or stop animation when text and speed change
   */
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(animate);

    // cancel raf on unmount
    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [animate]);

  useEffect(() => {
    if (!playOnMount) {
      controlRef.current = text.split('');
      stepRef.current = text.length;
      scrambleIndexRef.current = text.length;
      overdriveRef.current = text.length;
      draw();
      cancelAnimationFrame(rafRef.current);
    }
  }, []);

  return { ref: nodeRef, replay: play };
};
