// context/ChatContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';
import { Chat, OverlayProvider } from 'stream-chat-react-native-core';
import * as Notifications from 'expo-notifications';
import { generateChatToken, createChatRoom, getUserChatRooms, getStoredUserData } from '../services/api';
import { ActivityIndicator, View, Text } from 'react-native';

const ChatContext = createContext();

export const useChatContext = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChatContext must be used within a ChatProvider');
    }
    return context;
};

export const ChatProvider = ({ children }) => {
    const [client, setClient] = useState(null);
    const [user, setUser] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const initializeChat = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const userData = await getStoredUserData();
            if (!userData) {
                setLoading(false);
                return;
            }

            const tokenData = await generateChatToken();
            const chatClient = StreamChat.getInstance(tokenData.api_key);
            
            const streamUser = {
                id: tokenData.user_id,
                name: userData.username || `${userData.first_name} ${userData.last_name}`,
                image: userData.profile_image,
                role: userData.role
            };

            await chatClient.connectUser(streamUser, tokenData.token);
            
            setClient(chatClient);
            setUser(streamUser);
            setIsConnected(true);
        } catch (error) {
            console.error('Failed to initialize chat:', error);
            setError(error.message || 'Failed to initialize chat');
        } finally {
            setLoading(false);
        }
    };

    const disconnectChat = async () => {
        try {
            if (client) {
                await client.disconnectUser();
                setClient(null);
                setUser(null);
                setIsConnected(false);
            }
        } catch (error) {
            console.error('Failed to disconnect chat:', error);
        }
    };

    const createRoom = async (roomData) => {
        try {
            const response = await createChatRoom(roomData);
            return response;
        } catch (error) {
            console.error('Failed to create room:', error);
            throw error;
        }
    };

    const getUserRooms = async () => {
        try {
            const response = await getUserChatRooms();
            return response.rooms;
        } catch (error) {
            console.error('Failed to get user rooms:', error);
            throw error;
        }
    };

    const reconnectChat = async () => {
        if (!isConnected && user) {
            await initializeChat();
        }
    };

    useEffect(() => {
        initializeChat();
        
        return () => {
            disconnectChat();
        };
    }, []);

    useEffect(() => {
        if (!client) return;

        const handleNewMessage = (event) => {
            const { message, channel } = event;
            if (message.user.id === client.userID) return;
            
            Notifications.scheduleNotificationAsync({
                content: {
                    title: channel.data.name || 'New Message',
                    body: `${message.user.name}: ${message.text}`,
                    data: { 
                        roomId: channel.id, 
                        roomName: channel.data.name 
                    },
                },
                trigger: null,
            });
        };

        const handleConnectionChanged = (event) => {
            console.log('Connection changed:', event);
            setIsConnected(event.online);
        };

        client.on('message.new', handleNewMessage);
        client.on('connection.changed', handleConnectionChanged);

        return () => {
            client.off('message.new', handleNewMessage);
            client.off('connection.changed', handleConnectionChanged);
        };
    }, [client]);

    const value = {
        client,
        user,
        isConnected,
        loading,
        error,
        initializeChat,
        disconnectChat,
        reconnectChat,
        createRoom,
        getUserRooms
    };

    // Show loading state
    if (loading) {
        return (
            <ChatContext.Provider value={value}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" />
                    <Text style={{ marginTop: 10 }}>Connecting to chat...</Text>
                </View>
            </ChatContext.Provider>
        );
    }

    // Show error state
    if (error) {
        return (
            <ChatContext.Provider value={value}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: 'red', textAlign: 'center' }}>
                        Chat Error: {error}
                    </Text>
                </View>
            </ChatContext.Provider>
        );
    }

    // Show not connected state
    // if (!isConnected || !client) {
    //     return (
    //         <ChatContext.Provider value={value}>
    //             <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    //                 <Text>hat not connected</Text>
    //             </View>
    //         </ChatContext.Provider>
    //     );
    // }

    // Only render OverlayProvider when we have a connected client
    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};