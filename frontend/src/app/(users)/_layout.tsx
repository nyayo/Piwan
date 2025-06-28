import { Tabs } from "expo-router";

export default function UserLayout() {
    return (
        <Tabs screenOptions={{ headerShown: false}} >
            <Tabs.Screen name="index" />
            <Tabs.Screen name="profile" />
            <Tabs.Screen name="chat" />
            <Tabs.Screen name="schedule" />
        </Tabs>
    );
}
