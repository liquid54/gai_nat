import {View, Text, ScrollView} from "react-native";
import AvatarOption from "@/features/root/avatarSelect/components/AvatarSelect";
import {ThemedText} from "@/components/ThemedText";

const Enhance = () => {
    // Створюємо масив з 9 елементів
    const avatarOptions = Array.from({ length: 9 }, (_, index) => ({
        id: `avatar-${index + 1}`
    }));

    return (
        <View className='gap-y-7'>
            <ThemedText type='title_avatar_option'>Enhance</ThemedText>
            <View>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View className="flex-row gap-2 flex-wrap justify-between">
                        {avatarOptions.map((option) => (
                            <AvatarOption
                                key={option.id}
                            />
                        ))}
                    </View>
                </ScrollView>
            </View>
        </View>
    )
}

export default Enhance