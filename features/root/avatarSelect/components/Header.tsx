import {Button} from "@/components/Button";
import {View} from "react-native";
import {ThemedText} from "@/components/ThemedText";
import LinedArrow from "@/assets/images/icons/linedArrow";
import {useRouter} from "expo-router";

const Header = () => {
    const router = useRouter();

    const handleBack = () => {
        router.back(); // Повертає на попередню сторінку в історії навігації
    };

    return (
        <View className='pt-10'>
            <View className='px-4 py-2 flex gap-x-[76px] flex-row items-center'>
                <Button size='sm' color='third' className='flex items-center justify-center' onPress={handleBack}>
                    <LinedArrow/>
                </Button>
                <View >
                    <ThemedText type='title_page'>Avatar selection</ThemedText>
                </View>
            </View>
        </View>
    )
}

export default Header