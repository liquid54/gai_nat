import React from 'react';
import { View, TouchableOpacity, Text, SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function TabTwoScreen() {
    const router = useRouter();

    const navigateToHeyGen = () => {
        router.push('../(pages)/heyGenAvatar');
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <StatusBar barStyle="light-content" backgroundColor="#1f2937" />

            {/* Використовуємо прості стилі без Tailwind для перевірки */}
            <View style={styles.container}>
                <Text style={styles.title}>HeyGen Інтерактивний Аватар</Text>

                <TouchableOpacity
                    onPress={navigateToHeyGen}
                    style={styles.button}
                >
                    <Text style={styles.buttonText}>Запустити HeyGen Аватар</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 32,
        color: '#000000',
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#2563eb', // Яскраво-синій
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 12,
        elevation: 5, // Тінь для Android
        shadowColor: '#000', // Тінь для iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '600',
    }
});