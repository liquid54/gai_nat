import Header from "@/features/root/audioCall/components/Header";
import InputToolbar from "@/features/root/audioCall/components/inputToolbar";
import ActiveAvatar from "@/assets/images/icons/activeAvatar";
import {View} from "react-native";
import {ThemedText} from "@/components/ThemedText";
import {useEffect, useState} from "react";
import { registerGlobals } from "@livekit/react-native";
import { LiveKitRoom } from "@livekit/react-native";

// Register LiveKit globals
registerGlobals();

const AudioCall = () => {
    // Local state to update response text when it changes
    const [responseText, setResponseText] = useState("Відповідь обробляється...");

    // Get data passed from videoChat
    const audioCallData = (global as any).audioCallData || {
        sessionData: {
            sessionId: "",
            sessionToken: "",
            wsUrl: "",
            token: ""
        },
        responseText: "Немає доступної відповіді",
        avatarData: null
    };

    // Extract session data
    const { sessionData } = audioCallData;

    // Monitor for changes to the global object response
    useEffect(() => {
        console.log("AudioCall page loaded");

        // Set initial response text
        setResponseText(audioCallData.responseText);

        // Set up interval to check for updated response text
        const interval = setInterval(() => {
            if ((global as any).audioCallData && (global as any).audioCallData.responseText !== responseText) {
                console.log("Response text updated:", (global as any).audioCallData.responseText);
                setResponseText((global as any).audioCallData.responseText);
            }
        }, 200);

        return () => {
            clearInterval(interval);
        };
    }, [responseText]);

    return (
        <>
            <Header/>
            <View className='pl-[45px] px-[25px] pb-9'>
                <ActiveAvatar/>
            </View>

            <View className='flex items-center gap-y-[32px] pb-[140px]'>
                <View className='px-[62px]'>
                    <ThemedText type='text_ai_dark' className="text-center">
                        {responseText}
                    </ThemedText>
                </View>
                <InputToolbar/>
            </View>

            {/* LiveKit Room for Audio Playback */}
            {sessionData.wsUrl && sessionData.token && (
                <LiveKitRoom
                    serverUrl={sessionData.wsUrl}
                    token={sessionData.token}
                    connect={true}
                    options={{
                        adaptiveStream: {pixelDensity: "screen"},
                        audioCaptureDefaults: {
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: true
                        },
                        publishDefaults: {
                            dtx: true,
                            red: true,
                        },
                    }}
                    audio={false} // No microphone needed
                    video={false} // No video needed
                />
            )}
        </>
    )
}

export default AudioCall