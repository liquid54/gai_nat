import { Video } from 'expo-av';

export type LanguageOption = {
    label: string;
    value: string;
    key: string;
};

export type AvatarOption = {
    avatar_id: string;
    name: string;
};

export type ConversationEntry = {
    role: 'user' | 'assistant';
    content: string;
};

export type StreamType = MediaStream | null;

export type ChatMode = 'text' | 'voice';

export type AvatarStateTypes = {
    knowledgeId: string;
    knowledgeBase: string;
    isLoadingSession: boolean;
    stream: StreamType;
    text: string;
    avatarId: string;
    language: string;
    isProcessing: boolean;
    isUserTalking: boolean;
    mode: ChatMode;
    permissionError: string | null;
};

export type AvatarRefTypes = {
    avatar: any;
    stopTalkingListener: ((event: any) => void) | null;
    recognizedText: string;
    videoRef: Video | null;
};

export const STT_LANGUAGE_LIST: LanguageOption[] = [
    { label: 'Chinese', value: 'zh', key: 'zh' },
    { label: 'English', value: 'en', key: 'en' },
    { label: 'French', value: 'fr', key: 'fr' },
    { label: 'Ukrainian', value: 'uk', key: 'uk' },
];

export  const AVATARS: AvatarOption[] = [
    {
        avatar_id: "Anna_public_3_20240108",
        name: "Anna in Brown T-shirt",
    },
    {
        avatar_id: "Briana_public_3_20240110",
        name: "Briana in Brown suit",
    },
    {
        avatar_id: "Susan_public_2_20240328",
        name: "Susan in Black Shirt",
    },
    {
        avatar_id: "Eric_public_pro2_20230608",
        name: "Edward in Blue Shirt",
    },
    {
        avatar_id: "Tyler-incasualsuit-20220721",
        name: "Tyler in Casual Suit",
    },
    {
        avatar_id: "Santa_Fireplace_Front_public",
        name: "Santa Fireplace Front",
    },
    {
        avatar_id: "Ann_Doctor_Standing2_public",
        name: "Ann Doctor Standing 2",
    },
    {
        avatar_id: "Ann_Doctor_Sitting_public",
        name: "Ann Doctor Sitting",
    },
    {
        avatar_id: "Ann_Therapist_public",
        name: "Ann Therapist",
    },
    {
        avatar_id: "Shawn_Therapist_public",
        name: "Shawn Therapist",
    },
    {
        avatar_id: "Bryan_FitnessCoach_public",
        name: "Bryan Fitness Coach",
    },
    {
        avatar_id: "Bryan_IT_Sitting_public",
        name: "Bryan IT Sitting",
    },
    {
        avatar_id: "Dexter_Doctor_Standing2_public",
        name: "Dexter Doctor Standing 2",
    },
    {
        avatar_id: "Dexter_Doctor_Sitting2_public",
        name: "Dexter Doctor Sitting 2",
    },
    {
        avatar_id: "Dexter_Lawyer_Sitting_public",
        name: "Dexter Lawyer Sitting",
    },
    {
        avatar_id: "Elenora_IT_Sitting_public",
        name: "Elenora IT Sitting",
    },
    {
        avatar_id: "Elenora_FitnessCoach2_public",
        name: "Elenora Fitness Coach 2",
    },
    {
        avatar_id: "Elenora_FitnessCoach_public",
        name: "Elenora Fitness Coach",
    },
    {
        avatar_id: "Judy_Doctor_Standing2_public",
        name: "Judy Doctor Standing 2",
    },
    {
        avatar_id: "Judy_Doctor_Sitting2_public",
        name: "Judy Doctor Sitting 2",
    },
    {
        avatar_id: "Judy_Lawyer_Sitting2_public",
        name: "Judy Lawyer Sitting 2",
    },
    {
        avatar_id: "Judy_Teacher_Standing_public",
        name: "Judy Teacher Standing",
    },
    {
        avatar_id: "Judy_Teacher_Sitting2_public",
        name: "Judy Teacher Sitting 2",
    },
    {
        avatar_id: "Judy_Teacher_Sitting_public",
        name: "Judy Teacher Sitting",
    },
    {
        avatar_id: "Silas_CustomerSupport_public",
        name: "Silas Customer Support",
    },
    {
        avatar_id: "SilasHR_public",
        name: "Silas HR",
    },
    {
        avatar_id: "Wayne_20240711",
        name: "Wayne",
    },
    {
        avatar_id: "ef08039a41354ed5a20565db899373f3",
        name: "Avatar ef08039",
    },
    {
        avatar_id: "336b72634e644335ad40bd56462fc780",
        name: "Avatar 336b726",
    },
    {
        avatar_id: "37f4d912aa564663a1cf8d63acd0e1ab",
        name: "Avatar 37f4d91",
    },
    {
        avatar_id: "cc2984a6003a4d5194eb58a4ad570337",
        name: "Avatar cc2984a",
    },
    {
        avatar_id: "eb0a8cc8046f476da551a5559fbb5c82",
        name: "Avatar eb0a8cc",
    },
    {
        avatar_id: "fa7b34fe0b294f02b2fca6c1ed2c7158",
        name: "Avatar fa7b34f",
    },
    {
        avatar_id: "3c8a703d9d764938ae522b43401a59c2",
        name: "Avatar 3c8a703",
    },
    {
        avatar_id: "73c84e2b886940099c5793b085150f2f",
        name: "Avatar 73c84e2",
    },
    {
        avatar_id: "c20f4bdddbe041ecba98d93444f8b29b",
        name: "Avatar c20f4bd",
    },
    {
        avatar_id: "43c34c4285cb4b6c81856713c70ba23b",
        name: "Avatar 43c34c4",
    },
    {
        avatar_id: "2c57ba04ef4d4a5ca30a953d0791e7e3",
        name: "Avatar 2c57ba0",
    }
];