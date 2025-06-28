import { Tabs } from "expo-router";
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from "react-native";
import COLORS from "../../constants/theme";

export default function ConsultantLayout() {
    return (
        <Tabs screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarStyle: {
            backgroundColor: COLORS.white,
        },
        headerShown: false,
        }}>
            <Tabs.Screen 
            name="index" 
            options={{ 
                tabBarLabel: ({ focused, color }) => (
                    <Text style={{
                        color: color,
                        fontSize: focused ? 14 : 12,
                        fontWeight: focused ? 'bold' : 'normal',
                        textTransform: 'capitalize',
                    }}>
                        Dashboard
                    </Text>
                    ), 
                tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "grid" : "grid-outline"} size={26} color={color} />}} 
            />
            <Tabs.Screen 
            name="schedule" 
            options={{ 
                tabBarLabel: ({ focused, color }) => (
                    <Text style={{
                        color: color,
                        fontSize: focused ? 14 : 12,
                        fontWeight: focused ? 'bold' : 'normal',
                        textTransform: 'capitalize',
                    }}>
                        Schedule
                    </Text>
                    ),
                tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "calendar" : "calendar-outline"} size={26} color={color} />}} 
            />
            <Tabs.Screen 
            name="chat" 
            options={{ 
                tabBarLabel: ({ focused, color }) => (
                    <Text style={{
                        color: color,
                        fontSize: focused ? 14 : 12,
                        fontWeight: focused ? 'bold' : 'normal',
                        textTransform: 'capitalize',
                    }}>
                        Chat
                    </Text>
                    ), 
                tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "chatbubble" : "chatbubble-outline"} size={26} color={color} />}} 
            />
            <Tabs.Screen 
            name="profile" 
            options={{ 
                tabBarLabel: ({ focused, color }) => (
                    <Text style={{
                        color: color,
                        fontSize: focused ? 14 : 12,
                        fontWeight: focused ? 'bold' : 'normal',
                        textTransform: 'capitalize',
                    }}>
                        Account
                    </Text>
                    ),
                tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "person" : "person-outline"} size={26} color={color} />
            }} 
            /> 
        </Tabs>
    );
    // return (
    //     <Tabs screenOptions={{ headerShown: false }}>
    //         <Tabs.Screen 
    //             name="index" 
    //             options={{
    //                 title: "Dashboard",
    //                 tabBarIcon: ({ color }) => <Ionicons name="grid-outline" size={24} color={color} />
    //             }}
    //         />
    //         <Tabs.Screen 
    //             name="schedule" 
    //             options={{
    //                 title: "Schedule",
    //                 tabBarIcon: ({ color }) => <Ionicons name="calendar" size={24} color={color} />
    //             }}
    //         />
    //         <Tabs.Screen 
    //             name="chat" 
    //             options={{
    //                 title: "Chat",
    //                 tabBarIcon: ({ color }) => <Ionicons name="chatbubble-outline" size={24} color={color} />
    //             }}
    //         />
    //         <Tabs.Screen 
    //             name="profile" 
    //             options={{
    //                 title: "Profile",
    //                 tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />
    //             }}
    //         />
    //     </Tabs>
    // );
}
