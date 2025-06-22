import { View, Text, TouchableOpacity, StyleSheet, Alert, Switch, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import COLORS from '../../constants/theme';
import KeyboardAwareScrollView from '../../components/KeyboardAwareView';
import { useAuth } from '../../context/authContext';

export type AppPreferencesProps = {
    darkMode: boolean;
    autoSync: boolean;
    offlineMode: boolean;
    highQualityImages: boolean;
    soundEffects: boolean;
    hapticFeedback: boolean;
    autoBackup: boolean;
    wifiOnlySync: boolean;
    compactView: boolean;
    showPreview: boolean;
    language: string;
    fontSize: string;
    theme: string;
    defaultTab: string;
};

type PreferenceItemProps = {
    title: string;
    description: string;
    setting: string;
    value: boolean;
    handlePreferenceChange: (setting: string, value: boolean) => void;
    icon?: string;
};

type SelectablePreferenceItemProps = {
    title: string;
    description: string;
    currentValue: string;
    options: string[];
    onPress: () => void;
    icon?: string;
};

const PreferenceItem: React.FC<PreferenceItemProps> = ({ 
    title, 
    description, 
    setting, 
    value, 
    handlePreferenceChange,
    icon 
}) => {
    return (
        <View style={styles.preferenceItem}>
            <View style={styles.preferenceContent}>
                {icon && (
                    <Ionicons 
                        name={icon as any} 
                        size={20} 
                        color={COLORS.primary} 
                        style={styles.preferenceIcon}
                    />
                )}
                <View style={styles.preferenceText}>
                    <Text style={styles.preferenceTitle}>{title}</Text>
                    <Text style={styles.preferenceDescription}>{description}</Text>
                </View>
            </View>
            <Switch
                value={value}
                onValueChange={(newValue) => handlePreferenceChange(setting, newValue)}
                trackColor={{ false: COLORS.grey + '40', true: COLORS.primary + '40' }}
                thumbColor={value ? COLORS.primary : COLORS.grey}
                ios_backgroundColor={COLORS.grey + '40'}
            />
        </View>
    );
};

const SelectablePreferenceItem: React.FC<SelectablePreferenceItemProps> = ({ 
    title, 
    description, 
    currentValue, 
    onPress,
    icon 
}) => {
    return (
        <TouchableOpacity style={styles.selectablePreferenceItem} onPress={onPress}>
            <View style={styles.preferenceContent}>
                {icon && (
                    <Ionicons 
                        name={icon as any} 
                        size={20} 
                        color={COLORS.primary} 
                        style={styles.preferenceIcon}
                    />
                )}
                <View style={styles.preferenceText}>
                    <Text style={styles.preferenceTitle}>{title}</Text>
                    <Text style={styles.preferenceDescription}>{description}</Text>
                    <Text style={styles.currentValue}>{currentValue}</Text>
                </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.grey} />
        </TouchableOpacity>
    );
};

