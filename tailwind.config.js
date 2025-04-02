/** @type {import('tailwindcss').Config} */
const { TailwindColors } = require("./constants/Colors");

module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./features/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        Roboto: ['Roboto-Regular', 'sans-serif'],
        'Roboto-Medium': ['Roboto-Medium', 'sans-serif'],
        'Roboto-SemiBold': ['Roboto-SemiBold', 'sans-serif'],
        'Roboto-Bold': ['Roboto-Bold', 'sans-serif'],
        Urbanist: ['Urbanist-Regular', 'sans-serif'],
        'Urbanist-Bold': ['Urbanist-Bold', 'sans-serif'],
        'Urbanist-SemiBold': ['Urbanist-SemiBold', 'sans-serif'],
        'Urbanist-Medium': ['Urbanist-Medium', 'sans-serif'],
        Mulish: ['Mulish-Regular', 'sans-serif'],
        'Mulish-Light': ['Mulish-Light', 'sans-serif'],
        Lato: ['Lato-Regular', 'sans-serif']
      },
      colors: {
        ...TailwindColors
      },
      boxShadow: {
        '3xl': '2px 2px 8px 0px #00000033',
      }
    },
  },
  plugins: [],
};