import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { createTamagui } from 'tamagui'
import { defaultConfig } from '@tamagui/config/v4'
import { Redirect } from 'expo-router';

const config = createTamagui(defaultConfig)

export default function App() {
    return (
        <Redirect href={'/(tabs)'} />
    );
}


