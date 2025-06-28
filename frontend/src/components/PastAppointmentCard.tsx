import { View, Text, Image, StyleSheet, Dimensions } from 'react-native'
import React from 'react'
import { formatTime, convertToLocalDate, toLocalDateTimeString } from '../helper/convertDateTime';

type CarouselCardProps = {
    appointment: PastType;
}

const CarouselCard = ({ appointment }: CarouselCardProps) => {
    return (
        <View style={styles.pastCard}>
            <Image source={{ uri: appointment.profile_image }} style={styles.pastDoctorAvatar} />
            <View style={styles.pastDoctorInfo}>
            <Text style={styles.pastDoctorName}>{appointment.consultant_name}</Text>
            <Text style={styles.pastAppointmentDetails}>
                {appointment.profession} — {convertToLocalDate(appointment.appointment_datetime)} • {formatTime(appointment.appointment_datetime)}
            </Text>
            <Text style={styles.dateText}>
                {toLocalDateTimeString(appointment.appointment_datetime)}
            </Text>
            </View>
            <View style={styles.pastPriceContainer}>
            <Text style={styles.pastPrice}>{appointment.status}</Text>
            </View>
        </View>
        );
}

const COLORS = {
  ...require('../constants/theme').default,
  textLight: '#b0b0b0',
  shadow: 'rgba(0,0,0,0.1)',
  lightGrey: '#f1f1f1',
};

const styles = StyleSheet.create({
    pastCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        gap: 12,
    },
    pastDoctorAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    pastDoctorInfo: {
        flex: 1,
    },
    pastDoctorName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textDark,
        marginBottom: 4,
    },
    pastAppointmentDetails: {
        fontSize: 14,
        color: COLORS.grey,
    },
    dateText: {
        fontSize: 14,
        color: COLORS.grey,
    },
    pastPriceContainer: {
        backgroundColor: COLORS.textDark,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    pastPrice: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '600',
    },
})

export default CarouselCard;

// Fix PastType to include all used fields
export type PastType = {
    id: number;
    appointment_datetime: string;
    consultant_name: string;
    profile_image: string;
    profession: string;
    status: string;
    [key: string]: any;
};