import {View, Text} from "react-native";
import {ThemedText} from "@/components/ThemedText";
import {Button} from "@/components/Button";

const CreateAvatar = () => {
    return (
        <View className='bg-purple-800 flex gap-2 p-3 rounded-xl'>
            <View>
                <ThemedText type='title_card'>Create you own avatar</ThemedText>
                <ThemedText type='text_card'>Enter name, age, gender, favourite colour and we will generate personalized avatar </ThemedText>
            </View>
            <Button size='xs' color='secondary'>Generate</Button>
        </View>
    )
}

export default CreateAvatar