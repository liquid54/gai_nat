import {View, Text, Image, TouchableOpacity } from 'react-native'
import {ThemedText} from "@/components/ThemedText";
import Input from "@/components/Input";
import {Button} from "@/components/Button";
import InstagramPurple from "@/assets/images/icons/instagram";
import LinkedIn from "@/assets/images/icons/linkedIn";
import Facebook from "@/assets/images/icons/facebook";
import InstagramBig from "@/assets/images/icons/istagramBig";
import ArrowRight from "@/assets/images/icons/arrowRight";
import {useRouter} from 'expo-router';

const Signup = () => {
    const router = useRouter();

    const handleLogin = () => {
        router.push("/login");
    };

    return (
        <View className='flex-1 px-4'>
            <ThemedText type='title' className='pt-[110px] text-center'>Create account</ThemedText>

            <View className='gap-y-6 items-center pt-[60px] px-4'>
                <Input placeholder='gai@gmail.com' label='Email' keyboardType='email-address'/>
                <Input placeholder='3!HtzslHv794857' label='Password' keyboardType='visible-password' />
                <Input placeholder='3!HtzslHv794857' label='Again password' keyboardType='visible-password' />
            </View>
            <View className='pb-6 gap-y-2'>
                <ThemedText type='text_link'>Connect your social media</ThemedText>
                <View className='flex-row gap-x-1'>
                    <LinkedIn/>
                    <Facebook/>
                    <InstagramBig/>
                </View>
            </View>

            <View className='flex items-center'>
                <Button
                    size='xxl'
                    color='primary'
                    textType="text_button_lg"
                >
                    Sign up
                </Button>
            </View>

            {/* Використовуємо flex-1 для заповнення простору та justify-end для позиціонування внизу */}
            <View className='flex-1 justify-end pb-4'>
                <View className='mx-auto'>
                    <TouchableOpacity onPress={handleLogin}>
                        <View className='py-1 px-5 gap-x-2 flex-row items-center'>
                            <ThemedText type='text_link_underlined' className='underline'>I already have an account</ThemedText>
                            <ArrowRight/>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    )
}

export default Signup;