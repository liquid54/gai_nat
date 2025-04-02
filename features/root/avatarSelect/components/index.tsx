import {View} from "react-native";
import Header from "@/features/root/avatarSelect/components/Header";
import CreateAvatar from "@/features/root/avatarSelect/components/CreateAvatar";
import Enhance from "@/features/root/avatarSelect/components/Enhance";
import {Button} from "@/components/Button";
import {useRouter} from 'expo-router';
import { useState, useEffect, useRef } from "react";
import { AvatarOption } from "@/features/root/avatarSelect/constants/constants";
import { AVATARS } from "@/features/root/avatarSelect/constants/constants";
import * as Linking from 'expo-linking';

const AvatarSelect = () => {
    const router = useRouter();
    const [selectedAvatar, setSelectedAvatar] = useState<AvatarOption>(AVATARS[0]);
    const [shouldNavigate, setShouldNavigate] = useState(false);

    // Reference to check if component is mounted
    const isMounted = useRef(true);

    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    // Separate effect for navigation
    useEffect(() => {
        if (shouldNavigate && isMounted.current) {
            try {
                // Try various navigation approaches
                console.log("Navigating to videoChat from useEffect");

                // Approach 1: Using router
                router.push("/videoChat");

                // Approach 2: Using Linking API as fallback
                setTimeout(() => {
                    if (isMounted.current) {
                        const url = Linking.createURL('/videoChat');
                        Linking.openURL(url)
                            .catch(err => console.error("Linking error:", err));
                    }
                }, 300);

            } catch (error) {
                console.error("Navigation error in effect:", error);
            }
        }
    }, [shouldNavigate, router]);

    const handleStartVideoChat = () => {
        console.log(`Starting video chat with avatar: ${selectedAvatar.name}`);

        // Simplified approach: just trigger navigation
        setShouldNavigate(true);

        // Store the selected avatar for the videoChat page
        try {
            (global as any).selectedAvatar = selectedAvatar;
        } catch (e) {
            console.error("Error storing avatar:", e);
        }
    };

    const handleAvatarSelect = (avatar: AvatarOption) => {
        setSelectedAvatar(avatar);
        console.log(`Selected avatar: ${avatar.name}, ID: ${avatar.avatar_id}`);
    };

    return (
        <>
            <Header/>
            <View className='px-4 gap-y-8 pt-11'>
                <CreateAvatar/>
                <Enhance
                    selectedAvatar={selectedAvatar}
                    onSelectAvatar={handleAvatarSelect}
                />
                <View className='flex items-center'>
                    <Button
                        size='xxl'
                        color='primary'
                        onPress={handleStartVideoChat}
                    >
                        START VIDEO CHAT
                    </Button>
                </View>
            </View>
        </>
    )
}

export default AvatarSelect