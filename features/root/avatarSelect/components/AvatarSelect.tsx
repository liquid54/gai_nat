import {View, TouchableOpacity} from "react-native";
import PlaceHolder from "@/assets/images/icons/placeHolder";
import {AvatarOption as AvatarOptionType} from "@/features/root/avatarSelect/constants/constants";

interface AvatarOptionProps {
    avatar: AvatarOptionType;
    isSelected: boolean;
    onSelect: (avatar: AvatarOptionType) => void;
}

const AvatarOption = ({ avatar, isSelected, onSelect }: AvatarOptionProps) => {
    return (
        <TouchableOpacity
            onPress={() => onSelect(avatar)}
            className='flex mx-auto rounded-2xl shadow-3xl bg-white-950'
            style={isSelected ? { borderWidth: 2, borderColor: '#3B82F6' } : {}}
        >
            <View className='px-7 py-[33.5px]'>
                <PlaceHolder/>
            </View>
        </TouchableOpacity>
    )
}

export default AvatarOption