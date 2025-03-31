import { useEffect, useState } from "react";
import { Redirect, Stack, usePathname } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AppLayout() {
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    useEffect(() => {
        const checkLoginStatus = async () => {
            try {
                //await AsyncStorage.removeItem("isTestLoggedIn");

                const storedLogin = await AsyncStorage.getItem("isTestLoggedIn");
                setIsLoggedIn(storedLogin === "true");
                setIsLoading(false);
                setIsInitialLoad(false);
            } catch (error) {
                console.error("Failed to check login status:", error);
                setIsLoading(false);
                setIsInitialLoad(false);
            }
        };

        checkLoginStatus();
    }, []);


    if (isLoading) return null;

    // On initial app load or when not logged in, redirect to welcome
    if (isInitialLoad || !isLoggedIn) {
        // Only redirect if not already on the welcome page
        if (pathname !== "/welcome") {
            return <Redirect href="/welcome" />;
        }
    }

    return <Stack screenOptions={{ headerShown: false }} />;
}