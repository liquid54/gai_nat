import { useEffect, useState } from "react";
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
} from "react-native";
import { registerGlobals } from "@livekit/react-native";
import {
    LiveKitRoom,
    AudioSession,
    VideoTrack,
    useTracks,
    isTrackReference,
} from "@livekit/react-native";
import { Track } from "livekit-client";
import CustomSelect from "@/features/chat/CustomSelect";
import { STT_LANGUAGE_LIST, AVATARS } from "./constants";

registerGlobals();

const API_CONFIG = {
    apiKey: "ZjU2OTRlMTBkNTcxNGNjN2E5OTk5MGI0M2Q2OWE3OWItMTc0MDIyNzY0Nw==",
    serverUrl: "https://api.heygen.com",
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

    // choose language and avatar
    const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
    const [selectedAvatar, setSelectedAvatar] = useState<string>("");

    // Start audio session on app launch
    useEffect(() => {
        const setupAudio = async () => {
            // delay for 1 second before starting audio session
            await new Promise(resolve => setTimeout(resolve, 1000));
            await AudioSession.startAudioSession();
        };

        setupAudio();
        return () => {
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

    const sendText = async () => {
        try {
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
                        text: text,
                        task_type: "talk",
                    }),
                }
            );

            const data = await response.json();
            console.log("Task response:", data);
            setText(""); // Clear input after sending
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

            console.log("Session closed successfully");
        } catch (error) {
            console.error("Error closing session:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!connected) {
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
                    style={({ pressed }) => [
                        styles.startButton,
                        { opacity: pressed ? 0.8 : 1 },
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
                adaptiveStream: { pixelDensity: "screen" },
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
            />
        </LiveKitRoom>
    );
}
export default Explore

const RoomView = ({
                      onSendText,
                      text,
                      onTextChange,
                      speaking,
                      onClose,
                      loading,
                  }: {
    onSendText: () => void;
    text: string;
    onTextChange: (text: string) => void;
    speaking: boolean;
    onClose: () => void;
    loading: boolean;
}) => {
    const tracks = useTracks([Track.Source.Camera], { onlySubscribed: true });

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
                <TouchableOpacity
                    style={[styles.closeButton, loading && styles.disabledButton]}
                    onPress={onClose}
                    disabled={loading}
                >
                    <Text style={styles.closeButtonText}>
                        {loading ? "Closing..." : "Close Session"}
                    </Text>
                </TouchableOpacity>
                <View style={styles.controls}>
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
                            onPress={onSendText}
                            disabled={speaking || !text.trim() || loading}
                        >
                            <Text style={styles.sendButtonText}>
                                {speaking ? "Speaking..." : "Send"}
                            </Text>
                        </TouchableOpacity>
                    </View>
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
        backgroundColor: "#fff",
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
        backgroundColor: "#2196F3",
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 30,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    startButtonText: {
        color: "white",
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
    closeButton: {
        position: "absolute",
        top: 50,
        right: 20,
        backgroundColor: "#ff4444",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
        zIndex: 1,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    closeButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
    },
    controls: {
        width: "100%",
        padding: 20,
        borderTopWidth: 1,
        borderColor: "#333",
        // backgroundColor: "rgba(0, 0, 0, 0.75)",
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
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    sendButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
    },
    disabledButton: {
        opacity: 0.5,
    },
});