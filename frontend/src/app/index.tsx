import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { createTamagui } from 'tamagui'
import { defaultConfig } from '@tamagui/config/v4'
import { Redirect } from 'expo-router';
import { useAuth } from '../context/authContext';

const config = createTamagui(defaultConfig)

export default function App() {
    const {loading, isAuthenticated} = useAuth();
    return (
        <>
                <Redirect href={'/(tabs)'} />
            {/* {
                isAuthenticated ? (
                    <Redirect href={'/(auth)/signup'} />
                ) : (
                )
            } */}
        </>
    );
}


