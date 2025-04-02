import HorizontalLine from "@/assets/images/icons/horizontalLine";
import {View} from "react-native";
import {ThemedText} from "@/components/ThemedText";

const Date = () => {
    return (
        <View className='gap-x-3 flex-row items-center justify-center'>
            <HorizontalLine/>
            <ThemedText type='title_date'>today</ThemedText>
            <HorizontalLine/>
        </View>
    )
}
export default Date