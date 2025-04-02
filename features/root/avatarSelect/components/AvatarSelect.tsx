import {View} from "react-native";
import PlaceHolder from "@/assets/images/icons/placeHolder";

const AvatarOption = () => {
    return (
        <View className='flex mx-auto overflow-hidden rounded-2xl shadow-3xl bg-white-950'>
            <View className='px-7 py-[33.5px]'>
                <PlaceHolder/>
            </View>
        </View>
    )
}

export default AvatarOption