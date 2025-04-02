import { View } from "react-native";
import { Button } from "@/components/Button";
import Close from "@/assets/images/icons/close";
import Keyboard from "@/assets/images/icons/keyboard";
import Stop from "@/assets/images/icons/stop";
import Mute from "@/assets/images/icons/Mute";

const InputToolbar = () => {

    return (
        <View className='flex-row items-center justify-center gap-x-4'>
            <Button size='sm' color='third' className='items-center justify-center'> <Mute/> </Button>
            <Button size='sm' className='w-[72px] h-[72px] items-center justify-center'><Stop/></Button>
            <Button size='sm' color='third'><Keyboard/></Button>
        </View>
    );
};

export default InputToolbar;