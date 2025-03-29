import React from "react";
import Header from "@/features/root/chat/components/Header";
import { View } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import Micro from "@/assets/images/icons/micro";
import Camera from "@/assets/images/icons/camera";
import Emoji from "@/assets/images/icons/emoji";
import Input from "@/components/Input";
import Add from "@/assets/images/icons/add";
import WhiteMicro from "@/assets/images/icons/whiteMicro";

const Chat = () => {
    return (
        <View className="flex-1 flex flex-col">
            <Header />
            <View className='pt-[51px] flex items-center gap-y-10'>
                <View className='flex items-center'>
                    <ThemedText type='adress_text'>Hello, Mary!</ThemedText>
                    <ThemedText type='intro_text'>How can I help you today?</ThemedText>
                </View>
                <View className="w-[182px] h-[182px] rounded-full bg-purple-600">
                </View>
            </View>
            <View className="flex-1" />

            {/* Основний контейнер для блоку кнопок */}
            <View className='px-[22px] py-3'>
                {/* Використовуємо flex-row для горизонтального розміщення */}
                <View className="flex flex-row gap-x-8 justify-items-start ">
                    {/* Ліва колонка з двома кнопками */}
                    <View className="flex flex-col gap-y-3">
                        <Button size='md_wide' iconPosition='left' icon={<Micro/>}>Audio chat</Button>
                        <Button size='md_wide' iconPosition='left' icon={<Camera/>}>Video chat</Button>
                    </View>

                    {/* Права колонка з однією кнопкою */}
                    <View className="flex flex-col justify-end">
                        <Button size='md_wide' iconPosition='left' icon={<Emoji/>}>Give me ideas!</Button>
                    </View>
                </View>
            </View>

            <View className="pb-6 px-4 flex-row items-center gap-x-4 justify-center">
                <Input variant='askMe' icon={<Add/>}/>
                <Button size='sm'><WhiteMicro/></Button>
            </View>
        </View>
    )
}

export default Chat