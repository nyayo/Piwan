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
useWindowDimensions,
Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { widths } from '@tamagui/config';
import { router, useNavigation } from 'expo-router';

const COLORS = {
primary: "#1976D2",
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
primaryLight: "#E6F0FA"
};

const practitioners = [
 {
   id: 1,
   name: "Dr. Claire Jenkins",
   rating: 4.9,
   price: 80,
   profilePicture: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face",
   times: ["12:00 PM", "12:30 PM", "4:20 PM"],
   isFavorite: true
 },
 {
   id: 2,
   name: "Dr. Susanne Moore",
   rating: 5.0,
   price: 95,
   profilePicture: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face",
   times: ["2:00 PM", "2:30 PM", "3:20 PM"],
   isFavorite: false
 },
 {
   id: 3,
   name: "Dr. Aarav Patel",
   rating: 5.0,
   price: 100,
   profilePicture: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face",
   times: ["10:00 AM", "11:20 AM", "1:00 PM"],
   isFavorite: false
 },
 {
   id: 4,
   name: "Dr. James Wilson",
   rating: 4.8,
   price: 85,
   profilePicture: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face",
   times: ["9:00 AM", "10:30 AM", "2:00 PM"],
   isFavorite: false
 }
];

export default function SearchScreen() {
    const {width} = useWindowDimensions();
const [searchQuery, setSearchQuery] = useState('');
const [favorites, setFavorites] = useState(new Set([1]));
const navigation = useNavigation();

const toggleFavorite = (id: number) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(id)) {
    newFavorites.delete(id);
    } else {
    newFavorites.add(id);
    }
    setFavorites(newFavorites);
};

const filteredPractitioners = practitioners.filter(practitioner =>
    practitioner.name.toLowerCase().includes(searchQuery.toLowerCase())
);

const renderTimeSlot = (time: string, index : number) => (
    <View key={index} style={styles.timeSlot}>
    <Text style={styles.timeText}>{time}</Text>
    </View>
);

const renderPractitioner = (practitioner) => (
    <View key={practitioner.id} style={styles.card}>
   {/* First Row: Profile Picture, Name, Rating, Specialty, and Heart */}
    <View style={styles.topRow}>
        <Image 
            source={{ uri: practitioner.profilePicture || 'https://via.placeholder.com/48' }}
            style={styles.profilePicture}
        />
        <View style={styles.mainInfo}>
            <View style={styles.nameRatingRow}>
                <Text style={styles.practitionerName}>{practitioner.name}</Text>
                <View style={styles.ratingContainer}>
                    <Text style={styles.rating}>{practitioner.rating}</Text>
                    <Ionicons name="star" size={14} color="#FFD700" />
                </View>
            </View>
            <Text style={styles.specialty}>General practitioners</Text>
        </View>
        <TouchableOpacity onPress={() => toggleFavorite(practitioner.id)}>
            <Ionicons 
                name={favorites.has(practitioner.id) ? "heart" : "heart-outline"} 
                size={20} 
                color={favorites.has(practitioner.id) ? COLORS.error : COLORS.placeholderText} 
            />
        </TouchableOpacity>
    </View>

    {/* Availability Text */}
    <Text style={styles.availabilityText}>Available appointments for today</Text>

    {/* Time Slots and Button */}
    <View style={styles.bottomSection}>
        <View style={styles.timeSlotsContainer}>
            {practitioner.times.map((time: string, index : number) => renderTimeSlot(time, index))}
        </View>
        <TouchableOpacity style={styles.arrowButton} onPress={() => router.push('(screens)/createAppointment')}>
            <Ionicons name="chevron-forward" size={16} color={COLORS.white} />
        </TouchableOpacity>
    </View>
    </View>
);

return (
    <SafeAreaView style={styles.container}>
    <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
    
    {/* Custom Header */}
    <View style={styles.header}>
        <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color={COLORS.white || '#333'} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>General practitioners</Text>
        </View>
    </View>
    <ScrollView style={styles.scrollView}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
                <Ionicons 
                name="search" 
                size={21} 
                color={COLORS.placeholderText} 
                style={styles.searchIcon}
                />
                <TextInput
                style={styles.searchInput}
                placeholder="Search"
                placeholderTextColor={COLORS.placeholderText}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                enterKeyHint='search'
                />
            </View>
            <TouchableOpacity style={styles.filterButton}>
                <Ionicons name="options" size={21} color={COLORS.placeholderText} />
            </TouchableOpacity>
        </View>
        {/* Practitioners List */}
        <View style={styles.scrollContent}>
            {filteredPractitioners.map(renderPractitioner)}
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
searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
},
searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
    width: 0,
    height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 1,
},
searchIcon: {
    marginRight: 4,
},
searchInput: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 18,
    color: COLORS.textDark,
},
filterButton: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    paddingVertical: 13,
    padding: 13,
    shadowColor: '#000',
    shadowOffset: {
    width: 0,
    height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 1,
},
scrollView: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    marginTop: -20
},
scrollContent: {
    padding: 16,
    gap: 10
},
card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
        width: 0,
        height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.00,
    elevation: 1,
    borderWidth: 0,
    borderColor: COLORS.border,
    marginBottom: 16,
},
topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
},
profilePicture: {
    width: 48,
    height: 48,
    borderRadius: 12,
},
mainInfo: {
    flex: 1,
},
nameRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
},
practitionerName: {
    color: COLORS.textDark,
    fontSize: 16,
    fontWeight: '600',
},
ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
},
rating: {
    color: COLORS.textDark,
    fontSize: 14,
    fontWeight: '600',
},
specialty: {
    color: COLORS.textSecondary,
    fontSize: 13,
},
availabilityText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 12,
},
bottomSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
},
timeSlotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
},
timeSlot: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
},
timeText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '500',
},
arrowButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
},
});