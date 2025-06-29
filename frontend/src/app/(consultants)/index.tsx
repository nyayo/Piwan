import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { router } from 'expo-router';

import COLORS from '../../constants/theme';
import { useAuth } from '../../context/authContext';
import { getConsultantAppointments } from '../../services/api';
import { convertToLocalDate, formatTime } from '../../helper/convertDateTime';
import truncateWords from '../../helper/truncateWords';

const { width: screenWidth } = Dimensions.get('window');

// Static data moved above component for scope
const moodData = [
  { mood: "Excellent", count: 15, color: "#4CAF50", icon: "happy-outline" },
  { mood: "Good", count: 23, color: "#8BC34A", icon: "checkmark-circle-outline" },
  { mood: "Neutral", count: 18, color: "#FFC107", icon: "remove-circle-outline" },
  { mood: "Poor", count: 8, color: "#FF9800", icon: "sad-outline" },
  { mood: "Critical", count: 3, color: "#F44336", icon: "alert-circle-outline" }
];

const resourcesData = {
  podcasts: 24,
  music: 18,
  videos: 12,
  articles: 35,
  exercises: 28
};

const reviewsData = {
  averageRating: 4.8,
  totalReviews: 324,
  ratingDistribution: [
    { stars: 5, count: 280 },
    { stars: 4, count: 32 },
    { stars: 3, count: 8 },
    { stars: 2, count: 3 },
    { stars: 1, count: 1 }
  ]
};

const tabsData = [
  { id: 'overview', title: 'Overview', icon: 'grid-outline' },
  { id: 'mood', title: 'Mood Tracker', icon: 'happy-outline' },
  { id: 'resources', title: 'Resources', icon: 'library-outline' },
  { id: 'reviews', title: 'Reviews', icon: 'star-outline' },
  { id: 'reports', title: 'Reports', icon: 'document-text-outline' }
];

// Add types for user and appointment
interface User {
  id: string | number;
  first_name?: string;
  last_name?: string;
  profile_image?: string;
  [key: string]: any;
}

interface Appointment {
  id: string | number;
  user_name?: string;
  profile_image?: string;
  mood?: number;
  condition?: string;
  date?: string;
  time?: string;
  status?: string;
  [key: string]: any;
}

