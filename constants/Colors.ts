/**
 * Below are the colors that are used in the app. The colors are defined in the light mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const Colors = {
  light: {
    purple: {
      100: '#B88FC900', // Transparent light purple
      200: '#30173B',
      400: '#B88FC9',   // Mid-deep purple
      600: '#CBA3DB',   // Mid-tone purple
      800: '#E6D3EE',   // Very light purple
      950: '#4A235A'    // Dark purple
    },
    white: {
      100: '#FAF4F9',
      950: '#FAF9FB'    // Light grayish-purple
    },
    green: {
      950: '#6BF3CA'    // Bright teal
    },
    red: {
      950: '#FF6B81'    // Pinkish-red
    },
    black: {
      100: '#4D4D4D'
    }
  },
};

export const TailwindColors = {
  purple: Colors.light.purple,
  white: Colors.light.white,
  green: Colors.light.green,
  red: Colors.light.red,
  black: Colors.light.black,
};

export default Colors;