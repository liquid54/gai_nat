import {View} from "react-native";
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

// API configuration
const API_CONFIG = {
    apiKey: "YTA0OWNjZWVlZjhlNGU4MGFhN2FiMjA5NDM1ZGU0MjktMTc0MTE4MjIwOQ==",
    serverUrl: "https://api.heygen.com",
};

// Ініціалізуємо глобальний стан, якщо він ще не існує
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

    // Session state - використовуємо збережені дані або порожній об'єкт
    const [sessionData, setSessionData] = useState((global as any).chatState.sessionData || {
        sessionId: "",
        sessionToken: "",
        wsUrl: "",
        token: ""
    });

    // Chat state - відновлюємо історію чату, якщо вона існує
    const [showKeyboard, setShowKeyboard] = useState(false);
    const [inputText, setInputText] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [messages, setMessages] = useState<MessageType[]>((global as any).chatState.chatHistory || []);

    // Get current time in format HH.MM
    const getCurrentTime = () => {
        const now = new globalThis.Date();
        return `${String(now.getHours()).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')}`;
    };

    // Зберігаємо дані чату при зміні стану
    useEffect(() => {
        (global as any).chatState.chatHistory = messages;
    }, [messages]);

    // Зберігаємо дані сесії при зміні стану
    useEffect(() => {
        if (sessionData.sessionId) {
            (global as any).chatState.sessionData = sessionData;
            (global as any).chatState.hasActiveSession = true;
        }
    }, [sessionData]);

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

            // Очищаємо глобальний стан після закриття сесії
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
            // Перевіряємо, чи у нас вже є активна сесія
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

        // Cleanup on unmount компонента
        return () => {
            // Не закриваємо сесію при виході з компонента, щоб зберегти її для наступних відвідувань
            // closeSession();
        };
    }, []);

    // Send message function - using direct redirection approach
    const sendMessage = useCallback(async () => {
        if (!inputText.trim() || !sessionData.sessionId) return;

        const timeString = getCurrentTime();

        // Add user message to chat
        const newMessage: MessageType = {
            id: globalThis.Date.now(),
            text: inputText,
            type: 'text',
            sender: 'user',
            time: timeString
        };

        setMessages(prev => [...prev, newMessage]);

        // Log the request
        console.log("User message:", inputText);

        // Clear input
        setInputText("");

        // Add processing message
        setIsProcessing(true);
        const processingMessage: MessageType = {
            id: globalThis.Date.now() + 1,
            text: "Так... Обробка інформації",
            type: 'text',
            sender: 'assistant',
            time: timeString
        };

        setMessages(prev => [...prev, processingMessage]);

        try {
            // Store minimal data needed for audioCall
            (global as any).audioCallData = {
                sessionData: {
                    sessionId: sessionData.sessionId,
                    sessionToken: sessionData.sessionToken,
                    wsUrl: sessionData.wsUrl,
                    token: sessionData.token
                },
                responseText: "Відповідь обробляється...",
                avatarData: selectedAvatar,
                returnToChat: true // Додаємо прапорець для повернення в чат
            };

            // Redirect to audioCall BEFORE sending to API
            // This ensures we get audio on the audioCall page
            console.log("Redirecting to audioCall to prepare for audio playback");
            router.push("/audioCall");

            // API call happens in background and will update audioCall directly
            setTimeout(async () => {
                try {
                    console.log("Sending API request from background...");
                    const apiResponse = await sendMessageToAPI(inputText);

                    // Update global data for audioCall to access
                    if (apiResponse && apiResponse.data) {
                        // Якщо є текст відповіді, оновлюємо його
                        if (apiResponse.data.text) {
                            (global as any).audioCallData.responseText = apiResponse.data.text;
                            console.log("Updated response text for audioCall:", apiResponse.data.text);

                            // Також оновлюємо відповідь в історії чату
                            const updatedMessages = [...(global as any).chatState.chatHistory];
                            const processingIndex = updatedMessages.findIndex(
                                msg => msg.id === processingMessage.id
                            );

                            if (processingIndex !== -1) {
                                updatedMessages[processingIndex] = {
                                    ...updatedMessages[processingIndex],
                                    text: apiResponse.data.text
                                };
                                (global as any).chatState.chatHistory = updatedMessages;
                            }
                        }

                        // Оновлюємо інші дані відповіді
                        (global as any).audioCallData.apiResponse = apiResponse.data;
                    }
                } catch (e) {
                    console.error("Background API request failed:", e);
                }
            }, 500);
        } catch (error) {
            console.error("Error in message handling:", error);
            setIsProcessing(false);
        }
    }, [inputText, sessionData, messages, router]);

    return (
        <>
            <Header/>
            <View className='pt-[74px] pb-[26px] flex-1'>
                <View className='flex mx-auto pb-[40px]'>
                    <View className='flex overflow-hidden rounded-full'>
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
                                onSubmitEditing={sendMessage}
                            />
                            <Button
                                size='sm'
                                onPress={() => setShowKeyboard(false)}
                            >
                                <WhiteMicro/>
                            </Button>
                        </View>
                    ) : (
                        <InputToolbar onKeyboardPress={() => setShowKeyboard(true)} />
                    )}
                </View>
            </View>
        </>
    );
};

export default VideoChat;