import React from 'react';
import { Text, View } from 'react-native';
import { LogEntry as LogEntryType } from './useLogger';

const LogEntry: React.FC<LogEntryType> = ({ timestamp, message }) => (
    <View className="py-1">
        <Text className="text-sm text-gray-400">
            [{timestamp}] {message}
        </Text>
    </View>
);

export default LogEntry;