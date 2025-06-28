import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import COLORS from '../../constants/theme';
import { WebView } from 'react-native-webview';
import { Audio } from 'expo-av';
import { Video } from 'expo-video';

const getFileExtension = (url: string) => {
  const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|#|$)/);
  return match ? match[1].toLowerCase() : '';
};

const ResourceViewerScreen = () => {
  const { title, url } = useLocalSearchParams<{ title?: string; url?: string }>();
  const extension = url ? getFileExtension(url) : '';
  const videoRef = useRef<any>(null);

  // Helper to render content based on file type
  const renderContent = () => {
    if (!url) return <Text style={{ color: COLORS.error, marginTop: 24 }}>No resource URL provided.</Text>;
    if (["mp3", "wav", "ogg", "m4a"].includes(extension)) {
      // Audio file: use expo-audio
      return (
        <AudioPlayer url={url} />
      );
    }
    if (["mp4", "mov", "webm"].includes(extension)) {
      // Video file: use expo-video
      return (
        <View style={{ width: '100%', aspectRatio: 16/9, marginTop: 16 }}>
          <Video
            ref={videoRef}
            source={{ uri: url }}
            useNativeControls
            resizeMode="contain"
            style={{ width: '100%', height: 220, borderRadius: 12 }}
          />
        </View>
      );
    }
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) {
      // Image file
      return (
        <Image source={{ uri: url }} style={{ width: '100%', height: 320, borderRadius: 12, marginTop: 16 }} resizeMode="contain" />
      );
    }
    if (["pdf", "html", "htm"].includes(extension)) {
      // PDF or HTML: use WebView
      return (
        <View style={{ flex: 1, width: '100%', height: 400, marginTop: 16 }}>
          <WebView source={{ uri: url }} style={{ flex: 1, borderRadius: 12, overflow: 'hidden' }} />
        </View>
      );
    }
    // Default: try WebView
    return (
      <View style={{ flex: 1, width: '100%', height: 400, marginTop: 16 }}>
        <WebView source={{ uri: url }} style={{ flex: 1, borderRadius: 12, overflow: 'hidden' }} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title || 'Resource'}</Text>
      </View>
      <View style={styles.content}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

// Audio player using expo-audio imperative API
const AudioPlayer = ({ url }: { url: string }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [sound, setSound] = useState<any>(null);

  useEffect(() => {
    // Load audio when url changes
    let isMounted = true;
    async function loadAudio() {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }
      if (url) {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: false },
        );
        if (isMounted) {
          setSound(newSound);
          setIsLoaded(true);
        }
      }
    }
    loadAudio();
    return () => {
      isMounted = false;
      if (sound) {
        sound.unloadAsync();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  const handlePlayPause = async () => {
    if (!sound) return;
    if (isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
    } else {
      await sound.playAsync();
      setIsPlaying(true);
    }
  };

  return (
    <View style={{ alignItems: 'center', marginTop: 32 }}>
      <TouchableOpacity
        style={{ backgroundColor: COLORS.primary, borderRadius: 32, padding: 18 }}
        onPress={handlePlayPause}
        disabled={!isLoaded}
      >
        <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="#fff" />
      </TouchableOpacity>
      <Text style={{ marginTop: 16, color: COLORS.textDark, fontWeight: '600' }}>
        {isPlaying ? 'Playing...' : (!isLoaded ? 'Loading...' : 'Tap to Play Audio')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  backButton: { padding: 8, marginRight: 12 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: COLORS.textDark },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, width: '100%' },
});

export default ResourceViewerScreen;
