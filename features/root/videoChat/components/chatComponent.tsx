import React, {useEffect, useRef} from 'react';
import {View, ScrollView} from 'react-native';
import Play from "@/assets/images/icons/play";
import {ThemedText} from "@/components/ThemedText";
import Sound from "@/assets/images/icons/sound";

// Eksportuiemo typ, shchob yoho mozhna bulo vykorystovuvaty v inshykh komponentakh
export interface MessageType {
    id: number;
    text?: string;
    type?: 'text' | 'audio';
    sender: 'user' | 'assistant';
    time: string;
    duration?: string;
}

// Dodaiemo propsy dlia otrymannia povidomlen zzovni
interface ChatComponentProps {
    messages: MessageType[];
}

const ChatComponent = ({messages}: ChatComponentProps) => {

    // Stvoriuiemo ref dlia ScrollView
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {

        setTimeout(() => {
            if (scrollViewRef.current) {
                scrollViewRef.current.scrollToEnd({animated: true});
            }
        }, 100);
    }, [messages]);

    const renderMessage = (message: MessageType) => {
        const isUser = message.sender === 'user';
        const isAudio = message.type === 'audio';

        return (
            <View
                key={message.id}
            >
                <View className={`flex flex-row ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <View
                        className={`relative py-1 justify-center rounded-lg ${
                            isUser
                                ? isAudio
                                    ? 'bg-purple-950 px-2 w-[164px] h-[37px] rounded' // User audio message dimensions
                                    : 'bg-purple-950 px-2 max-w-[209px] h-[44px] rounded-br-none' // User text message dimensions
                                : 'border border-purple-800 px-2 w-[232px] h-[44px] rounded-bl-none' // Assistant message dimensions
                        }`}
                    >
                        {isAudio ? (
                            <View className="flex flex-row items-center gap-x-4 justify-center">
                                <View className='flex flex-row items-center justify-center gap-x-1'>
                                    <Play/>
                                    <ThemedText type='text_timing'>{message.duration}</ThemedText>
                                </View>
                                <Sound/>
                            </View>
                        ) : (
                            <>
                                <ThemedText
                                    type={isUser ? 'text_dialog_request' : 'text_dialog_answer'}
                                >
                                    {message.text}
                                </ThemedText>

                                {/* Time inside bubble for non-audio messages */}
                                <View className={`flex ${isUser ? 'items-end' : 'items-start'}`}>
                                    <ThemedText type={isUser ? 'time_request_in' : 'time_answer_in'}>
                                        {message.time}
                                    </ThemedText>
                                </View>
                            </>
                        )}
                    </View>
                </View>

                {/* Render time outside bubble only for audio messages */}
                {isAudio && (
                    <View className="flex items-end">
                        <ThemedText type='time_request_out'>
                            {message.time}
                        </ThemedText>
                    </View>
                )}
            </View>
        );
    };

    return (
        <ScrollView
            ref={scrollViewRef}
            className="flex h-[240px]"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{gap: 12}}
        >
            {messages.map(message => renderMessage(message))}
        </ScrollView>
    );
}

export default ChatComponent;