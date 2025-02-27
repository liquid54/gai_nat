import { useState } from 'react';

export type LogEntry = {
    timestamp: string;
    message: string;
};

export const useLogger = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);

    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { timestamp, message }]);
    };

    return { logs, addLog };
};

export default useLogger;