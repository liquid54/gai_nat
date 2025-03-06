import { Text, type TextProps } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

export type textEnum =
    'default' |
    'title' |
    'subtitle' |
    'defaultSemiBold' |
    'link' |
    'empty';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: textEnum;
  className?: string;
};

export function ThemedText({
                             lightColor,
                             darkColor,
                             type = 'default',
                             className = '',
                             ...rest
                           }: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
      <Text
          className={`
        ${type === 'default' ? 'text-base leading-6' : ''}
        ${type === 'title' ? 'text-[32px] font-bold leading-8' : ''}
        ${type === 'subtitle' ? 'text-xl font-bold' : ''}
        ${type === 'defaultSemiBold' ? 'text-base leading-6 font-semibold' : ''}
        ${type === 'link' ? 'text-base leading-[30px] text-[#0a7ea4]' : ''}
        ${type === 'empty' ? '' : ''}
        ${className}`}
          style={lightColor || darkColor ? { color } : undefined}
          {...rest}
      />
  );
}