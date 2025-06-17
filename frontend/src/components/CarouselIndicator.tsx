import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import COLORS from '../constants/theme';

type CarouselIndicatorProps = {
    total: number;
    current: number;
}

const CarouselIndicator = ({ total, current }: CarouselIndicatorProps) => {
    return (
        <View style={styles.indicatorContainer}>
            {Array.from({ length: total }).map((_, index) => (
            <View
                key={index}
                style={[
                styles.indicator,
                index === current ? styles.activeIndicator : styles.inactiveIndicator
                ]}
            />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    indicatorContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        gap: 8,
    },
    indicator: {
        height: 6,
        borderRadius: 3,
    },
    activeIndicator: {
        width: 20,
        backgroundColor: COLORS.primary,
    },
    inactiveIndicator: {
        width: 6,
        backgroundColor: COLORS.lightGrey,
    },
})

export default CarouselIndicator