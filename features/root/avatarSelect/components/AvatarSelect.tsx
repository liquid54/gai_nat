import {View} from "react-native";
import PlaceHolder from "@/assets/images/icons/placeHolder";

const AvatarOption = () => {
    return (
        <View className='flex mx-auto overflow-hidden rounded-2xl shadow-md'>
            <View className='px-7 py-[33.5px]'>
                <PlaceHolder/>
            </View>
        </View>
    )
}

export default AvatarOption