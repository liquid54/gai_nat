import Header from "@/features/root/audioCall/components/Header";
import InputToolbar from "@/features/root/audioCall/components/inputToolbar";
import ActiveAvatar from "@/assets/images/icons/activeAvatar";
import {View} from "react-native";
import {ThemedText} from "@/components/ThemedText";

const AudioCall = () => {
    return (
        <>
            <Header/>
            <View className='pl-[45px] px-[25px] pb-9'>
                <ActiveAvatar/>
            </View>

            <View className='flex items-center gap-y-[32px] pb-[140px]'>
                <View className='px-[62px]'>
                    <ThemedText type='text_ai_dark' className="text-center">
                        Well, if you wanna to look after
                        so<ThemedText type='text_ai_light'>me flowers you should have a
                        few things to know</ThemedText>
                    </ThemedText>
                </View>
                <InputToolbar/>
            </View>
        </>
    )
}

export default AudioCall