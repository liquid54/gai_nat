// app/_layout.tsx
import { Slot, usePathname } from 'expo-router';
import React from 'react';
import { ImageBackground, View, StatusBar } from 'react-native';

// Мапа фонів для різних маршрутів
const backgrounds: Record<string, any> = {
    '/login': require('../../assets/backgrounds/login.png'),
    '/signup': require('../../assets/backgrounds/signup.png'),
    '/welcome': require('../../assets/backgrounds/welcome.png'),
    '/resetpass': require('../../assets/backgrounds/reset.png'),
    '/checkmail': require('../../assets/backgrounds/checkmail.png'),
    // Додайте інші маршрути та фони
};

export default function RootLayout() {
    const pathname = usePathname();
    const backgroundSource = backgrounds[pathname];

    // Якщо фон не знайдено, просто відображаємо вміст без фону
    if (!backgroundSource) {
        return (
            <View className="flex-1 bg-white">
                <Slot />
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <ImageBackground
                source={backgroundSource}
                style={{
                    width: '100%',
                    height: '100%'
                }}>
                <Slot />
            </ImageBackground>
        </View>
    );
}