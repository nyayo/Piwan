import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import { ActivityType } from '../data/activity-data';
import COLORS from '../constants/theme';

type Activities = {
    index: number;
    activity: ActivityType;
}

const Activities = ({index, activity}:Activities) => {
    return (
        <TouchableOpacity
            key={index}
            style={styles.activityItem}
            onPress={() => {
            console.log(`Tapped ${activity.type}`);
            }}
        >
            <Image
            style={styles.activityImage}
            source={{ uri: activity.image }}
            defaultSource={{ uri: 'https://via.placeholder.com/80' }}
            />
            <Text style={styles.activityText}>{`${activity.type} • ${activity.timestamp}`}</Text>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({   
    activityItem: {
        alignItems: 'center',
        marginRight: 16,
    },
    activityImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    activityText: {
        fontSize: 14,
        color: COLORS.textDark,
        marginTop: 8,
        textAlign: 'center',
        maxWidth: 100,
    },
})

export default Activities