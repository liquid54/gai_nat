import {View, ScrollView} from "react-native";
import AvatarOption from "@/features/root/avatarSelect/components/AvatarSelect";
import {ThemedText} from "@/components/ThemedText";
import {AVATARS} from "@/features/root/avatarSelect/constants/constants";
import {AvatarOption as AvatarOptionType} from "@/features/root/avatarSelect/constants/constants";

interface EnhanceProps {
    selectedAvatar: AvatarOptionType;
    onSelectAvatar: (avatar: AvatarOptionType) => void;
}

const Enhance = ({ selectedAvatar, onSelectAvatar }: EnhanceProps) => {
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
                                onSelect={onSelectAvatar}
                            />
                        ))}
                    </View>
                </ScrollView>
            </View>
        </View>
    )
}

export default Enhance