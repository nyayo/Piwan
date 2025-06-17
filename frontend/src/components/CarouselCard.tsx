import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native'
import React from 'react'
import Ionicons from '@expo/vector-icons/Ionicons';
import COLORS from '../constants/theme';
import { UpcomingType } from '../data/upcoming';
const { width: screenWidth } = Dimensions.get('window');

type CarouselCardProps = {
    appointment: UpcomingType;
    onPayPress: (appointment: UpcomingType) => void;
}

const CarouselCard = ({ appointment, onPayPress }: CarouselCardProps) => {
    return (
    <View style={styles.carouselCard}>
        <View style={styles.cardHeader}>
        <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
            {appointment.status === 'confirmed' ? 'CONFIRMED' : 'PENDING'}
            </Text>
        </View>
        <Text style={styles.location}>{appointment.location}</Text>
        </View>
        
        <View style={styles.dateTimeContainer}>
        <Text style={styles.appointmentDate}>{appointment.date}</Text>
        <Text style={styles.appointmentTime}>{appointment.time}</Text>
        </View>
        
        <View style={styles.doctorSection}>
        <Image source={{ uri: appointment.image }} style={styles.doctorAvatar} />
        <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>{appointment.doctorName}</Text>
            <Text style={styles.specialty}>{appointment.specialty}</Text>
        </View>
        </View>
        
        <TouchableOpacity 
        style={styles.payButton}
        onPress={() => onPayPress(appointment)}
        >
        <Text style={styles.payButtonText}>Pay now • {appointment.price}$</Text>
        <Ionicons name="chevron-forward" size={16} color={COLORS.white} />
        </TouchableOpacity>
    </View>
);
}

const styles = StyleSheet.create({
    carouselCard: {
        backgroundColor: COLORS.textDark,
        borderRadius: 20,
        padding: 20,
        marginRight: 16,
        width: screenWidth - 80,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    cardHeader: {
        marginBottom: 8,
    },
    statusBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    statusText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '600',
    },
    location: {
        color: COLORS.white,
        fontSize: 14,
        opacity: 0.8,
    },
    dateTimeContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 20,
        gap: 16,
    },
    appointmentDate: {
        color: COLORS.white,
        fontSize: 24,
        fontWeight: '700',
    },
    appointmentTime: {
        color: COLORS.white,
        fontSize: 24,
        fontWeight: '700',
    },
    doctorSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 12,
    },
    doctorAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    doctorInfo: {
        flex: 1,
    },
    doctorName: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    specialty: {
        color: COLORS.white,
        fontSize: 14,
        opacity: 0.7,
    },
    payButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    payButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
})

export default CarouselCard;