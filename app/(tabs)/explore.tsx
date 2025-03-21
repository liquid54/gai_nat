import {useEffect, useState, useRef} from "react";
import {
    StyleSheet,
    View,
    TextInput,
    Text,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    TouchableOpacity,
    Pressable,
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
import {STT_LANGUAGE_LIST, AVATARS} from "@/features/chat/constants";

registerGlobals();

const API_CONFIG = {
    apiKey: "NWVhNWVhZDQ3OGZlNDU4ZjlhZmViMzY3YjdiMzhkODYtMTc0MjQ3NTY1NA==",
    serverUrl: "https://api.heygen.com",
    openaiApiKey: "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", // Замініть своїм ключем API OpenAI
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

    // Референції для запису
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
                    recording.current.stopAndUnloadAsync();
                } catch (error) {
                    console.log("Error cleaning recording:", error);
                }
                recording.current = null;
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
                recording.current = null;
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

            // Тепер створюємо новий запис
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

            const { recording: newRecording } = await Audio.Recording.createAsync(options);

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

    const stopRecording = async () => {
        if (!recording.current) return;

        try {
            setIsRecording(false);
            setRecordingStatus("processing");
            console.log("Recording stopped, processing...");

            let uri = null;

            try {
                // Перевіряємо стан запису перед спробою зупинки
                const status = await recording.current.getStatusAsync();
                if (status.canRecord) {
                    await recording.current.stopAndUnloadAsync();
                    uri = recording.current.getURI();
                }
            } catch (error) {
                console.log("Error stopping recording:", error);
            }

            // Якщо uri нема, спробуємо отримати його іншим способом
            if (!uri && recording.current) {
                uri = recording.current.getURI();
            }

            // Очищаємо поточний запис
            recording.current = null;

            if (uri) {
                // Отримуємо інформацію про файл
                const fileInfo = await FileSystem.getInfoAsync(uri);
                if (fileInfo.exists && fileInfo.size) {
                    console.log("Audio file size:", `${(fileInfo.size / 1024).toFixed(2)} KB`);
                } else {
                    console.log("Audio file size: unknown");
                }

                // Розпізнаємо мовлення
                await transcribeAudioWithOpenAI(uri);
            } else {
                console.error("Recording URI is null");
                setRecordingStatus("idle");
            }
        } catch (error) {
            console.error("Failed to stop recording:", error);
            setRecordingStatus("idle");
            // Очищаємо поточний запис при помилці
            recording.current = null;
        }
    };

    const transcribeAudioWithOpenAI = async (audioUri: string) => {
        try {
            // Створюємо формдату для відправки
            const formData = new FormData();
            formData.append('file', {
                uri: audioUri,
                type: 'audio/mp4',
                name: 'recording.m4a',
            } as any);
            formData.append('model', 'whisper-1');
            formData.append('language', selectedLanguage);

            console.log("Sending audio to OpenAI for transcription...");

            // Відправляємо запит до OpenAI
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

                // Автоматично відправляємо розпізнаний текст
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
        console.log('connected state:', connected)
        return (
            <View style={styles.startContainer}>
                <View style={styles.heroContainer}>
                    <Text style={styles.heroTitle}>HeyGen Streaming API + LiveKit</Text>
                    <Text style={styles.heroSubtitle}>React Native/Expo Demo</Text>
                </View>

                <View style={styles.settingsContainer}>
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

                <Pressable
                    style={({pressed}) => [
                        styles.startButton,
                        {opacity: pressed ? 0.8 : 1},
                    ]}
                    onPress={createSession}
                    disabled={loading}
                >
                    <Text style={styles.startButtonText}>
                        {loading ? "Starting..." : "Start Session"}
                    </Text>
                </Pressable>
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
    startRecording: () => Promise<void>;
    stopRecording: () => Promise<void>;
    isRecording: boolean;
    recordingStatus: "idle" | "recording" | "processing";
    transcribedText: string;
}) => {
    const tracks = useTracks([Track.Source.Camera], {onlySubscribed: true});

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.container}
            >
                <View style={styles.videoContainer}>
                    {tracks.map((track, idx) =>
                        isTrackReference(track) ? (
                            <VideoTrack
                                key={idx}
                                style={styles.videoView}
                                trackRef={track}
                                objectFit="contain"
                            />
                        ) : null
                    )}
                </View>
                <View style={styles.headerControls}>
                    <TouchableOpacity
                        style={[styles.closeButton, loading && styles.disabledButton]}
                        onPress={onClose}
                        disabled={loading}
                    >
                        <Text style={styles.closeButtonText}>
                            {loading ? "Closing..." : "Close Session"}
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.modeToggleContainer}>
                        <Text style={styles.modeLabel}>Text</Text>
                        <Switch
                            value={isVoiceMode}
                            onValueChange={toggleVoiceMode}
                            trackColor={{false: "#767577", true: "#81b0ff"}}
                            thumbColor={isVoiceMode ? "#2196F3" : "#f4f3f4"}
                            ios_backgroundColor="#3e3e3e"
                            disabled={speaking || recordingStatus === "processing"}
                        />
                        <Text style={styles.modeLabel}>Voice</Text>
                    </View>
                </View>

                {/* Відображення транскрибованого тексту */}
                {transcribedText ? (
                    <View style={styles.transcriptionContainer}>
                        <Text style={styles.transcriptionLabel}>Transcribed text:</Text>
                        <Text style={styles.transcriptionText}>{transcribedText}</Text>
                    </View>
                ) : null}

                <View style={styles.controls}>
                    {isVoiceMode ? (
                        // Voice mode
                        <TouchableOpacity
                            style={[
                                styles.voiceButton,
                                isRecording && styles.recordingButton,
                                (speaking || recordingStatus === "processing") && styles.disabledButton
                            ]}
                            onPress={isRecording ? stopRecording : startRecording}
                            disabled={speaking || recordingStatus === "processing"}
                            activeOpacity={0.7}
                        >
                            {recordingStatus === "processing" ? (
                                <ActivityIndicator size="small" color="#FFFFFF"/>
                            ) : (
                                <Text style={styles.voiceButtonText}>
                                    {isRecording ? "Stop Recording" : "Press to Record"}
                                </Text>
                            )}
                        </TouchableOpacity>
                    ) : (
                        // Text mode
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter text for avatar to speak"
                                placeholderTextColor="#666"
                                value={text}
                                onChangeText={onTextChange}
                                editable={!speaking && !loading}
                            />
                            <TouchableOpacity
                                style={[
                                    styles.sendButton,
                                    (speaking || !text.trim() || loading) && styles.disabledButton,
                                ]}
                                onPress={() => onSendText()}
                                disabled={speaking || !text.trim() || loading}
                            >
                                <Text style={styles.sendButtonText}>
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    startContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "white",
        padding: 20,
    },
    heroContainer: {
        alignItems: "center",
        marginBottom: 20,
    },
    heroTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: "#1a73e8",
        marginBottom: 8,
        textAlign: "center",
    },
    heroSubtitle: {
        fontSize: 18,
        color: "#666",
        fontWeight: "500",
        textAlign: "center",
    },
    settingsContainer: {
        width: "100%",
        marginBottom: 20,
    },
    startButton: {
        borderColor: 'green',
    },
    startButtonText: {
        color: "#1a73e8",
        fontSize: 18,
        fontWeight: "600",
    },
    videoContainer: {
        flex: 1,
        position: "relative",
    },
    videoView: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    headerControls: {
        position: "absolute",
        top: 50,
        right: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        paddingLeft: 20,
        paddingRight: 20,
        zIndex: 10,
    },
    closeButton: {
        backgroundColor: "#ff4444",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    closeButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
    },
    modeToggleContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    modeLabel: {
        marginHorizontal: 8,
        fontSize: 14,
        fontWeight: "500",
        color: "#333",
    },
    controls: {
        width: "100%",
        padding: 20,
        borderTopWidth: 1,
        borderColor: "#333",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    input: {
        flex: 1,
        height: 50,
        borderColor: "#333",
        borderWidth: 1,
        paddingHorizontal: 15,
        borderRadius: 25,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        fontSize: 16,
        color: "#000",
    },
    sendButton: {
        backgroundColor: "#2196F3",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    sendButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
    },
    voiceButton: {
        backgroundColor: "#2196F3",
        paddingVertical: 15,
        borderRadius: 30,
        alignItems: "center",
        justifyContent: "center",
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    recordingButton: {
        backgroundColor: "#ff4444",
    },
    voiceButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
    },
    disabledButton: {
        opacity: 0.5,
    },
    transcriptionContainer: {
        padding: 15,
        margin: 10,
        backgroundColor: "rgba(240, 240, 240, 0.8)",
        borderRadius: 10,
        position: "absolute",
        bottom: 100,
        left: 10,
        right: 10,
        zIndex: 5,
    },
    transcriptionLabel: {
        fontSize: 12,
        color: "#666",
        marginBottom: 5,
    },
    transcriptionText: {
        fontSize: 14,
        color: "#000",
        fontWeight: "500",
    },
});