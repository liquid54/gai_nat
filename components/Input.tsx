import React from 'react';
import { View, TextInput, KeyboardTypeOptions, TouchableOpacity } from 'react-native';
import { ThemedText } from "@/components/ThemedText";

interface FloatingLabelInputProps {
    keyboardType?: KeyboardTypeOptions;
    placeholder?: string;
    label?: string;
    bgColor?: string;
    variant?: 'default' | 'askMe';
    icon?: React.ReactNode;
    value?: string;
    onChangeText?: (text: string) => void;
    onSubmitEditing?: () => void;
}

function Input({
                   keyboardType = 'default',
                   placeholder = '',
                   label = 'Email',
                   bgColor = 'bg-white-100',
                   variant = 'default',
                   icon = null,
                   value = '',
                   onChangeText = () => {},
                   onSubmitEditing = () => {}
               }: FloatingLabelInputProps): JSX.Element {

    // Компонент "Ask me anything"
    if (variant === 'askMe') {
        return (
            <View className="flex flex-row items-center py-4 px-3 rounded-[28px] gap-x-1 border border-purple-800 bg-white-950 w-[284px] h-[56px]">
                {icon && (
                    <TouchableOpacity onPress={onSubmitEditing}>
                        {icon}
                    </TouchableOpacity>
                )}
                <TextInput
                    className="flex-1 text-purple-600 text-[16px] font-Roboto w-[180px] h-[48px]"
                    placeholder={placeholder || "Ask me anything..."}
                    placeholderTextColor="#D8B4FE"
                    value={value}
                    onChangeText={onChangeText}
                    onSubmitEditing={onSubmitEditing}
                    keyboardType={keyboardType}
                    returnKeyType="send"
                />
            </View>
        );
    }

    // Стандартний інпут з плаваючим лейблом
    return (
        <View>
            <ThemedText type='body_small' className={`absolute left-3 -top-2 z-10 px-1 ${bgColor}`}>
                {label}
            </ThemedText>
            <TextInput
                className="h-[56px] w-[344px] border border-purple-950 rounded-xl px-4 font-Roboto text-[16px] leading-6 text-purple-950"
                value={value}
                onChangeText={onChangeText}
                onSubmitEditing={onSubmitEditing}
                keyboardType={keyboardType}
                placeholder={placeholder}
                returnKeyType="send"
            />
        </View>
    );
}

export default Input;