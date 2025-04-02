import {View} from "react-native";
import Gradient from "@/components/Gradient";
import React from "react";
import Date from "@/features/root/videoChat/components/date";
import Header from "@/features/root/chat/components/Header";
import ChatComponent from "@/features/root/videoChat/components/chatComponent";
import InputToolbar from "@/features/root/videoChat/components/inputToolbar";

const VideoChat = () => {
    return (
        <>
            <Header/>
            <View className='pt-[74px] pb-[26px]'>
                <View className='flex mx-auto pb-[68px]'>
                    <View className='flex overflow-hidden rounded-full'>
                        <Gradient className='w-[182px] h-[182px]' type='multicolor'/>
                    </View>
                </View>
                <View className='px-4 gap-y-[45px]'>
                    <Date/>
                    <ChatComponent/>
                    <InputToolbar/>
                </View>
            </View>
        </>
    )
}

export default VideoChat