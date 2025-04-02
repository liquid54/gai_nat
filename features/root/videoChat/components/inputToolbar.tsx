import { View } from "react-native";
import { Button } from "@/components/Button";
import Close from "@/assets/images/icons/close";
import WhiteMicro from "@/assets/images/icons/whiteMicro";
import Keyboard from "@/assets/images/icons/keyboard";
import { useRouter } from "expo-router";

const InputToolbar = () => {
    const router = useRouter();

    const handleAudioCallPress = () => {
        router.push("/audioCall");
    };

    return (
        <View className='flex-row items-center justify-center gap-x-4'>
            <Button size='sm' color='third'><Close/></Button>
            <Button
                size='sm'
                className='w-[72px] h-[72px] items-center justify-center'
                onPress={handleAudioCallPress}
            >
                <WhiteMicro/>
            </Button>
            <Button size='sm' color='third'><Keyboard/></Button>
        </View>
    );
};

export default InputToolbar;