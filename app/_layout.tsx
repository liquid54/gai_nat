import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import './global.css';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Stack, usePathname } from "expo-router";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const pathname = usePathname();
  console.log("Current pathname:", pathname);


  const colorScheme = useColorScheme();
    const [loaded] = useFonts({
        'Roboto-Regular': require('../assets/fonts/Roboto-Regular.ttf'),
        'Roboto-Medium': require('../assets/fonts/Roboto-Medium.ttf'),
        'Roboto-SemiBold': require('../assets/fonts/Roboto-SemiBold.ttf'),
        'Roboto-Bold': require('../assets/fonts/Roboto-Bold.ttf'),
        'Urbanist-Regular': require('../assets/fonts/Urbanist-Regular.ttf'),
        'Urbanist-Bold': require('../assets/fonts/Urbanist-Bold.ttf'),
        'Urbanist-SemiBold': require('../assets/fonts/Urbanist-SemiBold.ttf'),
        'Urbanist-Medium': require('../assets/fonts/Urbanist-Medium.ttf'),
        'Mulish-Regular': require('../assets/fonts/Mulish-Regular.ttf'),
        'Mulish-Light': require('../assets/fonts/Mulish-Light.ttf'),
        'SpaceMono': require('../assets/fonts/SpaceMono-Regular.ttf'),
    });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
      <>
        <StatusBar style="auto" />
        <Stack
            screenOptions={{
              headerShown: false,
            }}
        />
      </>
  );
}