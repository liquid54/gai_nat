import {View, Platform} from "react-native";
import Gradient from "@/components/Gradient";
import React, { useState, useCallback, useEffect, useRef } from "react";
import DateComponent from "@/features/root/videoChat/components/date";
import Header from "@/features/root/chat/components/Header";
import ChatComponent, { MessageType } from "@/features/root/videoChat/components/chatComponent";
import InputToolbar from "@/features/root/videoChat/components/inputToolbar";
import { Button } from "@/components/Button";
import WhiteMicro from "@/assets/images/icons/whiteMicro";
import Input from "@/components/Input";
import Add from "@/assets/images/icons/add";
import { useRouter } from 'expo-router';
import { registerGlobals } from "@livekit/react-native";
import { LiveKitRoom } from "@livekit/react-native";
import { Audio } from "expo-av";
import * as FileSystem from 'expo-file-system';

// Register LiveKit globals
registerGlobals();

// API configuration
const API_CONFIG = {
    apiKey: "ZmVhOGI1ZDhjNTI1NGQ2YjkxZDY3NDM1YjhlMTJmOGEtMTc0MzYyNzQ4Ng==",
    serverUrl: "https://api.heygen.com",
    openaiApiKey: "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", // Replace with your OpenAI API key
};

// Initialize global state if it doesn't exist
if (!(global as any).chatState) {
    (global as any).chatState = {
        sessionData: null,
        chatHistory: [],
        hasActiveSession: false
    };
}

