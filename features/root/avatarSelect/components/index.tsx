import {View} from "react-native";
import Header from "@/features/root/avatarSelect/components/Header";
import CreateAvatar from "@/features/root/avatarSelect/components/CreateAvatar";
import Enchance from "@/features/root/avatarSelect/components/Enhance";
import {Button} from "@/components/Button";

const AvatarSelect = () => {
    return (
        <>
            <Header/>
            <View className='px-4 gap-y-8 pt-11'>
                <CreateAvatar/>
                <Enchance/>
                <View className='flex items-center'>
                    <Button size='xxl' color='primary'>Start video chat</Button>
                </View>
            </View>
        </>
    )
}

export default AvatarSelect