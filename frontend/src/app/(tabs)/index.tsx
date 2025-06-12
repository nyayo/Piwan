import { View, Text, StyleSheet, ScrollView, Image } from 'react-native'
import React from 'react'
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import COLORS from '../../constants/theme';

const index = () => {
  return (
    <ScrollView style={styles.container}>
      <SafeAreaView>
        <View style={styles.topBar}>
          <Image 
          style={styles.profileImg} 
          source={{uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTi7OjMMcQCicrkDxnax7RiNpMkvyG7-AjtBg&s"}} 
          />
          <View style={styles.profileInfo}>
            <Text style={styles.homeGreeting}>Hi, John</Text>
            <Text style={styles.greeting}>How is you mental health</Text>
          </View>
          <View style={styles.rightIcons}>
            <Ionicons name="search" size={24} color={COLORS.textDark} />
            <View>
              <View style={{ borderRadius: 8, width: 8, height: 8, backgroundColor: COLORS.primary, position: "absolute", right: 2, top: 3, zIndex: 1}} />
              <Ionicons name="notifications-outline" size={24} color={COLORS.textDark} />
            </View>
          </View>
        </View>
        <Text>index</Text>
      </SafeAreaView>
      <StatusBar style="dark" />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  topBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12
  },
  profileImg: {
    width: 50,
    height: 50,
    borderRadius: 50,
    borderWidth: 2.5,
    borderColor: COLORS.border
  },
  profileInfo: {
    justifyContent: "center"
  },
  homeGreeting: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textDark
  },
  greeting: {
    color: COLORS.grey
  },
  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    justifyContent:"flex-end",
    flex:1
  }
})

export default index;