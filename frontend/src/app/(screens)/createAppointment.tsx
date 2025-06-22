import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import { useConsultant } from '../../context/consultantContext';
import generateTimeSlots from '../../helper/timeSlot';
import { createAppointment, getConsultantAppointments, getDateRange } from '../../services/api';

const COLORS = {
  primary: "#1976D2",
  primaryTeal: "#20B2AA",
  textPrimary: "#1a4971",
  textSecondary: "#6d93b8",
  textDark: "#0d2b43",
  placeholderText: "#767676",
  background: "#e3f2fd",
  cardBackground: "#f5f9ff",
  inputBackground: "#f0f8ff",
  border: "#bbdefb",
  white: "#ffffff",
  black: "#000000",
  grey: "#808080",
  lightGrey: "#f1f1f1",
  error: "#FF4444",
  primaryLight: "#E6F0FA",
  selectedDate: "#1976D2",
  infoBackground: "#E8F5E8",
  infoText: "#2E7D32",
  disabledText: "#CCCCCC",
  pastDateBackground: "#F5F5F5"
};

// Calendar utility functions
const getMonthNames = () => [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year, month) => {
  const firstDay = new Date(year, month, 1).getDay();
  return firstDay === 0 ? 6 : firstDay - 1; // Convert Sunday (0) to be 6, Monday (1) to be 0
};

const isDateInPast = (year, month, day) => {
  const today = new Date();
  const checkDate = new Date(year, month, day);
  today.setHours(0, 0, 0, 0);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate < today;
};

const isToday = (year, month, day) => {
  const today = new Date();
  return today.getFullYear() === year && 
        today.getMonth() === month && 
        today.getDate() === day;
};

const formatDate = (year, month, day) => {
  return `${String(day).padStart(2, '0')}.${String(month + 1).padStart(2, '0')}.${year}`;
};

const generateCalendarDays = (year, month) => {
  const days = [];
  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getFirstDayOfMonth(year, month);

  // Add empty cells for days before month starts
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateStr = date.getDay().toString().padStart(2, '0');
    const fullDate = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    days.push({
      day,
      fullDate,
      date: dateStr,
      isPast: isDateInPast(year, month, day),
      isToday: isToday(year, month, day),
      isAvailable: true, // Default, updated by updateDateAvailability
      bookedSlots: [],  // Default, updated by updateDateAvailability
    });
  }

  return days;
};

const practitioner = {
  name: "Dr. Claire Jenkins",
  specialty: "General practitioners",
  profilePicture: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face",
  price: 80
};

