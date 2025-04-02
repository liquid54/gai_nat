import {View, ScrollView} from "react-native";
import AvatarOption from "@/features/root/avatarSelect/components/AvatarSelect";
import {ThemedText} from "@/components/ThemedText";
import {AVATARS} from "@/features/root/avatarSelect/constants/constants";
import {AvatarOption as AvatarOptionType} from "@/features/root/avatarSelect/constants/constants";
import {useState, useEffect} from "react";

const Enhance = () => {
    // State to track selected avatar - default to first avatar
    const [selectedAvatar, setSelectedAvatar] = useState<AvatarOptionType>(AVATARS[0]);

    // Handler for selecting an avatar
    const handleSelectAvatar = (avatar: AvatarOptionType) => {
        setSelectedAvatar(avatar);
        // Log the selected avatar name and id to console
        console.log(`Selected avatar: ${avatar.name}, ID: ${avatar.avatar_id}`);
    };

    // Log the initially selected avatar
    useEffect(() => {
        if (selectedAvatar) {
            console.log(`Initially selected avatar: ${selectedAvatar.name}, ID: ${selectedAvatar.avatar_id}`);
        }
    }, []);

    return (
        <View className='gap-y-7'>
            <ThemedText type='title_avatar_option'>Enhance</ThemedText>
            <View className='flex overflow-hidden max-h-[352px]'>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View className="flex-row gap-2 flex-wrap justify-between">
                        {AVATARS.map((avatar) => (
                            <AvatarOption
                                key={avatar.avatar_id}
                                avatar={avatar}
                                isSelected={selectedAvatar?.avatar_id === avatar.avatar_id}
                                onSelect={handleSelectAvatar}
                            />
                        ))}
                    </View>
                </ScrollView>
            </View>
        </View>
    )
}

export default Enhance