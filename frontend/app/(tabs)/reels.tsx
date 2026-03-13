import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

// Tab bar height + safe area
const TAB_BAR_HEIGHT = 80;
const REEL_HEIGHT = SCREEN_HEIGHT - TAB_BAR_HEIGHT;

interface Reel {
  id: string;
  video_url: string;
  thumbnail_url?: string;
  user_name: string;
  user_avatar?: string;
  category: string;
  level: string;
  likes: number;
  comments: number;
  description?: string;
  created_at: string;
  is_liked?: boolean;
}

// Demo reels data (will be replaced with API data)
const DEMO_REELS: Reel[] = [
  {
    id: '1',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    user_name: 'Rohit S.',
    category: 'batting',
    level: 'international',
    likes: 1234,
    comments: 45,
    description: 'Perfect cover drive technique',
    created_at: '2025-03-10',
  },
  {
    id: '2',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    user_name: 'Jasprit B.',
    category: 'bowling',
    level: 'international',
    likes: 2341,
    comments: 78,
    description: 'Yorker bowling masterclass',
    created_at: '2025-03-09',
  },
  {
    id: '3',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    user_name: 'Ravindra J.',
    category: 'fielding',
    level: 'domestic',
    likes: 876,
    comments: 23,
    description: 'Catching practice drills',
    created_at: '2025-03-08',
  },
  {
    id: '4',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    user_name: 'Coach Rahul',
    category: 'coach_tips',
    level: 'local',
    likes: 543,
    comments: 12,
    description: 'Batting stance fundamentals',
    created_at: '2025-03-07',
  },
  {
    id: '5',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    user_name: 'Fitness Pro',
    category: 'workouts',
    level: 'local',
    likes: 321,
    comments: 8,
    description: 'Cricket fitness routine',
    created_at: '2025-03-06',
  },
];

const categories = [
  { id: 'all', label: 'All', icon: 'apps' },
  { id: 'batting', label: 'Batting', icon: 'baseball' },
  { id: 'bowling', label: 'Bowling', icon: 'ellipse' },
  { id: 'fielding', label: 'Fielding', icon: 'hand-left' },
  { id: 'workouts', label: 'Workouts', icon: 'fitness' },
  { id: 'coach_tips', label: 'Tips', icon: 'school' },
];

