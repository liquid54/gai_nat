import {Text, type TextProps} from 'react-native';

export type textEnum =
    | 'heading'
    | 'title'
    | 'title_login'
    | 'subtitle'
    | 'heading_login'
    | 'text_button_lg'
    | 'text_button_md'
    | 'text'
    | 'adress_text'
    | 'intro_text'
    | 'gradient_text'
    | 'text_link'
    | 'text_link_underlined'
    | 'body_small'
    | 'subtext'
    | 'empty';

export type ThemedTextProps = TextProps & {
    type?: textEnum;
    className?: string;
};

export function ThemedText({type = 'text', className = 'flex ', ...rest}: ThemedTextProps) {
    return (
        <Text
            className={`
        ${type === 'heading' ? 'text-[41px] leading-[100%] font-Urbanist-Bold text-purple-950 tracking-normal' : ''}
        ${type === 'title' ? 'text-[32px] leading-[100%] font-Urbanist-Bold text-purple-950 tracking-normal' : ''}
        ${type === 'title_login' ? 'text-[32px] leading-[100%] font-Roboto-Bold text-purple-950 tracking-normal' : ''}
        ${type === 'subtitle' ? 'text-[15px] leading-[20px] font-Roboto text-purple-600 tracking-normal' : ''}
        ${type === 'text_button_lg' ? 'text-[16px] font-Urbanist-SemiBold leading-[24px] tracking-[0.5px]' : ''}
        ${type === 'text_button_md' ? 'text-[14px] font-Urbanist-SemiBold leading-[24px] tracking-[0.5px]' : ''}
        ${type === 'adress_text' ? 'text-[32px] leading-[40px] font-Urbanist-Bold text-purple-950 tracking-normal' : ''}
        ${type === 'intro_text' ? 'text-[16px] leading-[24px] font-Mulish-Light text-purple-950 opacity-[0.64] tracking-normal' : ''}
        ${type === 'gradient_text' ? 'text-[16px] leading-[20px] font-Urbanist text-purple-950 opacity-[0.64] tracking-[0.4%]' : ''}

        ${type === 'text_link_underlined' ? 'text-[14px] font-Roboto leading-[20px] tracking-normal text-purple-950 underline decoration-solid decoration-purple-950' : ''}
        ${type === 'text_link' ? 'text-[14px] leading-[100%] font-Roboto text-purple-950 tracking-normal' : ''}
        ${type === 'body_small' ? 'text-[14px] font-Roboto leading-[16px] text-purple-950 tracking-[0.4px]' : ''}
        ${type === 'subtext' ? 'text-[14px] font-Roboto leading-[20px] tracking-normal text-purple-950' : ''}

        ${type === 'empty' ? '' : ''}
        ${className}`}
            {...rest}

        />
    );
}
