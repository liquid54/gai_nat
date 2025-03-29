import {View} from "react-native";
import {ThemedText} from "@/components/ThemedText";
import {Button} from "@/components/Button";
import ArrowLeftIcon from "@/assets/images/icons/arrowLeft";
import {useRouter} from "expo-router";

const CheckMail = () => {
    const router = useRouter();

    const handleBack = () => {
        router.back(); // Повертає на попередню сторінку в історії навігації
    };


    return (
        <View className='flex-1 justify-between px-4'>
            <View className='pt-[239px] flex items-center gap-y-2'>
                <ThemedText type='title'>Check your email!</ThemedText>
                <ThemedText type='subtitle'>Please look in your mail for further steps</ThemedText>
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

export default CheckMail;