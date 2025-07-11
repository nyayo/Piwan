// app/_layout.tsx
import { Stack } from "expo-router";
import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { AuthProvider } from "../context/authContext";
import { UserProvider } from "../context/userContext";
import { ConsultantProvider } from "../context/consultantContext";
import { ThemeProvider as CustomThemeProvider, useTheme } from '../context/ThemeContext';
import { ChatProvider } from "../context/ChatContext";
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

// Set notification handler globally
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
    }),
});

function RootLayoutNav() {
    const { mode, COLORS } = useTheme();
    
    // Add loading state for theme initialization
    if (!COLORS || !COLORS.grey) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }
    
    // Set navigation theme based on mode
    const navTheme = mode === 'dark' ? DarkTheme : DefaultTheme;
    
    return (
        <ThemeProvider value={navTheme}>
            <AuthProvider>
                <UserProvider>
                    <ConsultantProvider>           
                            <Stack screenOptions={{ headerShown: false }} />
                    </ConsultantProvider>
                </UserProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default function RootLayout() {
    return (
        <CustomThemeProvider>
            <RootLayoutNav />
        </CustomThemeProvider>
    );
}