const PreferencesScreen = () => {
    // App Preferences State
    const [appPreferences, setAppPreferences] = useState<AppPreferencesProps>({
        darkMode: false,
        autoSync: true,
        offlineMode: false,
        highQualityImages: true,
        soundEffects: true,
        hapticFeedback: true,
        autoBackup: true,
        wifiOnlySync: false,
        compactView: false,
        showPreview: true,
        language: 'English',
        fontSize: 'Medium',
        theme: 'Light',
        defaultTab: 'Home',
    });

    const { user, updateUserPreferences } = useAuth();
    const router = useRouter();

    const handlePreferenceChange = async (setting: string, value: boolean) => {
        setAppPreferences(prev => ({
            ...prev,
            [setting]: value
        }));
        
        // API call to save preferences
        try {
            await updateUserPreferences({ [setting]: value });
        } catch (error) {
            console.log('Error updating preference:', error);
            // Revert the change if API call fails
            setAppPreferences(prev => ({
                ...prev,
                [setting]: !value
            }));
        }
    };

    const handleSelectablePreferenceChange = (setting: string, options: string[]) => {
        Alert.alert(
            `Select ${setting.charAt(0).toUpperCase() + setting.slice(1)}`,
            'Choose your preferred option',
            options.map(option => ({
                text: option,
                onPress: () => {
                    setAppPreferences(prev => ({
                        ...prev,
                        [setting]: option
                    }));
                }
            })).concat([{ text: 'Cancel', style: 'cancel' }])
        );
    };

    const handleGoBack = () => {
        router.back();
    };

    const handleResetPreferences = () => {
        Alert.alert(
            'Reset Preferences',
            'Are you sure you want to reset all preferences to their default values?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Reset', 
                    style: 'destructive',
                    onPress: () => {
                        setAppPreferences({
                            darkMode: false,
                            autoSync: true,
                            offlineMode: false,
                            highQualityImages: true,
                            soundEffects: true,
                            hapticFeedback: true,
                            autoBackup: true,
                            wifiOnlySync: false,
                            compactView: false,
                            showPreview: true,
                            language: 'English',
                            fontSize: 'Medium',
                            theme: 'Light',
                            defaultTab: 'Home',
                        });
                        Alert.alert('Success', 'Preferences have been reset to default values');
                    }
                }
            ]
        );
    };

    const handleClearCache = () => {
        Alert.alert(
            'Clear Cache',
            'This will clear all cached data. The app may take longer to load content temporarily.',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Clear', 
                    onPress: () => {
                        // Handle cache clearing
                        Alert.alert('Success', 'Cache cleared successfully');
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            {/* Custom Header */}
            <View style={styles.headerContainer}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleGoBack}
                >
                    <Ionicons name="arrow-back" size={24} color={COLORS.textDark || '#333'} />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>Preferences</Text>
                    <Text style={styles.headerSubtitle}>Customize your app experience</Text>
                </View>
            </View>
            
            <KeyboardAwareScrollView>
                {/* Appearance Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>APPEARANCE</Text>

                    <PreferenceItem 
                        title='Dark Mode' 
                        description='Use dark theme throughout the app' 
                        setting='darkMode'
                        value={appPreferences.darkMode}
                        handlePreferenceChange={handlePreferenceChange}
                        icon='moon'
                    />

                    <PreferenceItem 
                        title='Compact View' 
                        description='Show more content in less space' 
                        setting='compactView'
                        value={appPreferences.compactView}
                        handlePreferenceChange={handlePreferenceChange}
                        icon='resize'
                    />

                    <SelectablePreferenceItem 
                        title='Font Size' 
                        description='Adjust text size for better readability'
                        currentValue={appPreferences.fontSize}
                        options={['Small', 'Medium', 'Large', 'Extra Large']}
                        onPress={() => handleSelectablePreferenceChange('fontSize', ['Small', 'Medium', 'Large', 'Extra Large'])}
                        icon='text'
                    />

                    <SelectablePreferenceItem 
                        title='Theme' 
                        description='Choose your preferred color scheme'
                        currentValue={appPreferences.theme}
                        options={['Light', 'Dark', 'Auto']}
                        onPress={() => handleSelectablePreferenceChange('theme', ['Light', 'Dark', 'Auto'])}
                        icon='color-palette'
                    />
                </View>

                {/* Media & Storage Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>MEDIA & STORAGE</Text>

                    <PreferenceItem 
                        title='High Quality Images' 
                        description='Download and display images in high resolution' 
                        setting='highQualityImages'
                        value={appPreferences.highQualityImages}
                        handlePreferenceChange={handlePreferenceChange}
                        icon='image'
                    />

                    <PreferenceItem 
                        title='Auto Backup' 
                        description='Automatically backup your data to cloud storage' 
                        setting='autoBackup'
                        value={appPreferences.autoBackup}
                        handlePreferenceChange={handlePreferenceChange}
                        icon='cloud-upload'
                    />

                    <PreferenceItem 
                        title='WiFi Only Sync' 
                        description='Only sync data when connected to WiFi' 
                        setting='wifiOnlySync'
                        value={appPreferences.wifiOnlySync}
                        handlePreferenceChange={handlePreferenceChange}
                        icon='wifi'
                    />

                    <PreferenceItem 
                        title='Show Preview' 
                        description='Display content previews in lists' 
                        setting='showPreview'
                        value={appPreferences.showPreview}
                        handlePreferenceChange={handlePreferenceChange}
                        icon='eye'
                    />
                </View>

                {/* Sync & Data Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>SYNC & DATA</Text>

                    <PreferenceItem 
                        title='Auto Sync' 
                        description='Automatically sync data across devices' 
                        setting='autoSync'
                        value={appPreferences.autoSync}
                        handlePreferenceChange={handlePreferenceChange}
                        icon='sync'
                    />

                    <PreferenceItem 
                        title='Offline Mode' 
                        description='Allow app to work without internet connection' 
                        setting='offlineMode'
                        value={appPreferences.offlineMode}
                        handlePreferenceChange={handlePreferenceChange}
                        icon='cloud-offline'
                    />

                    <TouchableOpacity style={styles.actionButton} onPress={handleClearCache}>
                        <View style={styles.actionButtonContent}>
                            <Ionicons name="trash-bin" size={20} color={COLORS.primary} />
                            <View style={styles.actionButtonText}>
                                <Text style={styles.actionButtonTitle}>Clear Cache</Text>
                                <Text style={styles.actionButtonDescription}>Free up storage space</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={COLORS.grey} />
                    </TouchableOpacity>
                </View>

                {/* Interface Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>INTERFACE</Text>

                    <PreferenceItem 
                        title='Sound Effects' 
                        description='Play sounds for app interactions' 
                        setting='soundEffects'
                        value={appPreferences.soundEffects}
                        handlePreferenceChange={handlePreferenceChange}
                        icon='volume-high'
                    />

                    <PreferenceItem 
                        title='Haptic Feedback' 
                        description='Feel vibrations for touch interactions' 
                        setting='hapticFeedback'
                        value={appPreferences.hapticFeedback}
                        handlePreferenceChange={handlePreferenceChange}
                        icon='phone-portrait'
                    />

                    <SelectablePreferenceItem 
                        title='Language' 
                        description='Choose your preferred language'
                        currentValue={appPreferences.language}
                        options={['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese']}
                        onPress={() => handleSelectablePreferenceChange('language', ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese'])}
                        icon='language'
                    />

                    <SelectablePreferenceItem 
                        title='Default Tab' 
                        description='Choose which tab opens when you start the app'
                        currentValue={appPreferences.defaultTab}
                        options={['Home', 'Search', 'Profile', 'Settings']}
                        onPress={() => handleSelectablePreferenceChange('defaultTab', ['Home', 'Search', 'Profile', 'Settings'])}
                        icon='home'
                    />
                </View>

                {/* Advanced Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ADVANCED</Text>
                    
                    <TouchableOpacity style={styles.actionButton}>
                        <View style={styles.actionButtonContent}>
                            <Ionicons name="download" size={20} color={COLORS.primary} />
                            <View style={styles.actionButtonText}>
                                <Text style={styles.actionButtonTitle}>Export Data</Text>
                                <Text style={styles.actionButtonDescription}>Download your data as a file</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={COLORS.grey} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton}>
                        <View style={styles.actionButtonContent}>
                            <Ionicons name="bug" size={20} color={COLORS.primary} />
                            <View style={styles.actionButtonText}>
                                <Text style={styles.actionButtonTitle}>Debug Information</Text>
                                <Text style={styles.actionButtonDescription}>View app diagnostic data</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={COLORS.grey} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.resetButton}
                        onPress={handleResetPreferences}
                    >
                        <Ionicons name="refresh" size={20} color={COLORS.warning || '#FF9500'} />
                        <Text style={styles.resetButtonText}>Reset All Preferences</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAwareScrollView>
            <StatusBar style="dark" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fafafa',
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingTop: 24,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backButton: {
        padding: 8,
        marginRight: 12,
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.textDark || '#1a1a1a',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: COLORS.grey || '#666',
        marginTop: 2,
        fontWeight: '400',
    },
    section: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        backgroundColor: '#fff',
        marginBottom: 12,
        borderRadius: 10,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textDark,
        letterSpacing: 0.5,
        marginBottom: 16,
        textTransform: 'uppercase',
    },
    preferenceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.grey + '20',
    },
    selectablePreferenceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.grey + '20',
    },
    preferenceContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    preferenceIcon: {
        marginRight: 12,
    },
    preferenceText: {
        flex: 1,
    },
    preferenceTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.textDark,
        marginBottom: 2,
    },
    preferenceDescription: {
        fontSize: 14,
        color: COLORS.grey,
        lineHeight: 18,
    },
    currentValue: {
        fontSize: 13,
        color: COLORS.primary,
        marginTop: 4,
        fontWeight: '500',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.grey + '20',
    },
    actionButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    actionButtonText: {
        marginLeft: 12,
        flex: 1,
    },
    actionButtonTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.textDark,
        marginBottom: 2,
    },
    actionButtonDescription: {
        fontSize: 14,
        color: COLORS.grey,
    },
    resetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: (COLORS.warning || '#FF9500') + '40',
        backgroundColor: (COLORS.warning || '#FF9500') + '10',
        marginTop: 8,
    },
    resetButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.warning || '#FF9500',
        marginLeft: 12,
    },
});

export default PreferencesScreen;