import { Stack } from "expo-router";
import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { useColorScheme } from "react-native";
// import tamaguiConfig from "../../tamagui.config";
// import { TamaguiProvider } from "tamagui";
import { AuthProvider } from "../context/authContext";
import { UserProvider } from "../context/userContext";
import { ConsultantProvider } from "../context/consultantContext";
import { ThemeProvider as CustomThemeProvider, useTheme } from '../context/ThemeContext';
import * as Notifications from 'expo-notifications';

// Set notification handler globally
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
    }),
});

export default function RootLayout() {
    return (
        <CustomThemeProvider>
            <RootLayoutNav />
        </CustomThemeProvider>
    );
}

function RootLayoutNav() {
    // Use theme from context
    const { mode } = useTheme();
    // Set navigation theme based on mode
    const navTheme = mode === 'dark' ? DarkTheme : DefaultTheme;
    return (
        <ThemeProvider value={navTheme}>
            <AuthProvider>
                <UserProvider>
                    <ConsultantProvider>
                        <Stack screenOptions={{ headerShown: false}} />
                    </ConsultantProvider>
                </UserProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}