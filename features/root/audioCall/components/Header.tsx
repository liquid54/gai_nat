import {View, TouchableOpacity} from "react-native";
import LinedArrowPink from "@/assets/images/icons/linedArrowPink";
import {ThemedText} from "@/components/ThemedText";
import MenuIcon from "@/assets/images/icons/menu";
import {useRouter} from "expo-router";

const Header = () => {
    const router = useRouter();

    const handleBack = () => {
        router.back(); // Повертає на попередню сторінку в історії навігації
    };

    return (
        <View className="pt-10">
            <View className='flex px-4 py-3'>
                <View className='flex-row justify-between items-center gap-x-6'>
                    <TouchableOpacity onPress={handleBack}
                        className='h-[48px] w-[48px] rounded-full justify-center items-center'
                    >
                        <LinedArrowPink/>
                    </TouchableOpacity>
                    <ThemedText type='title_page' className='text-center'>Audio-call</ThemedText>
                    <MenuIcon/>
                </View>
            </View>
        </View>
    )
}

export default Header;