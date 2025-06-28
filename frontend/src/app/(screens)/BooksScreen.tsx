import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import COLORS from '../../constants/theme';

const books = [
  {
    id: '1',
    title: 'The Mindful Path',
    description: 'A guide to mindfulness and meditation for beginners.',
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80',
    url: 'https://www.example.com/mindful-path.pdf',
  },
  {
    id: '2',
    title: 'Resilience Roadmap',
    description: 'Building resilience through practical exercises and stories.',
    image: 'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=400&q=80',
    url: 'https://www.example.com/resilience-roadmap.pdf',
  },
  {
    id: '3',
    title: 'Calm in Chaos',
    description: 'Techniques to find calm and clarity in stressful times.',
    image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80',
    url: 'https://www.example.com/calm-in-chaos.pdf',
  },
];

const BooksScreen = () => {
  const renderItem = ({ item }: { item: typeof books[0] }) => (
    <TouchableOpacity
      key={item.id}
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => router.push({
        pathname: '/(screens)/ResourceViewerScreen',
        params: { title: item.title, url: item.url }
      })}
    >
      <View style={styles.cardBody}>
        <Image source={{ uri: item.image }} style={styles.thumbnailRow} />
        <Text style={styles.cardTitleRow}>{item.title}</Text>
        <Text style={styles.cardDescriptionRow}>{item.description}</Text>
        <TouchableOpacity
          style={styles.downloadButton}
          activeOpacity={0.8}
          onPress={(e) => {
            e.stopPropagation?.();
            router.push({
              pathname: '/(screens)/ResourceViewerScreen',
              params: { title: item.title, url: item.url }
            });
          }}
        >
          <Ionicons name="arrow-down-circle" size={22} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.downloadButtonText}>Read</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Books</Text>
          <Text style={styles.headerDescription}>Browse and read mental health books to support your journey.</Text>
        </View>
      </View>
      <FlatList
        data={books}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.cardRow}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  header: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  backButton: { padding: 8, marginRight: 12 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: COLORS.textDark },
  headerDescription: { fontSize: 15, color: COLORS.textDark, marginTop: 2, fontWeight: '400' },
  content: { padding: 24 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  card: {
    flex: 1,
    minWidth: 0,
    maxWidth: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    padding: 0,
    marginHorizontal: 4,
  },
  cardBody: { alignItems: 'center', padding: 16, paddingBottom: 8 },
  thumbnailRow: { width: '100%', height: 100, borderRadius: 12, marginBottom: 10, backgroundColor: '#eee' },
  cardTitleRow: { fontSize: 18, fontWeight: '700', color: COLORS.textDark, marginBottom: 6 },
  cardDescriptionRow: { fontSize: 13, color: COLORS.grey, lineHeight: 18, fontWeight: '400', marginBottom: 8 },
  downloadButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: 25, paddingVertical: 10, paddingHorizontal: 22, alignSelf: 'center', marginTop: 8, marginBottom: 8, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 2 },
  downloadButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});

export default BooksScreen;
