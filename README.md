# useScramble

A lightweight (1KB), high performance, react-hook for random text animations.

The hook receives a set of parameteres that allows you to customize the pace, and style of the animation.

## Development

###

```sh
  yarn dev
```

Will start the `playground` minisite at `http://localhost:1234` and build the library on watch mode

---

## Usage

### Install to your react application

```sh
  npm install use-scramble
```

### Import and call the `useScramble` hook

The hook returns a `ref` object, that you must apply to the target node, for the animation to take over.

```jsx
import { useScramble } from 'use-scramble';

export const App = () => {
  const { ref } = useScramble({
    text: 'Achilles next, that nimble runner, swift on his feet as the wind',
    speed: 0.6,
    tick: 1,
    step: 1,
    scramble: 4,
    seed: 0,
  });

  return <p ref={ref} />;
};
```

## Manual replay

Along with the `ref`, the hook returns a `replay` function, that you can call to start the animation manually.

You can also disable the first animation, by setting the `playOnMount` to false.

```jsx
import { useScramble } from 'use-scramble';

export const App = () => {
  const { ref, replay } = useScramble({
    text: 'Achilles next, that nimble runner, swift on his feet as the wind',
    playOnMount: false
  });

  return <p ref={ref} onMouseOver={replay} onMouseOut={replay} />;
};
```

## API Reference

| Property         | type            | default  | range | description                                                                                                                          |
| ---------------- | --------------- | -------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------ |
| playOnMount      | boolean         | true     |       | Skip the animation on the first mount input                                                                                          |
| text             | string          | -        |       | Set the text value of the animation. The animation, will start automatically.                                                        |
| speed            | number          | 1        | 0-1   | Internal clock framerate. 1 will tick 60 times a second. 0 will pause the animation                                                  |
| tick             | number          | 1        | 1-∞   | Controls how many ticks pass for an animation redraw. Combined with `speed`, you can fully control the pace rate                     |
| step             | number          | 1        | 1-∞   | Controls the animation step. On every redraw, the algorithm moves forward, by `step` characters.                                     |
| scramble         | number          | 1        | 0-∞   | Controls how many times to randomize each character. A value of 0 will emulate a typewriter effect.                                  |
| seed             | number          | 1        | 0-∞   | The `seed`, adds randomized characters ahead of the animation step, animating characters across the text block.                      |
| chance           | number          | 1        | 0-1   | Chance of scrambling a character, range from 0 to 1, 0 being no chance, and 1 being 100% chance.                                     |
| range            | number[]        | [65,125] |       | Unicode characters range to select random characters from                                                                            |
| overdrive        | boolean, number | true     |       | Defaults to underscore (95) unicode character, or provide a custom unicode value                                                     |
| overflow         | boolean         | true     |       | Overflow, animates over the previous text, and when false resets the text contents, and restarts the animation from an empty string. |
| ignore           | string[]        | [" "]    |       | Ignore specific characters when animating a string. By default only spaces are ignored, used to maintain the shape of the text.      |
| onAnimationStart | function        | -        |       | callback invoked when the animation starts playing                                                                                   |
| onAnimationFrame | function        | -        |       | callback invoked on every redraw                                                                                                     |
| onAnimationEnd   | function        | -        |       | callback invoked on when the animation ends                                                                                          |

## Return Values

Along with the `ref` the return value, contains a `replay` function, that you can invoke to restart the animation.

```jsx
const { ref, replay } = useScramble({ text: 'your_text' });

return <p ref={ref} onclick={replay} />;
```

## Reduced Motion

If the user has requested to minimize non-essential motion with `prefers-reduced-motion:reduce`, the animation is entirely disabled.

## Unicode Values

