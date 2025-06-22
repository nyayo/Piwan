import { ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import React, { PropsWithChildren } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import COLORS from '../constants/theme'

const KeyboardAwareScrollView = ({children} : PropsWithChildren) => {
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={['bottom']}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}  
                style={{ flex: 1 }}
            >
                <ScrollView 
                    keyboardShouldPersistTaps="handled" 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        minHeight: '100%',
                        paddingHorizontal: 10,
                        paddingVertical: 20,
                        justifyContent: 'center'
                    }} 
                    style={{ 
                        flex: 1,
                        backgroundColor: COLORS.background 
                    }}
                    keyboardDismissMode="on-drag"
                >
                    {children}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

export default KeyboardAwareScrollView;