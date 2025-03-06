import { Image, Platform } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
            headerImage={
                <Image
                    source={require('@/assets/images/partial-react-logo.png')}
                    className="h-[178px] w-[290px] absolute bottom-0 left-0"
                />
            }>
            <ThemedView className="flex-row items-center gap-2 mb-6">
                <ThemedText type="title" className="text-black dark:text-white">Welcome!</ThemedText>
                <HelloWave />
            </ThemedView>

            <ThemedView className="gap-2 mb-4">
                <ThemedText type="subtitle" className="text-black-900 dark:text-white-900">Step 1: Try it</ThemedText>
                <ThemedText className="text-gray-700 dark:text-gray-300">
                    Edit <ThemedText type="defaultSemiBold" className="text-black-950 dark:text-white-950">app/(tabs)/index.tsx</ThemedText> to see changes.
                    Press{' '}
                    <ThemedText type="defaultSemiBold" className="text-black-950 dark:text-white-950">
                        {Platform.select({
                            ios: 'cmd + d',
                            android: 'cmd + m',
                            web: 'F12'
                        })}
                    </ThemedText>{' '}
                    to open developer tools.
                </ThemedText>
            </ThemedView>

            <ThemedView className="gap-2 mb-4">
                <ThemedText type="subtitle" className="text-black-900 dark:text-white-900">Step 2: Explore</ThemedText>
                <ThemedText className="text-gray-700 dark:text-gray-300">
                    Tap the Explore tab to learn more about what's included in this starter app.
                </ThemedText>
            </ThemedView>

            <ThemedView className="gap-2 mb-2">
                <ThemedText type="subtitle" className="text-black-900 dark:text-white-900">Step 3: Get a fresh start</ThemedText>
                <ThemedText className="text-gray-700 dark:text-gray-300">
                    When you're ready, run{' '}
                    <ThemedText type="defaultSemiBold" className="text-black-950 dark:text-white-950">npm run reset-project</ThemedText> to get a fresh{' '}
                    <ThemedText type="defaultSemiBold" className="text-black-950 dark:text-white-950">app</ThemedText> directory. This will move the current{' '}
                    <ThemedText type="defaultSemiBold" className="text-black-950 dark:text-white-950">app</ThemedText> to{' '}
                    <ThemedText type="defaultSemiBold" className="text-black-950 dark:text-white-950">app-example</ThemedText>.
                </ThemedText>
            </ThemedView>
        </ParallaxScrollView>
    );
}