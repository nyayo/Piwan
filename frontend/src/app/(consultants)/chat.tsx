import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  TextInput, 
  Image, 
  KeyboardAvoidingView, 
  Platform, 
  Modal, 
  Alert 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/authContext';
import { useChatContext } from '../../context/ChatContext';
import { getUserChatRooms } from '../../services/api';

const { width: screenWidth } = Dimensions.get('window');

interface Room {
  id: string;
  name?: string;
  avatar?: string;
  last_message?: string;
  updated_at: string;
  unread_count: number;
  type?: 'messaging' | 'group';
  isPinned?: boolean;
  isOnline?: boolean;
  hasDelivered?: boolean;
  member_count?: number;
}

interface Contact {
  id: number;
  name: string;
  avatar: string;
}

const recentContacts: Contact[] = [
  { id: 1, name: 'Phillip', avatar: 'https://i.pravatar.cc/150?img=1' },
  { id: 2, name: 'Alfredo', avatar: 'https://i.pravatar.cc/150?img=2' },
  { id: 3, name: 'Jaylon', avatar: 'https://i.pravatar.cc/150?img=3' },
  { id: 4, name: 'Tatiana', avatar: 'https://i.pravatar.cc/150?img=4' },
  { id: 5, name: 'Terry', avatar: 'https://i.pravatar.cc/150?img=5' }
];

