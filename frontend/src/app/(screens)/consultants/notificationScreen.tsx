import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import COLORS from '../../../constants/theme';
import { router } from 'expo-router';

// Sample notification data
const notificationsData = [
  {
    id: 1,
    category: 'Today, 18 May 25',
    notifications: [
      {
        id: 'n1',
        type: 'message',
        icon: 'mail-outline',
        iconBg: '#E3F2FD',
        iconColor: '#2196F3',
        title: 'Patient Message',
        description: 'Olivia Rose has sent you a...',
        time: '2 hours ago',
        isRead: false
      },
      {
        id: 'n2',
        type: 'report',
        icon: 'document-text-outline',
        iconBg: '#E8F5E8',
        iconColor: '#4CAF50',
        title: 'New Report Uploaded',
        description: 'Report Type: X-Ray (Neck)...',
        time: '4 hours ago',
        isRead: false
      },
      {
        id: 'n3',
        type: 'appointment',
        icon: 'calendar-outline',
        iconBg: '#FFF3E0',
        iconColor: '#FF9800',
        title: 'New Appointment Added',
        description: 'Patient Name: Sarah Hasten...',
        time: '6 hours ago',
        isRead: false
      }
    ]
  },
  {
    id: 2,
    category: 'Yesterday, 17 May 25',
    notifications: [
      {
        id: 'n4',
        type: 'system',
        icon: 'checkmark-circle-outline',
        iconBg: '#E8F5E8',
        iconColor: '#4CAF50',
        title: 'System Update Successful',
        description: 'Your app has been...',
        time: '1 day ago',
        isRead: true
      },
      {
        id: 'n5',
        type: 'followup',
        icon: 'time-outline',
        iconBg: '#E3F2FD',
        iconColor: '#2196F3',
        title: 'Follow-Up Action Request',
        description: 'A follow-up test request has...',
        time: '1 day ago',
        isRead: true
      },
      {
        id: 'n6',
        type: 'payment',
        icon: 'card-outline',
        iconBg: '#E8F5E8',
        iconColor: '#4CAF50',
        title: 'Payment Successful',
        description: '$50 has been credited to...',
        time: '1 day ago',
        isRead: true
      }
    ]
  }
];

const NotificationScreen = () => {
  const [activeTab, setActiveTab] = useState('All');
  const [notifications, setNotifications] = useState(notificationsData);

  const handleNotificationPress = (notificationId, categoryId) => {
    // Mark notification as read
    const updatedNotifications = notifications.map(category => {
      if (category.id === categoryId) {
        return {
          ...category,
          notifications: category.notifications.map(notif => 
            notif.id === notificationId ? { ...notif, isRead: true } : notif
          )
        };
      }
      return category;
    });
    setNotifications(updatedNotifications);
  };

  const getFilteredNotifications = () => {
    if (activeTab === 'Unread') {
      return notifications.map(category => ({
        ...category,
        notifications: category.notifications.filter(notif => !notif.isRead)
      })).filter(category => category.notifications.length > 0);
    }
    return notifications;
  };

  const renderNotificationItem = (notification, categoryId) => (
    <TouchableOpacity
      key={notification.id}
      style={[
        styles.notificationItem,
        !notification.isRead && styles.unreadNotification
      ]}
      onPress={() => handleNotificationPress(notification.id, categoryId)}
    >
      <View style={[styles.iconContainer, { backgroundColor: notification.iconBg }]}>
        <Ionicons 
          name={notification.icon} 
          size={20} 
          color={notification.iconColor} 
        />
      </View>
      
      <View style={styles.notificationContent}>
        <Text style={[
          styles.notificationTitle,
          !notification.isRead && styles.unreadTitle
        ]}>
          {notification.title}
        </Text>
        <Text style={styles.notificationDescription}>
          {notification.description}
        </Text>
        <Text style={styles.notificationTime}>
          {notification.time}
        </Text>
      </View>
      
      {!notification.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Notification</Text>
        
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search-outline" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'All' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('All')}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === 'All' && styles.activeTabButtonText
          ]}>
            All
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'Unread' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('Unread')}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === 'Unread' && styles.activeTabButtonText
          ]}>
            Unread
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {getFilteredNotifications().map((category) => (
          <View key={category.id} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category.category}</Text>
            
            <View style={styles.notificationsContainer}>
              {category.notifications.map((notification) => 
                renderNotificationItem(notification, category.id)
              )}
            </View>
          </View>
        ))}
        
        {getFilteredNotifications().length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-outline" size={64} color={COLORS.lightGrey} />
            <Text style={styles.emptyStateText}>No notifications found</Text>
          </View>
        )}
      </ScrollView>

      <StatusBar style="dark" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  searchButton: {
    padding: 4,
  },
  // Tab Styles
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
  },
  activeTabButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  activeTabButtonText: {
    color: COLORS.white,
  },
  // Content Styles
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 16,
  },
  notificationsContainer: {
    gap: 12,
  },
  // Notification Item Styles
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
    gap: 12,
  },
  unreadNotification: {
    backgroundColor: '#F8F9FA',
    borderColor: COLORS.primary + '20',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: '600',
  },
  notificationDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  notificationTime: {
    fontSize: 11,
    color: COLORS.grey,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginTop: 6,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16,
  },
});

export default NotificationScreen;