export default function AppointmentScheduleScreen() {
  const { selectedConsultant, appointmentData, updateAppointmentData, clearConsultant } = useConsultant();
  const navigation = useNavigation();
  
  // Initialize with current date
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState("12:30 PM");
  const [reasonForVisit, setReasonForVisit] = useState("I have been experiencing persistent headaches for several days, and they do not improve with over-the-counter pain relievers.");
  
  const monthNames = getMonthNames();
  const calendarDays = generateCalendarDays(currentYear, currentMonth);
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const timeSlots = generateTimeSlots(selectedConsultant.available_from, selectedConsultant.available_to, 90);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(true);
  const [isBookingAppointment, setIsBookingAppointment] = useState(false);
  const [bookedAppointments, setBookedAppointments] = useState([]);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedTimeIndex, setSelectedTimeIndex] = useState(1);
  const [availableDates, setAvailableDates] = useState(calendarDays);

  // Auto-update calendar every minute to handle date changes
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      // Only update if the date has actually changed
      if (now.getDate() !== today.getDate() || 
          now.getMonth() !== today.getMonth() || 
          now.getFullYear() !== today.getFullYear()) {
        // Force re-render by updating state
        setCurrentYear(now.getFullYear());
        setCurrentMonth(now.getMonth());
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Fetch existing appointments for the consultant
  const fetchConsultantAppointments = async () => {
      if (!selectedConsultant?.id) return;
      
      try {
          setIsLoadingAvailability(true);
          
          // Get next 30 days date range
          const dateRange = getDateRange(30);
          
          const response = await getConsultantAppointments(
              selectedConsultant.id,
              {
                  date_from: dateRange.from,
                  date_to: dateRange.to,
                  status: 'confirmed'
              }
          );

          console.log(response)
          
          if (response.success) {
              setBookedAppointments(response.appointments || []);
              updateDateAvailability(response.appointments || []);
          } else {
              console.error('Failed to fetch appointments:', response.message);
              Alert.alert('Error', 'Failed to load appointment availability');
          }
      } catch (error) {
          console.error('Error fetching appointments:', error);
          Alert.alert('Error', 'Failed to load appointment availability');
      } finally {
          setIsLoadingAvailability(false);
      }
  };

  // Helper function to convert 12-hour format to 24-hour format
  const convertTo24Hour = (time12h) => {
      const [time, modifier] = time12h.split(' ');
      let [hours, minutes] = time.split(':');
      
      if (hours === '12') {
          hours = '00';
      }
      
      if (modifier === 'PM') {
          hours = parseInt(hours, 10) + 12;
      }
      
      return `${hours.toString().padStart(2, '0')}:${minutes}`;
  };

  // Updated function to handle timezone and time format issues
  const updateDateAvailability = (appointments) => {
    console.log('Total appointments received:', appointments.length);

    const updatedDates = availableDates.map((dateInfo) => {
      if (!dateInfo) {
        return dateInfo;
      }

      const appointmentsOnDate = appointments.filter((apt) => {
        let appointmentDate;
        if (apt.appointment_date.includes('T')) {
          const utcDate = new Date(apt.appointment_date);
          const year = utcDate.getFullYear();
          const month = (utcDate.getMonth() + 1).toString().padStart(2, '0');
          const day = utcDate.getDate().toString().padStart(2, '0');
          appointmentDate = `${year}-${month}-${day}`;
        } else {
          appointmentDate = apt.appointment_date.split('T')[0];
        }
        return appointmentDate === dateInfo.fullDate;
      });

      console.log(`Date ${dateInfo.fullDate}: ${appointmentsOnDate.length} appointments found`);

      const bookedTimesIn24Hour = appointmentsOnDate
        .map((apt) => {
          if (!apt.appointment_time) return null;
          return apt.appointment_time.substring(0, 5);
        })
        .filter((time) => time !== null);

      console.log(`Booked times (24h format) for ${dateInfo.fullDate}:`, bookedTimesIn24Hour);

      const timeSlotsIn24Hour = timeSlots.map((slot) => convertTo24Hour(slot.time));
      console.log(`Available time slots (24h format):`, timeSlotsIn24Hour);

      const availableSlots = timeSlots.filter((slot, index) => {
        const slot24h = timeSlotsIn24Hour[index];
        const isBooked = bookedTimesIn24Hour.includes(slot24h);
        console.log(`Slot ${slot.time} (${slot24h}) is ${isBooked ? 'BOOKED' : 'AVAILABLE'}`);
        return !isBooked;
      });

      const isDateAvailable = availableSlots.length > 0;

      console.log(
        `Date ${dateInfo.fullDate}: ${availableSlots.length}/${timeSlots.length} slots available, isAvailable: ${isDateAvailable}`
      );

      return {
        ...dateInfo,
        isAvailable: isDateAvailable,
        bookedSlots: bookedTimesIn24Hour,
      };
    });

    setAvailableDates(updatedDates);
  };

  // Get available time slots for selected date
  const getAvailableTimeSlots = () => {
    const selectedDate = availableDates[selectedDateIndex];
    if (!selectedDate) {
      console.log('No selected date, returning default time slots');
      return timeSlots;
    }

    const bookedTimes = bookedAppointments
      .filter((apt) => {
        let appointmentDate;
        if (apt.appointment_date.includes('T')) {
          // Parse as UTC and convert to local date
          const utcDate = new Date(apt.appointment_date);
          const year = utcDate.getFullYear();
          const month = (utcDate.getMonth() + 1).toString().padStart(2, '0');
          const day = utcDate.getDate().toString().padStart(2, '0');
          appointmentDate = `${year}-${month}-${day}`;
        } else {
          appointmentDate = apt.appointment_date.split('T')[0];
        }
        console.log(`Checking appointment date ${appointmentDate} against selected ${selectedDate.fullDate}`);
        return appointmentDate === selectedDate.fullDate;
      })
      .map((apt) => {
        const time = apt.appointment_time ? apt.appointment_time.substring(0, 5) : '';
        console.log(`Processing appointment time: ${apt.appointment_time} -> ${time}`);
        return time;
      })
      .filter((time) => time !== '');

    console.log('Booked times for selected date:', bookedTimes);

    return timeSlots.map((slot, index) => {
      const slot24h = convertTo24Hour(slot.time);
      const isBooked = bookedTimes.includes(slot24h);
      console.log(`Slot ${slot.time} (${slot24h}) isBooked: ${isBooked}`);
      return {
        ...slot,
        isBooked,
      };
    });
  };

  const renderTimeSlot = (timeSlot, index) => {
    const isSelected = timeSlot.time === selectedTime;

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.timeSlot,
          isSelected && !timeSlot.isBooked && styles.selectedTimeSlot,
          timeSlot.isBooked && styles.bookedTimeSlot,
        ]}
        onPress={() => handleTimeSelect(timeSlot.time, index)}
        disabled={timeSlot.isBooked}
      >
        <Text
          style={[
            styles.timeText,
            isSelected && !timeSlot.isBooked && styles.selectedTimeText,
            timeSlot.isBooked && styles.bookedTimeText,
          ]}
        >
          {timeSlot.time}
        </Text>
        {/* {timeSlot.isBooked && (
          <Text style={styles.bookedLabel}>Booked</Text>
        )} */}
      </TouchableOpacity>
    );
  };

  const handleDateSelect = (dayObj, index) => {
    if (dayObj && !dayObj.isPast && dayObj.isAvailable) {
      const dateObj = {
        year: currentYear,
        month: currentMonth,
        day: dayObj.day,
        formatted: formatDate(currentYear, currentMonth, dayObj.day),
      };
      console.log(`Selected date: ${dayObj.fullDate}, Index: ${index}`);
      setSelectedDateIndex(index);
      setSelectedTimeIndex(0);
      setSelectedDate(dateObj);
      updateAppointmentData({
        selectedDate: dateObj,
        selectedFullDate: dayObj.fullDate,
      });
    } else {
      Alert.alert('Unavailable', 'No appointments available on this date');
    }
  };

  const handleTimeSelect = (time, index) => {
    const availableSlots = getAvailableTimeSlots();
    const selectedSlot = availableSlots[index];
    if (selectedSlot.isBooked) {
      Alert.alert('Unavailable', 'This time slot is already booked');
      return;
    }
    setSelectedTime(time);
    setSelectedTimeIndex(index);
    updateAppointmentData({ selectedTime: selectedSlot.time });
  };

  const navigateMonth = (direction) => {
    let newMonth = currentMonth + direction;
    let newYear = currentYear;
    
    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }
    
    // Don't allow navigation to past months
    const today = new Date();
    const targetDate = new Date(newYear, newMonth, 1);
    const currentDate = new Date(today.getFullYear(), today.getMonth(), 1);
    
    if (targetDate >= currentDate) {
      setCurrentMonth(newMonth);
      setCurrentYear(newYear);
      
      // Clear selected date if it's no longer valid in the new month
      if (selectedDate && (selectedDate.month !== newMonth || selectedDate.year !== newYear)) {
        setSelectedDate(null);
        updateAppointmentData({ selectedDate: null });
      }
    }
  };

  const handleBookAppointment = async () => {
      const selectedDate = availableDates[selectedDateIndex];
          const availableSlots = getAvailableTimeSlots();
          const selectedTime = availableSlots[selectedTimeIndex];
          
          if (!selectedDate.isAvailable) {
              Alert.alert('Error', 'Selected date is not available');
              return;
          }
          
          if (selectedTime.isBooked) {
              Alert.alert('Error', 'Selected time slot is already booked');
              return;
          }
    
          if (!selectedConsultant?.id) {
              Alert.alert('Error', 'No consultant selected');
              return;
          }
    
          // Debug logging
          console.log('Booking appointment with:', {
              selectedDate: selectedDate.fullDate,
              selectedTime: selectedTime.time,
              consultant_id: selectedConsultant.id
          });
    
          try {
              setIsBookingAppointment(true);
              
              // Convert 12-hour time to 24-hour format with seconds
              const time24h = convertTo24Hour(selectedTime.time);
              const timeWithSeconds = time24h + ':00';
              
              // Prepare appointment data for API
              const appointmentData = {
                  consultant_id: selectedConsultant.id,
                  title: `Consultation with ${selectedConsultant.first_name} ${selectedConsultant.last_name}`,
                  description: reasonForVisit,
                  appointment_date: selectedDate.fullDate, // YYYY-MM-DD format
                  appointment_time: timeWithSeconds, // HH:MM:SS format
                  duration_minutes: 90
              };
    
              console.log('Sending appointment data:', appointmentData);
    
              // Call the API to create appointment
              const response = await createAppointment(appointmentData);
    
              if (response.success) {
                  // Update appointment data in context for any follow-up screens
                  updateAppointmentData({
                      selectedDate: `${selectedDate.day} ${selectedDate.date}`,
                      selectedFullDate: selectedDate.fullDate,
                      selectedTime: selectedTime.time,
                      consultantId: selectedConsultant.id,
                      appointmentId: response.appointment.id
                  });
    
                  Alert.alert(
                      'Appointment Booked!',
                      `Your appointment with ${selectedConsultant.first_name} ${selectedConsultant.last_name} has been scheduled for ${selectedDate.day} ${selectedDate.date} at ${selectedTime.time}`,
                      [
                          { 
                              text: 'OK', 
                              onPress: () => {
                                  // Refresh appointments to show the new booking
                                  fetchConsultantAppointments();
                                  // Navigate back or to appointments list
                                  router.push("/(tabs)/schedule");                                 
                                  // clearConsultant();
                              }
                          }
                      ]
                  );
              } else {
                  Alert.alert('Booking Failed', response.message || 'Failed to book appointment');
              }
          } catch (error) {
              console.error('Error booking appointment:', error);
              Alert.alert('Error', 'Failed to book appointment. Please try again.');
          } finally {
              setIsBookingAppointment(false);
          }
  };

  const renderCalendarDay = (dayObj, index) => {
    if (!dayObj) {
      return <View key={index} style={styles.calendarDay} />;
    }

    const isSelected = selectedDate && selectedDate.day === dayObj.day;
    const isUnavailable = !dayObj.isAvailable && !dayObj.isPast;

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.calendarDay,
          isSelected && styles.selectedDay,
          dayObj.isToday && !isSelected && styles.todayDay,
          dayObj.isPast && styles.pastDay,
          isUnavailable && styles.unavailableDateCard,
        ]}
        onPress={() => handleDateSelect(dayObj, index)}
        disabled={dayObj.isPast || !dayObj.isAvailable}
      >
        <Text
          style={[
            styles.calendarDayText,
            isSelected && styles.selectedDayText,
            dayObj.isToday && !isSelected && styles.todayDayText,
            dayObj.isPast && styles.pastDayText,
            isUnavailable && styles.unavailableDateText,
          ]}
        >
          {dayObj.day}
        </Text>
        {isUnavailable && (
          <View style={styles.unavailableBadge}>
            <Text style={styles.unavailableBadgeText}>Full</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Check if we can navigate to previous month
  const canNavigatePrevious = () => {
    const today = new Date();
    const prevMonth = currentMonth - 1;
    const prevYear = prevMonth < 0 ? currentYear - 1 : currentYear;
    const targetMonth = prevMonth < 0 ? 11 : prevMonth;
    
    return new Date(prevYear, targetMonth, 1) >= new Date(today.getFullYear(), today.getMonth(), 1);
  };

  // Fetch appointments when component mounts
  useEffect(() => {
      if (!selectedConsultant) {
          console.warn('No consultant selected, using default data');
          setIsLoadingAvailability(false);
          return;
      }
      
      fetchConsultantAppointments();
  }, [selectedConsultant]);

  // Re-fetch when dates change (for real-time updates)
  useEffect(() => {
    const interval = setInterval(() => {
      const newDates = generateCalendarDays(currentYear, currentMonth);
      setAvailableDates(newDates);
      if (selectedConsultant?.id) {
        fetchConsultantAppointments();
      }
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [selectedConsultant, currentYear, currentMonth]);

  const availableSlots = getAvailableTimeSlots();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Custom Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Schedule Your Appointment</Text>
        </View>
      </View>

      <View style={styles.mainContent}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            
            {/* Info Banner */}
            <View style={styles.infoBanner}>
              <Ionicons name="information-circle" size={20} color={COLORS.primary} />
              <Text style={styles.infoText}>
                If you do not attend the consultation, it will be{' '}
                <Text style={styles.infoHighlight}>canceled 10 minutes after</Text> it starts, and no refund will be provided.
              </Text>
            </View>

            {/* Doctor Info Card */}
            <View style={styles.doctorCard}>
              <Image 
                source={{ uri: selectedConsultant?.profile_image || practitioner.profilePicture }}
                style={styles.doctorImage}
              />
              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName}>
                  {selectedConsultant ? `${selectedConsultant.first_name} ${selectedConsultant.last_name}` : practitioner.name}
                </Text>
                <Text style={styles.doctorSpecialty}>
                  {selectedConsultant?.profession || practitioner.specialty}
                </Text>
              </View>
              <View style={styles.appointmentTimeInfo}>
                <Text style={styles.appointmentTime}>{selectedTime}</Text>
                <Text style={styles.appointmentDate}>
                  {selectedDate ? selectedDate.formatted : 'Select date'}
                </Text>
              </View>
            </View>

            {/* Enhanced Calendar */}
            <View style={styles.calendarContainer}>
              <View style={styles.calendarHeader}>
                <Text style={styles.monthYear}>
                  {monthNames[currentMonth]} {currentYear}
                </Text>
                <View style={styles.monthNavigation}>
                  <TouchableOpacity 
                    style={[styles.navButton, !canNavigatePrevious() && styles.disabledNavButton]}
                    onPress={() => navigateMonth(-1)}
                    disabled={!canNavigatePrevious()}
                  >
                    <Ionicons 
                      name="chevron-back" 
                      size={20} 
                      color={canNavigatePrevious() ? COLORS.textDark : COLORS.disabledText} 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.navButton} onPress={() => navigateMonth(1)}>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textDark} />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.weekDaysContainer}>
                {weekDays.map((day, index) => (
                  <Text key={index} style={styles.weekDayText}>{day}</Text>
                ))}
              </View>
              
              <View style={styles.calendarGrid}>
                {calendarDays.map((dayObj, index) => renderCalendarDay(dayObj, index))}
              </View>
            </View>

            {/* Time Selection */}
            <View style={styles.timeContainer}>
              <Text style={styles.sectionTitle}>Time</Text>
              {isLoadingAvailability ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <View style={styles.timeSlotsGrid}>
                  {availableSlots.map((timeSlot, index) => renderTimeSlot(timeSlot, index))}
                </View>
              )}
            </View>

            {/* Reason for Visit */}
            <View style={styles.reasonContainer}>
              <Text style={styles.sectionTitle}>Describe a reason for visit</Text>
              <TextInput
                style={styles.reasonInput}
                multiline
                value={reasonForVisit}
                onChangeText={setReasonForVisit}
                placeholder="Describe your symptoms or reason for the visit..."
                placeholderTextColor={COLORS.placeholderText}
              />
            </View>
            
            {/* Add bottom padding to prevent content from being hidden behind fixed bottom */}
            <View style={styles.bottomPadding} />
          </View>
        </ScrollView>

        {/* Fixed Bottom Container */}
        <View style={styles.fixedBottomContainer}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceText}>{practitioner.price},00 USD</Text>
            <Text style={styles.appointmentDetails}>
              {selectedTime}, {selectedDate ? selectedDate.formatted : 'No date selected'}
            </Text>
          </View>
          
          <TouchableOpacity style={styles.bookButton} onPress={handleBookAppointment}>
            <Text style={styles.bookButtonText}>Book now</Text>
          </TouchableOpacity>
        </View>
      </View>
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 60,
    paddingBottom: 30,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 12,
    marginRight: 16,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    marginTop: -20,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: COLORS.infoBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: COLORS.textDark,
    lineHeight: 20,
  },
  infoHighlight: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  doctorCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  doctorImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  doctorSpecialty: {
    color: COLORS.white,
    fontSize: 14,
    opacity: 0.8,
  },
  appointmentTimeInfo: {
    alignItems: 'flex-end',
  },
  appointmentTime: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  appointmentDate: {
    color: COLORS.white,
    fontSize: 14,
    opacity: 0.8,
  },
  calendarContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  monthNavigation: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
    padding: 8,
  },
  disabledNavButton: {
    opacity: 0.3,
  },
  weekDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  weekDayText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
    width: 40,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedDay: {
    backgroundColor: COLORS.selectedDate,
    borderRadius: 20,
  },
  todayDay: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 20,
  },
  pastDay: {
    backgroundColor: COLORS.pastDateBackground,
    borderRadius: 20,
  },
  calendarDayText: {
    fontSize: 16,
    color: COLORS.textDark,
    fontWeight: '500',
  },
  selectedDayText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  todayDayText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  pastDayText: {
    color: COLORS.disabledText,
    fontWeight: '400',
  },
  timeContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 16,
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  selectedTimeSlot: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timeText: {
    fontSize: 14,
    color: COLORS.textDark,
    fontWeight: '500',
  },
  selectedTimeText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  reasonContainer: {
    marginBottom: 24,
  },
  bottomPadding: {
    height: 120, // Space for fixed bottom container
  },
  fixedBottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    padding: 20,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    gap: 16,
  },
  reasonInput: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.textDark,
    textAlignVertical: 'top',
    minHeight: 120,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bottomContainer: {
    gap: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  appointmentDetails: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  bookButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bookButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  unavailableDateCard: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  unavailableDateText: {
    color: '#999',
  },
  unavailableBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff4444',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  unavailableBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '600',
  },
  bookedTimeSlot: {
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  bookedTimeText: {
    color: '#ff4444',
  },
  bookedLabel: {
    fontSize: 10,
    color: '#ff4444',
    marginTop: 2,
  },
});