export default function Reels() {
  const [reels, setReels] = useState<Reel[]>(DEMO_REELS);
  const [filteredReels, setFilteredReels] = useState<Reel[]>(DEMO_REELS);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Filter reels by category
  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredReels(reels);
    } else {
      setFilteredReels(reels.filter(r => r.category === selectedCategory));
    }
  }, [selectedCategory, reels]);

  // Fetch reels from API
  const fetchReels = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/reels`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params: { category: selectedCategory !== 'all' ? selectedCategory : undefined },
      });
      
      if (response.data && response.data.length > 0) {
        setReels(response.data);
      }
    } catch (error) {
      // Use demo data if API fails
      console.log('Using demo reels data');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReels();
    setRefreshing(false);
  }, [selectedCategory]);

  // Handle viewability change
  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 80,
  };

  // Like handler
  const handleLike = async (reelId: string) => {
    setReels(prev => prev.map(r => {
      if (r.id === reelId) {
        return {
          ...r,
          is_liked: !r.is_liked,
          likes: r.is_liked ? r.likes - 1 : r.likes + 1,
        };
      }
      return r;
    }));

    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        await axios.post(`${API_URL}/reels/${reelId}/like`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (error) {
      console.log('Like error:', error);
    }
  };

  // Render reel item
  const renderReel = ({ item, index }: { item: Reel; index: number }) => (
    <ReelItem
      reel={item}
      isActive={index === currentIndex}
      onLike={() => handleLike(item.id)}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Category Filter */}
      <View style={styles.categoryContainer}>
        <FlatList
          horizontal
          data={categories}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === item.id && styles.categoryChipSelected,
              ]}
              onPress={() => setSelectedCategory(item.id)}
            >
              <Ionicons
                name={item.icon as any}
                size={16}
                color={selectedCategory === item.id ? '#fff' : '#94a3b8'}
              />
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === item.id && styles.categoryChipTextSelected,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Reels Feed */}
      {isLoading && filteredReels.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : filteredReels.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="videocam-off" size={64} color="#64748b" />
          <Text style={styles.emptyTitle}>No Reels Yet</Text>
          <Text style={styles.emptyText}>
            Be the first to share a {selectedCategory !== 'all' ? selectedCategory : 'cricket'} reel!
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={filteredReels}
          renderItem={renderReel}
          keyExtractor={(item) => item.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={REEL_HEIGHT}
          snapToAlignment="start"
          decelerationRate="fast"
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#10b981"
            />
          }
          getItemLayout={(_, index) => ({
            length: REEL_HEIGHT,
            offset: REEL_HEIGHT * index,
            index,
          })}
        />
      )}
    </SafeAreaView>
  );
}

// Individual Reel Component
function ReelItem({ reel, isActive, onLike }: { reel: Reel; isActive: boolean; onLike: () => void }) {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (isActive) {
      videoRef.current?.playAsync();
      setIsPlaying(true);
    } else {
      videoRef.current?.pauseAsync();
      setIsPlaying(false);
    }
  }, [isActive]);

  const togglePlayPause = async () => {
    if (isPlaying) {
      await videoRef.current?.pauseAsync();
    } else {
      await videoRef.current?.playAsync();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = async () => {
    await videoRef.current?.setIsMutedAsync(!isMuted);
    setIsMuted(!isMuted);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'batting': return '#10b981';
      case 'bowling': return '#3b82f6';
      case 'fielding': return '#f59e0b';
      case 'workouts': return '#ef4444';
      case 'coach_tips': return '#8b5cf6';
      default: return '#64748b';
    }
  };

  return (
    <View style={styles.reelContainer}>
      {/* Video */}
      <TouchableOpacity activeOpacity={1} onPress={togglePlayPause} style={styles.videoContainer}>
        <Video
          ref={videoRef}
          source={{ uri: reel.video_url }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          isLooping
          shouldPlay={isActive}
          isMuted={isMuted}
        />
        
        {/* Play/Pause indicator */}
        {!isPlaying && (
          <View style={styles.pauseIndicator}>
            <Ionicons name="play" size={48} color="rgba(255,255,255,0.8)" />
          </View>
        )}
      </TouchableOpacity>

      {/* Overlay Content */}
      <View style={styles.overlay}>
        {/* Right side actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={onLike}>
            <Ionicons 
              name={reel.is_liked ? 'heart' : 'heart-outline'} 
              size={32} 
              color={reel.is_liked ? '#ef4444' : '#fff'} 
            />
            <Text style={styles.actionText}>{formatNumber(reel.likes)}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={28} color="#fff" />
            <Text style={styles.actionText}>{formatNumber(reel.comments)}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-social-outline" size={28} color="#fff" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={toggleMute}>
            <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Bottom info */}
        <View style={styles.infoContainer}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{reel.user_name.charAt(0)}</Text>
            </View>
            <Text style={styles.userName}>{reel.user_name}</Text>
            <View style={[styles.levelBadge, { backgroundColor: getCategoryColor(reel.category) }]}>
              <Text style={styles.levelText}>{reel.level}</Text>
            </View>
          </View>

          {reel.description && (
            <Text style={styles.description} numberOfLines={2}>
              {reel.description}
            </Text>
          )}

          <View style={styles.categoryTag}>
            <Ionicons 
              name={categories.find(c => c.id === reel.category)?.icon as any || 'pricetag'} 
              size={14} 
              color="#fff" 
            />
            <Text style={styles.categoryTagText}>
              {reel.category.replace('_', ' ')}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  categoryContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 8,
  },
  categoryList: {
    paddingHorizontal: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: '#10b981',
  },
  categoryChipText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
  reelContainer: {
    height: REEL_HEIGHT,
    width: SCREEN_WIDTH,
  },
  videoContainer: {
    flex: 1,
  },
  video: {
    flex: 1,
  },
  pauseIndicator: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    paddingTop: 60,
  },
  actionsContainer: {
    position: 'absolute',
    right: 12,
    bottom: 100,
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  infoContainer: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  description: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    alignSelf: 'flex-start',
  },
  categoryTagText: {
    color: '#fff',
    fontSize: 12,
    textTransform: 'capitalize',
  },
});
