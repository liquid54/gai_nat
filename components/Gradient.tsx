import React, { ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { ViewStyle } from 'react-native';
import gradients, { GradientType } from '../constants/Gradients';

interface GradientProps {
    /**
     * Тип градієнта з визначених у файлі gradients.ts
     */
    type?: GradientType;

    /**
     * Дочірні елементи, що відображатимуться на градієнтному фоні
     */
    children?: ReactNode;

    /**
     * Додаткові стилі для градієнтного контейнера
     */
    style?: ViewStyle;

    /**
     * CSS класи для використання з NativeWind/Tailwind
     */
    className?: string;
}

/**
 * Компонент для відображення градієнтного фону з предвизначеними конфігураціями
 */
export const Gradient = ({
                             type = 'primary',
                             children,
                             style,
                             className
                         }: GradientProps) => {

    const gradientConfig = gradients[type];

    const colors = gradientConfig.colors as unknown as [string, string, ...string[]];
    const locations = gradientConfig.locations as unknown as [number, number, ...number[]] | null | undefined;

    return (
        <LinearGradient
            colors={colors}
            start={gradientConfig.start}
            end={gradientConfig.end}
            locations={locations}
            style={style}
            className={className}
        >
            {children}
        </LinearGradient>
    );
};

export default Gradient;