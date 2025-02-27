import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    StyleSheet,
    Platform
} from 'react-native';
import { Video } from 'expo-av';
import { Audio } from 'expo-av';
import StreamingAvatarAPI, {
    StreamingEvents,
    TaskType,
    TaskMode,
    VoiceEmotion,
    AvatarQuality
} from "@heygen/streaming-avatar";
import {
    STT_LANGUAGE_LIST,
    AVATARS,
    StreamType,
    ConversationEntry,
    ChatMode
} from './constants';
import CustomSelect from './CustomSelect';
import LogEntry from './LogEntry';
import { useLogger } from './useLogger';

function HeyGenAvatar() {

    const [knowledgeId, setKnowledgeId] = useState("");
    const [knowledgeBase, setKnowledgeBase] = useState("");
    const [isLoadingSession, setIsLoadingSession] = useState(false);
    const [stream, setStream] = useState<StreamType>(null);
    const [text, setText] = useState("");
    const [avatarId, setAvatarId] = useState("");
    const [language, setLanguage] = useState('en');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isUserTalking, setIsUserTalking] = useState(false);
    const [mode, setMode] = useState<ChatMode>("text");
    const [permissionError, setPermissionError] = useState<string | null>(null);

    const avatar = useRef<any>(null);
    const [conversation, setConversation] = useState<ConversationEntry[]>([]);
    const { logs, addLog } = useLogger();
    const stopTalkingListener = useRef<((event: any) => void) | null>(null);
    const recognizedText = useRef("");
    const videoRef = useRef<Video>(null);


    const handleChangeChatMode = async (newMode: ChatMode) => {
        if (newMode === mode || !avatar.current) return;

        if (newMode === "text") {
            if (mode === "voice") {
                await avatar.current.closeVoiceChat();
            }
            setMode(newMode);
            addLog(`Перемкнуто в режим ${newMode}`);
        } else if (newMode === "voice") {
            try {
                const { granted } = await Audio.requestPermissionsAsync();
                if (!granted) {
                    throw new Error("Доступ до мікрофона не надано");
                }

                await avatar.current.startVoiceChat({
                    useSilencePrompt: false,
                    mediaConstraints: {
                        audio: {
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: true
                        }
                    }
                });
                setMode(newMode);
                addLog(`Перемкнуто в режим ${newMode}`);
            } catch (mediaError: any) {
                addLog(`Помилка доступу до мікрофона: ${mediaError.message}`);
                setPermissionError(mediaError.message);
            }
        }
    };

    const fetchAccessToken = async (): Promise<string> => {
        try {
            const response = await fetch("/api/get-access-token", {
                method: "POST",
            });
            const token = await response.text();
            addLog("Токен доступу отримано успішно");
            return token;
        } catch (error: any) {
            addLog(`Помилка отримання токену: ${error.message}`);
            return "";
        }
    };

    const sendMessage = async (message: string) => {
        if (!avatar.current || !message.trim() || isProcessing) return;

        setIsProcessing(true);
        addLog(`Відправлення повідомлення: "${message}"`);

        setConversation(prev => [...prev, { role: 'user', content: message }]);

        const avatarResponsePromise = new Promise<string>((resolve) => {
            stopTalkingListener.current = (event: any) => {
                resolve(event.text || message);
            };
        });

        await avatar.current.speak({
            text: message,
            taskType: TaskType.TALK,
            taskMode: TaskMode.SYNC
        });

        const avatarResponse = await avatarResponsePromise;

        setConversation(prev => [...prev, { role: 'assistant', content: avatarResponse }]);

        setIsProcessing(false);
    };

    const startSession = async () => {
        setIsLoadingSession(true);

        if (mode === "voice") {
            try {
                const { granted } = await Audio.requestPermissionsAsync();
                if (!granted) {
                    throw new Error("Доступ до мікрофона не надано");
                }
                setPermissionError(null);
                addLog("Отримано дозвіл на використання мікрофона");
            } catch (mediaError: any) {
                setPermissionError(mediaError.message);
                addLog(`Помилка доступу до мікрофона: ${mediaError.message}`);

                setMode("text");
                addLog("Перемикання в текстовий режим через відсутність доступу до мікрофона");
            }
        }

        const token = await fetchAccessToken();
        if (!token) {
            setIsLoadingSession(false);
            return;
        }

        avatar.current = new StreamingAvatarAPI({
            token: token,
        });

        avatar.current.on(StreamingEvents.STREAM_READY, (event: any) => {
            setStream(event.detail);
            addLog("Потік готовий");
        });

        avatar.current.on(StreamingEvents.AVATAR_START_TALKING, () => {
            addLog("Аватар почав говорити");
            setIsProcessing(true);
        });

        avatar.current.on(StreamingEvents.AVATAR_STOP_TALKING, (event: any) => {
            addLog(`Аватар закінчив говорити: ${event.text}`);
            setIsProcessing(false);

            if (stopTalkingListener.current) {
                stopTalkingListener.current(event);
                stopTalkingListener.current = null;
            }
        });

        avatar.current.on(StreamingEvents.USER_START, () => {
            addLog("Користувач почав говорити");
            setIsUserTalking(true);
            recognizedText.current = "";
        });

        avatar.current.on(StreamingEvents.USER_STOP, () => {
            addLog("Користувач закінчив говорити");
            setIsUserTalking(false);

            if (recognizedText.current.trim()) {
                addLog(`Обробка розпізнаного тексту: ${recognizedText.current}`);
                sendMessage(recognizedText.current);
                recognizedText.current = "";
            }
        });

        avatar.current.on(StreamingEvents.USER_TALKING_MESSAGE, (message: string) => {
            addLog(`Розпізнане повідомлення користувача: ${message}`);

            recognizedText.current = message;
        });

        avatar.current.on(StreamingEvents.USER_END_MESSAGE, (message: string) => {
            addLog(`Користувач закінчив говорити: ${message}`);
        });

        avatar.current.on(StreamingEvents.ERROR, (error: any) => {
            addLog(`Помилка API: ${error}`);
        });

        addLog(`Створення аватара з ID: ${avatarId}`);

        await avatar.current.createStartAvatar({
            quality: AvatarQuality.Low,
            avatarName: avatarId,
            voice: {
                rate: 1.2,
                emotion: VoiceEmotion.BROADCASTER,
            },
            language: language,
            enableChat: true,
            disableIdleTimeout: true,
            knowledgeId: knowledgeId || undefined,
            knowledgeBase: knowledgeBase || undefined,
            useV2VoiceChat: true,
        });

        addLog("Аватар успішно створений");

        if (mode === "voice") {
            try {
                addLog("Запуск голосового чату...");
                await avatar.current.startVoiceChat({
                    useSilencePrompt: false,
                    mediaConstraints: {
                        audio: {
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: true
                        }
                    }
                });
                addLog("Голосовий чат запущено");
            } catch (voiceChatError: any) {
                addLog(`Помилка запуску голосового чату: ${voiceChatError.message}`);
                setMode("text");
                addLog("Автоматичне перемикання в текстовий режим через помилку голосового чату");
            }
        } else {
            addLog("Запуск у текстовому режимі");
        }

        setIsLoadingSession(false);
    };

    const endSession = async () => {
        stopTalkingListener.current = null;
        recognizedText.current = "";

        if (avatar.current) {
            await avatar.current.stopAvatar();
            avatar.current = null;
            setStream(null);
            setConversation([]);
            setIsUserTalking(false);
            addLog("Сесію завершено");
        }
    };

    const handleSpeak = async () => {
        if (!text.trim()) return;
        const message = text.trim();
        setText('');
        await sendMessage(message);
    };

    useEffect(() => {
        if (!stream || !videoRef.current) return;

        if (videoRef.current) {
            videoRef.current.setNativeProps({
                source: { uri: URL.createObjectURL(stream) }
            });
        }
    }, [stream]);

    useEffect(() => {
        return () => {
            endSession();
        };
    }, []);

    if (!stream) {
        return (
            <SafeAreaView style={styles.container}>
                <ScrollView style={styles.scrollView}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Налаштування аватара</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Knowledge ID (optional)</Text>
                            <TextInput
                                placeholder="Введіть Knowledge ID з labs.heygen.com"
                                value={knowledgeId}
                                onChangeText={setKnowledgeId}
                                style={styles.textInput}
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>System Prompt (optional)</Text>
                            <TextInput
                                placeholder="Введіть власний системний промпт для аватара"
                                value={knowledgeBase}
                                onChangeText={setKnowledgeBase}
                                style={[styles.textInput, styles.textArea]}
                                multiline
                                numberOfLines={3}
                                placeholderTextColor="#999"
                            />
                        </View>
                    </View>

                    <View style={styles.selectorsContainer}>
                        <View style={styles.selector}>
                            <CustomSelect
                                label="Вибір аватара"
                                value={avatarId}
                                onValueChange={setAvatarId}
                                placeholder="Оберіть віртуального презентера"
                                options={AVATARS}
                            />
                        </View>

                        <View style={styles.selector}>
                            <CustomSelect
                                label="Вибір мови"
                                value={language}
                                onValueChange={setLanguage}
                                placeholder="Українська"
                                options={STT_LANGUAGE_LIST}
                            />
                        </View>
                    </View>

                    <View style={styles.infoSection}>
                        <Text style={styles.infoText}>Оберіть параметри та почніть сесію</Text>
                        <Text style={styles.infoTextSecondary}>щоб розпочати взаємодію</Text>
                    </View>

                    <View style={styles.modeSelector}>
                        <TouchableOpacity
                            style={[styles.modeButton, mode === 'text' ? styles.activeButton : {}]}
                            onPress={() => setMode('text')}
                        >
                            <Text style={[styles.modeButtonText, mode === 'text' ? styles.activeButtonText : {}]}>
                                Текстовий режим
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modeButton, mode === 'voice' ? styles.activeButton : {}]}
                            onPress={() => setMode('voice')}
                        >
                            <Text style={[styles.modeButtonText, mode === 'voice' ? styles.activeButtonText : {}]}>
                                Голосовий режим
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {permissionError && (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorTitle}>Помилка доступу до мікрофона: {permissionError}</Text>
                            <Text style={styles.errorText}>Будь ласка, надайте дозвіл на використання мікрофона в налаштуваннях пристрою.</Text>
                        </View>
                    )}

                    <View style={styles.actionButtonContainer}>
                        <TouchableOpacity
                            onPress={startSession}
                            disabled={!avatarId || isLoadingSession}
                            style={[
                                styles.actionButton,
                                (!avatarId || isLoadingSession) ? styles.actionButtonDisabled : {}
                            ]}
                        >
                            <Text style={styles.actionButtonText}>
                                {isLoadingSession ? "Запуск..." : "Почати сесію"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.videoContainer}>
                <Video
                    ref={videoRef}
                    style={styles.video}
                    resizeMode="contain"
                    shouldPlay
                    isLooping
                />
                <TouchableOpacity
                    onPress={endSession}
                    style={styles.endButton}
                >
                    <Text style={styles.endButtonText}>Завершити сесію</Text>
                </TouchableOpacity>
            </View>

            {permissionError && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorTitle}>Помилка доступу до мікрофона: {permissionError}</Text>
                    <Text style={styles.errorText}>Будь ласка, надайте дозвіл на використання мікрофона в налаштуваннях пристрою.</Text>
                </View>
            )}

            <View style={styles.chatContainer}>
                <View style={styles.modeSelector}>
                    <TouchableOpacity
                        style={[styles.modeButton, mode === 'text' ? styles.activeButton : {}]}
                        onPress={() => handleChangeChatMode('text')}
                    >
                        <Text style={[styles.modeButtonText, mode === 'text' ? styles.activeButtonText : {}]}>
                            Текстовий режим
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.modeButton, mode === 'voice' ? styles.activeButton : {}]}
                        onPress={() => handleChangeChatMode('voice')}
                    >
                        <Text style={[styles.modeButtonText, mode === 'voice' ? styles.activeButtonText : {}]}>
                            Голосовий режим
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                    {mode === 'text' ? (
                        <>
                            <TextInput
                                placeholder="Введіть ваше повідомлення тут..."
                                value={text}
                                onChangeText={setText}
                                onSubmitEditing={handleSpeak}
                                style={styles.messageInput}
                                placeholderTextColor="#999"
                                editable={!isProcessing}
                            />
                            <TouchableOpacity
                                onPress={handleSpeak}
                                disabled={!text.trim() || isProcessing}
                                style={[
                                    styles.sendButton,
                                    (!text.trim() || isProcessing) ? styles.sendButtonDisabled : {}
                                ]}
                            >
                                <Text style={styles.sendButtonText}>↑</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <View style={styles.voiceContainer}>
                            <View style={[
                                styles.voiceIndicator,
                                isUserTalking ? styles.voiceIndicatorActive : {}
                            ]}>
                                <Text style={styles.voiceIndicatorText}>
                                    {isUserTalking ? `Слухаю: ${recognizedText.current}` : 'Голосовий чат активний'}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                <View style={styles.logContainer}>
                    <Text style={styles.logTitle}>Журнал активності</Text>
                    <ScrollView style={styles.logContent}>
                        {logs.map((log, index) => (
                            <LogEntry key={index} {...log} />
                        ))}
                    </ScrollView>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    scrollView: {
        flex: 1,
    },
    section: {
        padding: 20,
        backgroundColor: '#fff',
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333',
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
        color: '#333',
    },
    textInput: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#333',
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    selectorsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    selector: {
        flex: 1,
        marginRight: 8,
    },
    infoSection: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    infoText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 4,
    },
    infoTextSecondary: {
        fontSize: 14,
        color: '#999',
    },
    modeSelector: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginBottom: 16,
    },
    modeButton: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        padding: 12,
        borderRadius: 8,
        marginHorizontal: 4,
        alignItems: 'center',
    },
    activeButton: {
        backgroundColor: '#2563eb',
    },
    modeButtonText: {
        color: '#666',
        fontWeight: '500',
    },
    activeButtonText: {
        color: '#fff',
    },
    errorContainer: {
        margin: 20,
        padding: 12,
        backgroundColor: '#fee2e2',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#ef4444',
    },
    errorTitle: {
        color: '#b91c1c',
        fontWeight: 'bold',
        marginBottom: 4,
    },
    errorText: {
        color: '#b91c1c',
    },
    actionButtonContainer: {
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    },
    actionButton: {
        backgroundColor: '#2563eb',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
    },
    actionButtonDisabled: {
        backgroundColor: '#93c5fd',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    videoContainer: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    video: {
        width: '90%',
        aspectRatio: 16 / 9,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        overflow: 'hidden',
    },
    endButton: {
        position: 'absolute',
        bottom: 20,
        backgroundColor: '#ef4444',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    endButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    chatContainer: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        padding: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    messageInput: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
        padding: 12,
        marginRight: 8,
        color: '#333',
    },
    sendButton: {
        width: 48,
        height: 48,
        backgroundColor: '#2563eb',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#93c5fd',
    },
    sendButtonText: {
        color: '#fff',
        fontSize: 18,
    },
    voiceContainer: {
        flex: 1,
    },
    voiceIndicator: {
        backgroundColor: '#f5f5f5',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#eee',
    },
    voiceIndicatorActive: {
        backgroundColor: '#fee2e2',
        borderColor: '#fca5a5',
    },
    voiceIndicatorText: {
        color: '#333',
    },
    logContainer: {
        marginTop: 8,
    },
    logTitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    logContent: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 8,
        height: 150,
    },
});
export default HeyGenAvatar;