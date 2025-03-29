import { View, TouchableOpacity } from "react-native";
import { useRouter } from 'expo-router';
import PaperClip from "@/assets/images/icons/paperClip";
import MenuIcon from "@/assets/images/icons/menu";

const Header = () => {
    const router = useRouter();

    // Функція для навігації на екран вибору аватара
    const navigateToSelectAvatar = () => {
        router.push("/avatarSelect");
    };

    return (
        <View className='px-4 py-3'>
            <View className='flex items-center justify-between flex-row pt-10'>
                <View className="w-9 h-9 rounded-full bg-purple-600">
                </View>
                <View className='gap-x-1 flex-row items-center'>
                    <TouchableOpacity>
                        <PaperClip />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={navigateToSelectAvatar}>
                        <MenuIcon />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default Header;