import {ThemedText} from "@/components/ThemedText";
import { View, TouchableOpacity } from "react-native";
import {Button} from "@/components/Button";
import Input from "@/components/Input";
import InstagramPurple from "@/assets/images/icons/instagram";
import ArrowRight from "@/assets/images/icons/arrowRight";
import {useRouter} from 'expo-router';
import AsyncStorage from "@react-native-async-storage/async-storage";

const Login = () => {
    const router = useRouter();

    const handleForgotPassword = () => {
        router.push("/resetpass");
    };

    const handleSignup = () => {
        router.push("/signup");
    };

    const handleLogin = async () => {
        try {
            // Зберігаємо статус входу в AsyncStorage
            await AsyncStorage.setItem("isTestLoggedIn", "true");
            // Після успішного збереження редиректимо на головну
            router.push("/");
        } catch (error) {
            console.error("Failed to save login status:", error);
            // Можна додати обробку помилок, показати повідомлення користувачу тощо
        }
    };

    return (
        <View className="flex-1">
            <ThemedText type='title_login' className='pt-[110px] text-center'>Log In</ThemedText>

            <View className='gap-y-6 items-center pt-[100px] px-4'>
                <Input placeholder='gai@gmail.com' label='Email' keyboardType='email-address'/>
                <Input placeholder='3!HtzslHv794857' label='Password' keyboardType='visible-password' />
            </View>
            <View className='px-3 pb-6 self-start'>
                <TouchableOpacity onPress={handleForgotPassword}>
                    <View className='flex flex-row py-1 px-5 gap-x-2 items-center'>
                        <ThemedText type='text_link_underlined' >Forgot password?</ThemedText>
                        <ArrowRight/>
                    </View>
                </TouchableOpacity>
            </View>

            <View className="gap-y-4 px-4 flex items-center">
                <Button
                    size='xxl'
                    color='primary'
                    textType="text_button_lg"
                    onPress={handleLogin}
                >
                    LOG IN
                </Button>

                <Button
                    size='xxl'
                    color='secondary'
                    textType="text_button_lg"
                >
                    LOG IN WITH APPLE
                </Button>

                <Button
                    size='xxl'
                    color='secondary'
                    textType="text_button_lg"
                >
                    LOG IN WITH GOOGLE
                </Button>

                <Button
                    size='xxl'
                    color='secondary'
                    textType="text_button_lg"
                    icon={<InstagramPurple />}
                    iconPosition="right"
                >
                    LOG IN WITH
                </Button>
            </View>

            <View className='flex-1 justify-end pb-4'>
                <View className='mx-auto'>
                    <TouchableOpacity onPress={handleSignup}>
                        <View className='py-1 px-5 gap-x-2 flex-row items-center'>
                            <ThemedText type='text_link_underlined' className='underline'>I don`t have an account</ThemedText>
                            <ArrowRight/>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    )
}

export default Login;