const ConsultantAdminHome = () => {
  const {user}: {user?: User} = useAuth() as {user?: User};
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const flatListRef = useRef<FlatList<Appointment>>(null);
  const [confirmedAppointments, setConfirmedAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const fetchConfirmedAppointments = async () => {
      if (!user?.id) return;
      try {
        const filters = { status: 'confirmed', limit: 10 };
        const result = await getConsultantAppointments(user.id, filters);
        if (result.success && result.appointments) {
          setConfirmedAppointments(result.appointments);
        } else {
          setConfirmedAppointments([]);
        }
      } catch (e) {
        setConfirmedAppointments([]);
      }
    };
    fetchConfirmedAppointments();
  }, [user?.id]);

  // Auto-scroll carousel
  useEffect(() => {
    if (confirmedAppointments.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        const nextIndex = prev + 1 >= confirmedAppointments.length ? 0 : prev + 1;
        flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        return nextIndex;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [confirmedAppointments]);

  const handleNotificationPress = () => {
    router.push('/(screens)/consultants/notificationScreen')
  }

  const handleChatPress = (appointment: Appointment) => {
    console.log('Starting chat with:', appointment.user_name);
  };

  const renderAppointmentCard = ({ item }: { item: Appointment }) => (
    <View style={styles.appointmentCarouselCard}>
      <View style={styles.cardHeader}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {item.status === 'confirmed' ? 'CONFIRMED' : 'PENDING'}
          </Text>
        </View>
        <View style={styles.moodIndicator}>
          <Ionicons 
            name={((item.mood ?? 0) >= 7 ? "happy" : (item.mood ?? 0) >= 5 ? "happy-outline" : "sad-outline") as any} 
            size={16} 
            color={(item.mood ?? 0) >= 7 ? "#4CAF50" : (item.mood ?? 0) >= 5 ? "#FFC107" : "#F44336"} 
          />
          <Text style={styles.moodText}>{item.mood !== undefined ? item.mood : '-'} /10</Text>
        </View>
      </View>
      
      <View style={styles.patientSection}>
        <Image source={{ uri: item.profile_image }} style={styles.patientAvatar} />
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>{item.user_name}</Text>
          <Text style={styles.conditionText}>{truncateWords({ text: item.description, maxWords: 5 })}</Text>
        </View>
        <TouchableOpacity 
          style={styles.chatButton}
          onPress={() => handleChatPress(item)}
        >
          <Ionicons name="chatbubble-outline" size={16} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.dateTimeContainer}>
        <View style={styles.dateTime}>
          <Ionicons name="calendar-outline" size={20} color={COLORS.textPrimary} />
          <Text style={styles.appointmentDate}>{convertToLocalDate(item.appointment_datetime)}</Text>
        </View>
        <View style={styles.dateTime}>
          <Ionicons name="time-outline" size={20} color={COLORS.textPrimary} />
          <Text style={styles.appointmentTime}>{formatTime(item.appointment_datetime)}</Text>
        </View>
      </View>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'mood':
        return renderMoodTab();
      case 'resources':
        return renderResourcesTab();
      case 'reviews':
        return renderReviewsTab();
      case 'reports':
        return renderReportsTab();
      default:
        return renderOverviewTab();
    }
  };

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={styles.statContent}>
            <View style={styles.statIconContainer}>
              <Ionicons name="calendar-outline" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={styles.statValue}>8</Text>
              <Text style={styles.statTitle}>Today's Schedule</Text>
              <Text style={styles.statChange}>+2 vs. last month</Text>
            </View>
          </View>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statContent}>
            <View style={styles.statIconContainer}>
              <Ionicons name="people-outline" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={styles.statValue}>320</Text>
              <Text style={styles.statTitle}>Total Patients</Text>
              <Text style={styles.statChange}>+12 vs. last month</Text>
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={styles.statContent}>
            <View style={styles.statIconContainer}>
              <Ionicons name="happy-outline" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={styles.statValue}>7.2</Text>
              <Text style={styles.statTitle}>Avg Mood Score</Text>
              <Text style={styles.statChange}>+0.3 vs. last week</Text>
            </View>
          </View>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statContent}>
            <View style={styles.statIconContainer}>
              <Ionicons name="star-outline" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={styles.statValue}>4.8</Text>
              <Text style={styles.statTitle}>Your Rating</Text>
              <Text style={styles.statChange}>324 reviews</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const renderMoodTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Patient Mood Distribution</Text>
      {moodData.map((mood, index) => (
        <View key={index} style={styles.moodItem}>
          <View style={styles.moodLeft}>
            <Ionicons name={mood.icon as any} size={24} color={mood.color} />
            <Text style={styles.moodLabel}>{mood.mood}</Text>
          </View>
          <View style={styles.moodRight}>
            <View style={[styles.moodBar, { backgroundColor: mood.color + '20' }]}>
              <View 
                style={[
                  styles.moodBarFill, 
                  { 
                    backgroundColor: mood.color, 
                    width: `${(mood.count / 67) * 100}%` 
                  }
                ]} 
              />
            </View>
            <Text style={styles.moodCount}>{mood.count}</Text>
          </View>
        </View>
      ))}
      
      <TouchableOpacity style={styles.actionButton}>
        <Ionicons name="analytics-outline" size={20} color={COLORS.white} />
        <Text style={styles.actionButtonText}>View Detailed Analytics</Text>
      </TouchableOpacity>
    </View>
  );

  const renderResourcesTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Your Resources Library</Text>
      
      <View style={styles.resourceGrid}>
        <View style={styles.resourceCard}>
          <Ionicons name="mic-outline" size={32} color="#E91E63" />
          <Text style={styles.resourceCount}>{resourcesData.podcasts}</Text>
          <Text style={styles.resourceLabel}>Podcasts</Text>
        </View>
        <View style={styles.resourceCard}>
          <Ionicons name="musical-notes-outline" size={32} color="#9C27B0" />
          <Text style={styles.resourceCount}>{resourcesData.music}</Text>
          <Text style={styles.resourceLabel}>Music</Text>
        </View>
      </View>
      
      <View style={styles.resourceGrid}>
        <View style={styles.resourceCard}>
          <Ionicons name="play-circle-outline" size={32} color="#2196F3" />
          <Text style={styles.resourceCount}>{resourcesData.videos}</Text>
          <Text style={styles.resourceLabel}>Videos</Text>
        </View>
        <View style={styles.resourceCard}>
          <Ionicons name="document-text-outline" size={32} color="#4CAF50" />
          <Text style={styles.resourceCount}>{resourcesData.articles}</Text>
          <Text style={styles.resourceLabel}>Articles</Text>
        </View>
      </View>
      
      <View style={styles.resourceGrid}>
        <View style={styles.resourceCard}>
          <Ionicons name="fitness-outline" size={32} color="#FF9800" />
          <Text style={styles.resourceCount}>{resourcesData.exercises}</Text>
          <Text style={styles.resourceLabel}>Exercises</Text>
        </View>
        <View style={styles.resourceCard}>
          <Ionicons name="add-circle-outline" size={32} color={COLORS.primary} />
          <Text style={styles.resourceCount}>+</Text>
          <Text style={styles.resourceLabel}>Add New</Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.actionButton}>
        <Ionicons name="cloud-upload-outline" size={20} color={COLORS.white} />
        <Text style={styles.actionButtonText}>Upload New Resource</Text>
      </TouchableOpacity>
    </View>
  );

  const renderReviewsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Patient Reviews & Ratings</Text>
      
      <View style={styles.ratingOverview}>
        <View style={styles.ratingLeft}>
          <Text style={styles.averageRating}>{reviewsData.averageRating}</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons 
                key={star} 
                name="star" 
                size={20} 
                color={star <= Math.floor(reviewsData.averageRating) ? "#FFD700" : "#E0E0E0"} 
              />
            ))}
          </View>
          <Text style={styles.totalReviews}>{reviewsData.totalReviews} reviews</Text>
        </View>
        
        <View style={styles.ratingRight}>
          {reviewsData.ratingDistribution.map((rating, index) => (
            <View key={index} style={styles.ratingRow}>
              <Text style={styles.starLabel}>{rating.stars}★</Text>
              <View style={styles.ratingBarContainer}>
                <View 
                  style={[
                    styles.ratingBarFill, 
                    { width: `${(rating.count / reviewsData.totalReviews) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.ratingCount}>{rating.count}</Text>
            </View>
          ))}
        </View>
      </View>
      
      <TouchableOpacity style={styles.actionButton}>
        <Ionicons name="chatbubbles-outline" size={20} color={COLORS.white} />
        <Text style={styles.actionButtonText}>View All Reviews</Text>
      </TouchableOpacity>
    </View>
  );

  const renderReportsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Generate Reports</Text>
      
      <View style={styles.reportOptions}>
        <TouchableOpacity style={styles.reportCard}>
          <Ionicons name="bar-chart-outline" size={32} color={COLORS.primary} />
          <Text style={styles.reportTitle}>Patient Progress</Text>
          <Text style={styles.reportDescription}>Weekly/Monthly progress reports</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.reportCard}>
          <Ionicons name="pie-chart-outline" size={32} color={COLORS.primary} />
          <Text style={styles.reportTitle}>Mood Analytics</Text>
          <Text style={styles.reportDescription}>Mood trends and patterns</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.reportCard}>
          <Ionicons name="trending-up-outline" size={32} color={COLORS.primary} />
          <Text style={styles.reportTitle}>Performance Report</Text>
          <Text style={styles.reportDescription}>Your consultation metrics</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.reportCard}>
          <Ionicons name="calendar-outline" size={32} color={COLORS.primary} />
          <Text style={styles.reportTitle}>Appointment Summary</Text>
          <Text style={styles.reportDescription}>Schedule and attendance data</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity style={styles.actionButton}>
        <Ionicons name="download-outline" size={20} color={COLORS.white} />
        <Text style={styles.actionButtonText}>Generate Custom Report</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <Image
              style={styles.profileImg}
              source={{ uri: user?.profile_image || undefined, }}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.homeGreeting}>Dr. {user?.first_name} {user?.last_name}</Text>
              <Text style={styles.greeting}>Ready to help clients today?</Text>
            </View>
            <View style={styles.rightIcons}> 
              <TouchableOpacity onPress={handleNotificationPress}>
                <View style={styles.notificationDot} />
                <Ionicons name="notifications-outline" size={24} color={COLORS.textDark} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Upcoming Appointments Carousel */}
          <View style={styles.appointmentsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
              <TouchableOpacity style={styles.seeAllButton}>
                <Text style={styles.seeAllText}>See All</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              ref={flatListRef}
              data={confirmedAppointments}
              renderItem={renderAppointmentCard}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={screenWidth - 32}
              decelerationRate="fast"
              snapToAlignment="center"
              contentContainerStyle={{
                paddingHorizontal: confirmedAppointments.length === 1 ? 0 : 16
              }}
              pagingEnabled={true}
              onMomentumScrollEnd={e => {
                const newIndex = Math.round(e.nativeEvent.contentOffset.x / (screenWidth - 32));
                setCurrentIndex(newIndex);
              }}
            />
            
            {/* Pagination Dots */}
            <View style={styles.paginationContainer}>
              {confirmedAppointments.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    currentIndex === index ? styles.paginationDotActive : styles.paginationDotInactive
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabScrollContainer}
            >
              {tabsData.map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.tabButton,
                    activeTab === tab.id && styles.tabButtonActive
                  ]}
                  onPress={() => setActiveTab(tab.id)}
                >
                  <Ionicons 
                    name={tab.icon as any} 
                    size={20} 
                    color={activeTab === tab.id ? COLORS.white : COLORS.textSecondary} 
                  />
                  <Text style={[
                    styles.tabButtonText,
                    activeTab === tab.id && styles.tabButtonTextActive
                  ]}>
                    {tab.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Tab Content */}
          {renderTabContent()}
        </ScrollView>
        <StatusBar style="dark" />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  // Top Bar Styles
  topBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
    alignItems: 'center',
  },
  profileImg: {
    width: 50,
    height: 50,
    borderRadius: 50,
    borderWidth: 2.5,
    borderColor: COLORS.border,
  },
  profileInfo: {
    justifyContent: 'center',
    flex: 1,
  },
  homeGreeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  greeting: {
    color: COLORS.grey,
    fontSize: 14,
    marginTop: 2,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    justifyContent: 'flex-end',
  },
  notificationDot: {
    borderRadius: 8,
    width: 8,
    height: 8,
    backgroundColor: COLORS.primary,
    position: 'absolute',
    right: 2,
    top: 3,
    zIndex: 1,
  },
  // Appointments Section
  appointmentsSection: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  carouselContainer: {
    paddingHorizontal: 16,
  },
  // Appointment Carousel Card Styles
  appointmentCarouselCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 8,
    marginVertical: 5,
    width: screenWidth - 48,
    borderColor: COLORS.lightGrey,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  statusBadge: {
    backgroundColor: COLORS.infoBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: COLORS.infoText,
    fontSize: 12,
    fontWeight: '600',
  },
  moodIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  moodText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  patientSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    gap: 12,
  },
  patientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  conditionText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 6,
  },
  chatButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: COLORS.textDark,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
    elevation: 2,
  },
  dateTimeContainer: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12
  },
  dateTime: {
    flexDirection: "row",
    gap: 5, 
    alignItems: "center"
  },
  appointmentDate: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  appointmentTime: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  // Pagination Styles
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  paginationDotActive: {
    backgroundColor: COLORS.primary,
  },
  paginationDotInactive: {
    backgroundColor: COLORS.lightGrey,
  },
  // Tab Styles
  tabContainer: {
    paddingHorizontal: 16,
    marginTop: 30,
  },
  tabScrollContainer: {
    paddingRight: 16,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    borderRadius: 25,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabButtonTextActive: {
    color: COLORS.white,
  },
  // Tab Content Styles
  tabContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 30,
  },
  tabTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 20,
  },
  // Stats Styles
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIconContainer: {
    backgroundColor: COLORS.primaryLight,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statTextContainer: {
    flex: 1,
  },
  statTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 2,
  },
  statChange: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  // Mood Tab Styles
  moodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
  },
  moodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  moodLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textDark,
  },
  moodRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 2,
  },
  moodBar: {
    height: 8,
    borderRadius: 4,
    flex: 1,
    overflow: 'hidden',
  },
  moodBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  moodCount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    minWidth: 30,
    textAlign: 'center',
  },
  // Resources Tab Styles
  resourceGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  resourceCard: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
  },
  resourceCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginTop: 8,
    marginBottom: 4,
  },
  resourceLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  // Reviews Tab Styles
  ratingOverview: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
  },
  ratingLeft: {
    flex: 1,
    alignItems: 'center',
    paddingRight: 20,
  },
  averageRating: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 8,
  },
  totalReviews: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  ratingRight: {
    flex: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  starLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    minWidth: 20,
  },
  ratingBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 3,
  },
  ratingCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    minWidth: 30,
    textAlign: 'right',
  },
  // Reports Tab Styles
  reportOptions: {
    gap: 12,
  },
  reportCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
    alignItems: 'center',
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
    marginTop: 12,
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  // Action Button Styles
  actionButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    shadowColor: COLORS.textDark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ConsultantAdminHome;