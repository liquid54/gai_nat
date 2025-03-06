import {useEffect, useState, useRef} from "react";
import {
    View,
    TextInput,
    Text,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator,
    Switch,
} from "react-native";
import {registerGlobals} from "@livekit/react-native";
import {
    LiveKitRoom,
    AudioSession,
    VideoTrack,
    useTracks,
    isTrackReference,
} from "@livekit/react-native";
import {Track} from "livekit-client";
import {Audio} from "expo-av";
import * as FileSystem from 'expo-file-system';
import CustomSelect from "@/features/chat/CustomSelect";
import {STT_LANGUAGE_LIST, AVATARS} from "./constants";

registerGlobals();

const API_CONFIG = {
    apiKey: "YTA0OWNjZWVlZjhlNGU4MGFhN2FiMjA5NDM1ZGU0MjktMTc0MTE4MjIwOQ==",
    serverUrl: "https://api.heygen.com",
    openaiApiKey: "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",
};

const Explore = () => {
    const [wsUrl, setWsUrl] = useState<string>("");
    const [token, setToken] = useState<string>("");
    const [sessionToken, setSessionToken] = useState<string>("");
    const [sessionId, setSessionId] = useState<string>("");
    const [connected, setConnected] = useState(false);
    const [text, setText] = useState("");
    const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
    const [loading, setLoading] = useState(false);
    const [speaking, setSpeaking] = useState(false);

    // Voice mode state
    const [isVoiceMode, setIsVoiceMode] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [transcribedText, setTranscribedText] = useState("");
    const [recordingStatus, setRecordingStatus] = useState<"idle" | "recording" | "processing">("idle");

    const recording = useRef<Audio.Recording | null>(null);

    // choose language and avatar
    const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
    const [selectedAvatar, setSelectedAvatar] = useState<string>("");

    // Start audio session on app launch
    useEffect(() => {
        const setupAudio = async () => {
            await AudioSession.startAudioSession();

            // Отримуємо дозвіл на запис аудіо
            const permission = await Audio.requestPermissionsAsync();
            if (!permission.granted) {
                console.error("Permission to access audio was denied");
            }

            // Налаштування аудіо режиму
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                shouldDuckAndroid: true,
                playThroughEarpieceAndroid: false,
            });
        };

        setupAudio();
        return () => {
            // Зупиняємо запис, якщо він активний
            if (recording.current) {
                try {
                    const checkStatus = async () => {
                        try {
                            if (recording.current) {
                                const status = await recording.current.getStatusAsync();
                                if (status.canRecord) {
                                    await recording.current.stopAndUnloadAsync();
                                }
                            }
                        } catch (error) {
                            console.log("Clean up recording error:", error);
                        }
                    };
                    checkStatus();
                } catch (error) {
                    console.log("Error cleaning recording:", error);
                }
            }

            // Зупиняємо аудіо сесію
            AudioSession.stopAudioSession();
        };
    }, []);

    // default avatar selection
    useEffect(() => {
        if (AVATARS.length > 0 && !selectedAvatar) {
            setSelectedAvatar(AVATARS[0].avatar_id);
        }
    }, []);

    const getSessionToken = async () => {
        try {
            const response = await fetch(
                `${API_CONFIG.serverUrl}/v1/streaming.create_token`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Api-Key": API_CONFIG.apiKey,
                    },
                }
            );

            const data = await response.json();
            console.log("Session token obtained", data.data.token);
            return data.data.token;
        } catch (error) {
            console.error("Error getting session token:", error);
            throw error;
        }
    };

    const startStreamingSession = async (
        sessionId: string,
        sessionToken: string
    ) => {
        try {
            console.log("Starting streaming session with:", {
                sessionId,
                sessionToken,
            });
            const startResponse = await fetch(
                `${API_CONFIG.serverUrl}/v1/streaming.start`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${sessionToken}`,
                    },
                    body: JSON.stringify({
                        session_id: sessionId,
                    }),
                }
            );

            const startData = await startResponse.json();
            console.log("Streaming start response:", startData);

            if (startData) {
                setConnected(true);
                return true;
            }

            return false;
        } catch (error) {
            console.error("Error starting streaming session:", error);
            return false;
        }
    };

    const createSession = async () => {
        try {
            setLoading(true);
            // Get new session token
            const newSessionToken = await getSessionToken();
            setSessionToken(newSessionToken);

            const response = await fetch(`${API_CONFIG.serverUrl}/v1/streaming.new`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${newSessionToken}`,
                },
                body: JSON.stringify({
                    quality: "low",
                    avatar_name: selectedAvatar, // choose avatar
                    voice: {
                        voice_id: "",
                        language: selectedLanguage, // add language for avatar
                    },
                    language: selectedLanguage, // add language for all avatar
                    version: "v2",
                    video_encoding: "H264",
                }),
            });

            const data = await response.json();
            console.log("Streaming new response:", data.data);

            if (data.data) {
                const newSessionId = data.data.session_id;
                // Set all session data
                setSessionId(newSessionId);
                setWsUrl(data.data.url);
                setToken(data.data.access_token);

                // Connect WebSocket
                const params = new URLSearchParams({
                    session_id: newSessionId,
                    session_token: newSessionToken,
                    silence_response: "false",
                    // opening_text: "Hello from the mobile app!",
                    stt_language: selectedLanguage, // language parameter for avatar response
                    language: selectedLanguage, // language parameter for avatar response
                });

                const wsUrl = `wss://${
                    new URL(API_CONFIG.serverUrl).hostname
                }/v1/ws/streaming.chat?${params}`;

                const ws = new WebSocket(wsUrl);
                setWebSocket(ws);

                // Start streaming session with the new IDs
                await startStreamingSession(newSessionId, newSessionToken);
            }
        } catch (error) {
            console.error("Error creating session:", error);
        } finally {
            setLoading(false);
        }
    };

    const sendText = async (textToSend = text) => {
        try {
            if (!textToSend.trim()) return;

            setSpeaking(true);

            // Send task request
            const response = await fetch(
                `${API_CONFIG.serverUrl}/v1/streaming.task`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${sessionToken}`,
                    },
                    body: JSON.stringify({
                        session_id: sessionId,
                        text: textToSend,
                        task_type: "talk",
                    }),
                }
            );

            const data = await response.json();
            console.log("Task response:", data);
            setText(""); // Clear input after sending
            setTranscribedText(""); // Clear transcribed text as well
        } catch (error) {
            console.error("Error sending text:", error);
        } finally {
            setSpeaking(false);
        }
    };

    const closeSession = async () => {
        try {
            setLoading(true);
            if (!sessionId || !sessionToken) {
                console.log("No active session");
                return;
            }

            // Зупиняємо запис
            if (recording.current) {
                try {
                    await recording.current.stopAndUnloadAsync();
                } catch (error) {
                    console.error("Error stopping recording:", error);
                }
            }

            const response = await fetch(
                `${API_CONFIG.serverUrl}/v1/streaming.stop`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${sessionToken}`,
                    },
                    body: JSON.stringify({
                        session_id: sessionId,
                    }),
                }
            );

            // Close WebSocket
            if (webSocket) {
                webSocket.close();
                setWebSocket(null);
            }

            // Reset all states
            setConnected(false);
            setSessionId("");
            setSessionToken("");
            setWsUrl("");
            setToken("");
            setText("");
            setSpeaking(false);
            setIsRecording(false);
            setTranscribedText("");
            setRecordingStatus("idle");

            console.log("Session closed successfully");
        } catch (error) {
            console.error("Error closing session:", error);
        } finally {
            setLoading(false);
        }
    };

    // Voice mode functions
    const startRecording = async () => {
        try {
            // Видаляємо попередній запис, якщо він є
            if (recording.current) {
                try {
                    await recording.current.stopAndUnloadAsync();
                } catch (error) {
                    console.log("Error with previous recording:", error);
                }
                recording.current = null;
            }

            // create new recording
            const options = {
                android: {
                    extension: '.m4a',
                    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
                    audioEncoder: Audio.AndroidAudioEncoder.AAC,
                    sampleRate: 16000,
                    numberOfChannels: 1,
                    bitRate: 32000,
                },
                ios: Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
                web: {
                    mimeType: 'audio/webm',
                    bitsPerSecond: 128000,
                },
            };

            const {recording: newRecording} = await Audio.Recording.createAsync(options);

            recording.current = newRecording;
            setIsRecording(true);
            setRecordingStatus("recording");
            console.log("Recording started");
        } catch (error) {
            console.error("Failed to start recording:", error);
            setIsRecording(false);
            setRecordingStatus("idle");
        }
    };

    useEffect(() => {
        const setupAudio = async () => {
            await AudioSession.startAudioSession();

            // Getting permission to record audio
            const permission = await Audio.requestPermissionsAsync();
            if (!permission.granted) {
                console.error("Permission to access audio was denied");
            }

            // Налаштування аудіо режиму
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                shouldDuckAndroid: true,
                playThroughEarpieceAndroid: false,
            });
        };

        setupAudio();

        return () => {
            // Stop recording if it is active
            if (recording.current) {
                try {
                    recording.current.stopAndUnloadAsync();
                } catch (error) {
                    console.log("Error cleaning recording:", error);
                }
                recording.current = null;
            }
            AudioSession.stopAudioSession();
        };
    }, []);

    const stopRecording = async () => {
        if (!recording.current) return;

        try {
            setIsRecording(false);
            setRecordingStatus("processing");
            console.log("Recording stopped, processing...");

            let uri = null;

            try {
                // Checking the recording status before attempting to stop
                const status = await recording.current.getStatusAsync();
                if (status.canRecord) {
                    await recording.current.stopAndUnloadAsync();
                    uri = recording.current.getURI();
                }
            } catch (error) {
                console.log("Error stopping recording:", error);
            }

            // If uri is null, try to get it another way
            if (!uri && recording.current) {
                uri = recording.current.getURI();
            }

            if (uri) {
                // Getting file information
                const fileInfo = await FileSystem.getInfoAsync(uri);
                if (fileInfo.exists && fileInfo.size) {
                    console.log("Audio file size:", `${(fileInfo.size / 1024).toFixed(2)} KB`);
                } else {
                    console.log("Audio file size: unknown");
                }

                // Recognizing speech
                await transcribeAudioWithOpenAI(uri);
            } else {
                console.error("Recording URI is null");
                setRecordingStatus("idle");
            }

            // clear current recording
            recording.current = null;
        } catch (error) {
            console.error("Failed to stop recording:", error);
            setRecordingStatus("idle");

            recording.current = null;
        }
    };

    const transcribeAudioWithOpenAI = async (audioUri: string) => {
        try {
            // create form data
            const formData = new FormData();
            formData.append('file', {
                uri: audioUri,
                type: 'audio/mp4',
                name: 'recording.m4a',
            } as any);
            formData.append('model', 'whisper-1');
            formData.append('language', selectedLanguage);

            console.log("Sending audio to OpenAI for transcription...");

            // send audio to OpenAI for transcription
            const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_CONFIG.openaiApiKey}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log("Transcription result:", data);

            if (data?.text) {
                const recognizedText = data.text.trim();
                setTranscribedText(recognizedText);

                // automatically send recognized text to the avatar
                if (recognizedText) {
                    await sendText(recognizedText);
                } else {
                    console.log("Empty transcription result");
                }
            } else {
                console.log("Invalid transcription result format");
            }
        } catch (error) {
            console.error("Error transcribing audio with OpenAI:", error);
            alert("Помилка розпізнавання голосу. Спробуйте ще раз.");
        } finally {
            setRecordingStatus("idle");
        }
    };

    // Toggle voice mode
    const toggleVoiceMode = () => {
        if (isVoiceMode && isRecording) {
            stopRecording();
        }

        setIsVoiceMode(!isVoiceMode);
        console.log(`Switched to ${!isVoiceMode ? 'voice' : 'text'} mode`);
    };

    if (!connected) {
        return (
            <View className="flex-1 justify-center items-center bg-white p-5">
                <View className="items-center mb-5">
                    <Text className="text-[22px] font-bold text-[#1a73e8] mb-2 text-center">
                        HeyGen Streaming API + LiveKit
                    </Text>
                    <Text className="text-lg text-gray-600 font-medium text-center">
                        React Native/Expo Demo
                    </Text>
                </View>

                <View className="w-full mb-5">
                    <CustomSelect
                        label="Мова"
                        value={selectedLanguage}
                        onValueChange={setSelectedLanguage}
                        placeholder="Оберіть мову"
                        options={STT_LANGUAGE_LIST}
                    />

                    <CustomSelect
                        label="Аватар"
                        value={selectedAvatar}
                        onValueChange={setSelectedAvatar}
                        placeholder="Оберіть аватар"
                        options={AVATARS}
                    />
                </View>

                <TouchableOpacity
                    className={`bg-blue-500 px-8 py-4 rounded-full shadow-md ${loading ? 'opacity-80' : 'opacity-100'}`}
                    onPress={createSession}
                    disabled={loading}
                >
                    <Text className="text-white text-lg font-semibold">
                        {loading ? "Starting..." : "Start Session"}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <LiveKitRoom
            serverUrl={wsUrl}
            token={token}
            connect={true}
            options={{
                adaptiveStream: {pixelDensity: "screen"},
                audioCaptureDefaults: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
            }}
            audio={false}
            video={false}
        >
            <RoomView
                onSendText={sendText}
                text={text}
                onTextChange={setText}
                speaking={speaking}
                onClose={closeSession}
                loading={loading}
                isVoiceMode={isVoiceMode}
                toggleVoiceMode={toggleVoiceMode}
                startRecording={startRecording}
                stopRecording={stopRecording}
                isRecording={isRecording}
                recordingStatus={recordingStatus}
                transcribedText={transcribedText}
            />
        </LiveKitRoom>
    );
};

