import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import TabScreen from '../../components/TabScreen'

const chat = () => {
  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <TabScreen />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 20
  }
})

export default chat