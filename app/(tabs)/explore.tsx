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
    useLocalParticipant,
} from "@livekit/react-native";
import {Track} from "livekit-client";
import {Audio} from "expo-av";
import * as FileSystem from 'expo-file-system';
import CustomSelect from "@/features/chat/CustomSelect";
import {STT_LANGUAGE_LIST, AVATARS} from "@/features/chat/constants";

registerGlobals();

const API_CONFIG = {
    apiKey: "MDZmNjQ2ZTllY2Y0NDVhYmFiOGU3YjU0ZDY2ZDhmODMtMTc0MTAyOTM1OA==",
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
    const [transcribedText, setTranscribedText] = useState("");
    const [recordingStatus, setRecordingStatus] = useState<"idle" | "recording" | "processing">("idle");

    // Референції для запису
    const recording = useRef<Audio.Recording | null>(null);
    const speakingTimer = useRef<NodeJS.Timeout | null>(null); // Таймер для контролю тривалості мовлення
    const cycleTimeout = useRef<NodeJS.Timeout | null>(null); // Таймер для циклічного запису

    // Стани для циклічного запису
    const isRecordingCycle = useRef(false); // Чи активний цикл запису
    const isProcessingRecording = useRef(false); // Чи обробляється запис зараз

    // Стан для відстеження останніх відповідей аватара (для фільтрації ехо)
    const [avatarResponses, setAvatarResponses] = useState<string[]>([]);

    // Тривалість запису (в мілісекундах)
    const RECORDING_DURATION = 5000; // 4 секунди

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
            // Очищаємо все при виході
            console.log("Main component unmounting - cleaning up");
            stopRecordingCycle();

            // Очищаємо таймер мовлення при розмонтуванні
            if (speakingTimer.current) {
                clearTimeout(speakingTimer.current);
                speakingTimer.current = null;
            }

            // Зупиняємо аудіо сесію
            AudioSession.stopAudioSession();
        };
    }, []);

    // Ефект для керування циклом запису
    useEffect(() => {
        if (isVoiceMode && !speaking) {
            // Якщо голосовий режим активний і аватар не говорить, запускаємо цикл запису
            startRecordingCycle();
        } else {
            // Інакше зупиняємо цикл
            stopRecordingCycle();
        }
    }, [isVoiceMode, speaking]);

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

            // Встановлюємо флаг, що аватар говорить
            setSpeaking(true);
            console.log("Avatar started speaking - setting speaking flag to true");

            // Зберігаємо текст, який був надісланий аватару
            // Це допоможе нам пізніше фільтрувати ехо
            setAvatarResponses(prev => {
                const newResponses = [...prev, textToSend.toLowerCase().trim()];
                // Зберігаємо тільки останні 5 відповідей
                return newResponses.slice(-5);
            });

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

            // Очищаємо попередній таймер, якщо він є
            if (speakingTimer.current) {
                clearTimeout(speakingTimer.current);
                speakingTimer.current = null;
            }

            // Отримуємо тривалість відповіді
            const durationMs = data?.data?.duration_ms || 0;
            console.log(`Avatar will speak for ${durationMs} ms`);

            if (durationMs > 0) {
                // Встановлюємо таймер, щоб вимкнути флаг speaking після завершення відповіді
                // Додаємо 500 мс буфер для безпеки
                speakingTimer.current = setTimeout(() => {
                    console.log("Speaking timer completed - avatar should be done speaking");
                    setSpeaking(false);
                }, durationMs + 500);
            } else {
                // Якщо не отримали тривалість, одразу знімаємо флаг
                setSpeaking(false);
            }

            setText(""); // Clear input after sending
            setTranscribedText(""); // Clear transcribed text as well
        } catch (error) {
            console.error("Error sending text:", error);
            // У випадку помилки знімаємо флаг
            setSpeaking(false);
        }
    };

    // Функція для перевірки, чи розпізнаний текст схожий на останні відповіді
    const isLikelyEcho = (text: string): boolean => {
        if (!text || avatarResponses.length === 0) return false;

        const normalizedText = text.toLowerCase().trim();
        console.log("Checking if text is echo:", normalizedText);
        console.log("Avatar responses:", avatarResponses);

        // Перевіряємо, чи текст співпадає з нещодавніми відповідями аватара
        for (const response of avatarResponses) {
            // Точне співпадіння
            if (normalizedText === response) {
                console.log("Echo detected - exact match");
                return true;
            }

            // Часткове співпадіння (якщо розпізнано частину фрази)
            if (response.includes(normalizedText) || normalizedText.includes(response)) {
                // Якщо довжина співпадіння більше 60% від оригіналу
                const similarity = Math.min(
                    normalizedText.length / response.length,
                    response.length / normalizedText.length
                );

                if (similarity > 0.6) {
                    console.log(`Echo detected - partial match with similarity ${similarity.toFixed(2)}`);
                    return true;
                }
            }

            // Перевірка на схожі слова
            const responseWords = response.split(/\s+/);
            const transcriptWords = normalizedText.split(/\s+/);

            // Якщо більше 70% слів співпадають
            const commonWords = responseWords.filter(word =>
                transcriptWords.some(tWord =>
                    tWord === word || (tWord.length > 3 && word.length > 3 && (tWord.includes(word) || word.includes(tWord)))
                )
            );

            if (commonWords.length > 0) {
                const wordSimilarity = commonWords.length / Math.max(responseWords.length, transcriptWords.length);
                if (wordSimilarity > 0.7) {
                    console.log(`Echo detected - word similarity ${wordSimilarity.toFixed(2)}`);
                    return true;
                }
            }
        }

        return false;
    };

    // ===== ЦИКЛІЧНИЙ ЗАПИС =====

    // Функція для запуску циклу запису
    const startRecordingCycle = async () => {
        if (isRecordingCycle.current || speaking) {
            console.log("Cannot start recording cycle: already active or avatar is speaking");
            return;
        }

        isRecordingCycle.current = true;
        console.log("Starting recording cycle");

        // Запускаємо перший запис
        startNextRecording();
    };

    // Функція для зупинки циклу запису
    const stopRecordingCycle = async () => {
        isRecordingCycle.current = false;
        console.log("Stopping recording cycle");

        // Зупиняємо поточний запис, якщо він є
        if (recording.current) {
            try {
                await recording.current.stopAndUnloadAsync();
            } catch (error) {
                console.log("Error stopping recording:", error);
            }
            recording.current = null;
        }

        // Очищаємо таймер циклу
        if (cycleTimeout.current) {
            clearTimeout(cycleTimeout.current);
            cycleTimeout.current = null;
        }

        setRecordingStatus("idle");
    };

    // Функція для запуску нового запису в циклі
    const startNextRecording = async () => {
        // Якщо цикл не активний або аватар говорить, не починаємо новий запис
        if (!isRecordingCycle.current || speaking || isProcessingRecording.current) {
            console.log("Skipping recording start: cycle inactive, avatar speaking, or processing in progress");
            return;
        }

        try {
            // Зупиняємо попередній запис, якщо він є
            if (recording.current) {
                try {
                    await recording.current.stopAndUnloadAsync();
                } catch (error) {
                    console.log("Error stopping previous recording:", error);
                }
                recording.current = null;
            }

            console.log("Starting new recording in cycle");
            setRecordingStatus("recording");

            // Налаштування для запису
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

            // Створюємо новий запис
            const { recording: newRecording } = await Audio.Recording.createAsync(options);
            recording.current = newRecording;

            // Встановлюємо таймер на завершення запису
            cycleTimeout.current = setTimeout(async () => {
                await processRecording();
            }, RECORDING_DURATION);

        } catch (error) {
            console.error("Error starting recording in cycle:", error);
            setRecordingStatus("idle");

            // Якщо сталася помилка, спробуємо перезапустити цикл через деякий час
            setTimeout(() => {
                if (isRecordingCycle.current && !speaking) {
                    startNextRecording();
                }
            }, 1000);
        }
    };

    // Функція для обробки запису в циклі
    const processRecording = async () => {
        // Якщо немає запису або аватар почав говорити, пропускаємо обробку
        if (!recording.current || speaking || !isRecordingCycle.current) {
            console.log("Skipping recording processing: no recording, avatar speaking, or cycle inactive");

            // Якщо цикл все ще активний і аватар не говорить, запускаємо новий запис
            if (isRecordingCycle.current && !speaking) {
                startNextRecording();
            }

            return;
        }

        // Встановлюємо флаг обробки, щоб уникнути паралельних обробок
        isProcessingRecording.current = true;
        setRecordingStatus("processing");

        try {
            console.log("Processing recording in cycle");

            // Зупиняємо поточний запис
            await recording.current.stopAndUnloadAsync();
            const uri = recording.current.getURI();
            recording.current = null;

            // Якщо цикл все ще активний і аватар не говорить, запускаємо новий запис
            // Це забезпечує безперервність запису
            if (isRecordingCycle.current && !speaking) {
                startNextRecording();
            }

            if (!uri) {
                console.log("No URI obtained from recording");
                isProcessingRecording.current = false;
                setRecordingStatus(isRecordingCycle.current && !speaking ? "recording" : "idle");
                return;
            }

            // Отримуємо інформацію про файл
            const fileInfo = await FileSystem.getInfoAsync(uri);

            if (!fileInfo.exists || !fileInfo.size || fileInfo.size <= 1000) {
                console.log("Audio file is too small or does not exist");
                isProcessingRecording.current = false;
                setRecordingStatus(isRecordingCycle.current && !speaking ? "recording" : "idle");
                return;
            }

            console.log("Audio file size:", `${(fileInfo.size / 1024).toFixed(2)} KB`);

            // Відправляємо на транскрипцію
            await transcribeAudioWithOpenAI(uri);

        } catch (error) {
            console.error("Error processing recording in cycle:", error);
        } finally {
            isProcessingRecording.current = false;
            setRecordingStatus(isRecordingCycle.current && !speaking ? "recording" : "idle");
        }
    };

    // Toggle voice mode
    const toggleVoiceMode = () => {
        setIsVoiceMode(!isVoiceMode);
    };

    const closeSession = async () => {
        try {
            setLoading(true);
            if (!sessionId || !sessionToken) {
                console.log("No active session");
                return;
            }

            // Вимикаємо голосовий режим і зупиняємо запис
            setIsVoiceMode(false);
            stopRecordingCycle();

            // Очищаємо таймер мовлення
            if (speakingTimer.current) {
                clearTimeout(speakingTimer.current);
                speakingTimer.current = null;
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
            setTranscribedText("");
            setAvatarResponses([]);  // Очищаємо історію відповідей

            console.log("Session closed successfully");
        } catch (error) {
            console.error("Error closing session:", error);
        } finally {
            setLoading(false);
        }
    };

    const transcribeAudioWithOpenAI = async (audioUri: string) => {
        try {
            // Якщо аватар почав говорити, пропускаємо транскрипцію
            if (speaking) {
                console.log("Avatar is speaking, skipping transcription");
                return;
            }

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

            // Перевіряємо знову, чи аватар не почав говорити під час запиту
            if (speaking) {
                console.log("Avatar started speaking during transcription, skipping");
                return;
            }

            if (data?.text) {
                const recognizedText = data.text.trim();

                // Якщо текст порожній, пропускаємо
                if (!recognizedText) {
                    console.log("Empty transcription result");
                    return;
                }

                // Перевіряємо, чи це не ехо від аватара
                if (isLikelyEcho(recognizedText)) {
                    console.log("Detected echo, ignoring: ", recognizedText);
                    return; // Не обробляємо ехо
                }

                setTranscribedText(recognizedText);

                // Відправляємо текст аватару
                await sendText(recognizedText);
            } else {
                console.log("Invalid transcription result format");
            }
        } catch (error) {
            console.error("Error transcribing audio with OpenAI:", error);
        }
    };

    // Функція для ініціалізації LiveKit Room
    const handleRoomInit = () => {
        console.log("LiveKit Room initialized");
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
                publishDefaults: {
                    dtx: true,
                    red: true,
                },
            }}
            // Вмикаємо мікрофон лише коли ми в голосовому режимі і аватар не говорить
            audio={isVoiceMode && !speaking}
            video={false}
            onConnected={handleRoomInit}
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
    recordingStatus: "idle" | "recording" | "processing";
    transcribedText: string;
}) => {
    const tracks = useTracks([Track.Source.Camera], {onlySubscribed: true});
    const { localParticipant } = useLocalParticipant();

    // Відображаємо стан мікрофона для налагодження
    const microphoneEnabled = localParticipant?.isMicrophoneEnabled;

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

                {/* Додаємо індикатор стану мікрофона для налагодження */}
                <View style={styles.micStatusContainer}>
                    <Text style={styles.micStatusText}>
                        Mic: {microphoneEnabled ? "ON" : "OFF"}
                    </Text>
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
                        <View style={styles.voiceIndicator}>
                            <View style={[
                                styles.recordingIndicator,
                                isVoiceMode && !speaking && recordingStatus === "recording" && styles.activeRecordingIndicator,
                                isVoiceMode && !speaking && recordingStatus === "processing" && styles.processingRecordingIndicator,
                                isVoiceMode && speaking && styles.pausedRecordingIndicator
                            ]} />
                            <Text style={styles.voiceStatusText}>
                                {recordingStatus === "processing"
                                    ? "Розпізнавання голосу..."
                                    : speaking
                                        ? "Аватар говорить - мікрофон вимкнено"
                                        : recordingStatus === "recording"
                                            ? "Запис голосу..."
                                            : "Голосовий режим активний"}
                            </Text>
                        </View>
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
        backgroundColor: "#1a73e8",
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 25,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    startButtonText: {
        color: "black",
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
    // Стилі для індикатора
    voiceIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(240, 240, 240, 0.8)',
        padding: 15,
        borderRadius: 30,
        justifyContent: 'center',
    },
    recordingIndicator: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#cccccc',
        marginRight: 10,
    },
    activeRecordingIndicator: {
        backgroundColor: '#ff4444',  // Червоний для активного запису
    },
    processingRecordingIndicator: {
        backgroundColor: '#3366ff', // Синій для обробки
    },
    pausedRecordingIndicator: {
        backgroundColor: '#ffaa00',  // Жовтий для паузи
    },
    voiceStatusText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    // Контейнер для індикатора стану мікрофона (для налагодження)
    micStatusContainer: {
        position: 'absolute',
        top: 10,
        alignSelf: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        zIndex: 15,
    },
    micStatusText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
});