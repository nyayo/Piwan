import { Stack } from "expo-router";
import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { useColorScheme } from "react-native";
import tamaguiConfig from "../../tamagui.config"
import { TamaguiProvider } from "tamagui";
import { AuthProvider } from "../context/authContext";
import { UserProvider } from "../context/userContext";
import { ConsultantProvider } from "../context/consultantContext";

export default function RootLayout() {
    return <RootLayoutNav />;
}

function RootLayoutNav() {
    const colorScheme = useColorScheme();

    return (
        <TamaguiProvider config={tamaguiConfig} defaultTheme={colorScheme!}>
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
            <AuthProvider>
                <UserProvider>
                    <ConsultantProvider>
                        <Stack screenOptions={{ headerShown: false}} />
                    </ConsultantProvider>
                </UserProvider>
            </AuthProvider>
        </ThemeProvider>
        </TamaguiProvider>
    );
}