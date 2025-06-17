import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import React from 'react'
import Ionicons from '@expo/vector-icons/Ionicons';
import { data } from '../data/action-data';

const QuickActionsContent = () => {
    const quickActions = data;

    return (
        <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
                <TouchableOpacity
                    key={action.id}
                    style={[styles.quickActionCard, { backgroundColor: action.backgroundColor }]}
                    onPress={action.action}
                    activeOpacity={0.8}
                >
                    <View style={styles.quickActionIcon}>
                        <Ionicons 
                            name={action.icon} 
                            size={28} 
                            color="white" 
                        />
                    </View>
                    <Text style={styles.quickActionTitle}>{action.title}</Text>
                    <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    quickActionCard: {
        width: '48%',
        minHeight: 120,
        borderRadius: 16,
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    quickActionIcon: {
        marginBottom: 8,
    },
    quickActionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginBottom: 4,
    },
    quickActionSubtitle: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
    },
})

export default QuickActionsContent;