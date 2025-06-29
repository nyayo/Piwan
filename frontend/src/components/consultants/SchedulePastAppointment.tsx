import { StyleSheet, Text, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react'

import { calculateAge } from '../../helper/calculateAge';
import { convertToLocalDate } from '../../helper/convertDateTime';
import COLORS from '../../constants/theme';
import truncateWords from '../../helper/truncateWords';

const SchedulePastAppointment = ({appointment}) => {
    return (
        <View key={appointment.id} style={styles.pastAppointmentCard}>
            <View style={styles.pastAppointmentHeader}>
                <Text style={styles.pastAppointmentDate}>{convertToLocalDate(appointment.appointment_datetime)}</Text>
                <View style={styles.ratingContainer}>
                    {[...Array(5)].map((_, i) => (
                        <Ionicons
                            key={i}
                            name="star"
                            size={12}
                            color={i < appointment.rating ? COLORS.warning : COLORS.lightGrey}
                        />
                    ))}
                </View>
            </View>
            <Text style={styles.pastPatientName}>{appointment.user_name}</Text>
            <Text style={styles.pastCondition}>{truncateWords({ text: appointment.description, maxWords: 5 })}</Text>
            <Text style={styles.pastNotes}>{truncateWords({ text: appointment.title, maxWords: 5 })}</Text>
            <View style={styles.pastAppointmentFooter}>
                <Text style={styles.pastDuration}>{appointment.duration_minutes} mins</Text>
                <Text style={[styles.pastStatus, { color: appointment.status === 'completed' ? COLORS.success : COLORS.error }]}>
                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    pastAppointmentCard: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.lightGrey,
    },
    pastAppointmentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    pastAppointmentDate: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    ratingContainer: {
        flexDirection: 'row',
        gap: 2,
    },
    pastPatientName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textDark,
        marginBottom: 4,
    },
    pastCondition: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 8,
    },
    pastNotes: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontStyle: 'italic',
        marginBottom: 12,
    },
    pastAppointmentFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pastDuration: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    pastStatus: {
        fontSize: 12,
        fontWeight: '500',
    },
})


export default SchedulePastAppointment;
