import {View} from 'react-native'
import {ThemedText} from "@/components/ThemedText";
import {Button} from "@/components/Button";
import {useNavigation} from '@react-navigation/native';
import {useRouter} from 'expo-router';

const Welcome = () => {
    // Using Expo Router instead of React Navigation's navigate
    const router = useRouter();

    const handleLoginPress = () => {
        router.push('/login');
    };

    const handleSignupPress = () => {
        router.push('/signup');
    };


    return (
        <View className="gap-y-[236px]">
            <ThemedText type='heading' className='pt-[203px] text-center'>Welcome to GAI!</ThemedText>
            <View className="gap-y-[16px] px-12">
                <Button
                    size='xl'
                    color='secondary'
                    textType="text_button_lg"
                    onPress={handleLoginPress}
                >
                    LOG IN
                </Button>
                <Button size='xl' color='secondary' textType="text_button_lg" onPress={handleSignupPress}>
                    SIGN UP
                </Button>
            </View>
        </View>
    )
}

export default Welcome;