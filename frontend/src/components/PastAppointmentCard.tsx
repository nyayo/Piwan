import { View, Text, Image, StyleSheet, Dimensions } from 'react-native'
import React from 'react'
import COLORS from '../constants/theme';
import { PastType } from '../data/past';

type CarouselCardProps = {
    appointment: PastType;
}

const CarouselCard = ({ appointment }: CarouselCardProps) => {
    return (
        <View style={styles.pastCard}>
            <Image source={{ uri: appointment.image }} style={styles.pastDoctorAvatar} />
            <View style={styles.pastDoctorInfo}>
            <Text style={styles.pastDoctorName}>{appointment.doctorName}</Text>
            <Text style={styles.pastAppointmentDetails}>
                {appointment.specialty} — {appointment.date} • {appointment.time}
            </Text>
            </View>
            <View style={styles.pastPriceContainer}>
            <Text style={styles.pastPrice}>{appointment.price}$</Text>
            </View>
        </View>
        );
}

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