const VideoChat = () => {
    const router = useRouter();

    // Get selected avatar from global variable
    const selectedAvatar = (global as any).selectedAvatar || {
        avatar_id: "Anna_public_3_20240108",
        name: "Anna in Brown T-shirt"
    };

    // Session state - use saved data or empty object
    const [sessionData, setSessionData] = useState((global as any).chatState.sessionData || {
        sessionId: "",
        sessionToken: "",
        wsUrl: "",
        token: ""
    });

    // Chat state - restore chat history if it exists
    const [showKeyboard, setShowKeyboard] = useState(false);
    const [inputText, setInputText] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [messages, setMessages] = useState<MessageType[]>((global as any).chatState.chatHistory || []);

    // Voice recording states
    const [isRecording, setIsRecording] = useState(false);
    const recording = useRef<Audio.Recording | null>(null);
    const [isTranscribing, setIsTranscribing] = useState(false);

    // Current selected language
    const [selectedLanguage, setSelectedLanguage] = useState<string>("uk");

    // Get current time in format HH.MM
    const getCurrentTime = () => {
        const now = new globalThis.Date();
        return `${String(now.getHours()).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')}`;
    };

    // Save chat data when state changes
    useEffect(() => {
        (global as any).chatState.chatHistory = messages;
    }, [messages]);

    // Save session data when state changes
    useEffect(() => {
        if (sessionData.sessionId) {
            (global as any).chatState.sessionData = sessionData;
            (global as any).chatState.hasActiveSession = true;
        }
    }, [sessionData]);

    // Setup audio recording permissions
    useEffect(() => {
        const setupAudio = async () => {
            // Get audio recording permission
            const permission = await Audio.requestPermissionsAsync();
            if (!permission.granted) {
                console.error("Permission to access audio was denied");
            }

            // Setup audio mode
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                shouldDuckAndroid: true,
                playThroughEarpieceAndroid: false,
            });
        };

        setupAudio();
    }, []);

    // Get session token
    const getSessionToken = async () => {
        try {
            console.log("Requesting session token...");
            const response = await fetch(
                `${API_CONFIG.serverUrl}/v1/streaming.create_token`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "X-Api-Key": API_CONFIG.apiKey,
                    },
                }
            );

            // Check response
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Token request error (${response.status}):`, errorText);
                throw new Error(`Token request returned status ${response.status}`);
            }

            // Parse response
            const responseText = await response.text();
            const data = JSON.parse(responseText);
            console.log("Session token obtained", data.data.token.substring(0, 10) + "...");
            return data.data.token;
        } catch (error) {
            console.error("Error getting session token:", error);
            throw error;
        }
    };

    // Create a new session
    const createSession = async (sessionToken: string, avatarId: string) => {
        try {
            console.log("Creating session with avatar ID:", avatarId);
            const response = await fetch(`${API_CONFIG.serverUrl}/v1/streaming.new`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": `Bearer ${sessionToken}`,
                },
                body: JSON.stringify({
                    quality: "low",
                    avatar_name: avatarId,
                    voice: {
                        voice_id: "",
                        language: "uk", // Ukrainian language
                    },
                    language: "uk", // Ukrainian language
                    version: "v2",
                    video_encoding: "H264",
                }),
            });

            // Check response
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Session creation error (${response.status}):`, errorText);
                throw new Error(`Session creation returned status ${response.status}`);
            }

            // Parse response
            const responseText = await response.text();
            console.log("Raw session creation response:", responseText.substring(0, 100) + "...");
            const data = JSON.parse(responseText);
            console.log("Session created:", data.data);
            return data.data;
        } catch (error) {
            console.error("Error creating session:", error);
            return null;
        }
    };

    // Start streaming session
    const startStreamingSession = async (sessionId: string, sessionToken: string) => {
        try {
            console.log("Starting streaming with session ID:", sessionId);
            const startResponse = await fetch(
                `${API_CONFIG.serverUrl}/v1/streaming.start`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "Authorization": `Bearer ${sessionToken}`,
                    },
                    body: JSON.stringify({
                        session_id: sessionId,
                    }),
                }
            );

            // Check response
            if (!startResponse.ok) {
                const errorText = await startResponse.text();
                console.error(`Streaming start error (${startResponse.status}):`, errorText);
                throw new Error(`Streaming start returned status ${startResponse.status}`);
            }

            // Parse response
            const responseText = await startResponse.text();
            const startData = JSON.parse(responseText);
            console.log("Streaming start response:", startData);

            // Check for success code instead of data
            if (startData && startData.code === 100) {
                console.log("Streaming started successfully with code 100");
                return true;
            }

            console.error("Unexpected response from streaming.start:", startData);
            return false;
        } catch (error) {
            console.error("Error starting streaming session:", error);
            return false;
        }
    };

    // Close session
    const closeSession = async () => {
        try {
            if (!sessionData.sessionId || !sessionData.sessionToken) {
                console.log("No active session to close");
                return;
            }

            console.log("Closing session:", sessionData.sessionId);
            await fetch(
                `${API_CONFIG.serverUrl}/v1/streaming.stop`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "Authorization": `Bearer ${sessionData.sessionToken}`,
                    },
                    body: JSON.stringify({
                        session_id: sessionData.sessionId,
                    }),
                }
            );

            console.log("Session closed successfully");

            // Clear global state after closing session
            (global as any).chatState.sessionData = null;
            (global as any).chatState.hasActiveSession = false;
        } catch (error) {
            console.error("Error closing session:", error);
        }
    };

    // Send message to API
    const sendMessageToAPI = async (text: string) => {
        try {
            console.log("Sending message to API:", text);
            console.log("Using session ID:", sessionData.sessionId);
            console.log("Using session token:", sessionData.sessionToken.substring(0, 10) + "...");

            // Check if we have valid session data
            if (!sessionData.sessionId || !sessionData.sessionToken) {
                console.error("Missing session data for API request");
                return null;
            }

            const response = await fetch(
                `${API_CONFIG.serverUrl}/v1/streaming.task`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "Authorization": `Bearer ${sessionData.sessionToken}`,
                    },
                    body: JSON.stringify({
                        session_id: sessionData.sessionId,
                        text: text,
                        task_type: "talk",
                    }),
                }
            );

            // Log response status
            console.log("API response status:", response.status);

            // Check if response is ok before trying to parse JSON
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`API error (${response.status}):`, errorText);
                throw new Error(`API returned status ${response.status}`);
            }

            // Try to safely parse JSON
            let data;
            try {
                const responseText = await response.text();
                console.log("Raw response:", responseText.substring(0, 100) + "...");
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error("JSON parse error:", parseError);
                throw new Error("Failed to parse API response");
            }

            console.log("Parsed API response:", data);
            return data;
        } catch (error) {
            console.error("Error sending message to API:", error);
            return null;
        }
    };

    // Initialize API connection on component mount
    useEffect(() => {
        const initializeSession = async () => {
            // Check if we already have an active session
            if ((global as any).chatState.hasActiveSession && (global as any).chatState.sessionData) {
                console.log("Using existing session:", (global as any).chatState.sessionData.sessionId);
                setSessionData((global as any).chatState.sessionData);
                console.log("Session restored from global state");
                return;
            }

            try {
                console.log(`Initializing session with avatar: ${selectedAvatar.name}, ID: ${selectedAvatar.avatar_id}`);

                // Step 1: Get session token
                console.log("Getting session token...");
                const sessionToken = await getSessionToken();
                console.log("Session token obtained:", sessionToken.substring(0, 10) + "...");

                // Step 2: Create new session
                console.log("Creating new session...");
                const session = await createSession(sessionToken, selectedAvatar.avatar_id);

                if (session) {
                    console.log("Session created successfully:", session);

                    // Step 3: Start streaming session
                    console.log("Starting streaming session...");
                    const startResult = await startStreamingSession(session.session_id, sessionToken);

                    if (startResult) {
                        console.log("Session fully initialized!");

                        // Save session data
                        const newSessionData = {
                            sessionId: session.session_id,
                            sessionToken: sessionToken,
                            wsUrl: session.url,
                            token: session.access_token
                        };

                        setSessionData(newSessionData);
                        (global as any).chatState.sessionData = newSessionData;
                        (global as any).chatState.hasActiveSession = true;

                        // Add an initial delay before sending messages to ensure session is ready
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        console.log("Ready to accept messages");
                    } else {
                        console.error("Failed to start streaming session");
                    }
                } else {
                    console.error("Failed to create session");
                }
            } catch (error) {
                console.error("Error initializing session:", error);
            }
        };

        initializeSession();

        // Cleanup on component unmount
        return () => {
            // Don't close session when exiting component to preserve it for future visits
            // closeSession();
        };
    }, []);

    // Voice recording functions
    const startRecording = async () => {
        try {
            setIsRecording(true);

            // Setup for recording
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

            console.log("Starting voice recording...");
            const { recording: newRecording } = await Audio.Recording.createAsync(options);
            recording.current = newRecording;

        } catch (error) {
            console.error("Error starting recording:", error);
            setIsRecording(false);
        }
    };

    const stopRecording = async () => {
        if (!recording.current) {
            setIsRecording(false);
            return;
        }

        try {
            console.log("Stopping recording...");
            await recording.current.stopAndUnloadAsync();
            const uri = recording.current.getURI();
            recording.current = null;
            setIsRecording(false);

            if (uri) {
                // Transcribe the recorded audio
                await transcribeAudio(uri);
            }
        } catch (error) {
            console.error("Error stopping recording:", error);
            setIsRecording(false);
        }
    };

    const transcribeAudio = async (audioUri: string) => {
        try {
            setIsTranscribing(true);

            // Get file info
            const fileInfo = await FileSystem.getInfoAsync(audioUri);
            if (!fileInfo.exists || !fileInfo.size || fileInfo.size <= 1000) {
                console.log("Audio file is too small or does not exist");
                setIsTranscribing(false);
                return;
            }

            console.log("Audio file size:", `${(fileInfo.size / 1024).toFixed(2)} KB`);

            // Create FormData for OpenAI API
            const formData = new FormData();
            formData.append('file', {
                uri: audioUri,
                type: 'audio/mp4',
                name: 'recording.m4a',
            } as any);
            formData.append('model', 'whisper-1');
            formData.append('language', selectedLanguage);

            console.log("Sending audio to OpenAI for transcription...");

            // Send to OpenAI API
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
                const transcribedText = data.text.trim();
                console.log("Transcribed text:", transcribedText);

                // Set the transcribed text as input
                setInputText(transcribedText);

                // Automatically send the transcribed text
                if (transcribedText) {
                    await sendMessage(transcribedText);
                }
            }

        } catch (error) {
            console.error("Error transcribing audio:", error);
        } finally {
            setIsTranscribing(false);
        }
    };

    // Handle voice button press
    const handleVoiceButtonPress = async () => {
        if (isRecording) {
            await stopRecording();
        } else {
            await startRecording();
        }
    };

    // Send message function - with handling right in the chat, without redirect
    const sendMessage = useCallback(async (textToSend = inputText) => {
        if (!textToSend.trim() || !sessionData.sessionId) return;

        const timeString = getCurrentTime();

        // Add user message to chat
        const newMessage: MessageType = {
            id: globalThis.Date.now(),
            text: textToSend,
            type: 'text',
            sender: 'user',
            time: timeString
        };

        setMessages(prev => [...prev, newMessage]);

        // Log the request
        console.log("User message:", textToSend);

        // Clear input
        setInputText("");

        // Add processing message with the new text
        setIsProcessing(true);
        const processingMessage: MessageType = {
            id: globalThis.Date.now() + 1,
            text: "Хм... зараз подумаю",
            type: 'text',
            sender: 'assistant',
            time: timeString
        };

        setMessages(prev => [...prev, processingMessage]);

        try {
            // Send request to API
            console.log("Sending API request...");
            const apiResponse = await sendMessageToAPI(textToSend);
            setIsProcessing(false);

            // Get response and update message
            if (apiResponse && apiResponse.data) {
                // If there's a response text, update the message in the chat
                if (apiResponse.data.text) {
                    console.log("Updated response text:", apiResponse.data.text);

                    // Update message in chat
                    setMessages(prev =>
                        prev.map(msg =>
                            msg.id === processingMessage.id
                                ? { ...msg, text: apiResponse.data.text || "Отримано відповідь" }
                                : msg
                        )
                    );
                }
            }
        } catch (error) {
            console.error("Error in message handling:", error);
            setIsProcessing(false);

            // Show error in chat
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === processingMessage.id
                        ? { ...msg, text: "Виникла помилка при обробці запиту" }
                        : msg
                )
            );
        }
    }, [inputText, sessionData, messages]);

    return (
        <>
            <Header/>
            <View className='pt-[74px] pb-[26px] flex-1'>
                <View className='flex mx-auto pb-[40px]'>
                    <View className='flex overflow-hidden rounded-full'>
                        {/* Avatar Display */}
                        <Gradient className='w-[182px] h-[182px]' type='multicolor'/>
                    </View>
                </View>
                <View className='px-4 flex-1 gap-y-[15px]'>
                    <DateComponent/>

                    <View className="flex-1">
                        <ChatComponent messages={messages} />
                    </View>

                    {showKeyboard ? (
                        <View className="pb-6 px-4 flex-row items-center gap-x-4 justify-center">
                            <Input
                                variant='askMe'
                                icon={<Add/>}
                                value={inputText}
                                onChangeText={setInputText}
                                onSubmitEditing={() => sendMessage()}
                            />
                            <Button
                                size='sm'
                                onPress={() => {
                                    setShowKeyboard(false);
                                }}
                            >
                                <WhiteMicro/>
                            </Button>
                        </View>
                    ) : (
                        <View className='flex-row items-center justify-center gap-x-4'>
                            <InputToolbar onKeyboardPress={() => setShowKeyboard(true)} />

                            {/* Voice input button */}
                            <Button
                                size='sm'
                                color={isRecording ? 'primary' : 'secondary'}
                                onPress={handleVoiceButtonPress}
                            >
                                <WhiteMicro/>
                            </Button>
                        </View>
                    )}
                </View>
            </View>

            {/* LiveKit Room for audio playback */}
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
                    video={true} // No video needed
                />
            )}
        </>
    );
};

export default VideoChat;