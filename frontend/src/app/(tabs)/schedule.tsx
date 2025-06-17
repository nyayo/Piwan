import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  Alert,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { upcoming, UpcomingType } from '../../data/upcoming';
import { past } from '../../data/past';
import CarouselCard from '../../components/CarouselCard';
import PastAppointmentCard from '../../components/PastAppointmentCard';
import FeedbackBanner from '../../components/FeedbackBanner';
import CarouselIndicator from '../../components/CarouselIndicator';

const { width: screenWidth } = Dimensions.get('window');

const COLORS = {
  primary: "#1976D2",
  primaryTeal: "#20B2AA",
  textPrimary: "#1a4971",
  textSecondary: "#6d93b8",
  textDark: "#0d2b43",
  placeholderText: "#767676",
  background: "#f8fafc",
  cardBackground: "#ffffff",
  inputBackground: "#f0f8ff",
  border: "#e2e8f0",
  white: "#ffffff",
  black: "#000000",
  grey: "#64748b",
  lightGrey: "#f1f5f9",
  error: "#ef4444",
  success: "#10b981",
  warning: "#f59e0b",
  primaryLight: "#dbeafe",
  selectedTab: "#1976D2",
  inactiveTab: "#94a3b8",
  shadow: "rgba(0, 0, 0, 0.1)"
};

const upcomingAppointments = upcoming;

const pastAppointments = past;

export default function AppointmentsScreen() {
  const navigation = useNavigation();
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);

  const handlePayPress = (appointment: UpcomingType) => {
    Alert.alert(
      "Payment",
      `Proceed to pay ${appointment.price}$ for appointment with ${appointment.doctorName}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Pay Now", onPress: () => console.log("Payment processed") }
      ]
    );
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / (screenWidth - 40));
    setCurrentCarouselIndex(slideIndex);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        {/* <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.textDark} />
        </TouchableOpacity> */}
        
        <Text style={styles.headerTitle}>Appointments</Text>
        
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Upcoming Appointments Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
          
          {/* Carousel */}
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={styles.carouselContainer}
            decelerationRate="fast"
            snapToInterval={screenWidth - 40}
            snapToAlignment="start"
          >
            {upcomingAppointments.map((appointment) => (
              <CarouselCard
                key={appointment.id}
                appointment={appointment}
                onPayPress={handlePayPress}
              />
            ))}
          </ScrollView>
          
          {/* Carousel Indicator */}
          <CarouselIndicator 
            total={upcomingAppointments.length} 
            current={currentCarouselIndex} 
          />
        </View>

        {/* Past Appointments Section */}
        <View style={styles.pastSection}>
          <View style={styles.pastSectionHeader}>
            <Text style={styles.pastSectionTitle}>Past Appointments</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          
          {pastAppointments.map((appointment) => (
            <PastAppointmentCard
              key={appointment.id}
              appointment={appointment}
            />
          ))}
          
          <FeedbackBanner />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 16,
    backgroundColor: COLORS.background,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  moreButton: {
    padding: 8,
    marginRight: -8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  
  // Section styles
  sectionContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  
  // Carousel styles
  carouselContainer: {
    paddingLeft: 20,
  },
  
  
  
  // Past appointments styles
  pastSection: {
    paddingHorizontal: 20,
  },
  pastSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pastSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
});