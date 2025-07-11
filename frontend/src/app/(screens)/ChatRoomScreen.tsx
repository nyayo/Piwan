import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Channel, MessageList, MessageInput } from 'stream-chat-react-native';
import { useChatContext } from '../../context/ChatContext';
import { useLocalSearchParams } from 'expo-router';

// Changed from arrow function to standard function declaration
export default function ChatRoomScreen() {
  const { roomId, roomName } = useLocalSearchParams();
  const { client } = useChatContext();
  const [channel, setChannel] = useState(null);

  useEffect(() => {
    if (client) {
      const ch = client.channel('messaging', roomId);
      ch.watch()
        .then(() => setChannel(ch))
        .catch(() => Alert.alert('Error', 'Failed to load chat room'));
    }
  }, [client, roomId]);

  if (!channel) return <View style={{ flex: 1, backgroundColor: '#f5f5f5' }} />;

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <Channel channel={channel}>
        <MessageList />
        <MessageInput />
      </Channel>
    </View>
  );
}
