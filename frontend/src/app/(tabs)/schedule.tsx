import React, { useState, useEffect, useCallback } from 'react';
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
  NativeScrollEvent,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { cancelAppointment, getUserAppointments } from '../../services/api';
import CarouselCard from '../../components/CarouselCard';
import PastAppointmentCard from '../../components/PastAppointmentCard';
import FeedbackBanner from '../../components/FeedbackBanner';
import CarouselIndicator from '../../components/CarouselIndicator';
import { useAuth } from '../../context/authContext';
import { cancelExpiredAppointments } from '../../helper/autoCancellationOfExpired';

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

export default function AppointmentsScreen() {
  const {user} = useAuth();
  const navigation = useNavigation();
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Pagination states for past appointments
  const [pastAppointments, setPastAppointments] = useState([]);
  const [pastAppointmentsPage, setPastAppointmentsPage] = useState(1);
  const [pastAppointmentsLoading, setPastAppointmentsLoading] = useState(false);
  const [hasMorePastAppointments, setHasMorePastAppointments] = useState(true);
  const [totalPastAppointments, setTotalPastAppointments] = useState(0);
  
  // Add a flag to prevent duplicate calls
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const userId = user?.id;
  const PAST_APPOINTMENTS_LIMIT = 5;

  // Separate appointments into upcoming only (past will be handled separately)
  const upcomingAppointments = appointments.filter(apt => {
    const appointmentDate = new Date(apt.appointment_date);
    const now = new Date();
    return appointmentDate >= now || apt.status === "pending" || apt.status === "confirmed";
  });

  const fetchPastAppointments = useCallback(async (page = 1, isRefresh = false) => {
    if (!userId) return;
    
    try {
      console.log(`Fetching past appointments - Page: ${page}, Refresh: ${isRefresh}`);
      
      // Don't show loading for page 1 if we're refreshing the whole screen
      if (page === 1 && !isRefresh) {
        setPastAppointmentsLoading(true);
      } else if (page > 1) {
        setPastAppointmentsLoading(true);
      }

      const pastFilters = {
        status: 'cancelled, completed',
        // date_to: new Date().toISOString().split('T')[0], // up to today
        page: page,
        limit: PAST_APPOINTMENTS_LIMIT,
        // Add a flag to get total count only on first page
        include_total: page === 1 ? 'true' : 'false'
      };

      console.log('Fetching past appointments with filters:', pastFilters);

      const pastResult = await getUserAppointments(userId, pastFilters);

      if (pastResult.success) {
        const newPastAppointments = pastResult.appointments || [];
        
        console.log(`Received ${newPastAppointments.length} past appointments for page ${page}`);
        console.log('Total from API:', pastResult.total);
        
        if (page === 1 || isRefresh) {
          // Replace all past appointments
          setPastAppointments(newPastAppointments);
          setPastAppointmentsPage(1);
        } else {
          // Append to existing past appointments
          setPastAppointments(prev => {
            // Prevent duplicates by checking IDs
            const existingIds = new Set(prev.map(apt => apt.id));
            const uniqueNew = newPastAppointments.filter(apt => !existingIds.has(apt.id));
            return [...prev, ...uniqueNew];
          });
          setPastAppointmentsPage(page);
        }

        // Update pagination state
        setHasMorePastAppointments(newPastAppointments.length === PAST_APPOINTMENTS_LIMIT);
        
        // If your API returns total count (only on first page)
        if (pastResult.total !== undefined && page === 1) {
          setTotalPastAppointments(pastResult.total);
          console.log('Setting total past appointments:', pastResult.total);
        }
        
      } else {
        console.error('Failed to fetch past appointments:', pastResult.message);
        if (page === 1) {
          setError(pastResult.message || 'Failed to fetch past appointments');
        }
      }
    } catch (err) {
      console.error('Error fetching past appointments:', err);
      if (page === 1) {
        setError(err.message || 'Failed to fetch past appointments');
      }
    } finally {
      setPastAppointmentsLoading(false);
    }
  }, [userId, PAST_APPOINTMENTS_LIMIT]);

  const fetchAppointments = useCallback(async (showRefreshIndicator = false) => {
    if (!userId) return;
    
    try {
      console.log(`Fetching appointments - Refresh: ${showRefreshIndicator}`);
      
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else if (!initialLoadComplete) {
        setLoading(true);
      }
      setError(null);

      // Fetch upcoming appointments
      const upcomingFilters = {
        status: 'pending,confirmed',
        date_from: new Date().toISOString().split('T')[0] // today onwards
      };
      
      const upcomingResult = await getUserAppointments(userId, upcomingFilters);
      
      if (upcomingResult.success) {
        setAppointments(upcomingResult.appointments || []);
      } else {
        setError(upcomingResult.message || 'Failed to fetch appointments');
      }

      // Reset past appointments pagination when refreshing
      if (showRefreshIndicator) {
        setPastAppointmentsPage(1);
        setPastAppointments([]);
        setHasMorePastAppointments(true);
        setTotalPastAppointments(0);
        // Fetch past appointments immediately when refreshing
        await fetchPastAppointments(1, true);
      } else if (!initialLoadComplete) {
        // Only fetch past appointments on initial load
        await fetchPastAppointments(1, false);
        setInitialLoadComplete(true);
      }

    } catch (err) {
      setError(err.message || 'Failed to fetch appointments');
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, initialLoadComplete, fetchPastAppointments]);

  const loadMorePastAppointments = useCallback(() => {
    if (!pastAppointmentsLoading && hasMorePastAppointments && userId) {
      console.log(`Loading more past appointments - Current page: ${pastAppointmentsPage}`);
      fetchPastAppointments(pastAppointmentsPage + 1);
    }
  }, [pastAppointmentsLoading, hasMorePastAppointments, pastAppointmentsPage, userId, fetchPastAppointments]);

  // Single useEffect for initial data loading
  useEffect(() => {
    if (userId && !initialLoadComplete) {
      console.log('Initial data load for user:', userId);
      cancelExpiredAppointments(userId);
      fetchAppointments(false);
    }
  }, [userId, initialLoadComplete, fetchAppointments]);

  const handleCancelPress = async (appointment, reason) => {
    try {
      Alert.alert(
        "Cancel Appointment",
        `Are you sure you want to cancel your appointment with ${appointment.consultant_name}?\n\nReason: ${reason}`,
        [
          { 
            text: "Keep Appointment", 
            style: "cancel" 
          },
          { 
            text: "Cancel Appointment", 
            style: "destructive",
            onPress: async () => {
              try {
                const cancelData = {
                  status: 'cancelled',
                  cancellation_reason: reason
                }

                const response = await cancelAppointment(appointment, cancelData);

                if (response.success) {
                  Alert.alert(
                    "Success", 
                    "Your appointment has been cancelled successfully.",
                    [{ text: "OK" }]
                  );
                  fetchAppointments();
                  fetchPastAppointments();
                } else {
                  Alert.alert(
                    "Error", 
                    response.data.message || "Failed to cancel appointment. Please try again.",
                    [{ text: "OK" }]
                  );
                }
              } catch (error) {
                console.error('Error cancelling appointment:', error);
                
                let errorMessage = "Failed to cancel appointment. Please try again.";
                
                if (error.response?.status === 400) {
                  errorMessage = error.response.data.message || "Bad request. Please check your input.";
                } else if (error.response?.status === 401) {
                  errorMessage = "You are not authorized to cancel this appointment.";
                } else if (error.response?.status === 404) {
                  errorMessage = "Appointment not found.";
                } else if (error.response?.status >= 500) {
                  errorMessage = "Server error. Please try again later.";
                }
                
                Alert.alert(
                  "Error", 
                  errorMessage,
                  [{ text: "OK" }]
                );
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error in handleCancelPress:', error);
      Alert.alert(
        "Error", 
        "An unexpected error occurred. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const handleChat = (appointment) => {
    console.log('Starting chat with:', appointment.consultant_name);
  };

  const handleScroll = (event) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / (screenWidth - 40));
    setCurrentCarouselIndex(slideIndex);
  };

  const onRefresh = useCallback(() => {
    console.log('Refreshing all data');
    setInitialLoadComplete(false); // Reset to allow fresh load
    fetchAppointments(true);
  }, [fetchAppointments]);

  // Handle floating action button press
  const handleFloatingButtonPress = () => {
    // Add your logic here - could navigate to booking screen, show modal, etc.
    console.log('Floating button pressed');
    // Example: navigation.navigate('BookAppointment');
    Alert.alert(
      "Book Appointment",
      "Navigate to booking screen?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Book Now", onPress: () => console.log('Navigate to booking') }
      ]
    );
  };

  const renderEmptyState = (type) => (
    <View style={styles.emptyState}>
      <Ionicons 
        name={type === 'upcoming' ? 'calendar-outline' : 'time-outline'} 
        size={48} 
        color={COLORS.placeholderText} 
      />
      <Text style={styles.emptyStateText}>
        No {type} appointments found
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity 
        style={styles.retryButton} 
        onPress={() => {
          setInitialLoadComplete(false);
          fetchAppointments();
        }}
      >
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoadMoreButton = () => {
    if (pastAppointmentsLoading) {
      return (
        <View style={styles.loadMoreContainer}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadMoreText}>Loading more...</Text>
        </View>
      );
    }

    if (hasMorePastAppointments) {
      return (
        <TouchableOpacity 
          style={styles.loadMoreButton} 
          onPress={loadMorePastAppointments}
        >
          <Text style={styles.loadMoreButtonText}>Load More</Text>
        </TouchableOpacity>
      );
    }

    if (pastAppointments.length > 0) {
      return (
        <View style={styles.endOfListContainer}>
          <Text style={styles.endOfListText}>No more past appointments</Text>
        </View>
      );
    }

    return null;
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Appointments</Text>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.textDark} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading appointments...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !refreshing && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Appointments</Text>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.textDark} />
          </TouchableOpacity>
        </View>
        {renderError()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Appointments</Text>
        
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Upcoming Appointments Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
          
          {upcomingAppointments.length > 0 ? (
            <>
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
                    onCancelPress={handleCancelPress}
                    onChatPress={handleChat}
                  />
                ))}
              </ScrollView>
              
              <CarouselIndicator 
                total={upcomingAppointments.length} 
                current={currentCarouselIndex} 
              />
            </>
          ) : (
            renderEmptyState('upcoming')
          )}
        </View>

        {/* Past Appointments Section */}
        <View style={styles.pastSection}>
          <View style={styles.pastSectionHeader}>
            <Text style={styles.pastSectionTitle}>Past Appointments</Text>
            {totalPastAppointments > 0 && (
              <Text style={styles.totalCountText}>
                {pastAppointments.length} of {totalPastAppointments}
              </Text>
            )}
          </View>
          
          {pastAppointments.length > 0 ? (
            <>
              {pastAppointments.map((appointment) => (
                <PastAppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                />
              ))}
              
              {renderLoadMoreButton()}
              
              {/* Show feedback banner only when we've loaded some past appointments */}
              {pastAppointments.length > 0 && (
                <FeedbackBanner />
              )}
            </>
          ) : (
            renderEmptyState('past')
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.floatingActionButton}
        onPress={handleFloatingButtonPress}
        activeOpacity={0.8}
      >
        <Ionicons style={{ fontWeight: "100"}} name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>
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
  
  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  
  // Error styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Empty state styles
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.placeholderText,
    textAlign: 'center',
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
  totalCountText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  
  // Load more styles
  loadMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  loadMoreButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 16,
    alignSelf: 'center',
  },
  loadMoreButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  endOfListContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  endOfListText: {
    fontSize: 14,
    color: COLORS.placeholderText,
    fontStyle: 'italic',
  },

  // Floating Action Button styles
  floatingActionButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: 12, // Square with rounded corners
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8, // Android shadow
    shadowColor: COLORS.shadow, // iOS shadow
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  },
});