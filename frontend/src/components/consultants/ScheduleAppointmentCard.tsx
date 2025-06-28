import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons';
import COLORS from '../../constants/theme';
import React from 'react'

const ScheduleAppointmentCard = ({appointment, handlePatientDetails}) => {
    console.log('Confirmed Appointments', appointment)
    return (
        <View key={appointment.id} style={styles.appointmentCard}>
            <View style={styles.timeContainer}>
                <View style={styles.verticalLine} />
                <View style={styles.appointmentTimeBox}>
                    <Text style={styles.appointmentTime}>{appointment.time}</Text>
                </View>
                <View style={styles.verticalLine} />
            </View>
            
            <View style={styles.appointmentContent}>
                <Image source={{ uri: appointment.profile_image }} style={styles.patientAvatar} />
                
                <View style={styles.appointmentDetails}>
                    <View style={styles.patientHeader}>
                        <Text style={styles.patientName}>{appointment.user_name}</Text>
                    </View>
                    <Text style={styles.patientCondition}>{appointment.age} years • {appointment.condition}</Text>
                    
                    <View style={styles.appointmentInfo}>
                        <View style={styles.appointmentAction}>
                            <Text style={styles.appointmentActionReschedule}>Reschedule</Text>
                        </View>
                        <View style={styles.appointmentAction}>
                            <Text style={styles.appointmentActionCancel}>Cancel</Text>
                        </View>
                    </View>
                </View>
                
                <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={handlePatientDetails}
                    >
                    <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    appointmentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    timeContainer: {
        alignItems: 'center',
        marginRight: 16,
    },
    appointmentTimeBox: {
        backgroundColor: COLORS.lightGrey,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        minWidth: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    appointmentTime: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textDark,
    },
    verticalLine: {
        width: 2,
        height: 40,
        backgroundColor: COLORS.lightGrey,
    },
    appointmentContent: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: COLORS.cardBackground,
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.lightGrey,
    },
    patientAvatar: {
        width: 50,
        height: 50,
        borderRadius: 12,
        marginRight: 12,
    },
    appointmentDetails: {
        flex: 1,
    },
    patientHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    patientName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textDark,
        marginRight: 8,
    },
    patientCondition: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 8,
    },
    appointmentInfo: {
        flexDirection: 'row',
        gap: 16,
    },
    appointmentAction: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    appointmentActionReschedule: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontWeight: '500',
        backgroundColor: COLORS.background,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4
    },
    appointmentActionCancel: {
        fontSize: 14,
        color: COLORS.error,
        fontWeight: '500',
        backgroundColor: COLORS.bgError,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4
    },
    actionButton: {
        justifyContent: 'center',
        alignItems: 'center',
    },
})

export default ScheduleAppointmentCard;
