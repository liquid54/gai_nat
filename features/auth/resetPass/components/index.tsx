import {ThemedText} from "@/components/ThemedText";
import {View} from "react-native";
import Input from "@/components/Input";
import {Button} from "@/components/Button";
import ArrowLeftIcon from "@/assets/images/icons/arrowLeft";
import {useRouter} from 'expo-router';

const ResetPass = () => {
    const router = useRouter();

    const handleBack = () => {
        router.back();
    };

    const handleNext = () => {
        router.push('/checkmail');
    };

    return (
        <View className='px-4 flex-1 justify-between'>
            <View className='pt-[106px] flex gap-y-[124px]'>
                <View className='px-[13px]'>
                    <ThemedText type='title' className='text-left leading-none'>Reset password</ThemedText>
                    <ThemedText type='subtitle' className='text-left'>Enter your registered email</ThemedText>
                </View>
                <View className='flex items-center gap-y-5'>
                    <Input placeholder='gai@gmail.com' label='Email' keyboardType='email-address'/>
                    <Button
                        size='xxl'
                        color='primary'
                        onPress={handleNext}
                    >
                        NEXT
                    </Button>
                </View>
            </View>
            <View className='pb-6'>
                <Button
                    size='md'
                    color='secondary'
                    iconPosition='left'
                    icon={<ArrowLeftIcon/>}
                    onPress={handleBack}
                >
                    BACK
                </Button>
            </View>
        </View>
    )
}

export default ResetPass