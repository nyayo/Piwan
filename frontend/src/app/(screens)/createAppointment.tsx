import React, { useState } from 'react';
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
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';

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
  infoText: "#2E7D32"
};

// Generate calendar days for May 2025
const generateCalendarDays = () => {
  const days = [];
  const daysInMonth = 31;
  const startDay = 4; // May 1, 2025 starts on Thursday (4)
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }
  
  return days;
};

const timeSlots = [
  "12:00 PM", "12:30 PM", "4:20 PM", "5:30 PM",
  "5:40 PM", "5:50 PM", "6:00 PM", "6:30 PM",
  "6:40 PM", "6:50 PM", "7:00 PM", "7:30 PM",
  "8:00 PM", "9:40 PM"
];

const practitioner = {
  name: "Dr. Claire Jenkins",
  specialty: "General practitioners",
  profilePicture: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face",
  price: 80
};

export default function AppointmentScheduleScreen() {
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState(30);
  const [selectedTime, setSelectedTime] = useState("12:30 PM");
  const [reasonForVisit, setReasonForVisit] = useState("I have been experiencing persistent headaches for several days, and they do not improve with over-the-counter pain relievers.");
  const [currentMonth, setCurrentMonth] = useState("May 2025");
  
  const calendarDays = generateCalendarDays();
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const handleDateSelect = (day) => {
    if (day) {
      setSelectedDate(day);
    }
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };

  const handleBookAppointment = () => {
    Alert.alert(
      "Appointment Booked",
      `Your appointment with ${practitioner.name} has been scheduled for ${selectedDate}.05.25 at ${selectedTime}`,
      [{ text: "OK" }]
    );
  };

  const renderCalendarDay = (day, index) => {
    const isSelected = day === selectedDate;
    const isToday = day === 30; // Assuming today is the 30th
    
    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.calendarDay,
          isSelected && styles.selectedDay,
          isToday && !isSelected && styles.todayDay
        ]}
        onPress={() => handleDateSelect(day)}
        disabled={!day}
      >
        {day && (
          <Text style={[
            styles.calendarDayText,
            isSelected && styles.selectedDayText,
            isToday && !isSelected && styles.todayDayText
          ]}>
            {day}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderTimeSlot = (time) => {
    const isSelected = time === selectedTime;
    
    return (
      <TouchableOpacity
        key={time}
        style={[
          styles.timeSlot,
          isSelected && styles.selectedTimeSlot
        ]}
        onPress={() => handleTimeSelect(time)}
      >
        <Text style={[
          styles.timeText,
          isSelected && styles.selectedTimeText
        ]}>
          {time}
        </Text>
      </TouchableOpacity>
    );
  };

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
                source={{ uri: practitioner.profilePicture }}
                style={styles.doctorImage}
              />
              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName}>{practitioner.name}</Text>
                <Text style={styles.doctorSpecialty}>{practitioner.specialty}</Text>
              </View>
              <View style={styles.appointmentTimeInfo}>
                <Text style={styles.appointmentTime}>{selectedTime}</Text>
                <Text style={styles.appointmentDate}>{String(selectedDate).padStart(2, '0')}.05.25</Text>
              </View>
            </View>

            {/* Calendar */}
            <View style={styles.calendarContainer}>
              <View style={styles.calendarHeader}>
                <Text style={styles.monthYear}>{currentMonth}</Text>
                <View style={styles.monthNavigation}>
                  <TouchableOpacity style={styles.navButton}>
                    <Ionicons name="chevron-back" size={20} color={COLORS.textDark} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.navButton}>
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
                {calendarDays.map((day, index) => renderCalendarDay(day, index))}
              </View>
            </View>

            {/* Time Selection */}
            <View style={styles.timeContainer}>
              <Text style={styles.sectionTitle}>Time</Text>
              <View style={styles.timeSlotsGrid}>
                {timeSlots.map(renderTimeSlot)}
              </View>
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
              {selectedTime}, {String(selectedDate).padStart(2, '0')}.05.25
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
});