export default Explore;

const RoomView = ({
                      onSendText,
                      text,
                      onTextChange,
                      speaking,
                      onClose,
                      loading,
                      isVoiceMode,
                      toggleVoiceMode,
                      startRecording,
                      stopRecording,
                      isRecording,
                      recordingStatus,
                      transcribedText,
                  }: {
    onSendText: (text?: string) => void;
    text: string;
    onTextChange: (text: string) => void;
    speaking: boolean;
    onClose: () => void;
    loading: boolean;
    isVoiceMode: boolean;
    toggleVoiceMode: () => void;
    startRecording: () => void;
    stopRecording: () => void;
    isRecording: boolean;
    recordingStatus: "idle" | "recording" | "processing";
    transcribedText: string;
}) => {
    const tracks = useTracks([Track.Source.Camera], {onlySubscribed: true});

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <View className="flex-1 relative">
                    {tracks.map((track, idx) =>
                        isTrackReference(track) ? (
                            <VideoTrack
                                key={idx}
                                trackRef={track}
                                objectFit="contain"
                            />
                        ) : null
                    )}
                </View>
                <View className="absolute top-12 right-5 flex-row justify-between w-full px-5 z-10">
                    <TouchableOpacity
                        className={`bg-red-500 px-5 py-2.5 rounded-full shadow-md ${loading ? 'opacity-50' : ''}`}
                        onPress={onClose}
                        disabled={loading}
                    >
                        <Text className="text-white text-base font-semibold">
                            {loading ? "Closing..." : "Close Session"}
                        </Text>
                    </TouchableOpacity>

                    <View className="flex-row items-center bg-white bg-opacity-80 px-2.5 py-1.5 rounded-full">
                        <Text className="mx-2 text-sm font-medium text-gray-800">Text</Text>
                        <Switch
                            value={isVoiceMode}
                            onValueChange={toggleVoiceMode}
                            trackColor={{false: "#767577", true: "#81b0ff"}}
                            thumbColor={isVoiceMode ? "#2196F3" : "#f4f3f4"}
                            ios_backgroundColor="#3e3e3e"
                            disabled={speaking || recordingStatus === "processing"}
                        />
                        <Text className="mx-2 text-sm font-medium text-gray-800">Voice</Text>
                    </View>
                </View>

                {/* Відображення транскрибованого тексту */}
                {transcribedText ? (
                    <View className="p-4 m-2.5 bg-gray-100 bg-opacity-80 rounded-lg absolute bottom-24 left-2.5 right-2.5 z-10">
                        <Text className="text-xs text-gray-600 mb-1">Transcribed text:</Text>
                        <Text className="text-sm text-black font-medium">{transcribedText}</Text>
                    </View>
                ) : null}

                <View className="w-full p-5 border-t border-gray-800">
                    {isVoiceMode ? (
                        // Voice mode
                        <TouchableOpacity
                            className={`py-4 rounded-full items-center justify-center shadow-md ${
                                isRecording ? 'bg-red-500' : 'bg-blue-500'
                            } ${(speaking || recordingStatus === "processing") ? 'opacity-50' : ''}`}
                            onPress={isRecording ? stopRecording : startRecording}
                            disabled={speaking || recordingStatus === "processing"}
                            activeOpacity={0.7}
                        >
                            {recordingStatus === "processing" ? (
                                <ActivityIndicator size="small" color="#FFFFFF"/>
                            ) : (
                                <Text className="text-white text-base font-semibold">
                                    {isRecording ? "Stop Recording" : "Press to Record"}
                                </Text>
                            )}
                        </TouchableOpacity>
                    ) : (
                        // Text mode
                        <View className="flex-row items-center space-x-2.5">
                            <TextInput
                                className="flex-1 h-12 border border-gray-800 px-4 rounded-full bg-white bg-opacity-90 text-base text-black"
                                placeholder="Enter text for avatar to speak"
                                placeholderTextColor="#666"
                                value={text}
                                onChangeText={onTextChange}
                                editable={!speaking && !loading}
                            />
                            <TouchableOpacity
                                className={`bg-blue-500 px-5 py-3 rounded-full shadow-md ${
                                    (speaking || !text.trim() || loading) ? 'opacity-50' : ''
                                }`}
                                onPress={() => onSendText()}
                                disabled={speaking || !text.trim() || loading}
                            >
                                <Text className="text-white text-base font-semibold">
                                    {speaking ? "Speaking..." : "Send"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};