| Glyph  | Unicode | Description            |
| ------ | ------- | ---------------------- |
| &nbsp; | 32      | Space mark             |
| !      | 33      | Exclamation mark       |
| "      | 34      | Quotation mark         |
| #      | 35      | Hash                   |
| \$     | 36      | Dollar sign            |
| %      | 37      | Percent sign           |
| &      | 38      | Ampersand              |
| \'     | 39      | Apostrophe             |
| (      | 40      | Left parenthesis       |
| )      | 41      | Right parenthesis      |
| \*     | 42      | Asterisk               |
| +      | 43      | Plus sign              |
| ","    | 44      | Comma                  |
| -      | 45      | Hyphen-minus           |
| .      | 46      | Full stop              |
| /      | 47      | Slash (Solidus)        |
| 0      | 48      | Digit Zero             |
| 1      | 49      | Digit One              |
| 2      | 50      | Digit Two              |
| 3      | 51      | Digit Three            |
| 4      | 52      | Digit Four             |
| 5      | 53      | Digit Five             |
| 6      | 54      | Digit Six              |
| 7      | 55      | Digit Seven            |
| 8      | 56      | Digit Eight            |
| 9      | 57      | Digit Nine             |
| :      | 58      | Colon                  |
| ;      | 59      | Semicolon              |
| <      | 60      | Less-than sign         |
| =      | 61      | Equal sign             |
| >      | 62      | Greater-than sign      |
| ?      | 63      | Question mark          |
| @      | 64      | At sign                |
| A      | 65      | Latin Capital letter A |
| B      | 66      | Latin Capital letter B |
| C      | 67      | Latin Capital letter C |
| D      | 68      | Latin Capital letter D |
| E      | 69      | Latin Capital letter E |
| F      | 70      | Latin Capital letter F |
| G      | 71      | Latin Capital letter G |
| H      | 72      | Latin Capital letter H |
| I      | 73      | Latin Capital letter I |
| J      | 74      | Latin Capital letter J |
| K      | 75      | Latin Capital letter K |
| L      | 76      | Latin Capital letter L |
| M      | 77      | Latin Capital letter M |
| N      | 78      | Latin Capital letter N |
| O      | 79      | Latin Capital letter O |
| P      | 80      | Latin Capital letter P |
| Q      | 81      | Latin Capital letter Q |
| R      | 82      | Latin Capital letter R |
| S      | 83      | Latin Capital letter S |
| T      | 84      | Latin Capital letter T |
| U      | 85      | Latin Capital letter U |
| V      | 86      | Latin Capital letter V |
| W      | 87      | Latin Capital letter W |
| X      | 88      | Latin Capital letter X |
| Y      | 89      | Latin Capital letter Y |
| Z      | 90      | Latin Capital letter Z |
| [      | 91      | Left Square Bracket    |
| \      | 92      | Backslash              |
| ]      | 93      | Right Square Bracket   |
| ^      | 94      | Circumflex accent      |
| \_     | 95      | Low line               |
| \`     | 96      | Grave accent           |
| a      | 97      | Latin Small Letter A   |
| b      | 98      | Latin Small Letter B   |
| c      | 99      | Latin Small Letter C   |
| d      | 100     | Latin Small Letter D   |
| e      | 101     | Latin Small Letter E   |
| f      | 102     | Latin Small Letter F   |
| g      | 103     | Latin Small Letter G   |
| h      | 104     | Latin Small Letter H   |
| i      | 105     | Latin Small Letter I   |
| j      | 106     | Latin Small Letter J   |
| k      | 107     | Latin Small Letter K   |
| l      | 108     | Latin Small Letter L   |
| m      | 109     | Latin Small Letter M   |
| n      | 110     | Latin Small Letter N   |
| o      | 111     | Latin Small Letter O   |
| p      | 112     | Latin Small Letter P   |
| q      | 113     | Latin Small Letter Q   |
| r      | 114     | Latin Small Letter R   |
| s      | 115     | Latin Small Letter S   |
| t      | 116     | Latin Small Letter T   |
| u      | 117     | Latin Small Letter U   |
| v      | 118     | Latin Small Letter V   |
| w      | 119     | Latin Small Letter W   |
| x      | 120     | Latin Small Letter X   |
| y      | 121     | Latin Small Letter Y   |
| z      | 122     | Latin Small Letter Z   |
| {      | 123     | Left Curly Bracket     |
| \|     | 124     | Vertical bar           |
| }      | 125     | Right Curly Bracket    |
| ~      | 126     | Tilde                  |
