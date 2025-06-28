import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Image,
  FlatList,
  Alert,
  Dimensions,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../../../constants/theme';
import { useAuth } from '../../../context/authContext';
import { StatusBar } from 'expo-status-bar';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

export default function MediaLibraryScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const scrollViewRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    previewImage: null,
    file: null,
    type: ''
  });
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Categories for dropdown
  const categories = [
    'Mental Health',
    'Physical Wellness',
    'Psychology',
    'Relaxation',
    'Nutrition',
    'Lifestyle',
    'Education',
    'Self-Help',
    'Meditation',
    'Exercise'
  ];

  // Sample media data - replace with your API data
  const [mediaItems, setMediaItems] = useState([
    {
      id: '1',
      title: 'Mindfulness Meditation Guide',
      type: 'book',
      category: 'Mental Health',
      author: 'Dr. Sarah Johnson',
      duration: '45 min read',
      thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop',
      uploadDate: '2024-01-15',
      downloads: 156,
      rating: 4.8,
    },
    {
      id: '2',
      title: 'Healing Sounds of Nature',
      type: 'music',
      category: 'Relaxation',
      author: 'Nature Sounds Collective',
      duration: '30 min',
      thumbnail: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=200&fit=crop',
      uploadDate: '2024-01-10',
      downloads: 89,
      rating: 4.6,
    },
    {
      id: '3',
      title: 'Anxiety Management Techniques',
      type: 'article',
      category: 'Psychology',
      author: 'Dr. Michael Chen',
      duration: '12 min read',
      thumbnail: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=200&fit=crop',
      uploadDate: '2024-01-08',
      downloads: 234,
      rating: 4.9,
    },
    {
      id: '4',
      title: 'Yoga for Beginners Video',
      type: 'video',
      category: 'Physical Wellness',
      author: 'Wellness Studio',
      duration: '25 min',
      thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300&h=200&fit=crop',
      uploadDate: '2024-01-05',
      downloads: 178,
      rating: 4.7,
    },
  ]);

  const tabs = [
    { id: 'all', title: 'All', icon: 'grid-outline' },
    { id: 'book', title: 'Books', icon: 'book-outline' },
    { id: 'article', title: 'Articles', icon: 'document-text-outline' },
    { id: 'music', title: 'Music', icon: 'musical-notes-outline' },
    { id: 'video', title: 'Videos', icon: 'videocam-outline' },
  ];

  const filteredItems = activeTab === 'all' 
    ? mediaItems 
    : mediaItems.filter(item => item.type === activeTab);

  const handleUpload = () => {
    setShowUploadModal(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowUploadModal(false);
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        previewImage: null,
        file: null,
        type: ''
      });
      setShowCategoryDropdown(false);
    });
  };

  const handleSelectPreviewImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setFormData(prev => ({
          ...prev,
          previewImage: result.assets[0]
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleFileUpload = async (type) => {
    try {
      let result;
      
      switch (type) {
        case 'document':
          result = await DocumentPicker.getDocumentAsync({
            type: ['application/pdf', 'application/msword', 'text/plain'],
            copyToCacheDirectory: true,
          });
          break;
        case 'image':
          result = await DocumentPicker.getDocumentAsync({
            type: 'image/*',
            copyToCacheDirectory: true,
          });
          break;
        case 'audio':
          result = await DocumentPicker.getDocumentAsync({
            type: 'audio/*',
            copyToCacheDirectory: true,
          });
          break;
        case 'video':
          result = await DocumentPicker.getDocumentAsync({
            type: 'video/*',
            copyToCacheDirectory: true,
          });
          break;
        default:
          result = await DocumentPicker.getDocumentAsync({
            copyToCacheDirectory: true,
          });
      }

      if (!result.canceled) {
        setFormData(prev => ({
          ...prev,
          file: result.assets[0],
          type: type
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select file');
    }
  };

  const handleSubmitUpload = async () => {
    // Validate form
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }
    if (!formData.category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
    if (!formData.file) {
      Alert.alert('Error', 'Please select a file to upload');
      return;
    }

    setIsUploading(true);

    try {
      // Here you would implement your actual upload logic
      // For demo purposes, we'll just simulate an upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add new item to media items (in real app, this would come from API response)
      const newItem = {
        id: Date.now().toString(),
        title: formData.title,
        type: formData.type,
        category: formData.category,
        author: user?.name || 'Current User',
        duration: 'New',
        thumbnail: formData.previewImage?.uri || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=300&h=200&fit=crop',
        uploadDate: new Date().toISOString().split('T')[0],
        downloads: 0,
        rating: 0,
      };

      setMediaItems(prev => [newItem, ...prev]);
      setIsUploading(false);
      closeModal();
      Alert.alert('Success', 'Resource uploaded successfully!');
    } catch (error) {
      setIsUploading(false);
      Alert.alert('Error', 'Failed to upload resource');
    }
  };

  const getMediaIcon = (type) => {
    switch (type) {
      case 'book': return 'book-outline';
      case 'article': return 'document-text-outline';
      case 'music': return 'musical-notes-outline';
      case 'video': return 'videocam-outline';
      default: return 'document-outline';
    }
  };

  const renderMediaItem = ({ item }) => (
    <TouchableOpacity style={styles.mediaCard} activeOpacity={0.7}>
      <Image source={{ uri: item.thumbnail }} style={styles.mediaThumbnail} />
      <View style={styles.mediaOverlay}>
        <Ionicons 
          name={getMediaIcon(item.type)} 
          size={24} 
          color={COLORS.white} 
          style={styles.mediaTypeIcon}
        />
      </View>
      
      <View style={styles.mediaInfo}>
        <Text style={styles.mediaTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.mediaAuthor}>{item.author}</Text>
        <Text style={styles.mediaCategory}>{item.category}</Text>
        
        <View style={styles.mediaStats}>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.statText}>{item.duration}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="download-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.statText}>{item.downloads}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.statText}>{item.rating}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderTab = (tab) => (
    <TouchableOpacity
      key={tab.id}
      style={[styles.tab, activeTab === tab.id && styles.activeTab]}
      onPress={() => setActiveTab(tab.id)}
    >
      <Ionicons 
        name={tab.icon} 
        size={20} 
        color={activeTab === tab.id ? COLORS.primary : COLORS.textSecondary} 
      />
      <Text style={[
        styles.tabText, 
        activeTab === tab.id && styles.activeTabText
      ]}>
        {tab.title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Media Library</Text>
        <TouchableOpacity onPress={handleUpload} style={styles.uploadButton}>
          <Ionicons name="add" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{mediaItems.length}</Text>
          <Text style={styles.statLabel}>Total Resources</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {mediaItems.reduce((sum, item) => sum + item.downloads, 0)}
          </Text>
          <Text style={styles.statLabel}>Total Downloads</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>4.8</Text>
          <Text style={styles.statLabel}>Avg. Rating</Text>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {tabs.map(renderTab)}
      </ScrollView>

      {/* Media Grid */}
      <FlatList
        ref={scrollViewRef}
        data={filteredItems}
        renderItem={renderMediaItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.mediaGrid}
        showsVerticalScrollIndicator={false}
      />

      {/* Upload Modal */}
      <Modal
        visible={showUploadModal}
        transparent={true}
        animationType="none"
        onRequestClose={closeModal}
      >
        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
          <Animated.View 
            style={[
              styles.modalContent,
              {
                transform: [{
                  scale: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  })
                }]
              }
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload Resource</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={COLORS.textDark} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
              {/* Title Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Title *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter resource title"
                  value={formData.title}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
                  maxLength={100}
                />
              </View>

              {/* Description Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description *</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Enter a brief description"
                  value={formData.description}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                  multiline={true}
                  numberOfLines={3}
                  maxLength={500}
                />
              </View>

              {/* Category Dropdown */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category *</Text>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                >
                  <Text style={[
                    styles.dropdownText,
                    !formData.category && styles.placeholderText
                  ]}>
                    {formData.category || 'Select a category'}
                  </Text>
                  <Ionicons 
                    name={showCategoryDropdown ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={COLORS.textSecondary} 
                  />
                </TouchableOpacity>
                
                {showCategoryDropdown && (
                  <View style={styles.dropdownList}>
                    <ScrollView style={styles.dropdownScroll} nestedScrollEnabled={true}>
                      {categories.map((category, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setFormData(prev => ({ ...prev, category }));
                            setShowCategoryDropdown(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{category}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Preview Image */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Preview Image</Text>
                <TouchableOpacity
                  style={styles.imageSelector}
                  onPress={handleSelectPreviewImage}
                >
                  {formData.previewImage ? (
                    <View style={styles.selectedImageContainer}>
                      <Image 
                        source={{ uri: formData.previewImage.uri }} 
                        style={styles.selectedImage} 
                      />
                      <View style={styles.imageOverlay}>
                        <Ionicons name="camera" size={20} color={COLORS.white} />
                      </View>
                    </View>
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="image-outline" size={32} color={COLORS.textSecondary} />
                      <Text style={styles.imagePlaceholderText}>Tap to select image</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* File Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Select File *</Text>
                {formData.file ? (
                  <View style={styles.selectedFile}>
                    <Ionicons name="document" size={20} color={COLORS.primary} />
                    <Text style={styles.selectedFileName}>{formData.file.name}</Text>
                    <TouchableOpacity
                      onPress={() => setFormData(prev => ({ ...prev, file: null, type: '' }))}
                    >
                      <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.fileOptions}>
                    <TouchableOpacity 
                      style={styles.fileOption}
                      onPress={() => handleFileUpload('document')}
                    >
                      <Ionicons name="document-text-outline" size={24} color={COLORS.primary} />
                      <Text style={styles.fileOptionText}>Document</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.fileOption}
                      onPress={() => handleFileUpload('audio')}
                    >
                      <Ionicons name="musical-notes-outline" size={24} color={COLORS.primary} />
                      <Text style={styles.fileOptionText}>Audio</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.fileOption}
                      onPress={() => handleFileUpload('video')}
                    >
                      <Ionicons name="videocam-outline" size={24} color={COLORS.primary} />
                      <Text style={styles.fileOptionText}>Video</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.fileOption}
                      onPress={() => handleFileUpload('image')}
                    >
                      <Ionicons name="image-outline" size={24} color={COLORS.primary} />
                      <Text style={styles.fileOptionText}>Image</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, isUploading && styles.submitButtonDisabled]}
              onPress={handleSubmitUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <Text style={styles.submitButtonText}>Uploading...</Text>
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={20} color={COLORS.white} />
                  <Text style={styles.submitButtonText}>Upload Resource</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: COLORS.white,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  uploadButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  tabsContainer: {
    maxHeight: 60,
  },
  tabsContent: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  activeTabText: {
    color: COLORS.white,
  },
  mediaGrid: {
    padding: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
  mediaCard: {
    width: (width - 50) / 2,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
  },
  mediaThumbnail: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  mediaOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaTypeIcon: {
    opacity: 0.9,
  },
  mediaInfo: {
    padding: 12,
  },
  mediaTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 4,
    lineHeight: 18,
  },
  mediaAuthor: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  mediaCategory: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '500',
    marginBottom: 8,
  },
  mediaStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginLeft: 2,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  formContainer: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: COLORS.textDark,
    backgroundColor: COLORS.white,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
    borderRadius: 12,
    padding: 12,
    backgroundColor: COLORS.white,
  },
  dropdownText: {
    fontSize: 14,
    color: COLORS.textDark,
  },
  placeholderText: {
    color: COLORS.textSecondary,
  },
  dropdownList: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    maxHeight: 150,
  },
  dropdownScroll: {
    maxHeight: 150,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
  },
  dropdownItemText: {
    fontSize: 14,
    color: COLORS.textDark,
  },
  imageSelector: {
    borderWidth: 2,
    borderColor: COLORS.lightGrey,
    borderRadius: 12,
    borderStyle: 'dashed',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  selectedImageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  selectedFile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
  },
  selectedFileName: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textDark,
    marginLeft: 8,
  },
  fileOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  fileOption: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
    marginBottom: 8,
  },
  fileOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textDark,
    marginTop: 4,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.lightGrey,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});