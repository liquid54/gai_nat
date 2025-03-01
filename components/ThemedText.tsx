import { Text, type TextProps } from 'react-native';

export type textEnum = 'text' | 'text-small' | 'title' | 'heading' | 'subtitle' | 'text-semiBold' | 'text-medium' | 'text-medium-base' | 'text-medium-gray' | 'link' | 'link-semiBold' | 'empty';

export type ThemedTextProps = TextProps & {
  type?: textEnum;
  className?: string;
};

export function ThemedText({ type = 'text', className = '', ...rest }: ThemedTextProps) {
  return (
      <Text
          className={`leading-[1.275]
        ${type === 'title' ? 'text-[22px] font-Onest-Bold text-black' : ''}
        ${type === 'subtitle' ? 'text-base font-Onest-Bold text-black-950' : ''}
        ${type === 'text-medium' ? 'text-sm font-Onest-Medium text-black-950' : ''}
        ${type === 'text-medium-gray' ? 'text-sm font-Onest-Medium text-black-200' : ''}
        ${type === 'text-medium-base' ? 'text-base font-Onest-Medium text-black-950' : ''}
        ${type === 'text' ? 'text-sm font-Onest text-gray-600' : ''}
        ${type === 'text-small' ? 'text-xs font-Onest text-gray-600' : ''}
        ${type === 'text-semiBold' ? 'text-sm font-Onest-SemiBold text-white-950' : ''}
        ${type === 'link' ? 'text-sm font-Onest text-accent-950' : ''}
        ${type === 'link-semiBold' ? 'text-sm font-Onest-SemiBold text-accent-950' : ''}
        ${type === 'empty' ? '' : ''}
        ${className}`}
          {...rest}
      />
  );
}
