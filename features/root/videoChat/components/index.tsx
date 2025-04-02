import {View} from "react-native";
import Gradient from "@/components/Gradient";
import React, { useState, useCallback } from "react";
import Date from "@/features/root/videoChat/components/date";
import Header from "@/features/root/chat/components/Header";
import ChatComponent from "@/features/root/videoChat/components/chatComponent";
import InputToolbar from "@/features/root/videoChat/components/inputToolbar";
import { Button } from "@/components/Button";
import WhiteMicro from "@/assets/images/icons/whiteMicro";
import Input from "@/components/Input";
import Add from "@/assets/images/icons/add";

// Імпортуємо тип MessageType з ChatComponent
import type { MessageType } from "@/features/root/videoChat/components/chatComponent";

const VideoChat = () => {
    // Стан для перемикання між клавіатурою та інструментами
    const [showKeyboard, setShowKeyboard] = useState(false);

    // Стан для тексту повідомлення
    const [inputText, setInputText] = useState("");

    // Стан для повідомлень чату з правильними типами
    const [messages, setMessages] = useState<MessageType[]>([
        {
            id: 1,
            text: "Tell me how look after flowers",
            type: 'text',
            sender: "user",
            time: "16.46"
        },
        {
            id: 2,
            text: "Yeah! Processing information....",
            type: 'text',
            sender: "assistant",
            time: "16.46"
        },
        {
            id: 3,
            type: "audio",
            duration: "0:20",
            sender: "user",
            time: "16.46"
        }
    ]);

    // Функція для відправки текстового повідомлення
    const sendMessage = useCallback(() => {
        if (!inputText.trim()) return;

        // Використовуємо фіксований час для спрощення
        const timeString = "16.46"; // Це ж demo, тому можемо використати фіксований час

        const newMessage: MessageType = {
            id: messages.length + 1,
            text: inputText,
            type: 'text' as const,
            sender: 'user',
            time: timeString
        };

        // Додаємо повідомлення до чату
        setMessages(prev => [...prev, newMessage]);

        // Очищаємо поле введення
        setInputText("");

        // Симулюємо відповідь асистента через 1 секунду
        setTimeout(() => {
            const assistantMessage: MessageType = {
                id: messages.length + 2,
                text: getRandomResponse(),
                type: 'text' as const,
                sender: 'assistant',
                time: timeString
            };

            setMessages(prev => [...prev, assistantMessage]);
        }, 1000);
    }, [inputText, messages]);

    // Функція для випадкової відповіді асистента
    const getRandomResponse = () => {
        const responses = [
            "I'm processing your request...",
            "Let me think about that...",
            "That's an interesting question!",
            "I understand what you're asking.",
            "Here's what I found about that topic.",
            "Would you like to know more about this?"
        ];

        return responses[Math.floor(Math.random() * responses.length)];
    };

    return (
        <>
            <Header/>
            <View className='pt-[74px] pb-[26px] flex-1'>
                <View className='flex mx-auto pb-[40px]'>
                    <View className='flex overflow-hidden rounded-full'>
                        <Gradient className='w-[182px] h-[182px]' type='multicolor'/>
                    </View>
                </View>
                <View className='px-4 flex-1 gap-y-[15px]'>
                    <Date/>

                    {/* Використовуємо flex-1 для ChatComponent, щоб він зайняв доступний простір */}
                    <View className="flex-1">
                        <ChatComponent messages={messages} />
                    </View>

                    {showKeyboard ? (
                        // Відображаємо композицію з Input та Button
                        <View className="pb-6 px-4 flex-row items-center gap-x-4 justify-center">
                            <Input
                                variant='askMe'
                                icon={<Add/>}
                                value={inputText}
                                onChangeText={setInputText}
                                onSubmitEditing={sendMessage}
                            />
                            <Button
                                size='sm'
                                onPress={() => setShowKeyboard(false)} // Повернення до InputToolbar
                            >
                                <WhiteMicro/>
                            </Button>
                        </View>
                    ) : (
                        // Відображаємо InputToolbar
                        <InputToolbar onKeyboardPress={() => setShowKeyboard(true)} />
                    )}
                </View>
            </View>
        </>
    )
}

export default VideoChat