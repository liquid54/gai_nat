import { TouchableOpacity, View } from 'react-native';
import { type ReactNode } from 'react';
import { ThemedText, textEnum } from './ThemedText';
import Gradient from './Gradient';

export type ButtonProps = {
    children: ReactNode;
    size?: 'xs' | 'sm' | 'md' | 'md_wide' | 'lg' | 'xl' | 'xxl';
    color?: 'primary' | 'secondary' | 'danger';
    onPress?: () => void;
    className?: string;
    textClassName?: string;
    textType?: textEnum;
    icon?: ReactNode;
    iconPosition?: 'left' | 'right';
    iconSpacing?: string;
};

export function Button({
                           children,
                           size = 'lg',
                           color = 'primary',
                           onPress,
                           className,
                           textClassName,
                           textType,
                           icon,
                           iconPosition = 'right',
                           iconSpacing = 'mt-[5px]',
                       }: ButtonProps) {
    // Для кнопки розміром md_wide використовуємо градієнт
    if (size === 'md_wide') {
        const buttonTextType = textType || 'text_button_md';

        return (
            <View style={{ alignSelf: 'flex-start' }}> {/* Цей контейнер обмежить ширину до контенту */}
                <TouchableOpacity
                    onPress={onPress}
                    activeOpacity={0.8}
                    style={{
                        minWidth: 128, // Мінімальна ширина
                        maxHeight: 40,
                        borderRadius: 24,
                        overflow: 'hidden',
                    }}
                >
                    <Gradient type="purpleGreen" style={{ flex: 1 }}>
                        <View className="flex flex-row items-center px-4 h-full">
                            {iconPosition === 'left' && (
                                <View className="mr-2">
                                    {icon}
                                </View>
                            )}

                            <ThemedText
                                type={buttonTextType}
                                className={`text-purple-950 ${textClassName || ''}`}
                            >
                                {children}
                            </ThemedText>

                            {iconPosition === 'right' && (
                                <View className={iconSpacing || 'ml-2'}>
                                    {icon}
                                </View>
                            )}
                        </View>
                    </Gradient>
                </TouchableOpacity>
            </View>
        );
    }

    // Стандартний код для інших розмірів кнопок
    const buttonClasses = `
        ${size === 'xs' ? 'w-[72px] h-[24px] rounded-[12px]' : ''}
        ${size === 'sm' ? 'w-[44px] h-[44px] rounded-[56px]' : ''}
        ${size === 'md' ? 'w-[120px] h-[36px] rounded-[8px] shadow-sm' : ''}
        ${size === 'lg' ? 'w-[60px] h-[60px] rounded-[56px]' : ''}
        ${size === 'xl' ? 'w-[280px] h-[40px] rounded-[8px] shadow-sm' : ''}
        ${size === 'xxl' ? 'w-[344px] h-[40px] rounded-[8px] shadow-sm' : ''}
        ${color === 'primary' ? 'bg-purple-950' : ''}
        ${color === 'secondary' ? 'bg-white-950' : ''}
        ${color === 'danger' ? 'transparent' : ''}
        ${className ? className : 'flex-row items-center justify-center'}
    `;

    const buttonTextType =
        size === 'xl' || size === 'xxl' ? 'text_button_lg' :
            size === 'md' ? 'text_button_md' :
                textType || 'empty';

    const textColorClass =
        color === 'primary' ? 'text-white-950' :
            color === 'secondary' ? 'text-purple-950' :
                '';

    if (icon) {
        // Визначаємо класи для відступів іконки
        const leftIconClass = iconPosition === 'left' ? '' : '';
        const rightIconClass = iconPosition === 'right' ? iconSpacing : '';

        return (
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.8}
                className={buttonClasses}
                style={[
                    (size === 'md' || size === 'xl' || size === 'xxl') && {
                        shadowColor: "#000000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.14,
                        shadowRadius: 2,
                        elevation: 2,
                    }
                ]}
            >
                <View className="flex flex-row items-center justify-center gap-x-2 w-full h-full">
                    {iconPosition === 'left' && (
                        <View className={leftIconClass}>
                            {icon}
                        </View>
                    )}

                    <ThemedText
                        type={buttonTextType}
                        className={`${textColorClass} ${textClassName || ''}`}
                    >
                        {children}
                    </ThemedText>

                    {iconPosition === 'right' && (
                        <View className={rightIconClass}>
                            {icon}
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            className={buttonClasses}
            style={[
                (size === 'md' || size === 'xl' || size === 'xxl') && {
                    shadowColor: "#000000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.14,
                    shadowRadius: 2,
                    elevation: 2,
                }
            ]}
        >
            <ThemedText
                type={buttonTextType}
                className={`${textColorClass} ${textClassName || ''}`}
            >
                {children}
            </ThemedText>
        </TouchableOpacity>
    );
}