import ArrowLeft from "@/assets/images/icons/arrowLeft";
import {Button} from "@/components/Button";
import {View} from "react-native";
import {ThemedText} from "@/components/ThemedText";

const Header = () => {
    return (
        <View>
            <View className='px-4 py-2 flex gap-x-19 justify-between'>
                <Button>
                    <ArrowLeft/>
                </Button>
                <View>
                    <ThemedText className='text-center'>Avatar selection</ThemedText>
                </View>
            </View>
        </View>
    )
}