const formatTimeAgo = (timestamp: string | Date): string => {
  const now = new Date();
  const messageDate = new Date(timestamp);
  const diffSeconds = Math.floor((now.getTime() - messageDate.getTime()) / 1000);

  if (diffSeconds < 60) return 'Just now';
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds/60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds/3600)}h ago`;
  return `${Math.floor(diffSeconds/86400)}d ago`;
};

const UsersChatScreen = () => {
  const { COLORS, mode } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { client, createRoom, isConnected, loading, error } = useChatContext();

  const [activeTab, setActiveTab] = useState<'message' | 'group' | 'calls'>('message');
  const [searchQuery, setSearchQuery] = useState('');
  const [groupModalVisible, setGroupModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  const tabs = [
    { id: 'message', label: 'Messages', icon: 'chatbubble' as const },
    { id: 'group', label: 'Groups', icon: 'people' as const },
    { id: 'calls', label: 'Calls', icon: 'call' as const }
  ];

  const statusBarStyle = mode === 'dark' || COLORS.background === '#000' ? 'light' : 'dark';

  useEffect(() => {
    loadUserRooms();
    
    // Setup message listener for real-time updates
    const handleMessage = () => {
      loadUserRooms();
    };

    if (client) {
      client.on('message.new', handleMessage);
    }

    return () => {
      if (client) {
        client.off('message.new', handleMessage);
      }
    };
  }, [client]);

  const loadUserRooms = async () => {
    try {
      setLoadingRooms(true);
      const response = await getUserChatRooms();
      if (response.success) {
        setRooms(response.rooms);
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      Alert.alert('Error', 'Group name is required');
      return;
    }
    try {
      const roomId = `group_${Date.now()}`;
      const roomData = {
        roomId,
        name: newGroupName,
        type: 'messaging',
        members: [
          { user_id: user?.id, user_type: user?.role, role: 'owner' }
        ]
      };
      await createRoom(roomData);
      setGroupModalVisible(false);
      setNewGroupName('');
      loadUserRooms();
    } catch (error) {
      Alert.alert('Error', 'Failed to create group');
    }
  };

  const onSelectRoom = (room: Room) => {
    router.push({
      pathname: '/(screens)/ChatRoomScreen',
      params: { 
        roomId: room.id, 
        roomName: room.name || 'Chat'
      }
    });
  };

  const filteredRooms = rooms.filter(room => 
    room.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.last_message?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const directMessages = filteredRooms.filter(room => room.type === 'messaging' || !room.type);
  const groupChats = filteredRooms.filter(room => room.type === 'group');
  const pinnedRooms = filteredRooms.filter(room => room.isPinned);

  const renderTabBar = () => (
    <View style={[styles.tabContainer, { backgroundColor: COLORS.background }]}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tab,
            activeTab === tab.id && [styles.activeTab, { backgroundColor: COLORS.primary }]
          ]}
          onPress={() => setActiveTab(tab.id as 'message' | 'group' | 'calls')}
        >
          <Ionicons 
            name={tab.icon} 
            size={20} 
            color={activeTab === tab.id ? COLORS.white : COLORS.textSecondary} 
          />
          <Text style={[
            styles.tabText,
            { color: activeTab === tab.id ? COLORS.white : COLORS.textSecondary }
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderContactsList = () => (
    <View style={styles.contactsContainer}>
      <Text style={[styles.contactsTitle, { color: COLORS.textDark }]}>Contact List</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.contactsScroll}>
        {recentContacts.map((contact) => (
          <TouchableOpacity key={contact.id} style={styles.contactItem}>
            <View style={styles.contactAvatar}>
              <Image source={{ uri: contact.avatar }} style={styles.contactAvatarImage} />
            </View>
            <Text style={[styles.contactName, { color: COLORS.textDark }]}>{contact.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderChatItem = (room: Room) => (
    <TouchableOpacity 
      style={[styles.chatItem, { backgroundColor: COLORS.background }]}
      onPress={() => onSelectRoom(room)}
    >
      <View style={styles.chatAvatar}>
        <Image 
          source={{ uri: room.avatar || `https://i.pravatar.cc/150?img=${room.id}` }} 
          style={styles.avatarImage} 
        />
        {room.isOnline && <View style={[styles.onlineIndicator, { backgroundColor: COLORS.success }]} />}
      </View>
      
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={[styles.chatName, { color: COLORS.textDark }]}>
            {room.name || 'Unnamed Room'}
          </Text>
          <Text style={[
            styles.chatTime, 
            { 
              color: room.unread_count > 0 ? COLORS.primary : COLORS.textSecondary,
              fontWeight: room.unread_count > 0 ? 'bold' : 'normal'
            }
          ]}>
            {room.updated_at ? formatTimeAgo(room.updated_at) : 'Now'}
          </Text>
        </View>
        <View style={styles.chatFooter}>
          <Text 
            style={[
              styles.lastMessage, 
              { 
                color: COLORS.textSecondary,
                fontWeight: room.unread_count > 0 ? '500' : '400'
              }
            ]} 
            numberOfLines={1}
          >
            {room.last_message || 'No messages yet'}
          </Text>
          {room.unread_count > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: COLORS.error }]}>
              <Text style={styles.unreadText}>{room.unread_count}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderGroupChatItem = (room: Room) => (
    <TouchableOpacity 
      style={[styles.chatItem, { backgroundColor: COLORS.background }]}
      onPress={() => onSelectRoom(room)}
    >
      <View style={styles.chatAvatar}>
        <Image 
          source={{ uri: room.avatar || `https://i.pravatar.cc/150?img=${room.id}` }} 
          style={styles.avatarImage} 
        />
        <View style={[styles.groupIndicator, { backgroundColor: COLORS.primary }]}>
          <Text style={styles.groupMemberCount}>{room.member_count || 0}</Text>
        </View>
      </View>
      
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={[styles.chatName, { color: COLORS.textDark }]}>
            {room.name || 'Unnamed Group'}
          </Text>
          <Text style={[styles.chatTime, { color: COLORS.textSecondary }]}>
            {room.updated_at ? formatTimeAgo(room.updated_at) : 'Now'}
          </Text>
        </View>
        <View style={styles.chatFooter}>
          <Text style={[styles.lastMessage, { color: COLORS.textSecondary }]} numberOfLines={1}>
            {room.last_message || 'No messages yet'}
          </Text>
          <View style={styles.chatIcons}>
            {room.unread_count > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: COLORS.error }]}>
                <Text style={styles.unreadText}>{room.unread_count}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderGroupModal = () => (
    <Modal visible={groupModalVisible} animationType="slide">
      <View style={[styles.modalContainer, { backgroundColor: COLORS.background }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: COLORS.textDark }]}>
            Create Group
          </Text>
          <TouchableOpacity onPress={() => setGroupModalVisible(false)}>
            <Ionicons name="close" size={24} color={COLORS.textDark} />
          </TouchableOpacity>
        </View>
        
        <TextInput
          placeholder="Group Name"
          placeholderTextColor={COLORS.textSecondary}
          value={newGroupName}
          onChangeText={setNewGroupName}
          style={[styles.input, { 
            borderColor: COLORS.border, 
            color: COLORS.textDark 
          }]}
        />
        
        <View style={styles.modalButtons}>
          <TouchableOpacity 
            onPress={handleCreateGroup} 
            style={[styles.createButton, { backgroundColor: COLORS.primary }]}
          >
            <Text style={[styles.buttonText, { color: COLORS.white }]}>
              Create Group
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => setGroupModalVisible(false)} 
            style={[styles.cancelButton, { borderColor: COLORS.border }]}
          >
            <Text style={[styles.buttonText, { color: COLORS.textDark }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'message':
        return (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
            <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
              {renderContactsList()}
              
              <View style={styles.searchContainer}>
                <View style={[styles.searchBar, { backgroundColor: COLORS.cardBackground }]}>
                  <Ionicons name="search" size={20} color={COLORS.textSecondary} />
                  <TextInput
                    style={[styles.searchInput, { color: COLORS.textDark }]}
                    placeholder="Search..."
                    placeholderTextColor={COLORS.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
                <TouchableOpacity style={styles.filterButton}>
                  <Ionicons name="options" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.directMessageContainer}>
                <TouchableOpacity 
                  style={[styles.directMessageButton, { backgroundColor: COLORS.warning }]}
                >
                  <Text style={styles.directMessageText}>Direct Message</Text>
                  <View style={[styles.directMessageBadge, { backgroundColor: COLORS.textDark }]}>
                    <Text style={styles.directMessageBadgeText}>{directMessages.length}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.groupButton, { backgroundColor: COLORS.cardBackground }]}
                  onPress={() => setGroupModalVisible(true)}
                >
                  <Text style={[styles.groupButtonText, { color: COLORS.textDark }]}>Group</Text>
                  <Ionicons name="add" size={16} color={COLORS.textDark} />
                </TouchableOpacity>
              </View>

              {pinnedRooms.length > 0 && (
                <View style={styles.sectionContainer}>
                  <Text style={[styles.sectionTitle, { color: COLORS.textDark }]}>
                    Pinned Message({pinnedRooms.length})
                  </Text>
                  {pinnedRooms.map(room => renderChatItem(room))}
                </View>
              )}

              <View style={styles.sectionContainer}>
                <Text style={[styles.sectionTitle, { color: COLORS.textDark }]}>
                  All Messages({directMessages.length})
                </Text>
                {loadingRooms ? (
                  <Text style={[styles.loadingText, { color: COLORS.textSecondary }]}>
                    Loading chats...
                  </Text>
                ) : directMessages.length > 0 ? (
                  directMessages.map(room => renderChatItem(room))
                ) : (
                  <Text style={[styles.emptyText, { color: COLORS.textSecondary }]}>
                    No messages yet
                  </Text>
                )}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        );

      case 'group':
        return (
          <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.searchContainer}>
              <View style={[styles.searchBar, { backgroundColor: COLORS.cardBackground }]}>
                <Ionicons name="search" size={20} color={COLORS.textSecondary} />
                <TextInput
                  style={[styles.searchInput, { color: COLORS.textDark }]}
                  placeholder="Search groups..."
                  placeholderTextColor={COLORS.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>

            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, { color: COLORS.textDark }]}>
                Group Chats({groupChats.length})
              </Text>
              {loadingRooms ? (
                <Text style={[styles.loadingText, { color: COLORS.textSecondary }]}>
                  Loading groups...
                </Text>
              ) : groupChats.length > 0 ? (
                groupChats.map(room => renderGroupChatItem(room))
              ) : (
                <Text style={[styles.emptyText, { color: COLORS.textSecondary }]}>
                  No groups yet
                </Text>
              )}
            </View>
          </ScrollView>
        );

      case 'calls':
        return (
          <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.searchContainer}>
              <View style={[styles.searchBar, { backgroundColor: COLORS.cardBackground }]}>
                <Ionicons name="search" size={20} color={COLORS.textSecondary} />
                <TextInput
                  style={[styles.searchInput, { color: COLORS.textDark }]}
                  placeholder="Search calls..."
                  placeholderTextColor={COLORS.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>

            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, { color: COLORS.textDark }]}>
                Recent Calls(0)
              </Text>
              <Text style={[styles.emptyText, { color: COLORS.textSecondary }]}>
                No recent calls
              </Text>
            </View>
          </ScrollView>
        );

      default:
        return null;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 15,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: COLORS.textDark,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 15,
    },
    headerButton: {
      padding: 8,
    },
    messageStats: {
      backgroundColor: COLORS.primary,
      borderRadius: 16,
      padding: 20,
      marginBottom: 10,
    },
    statsText: {
      color: COLORS.white,
      fontSize: 14,
      marginBottom: 5,
    },
    statsNumber: {
      color: COLORS.white,
      fontSize: 24,
      fontWeight: 'bold',
    },
    contactsContainer: {
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    contactsTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 15,
    },
    contactsScroll: {
      marginHorizontal: -10,
    },
    contactItem: {
      alignItems: 'center',
      marginHorizontal: 10,
    },
    contactAvatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      marginBottom: 8,
    },
    contactAvatarImage: {
      width: '100%',
      height: '100%',
      borderRadius: 30,
    },
    contactName: {
      fontSize: 12,
      fontWeight: '500',
    },
    tabContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 10,
      gap: 10,
    },
    tab: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 25,
      backgroundColor: COLORS.cardBackground,
      gap: 8,
    },
    activeTab: {
      backgroundColor: COLORS.primary,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '500',
    },
    contentContainer: {
      flex: 1,
    },
    searchContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      marginBottom: 20,
      gap: 10,
    },
    searchBar: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 15,
      paddingVertical: 12,
      borderRadius: 12,
      gap: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
    },
    filterButton: {
      padding: 12,
      borderRadius: 12,
      backgroundColor: COLORS.cardBackground,
    },
    directMessageContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      marginBottom: 20,
      gap: 10,
    },
    directMessageButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 12,
      gap: 8,
    },
    directMessageText: {
      color: COLORS.textDark,
      fontWeight: '600',
    },
    directMessageBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      minWidth: 20,
      alignItems: 'center',
    },
    directMessageBadgeText: {
      color: COLORS.white,
      fontSize: 12,
      fontWeight: '600',
    },
    groupButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
      gap: 5,
    },
    groupButtonText: {
      fontWeight: '600',
    },
    sectionContainer: {
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 15,
    },
    chatItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      gap: 12,
    },
    chatAvatar: {
      position: 'relative',
    },
    avatarImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
    },
    onlineIndicator: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 12,
      height: 12,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: COLORS.background,
    },
    groupIndicator: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: 8,
      minWidth: 16,
      alignItems: 'center',
    },
    groupMemberCount: {
      color: COLORS.white,
      fontSize: 10,
      fontWeight: '600',
    },
    chatContent: {
      flex: 1,
    },
    chatHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    chatName: {
      fontSize: 16,
      fontWeight: '600',
    },
    chatTime: {
      fontSize: 12,
    },
    chatFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    lastMessage: {
      fontSize: 14,
      flex: 1,
      marginRight: 10,
    },
    chatIcons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    unreadBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
      minWidth: 20,
      alignItems: 'center',
    },
    unreadText: {
      color: COLORS.white,
      fontSize: 12,
      fontWeight: '600',
    },
    emptyText: {
      textAlign: 'center',
      fontSize: 14,
      fontStyle: 'italic',
      marginTop: 20,
    },
    fab: {
      position: 'absolute',
      bottom: 30,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: COLORS.primary,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 8,
    },
    modalContainer: {
      flex: 1,
      padding: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    input: {
      borderBottomWidth: 1,
      paddingVertical: 12,
      fontSize: 16,
      marginBottom: 20,
    },
    modalButtons: {
      marginTop: 'auto',
    },
    createButton: {
      padding: 16,
      borderRadius: 8,
      marginBottom: 12,
    },
    cancelButton: {
      padding: 16,
      borderRadius: 8,
      borderWidth: 1,
    },
    buttonText: {
      textAlign: 'center',
      fontSize: 16,
      fontWeight: 'bold',
    },
  });

  // ... (remaining component logic and return statement)

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.headerTitle}>
                        {activeTab === 'message' ? 'Messages' : 
                        activeTab === 'group' ? 'Groups' : 'Calls'}
                    </Text>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.headerButton}>
                            <Ionicons name="notifications-outline" size={24} color={COLORS.textDark} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.headerButton}>
                            <Ionicons name="create-outline" size={24} color={COLORS.textDark} />
                        </TouchableOpacity>
                    </View>
                </View>
                
                {activeTab === 'message' && (
                    <View style={styles.messageStats}>
                        <Text style={styles.statsText}>Hi, {user?.first_name || 'User'}!</Text>
                        <Text style={styles.statsText}>You have</Text>
                        <Text style={styles.statsNumber}>{rooms.length} Chat Rooms</Text>
                    </View>
                )}
            </View>

            {/* Tab Bar */}
            {renderTabBar()}

            {/* Content */}
            {renderContent()}

            {/* Floating Action Button */}
            <TouchableOpacity 
                style={styles.fab}
                onPress={() => setGroupModalVisible(true)}
            >
                <Ionicons name="add" size={24} color={COLORS.white} />
            </TouchableOpacity>

            {/* Group Creation Modal */}
            {renderGroupModal()}

            <StatusBar style={statusBarStyle} />
        </SafeAreaView>
  );
};

export default UsersChatScreen;
