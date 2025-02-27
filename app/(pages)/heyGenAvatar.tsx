import React from 'react';
import { SafeAreaView, StatusBar, View } from 'react-native';
import { Stack } from 'expo-router';
import HeyGenAvatar from "@/features/chat/heyGenAvatar";


export default function HeyGenAvatarScreen() {
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#111827' }}>
            <StatusBar barStyle="light-content" backgroundColor="#111827" />
            <Stack.Screen
                options={{
                    title: 'HeyGen Аватар',
                    headerShown: true,
                    headerStyle: { backgroundColor: '#1f2937' },
                    headerTintColor: '#ffffff'
                }}
            />
            <View style={{ flex: 1 }}>
                <HeyGenAvatar />
            </View>
        </SafeAreaView>
    );
}