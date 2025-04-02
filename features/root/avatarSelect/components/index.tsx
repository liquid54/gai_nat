import {View} from "react-native";
import Header from "@/features/root/avatarSelect/components/Header";
import CreateAvatar from "@/features/root/avatarSelect/components/CreateAvatar";
import Enchance from "@/features/root/avatarSelect/components/Enhance";
import {Button} from "@/components/Button";
import {useRouter} from 'expo-router';

const AvatarSelect = () => {
    const router = useRouter();

    const handleStartVideoChat = () => {
        router.push("/videoChat");
    };

    return (
        <>
            <Header/>
            <View className='px-4 gap-y-8 pt-11'>
                <CreateAvatar/>
                <Enchance/>
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