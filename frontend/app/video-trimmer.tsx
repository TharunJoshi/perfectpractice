import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CLIP_DURATION = 30; // 30 seconds max clip

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

export default function VideoTrimmer() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const videoRef = useRef<Video>(null);
  
  const videoUri = params.videoUri as string;
  const focusArea = params.focusArea as string || 'batting';
  const skillLevel = params.skillLevel as string || 'intermediate';
  
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [sharePublicly, setSharePublicly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(focusArea);

  const categories = [
    { id: 'batting', label: 'Batting', icon: 'baseball' },
    { id: 'bowling', label: 'Bowling', icon: 'ellipse' },
    { id: 'fielding', label: 'Fielding', icon: 'hand-left' },
    { id: 'workouts', label: 'Workouts', icon: 'fitness' },
    { id: 'coach_tips', label: 'Coach Tips', icon: 'school' },
  ];

  const levelOptions = [
    { id: 'local', label: 'Local' },
    { id: 'domestic', label: 'Domestic' },
    { id: 'international', label: 'International' },
  ];

  const [selectedLevel, setSelectedLevel] = useState('local');

  // Handle video load
  const onVideoLoad = (status: any) => {
    if (status.durationMillis) {
      const durationSec = status.durationMillis / 1000;
      setDuration(durationSec);
      setIsLoading(false);
    }
  };

  // Handle playback status update
  const onPlaybackStatusUpdate = (status: any) => {
    if (status.positionMillis) {
      setCurrentTime(status.positionMillis / 1000);
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Preview selected clip
  const previewClip = async () => {
    if (videoRef.current) {
      await videoRef.current.setPositionAsync(trimStart * 1000);
      await videoRef.current.playAsync();
      setIsPlaying(true);
      
      // Stop after clip duration
      setTimeout(async () => {
        if (videoRef.current) {
          await videoRef.current.pauseAsync();
          setIsPlaying(false);
        }
      }, CLIP_DURATION * 1000);
    }
  };

  // Pause/Play toggle
  const togglePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Seek to position
  const seekToPosition = async (position: number) => {
    if (videoRef.current) {
      await videoRef.current.setPositionAsync(position * 1000);
      setTrimStart(position);
    }
  };

  // Upload trimmed video
  const uploadVideo = async () => {
    try {
      setIsUploading(true);
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Please login to upload videos');
        return;
      }

      // In a real app, you would:
      // 1. Use ffmpeg or similar to actually trim the video
      // 2. Upload the trimmed video file
      // For now, we'll send metadata about the trim
      
      const response = await axios.post(
        `${API_URL}/reels/upload`,
        {
          video_uri: videoUri,
          trim_start: trimStart,
          trim_end: trimStart + CLIP_DURATION,
          category: selectedCategory,
          level: selectedLevel,
          focus_area: focusArea,
          skill_level: skillLevel,
          is_public: sharePublicly,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Alert.alert(
        'Upload Successful!',
        sharePublicly 
          ? 'Your clip has been uploaded and will appear in the Reels feed!'
          : 'Your clip has been uploaded for AI analysis!',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/home') }]
      );
    } catch (error: any) {
      Alert.alert('Upload Failed', error.response?.data?.detail || 'Please try again');
    } finally {
      setIsUploading(false);
    }
  };

  // Calculate max trim start position
  const maxTrimStart = Math.max(0, duration - CLIP_DURATION);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trim Your Clip</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Video Preview */}
        <View style={styles.videoContainer}>
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#10b981" />
              <Text style={styles.loadingText}>Loading video...</Text>
            </View>
          )}
          <Video
            ref={videoRef}
            source={{ uri: videoUri }}
            style={styles.video}
            resizeMode={ResizeMode.CONTAIN}
            onLoad={onVideoLoad}
            onPlaybackStatusUpdate={onPlaybackStatusUpdate}
            isLooping={false}
          />
          
          {/* Play/Pause Overlay */}
          <TouchableOpacity style={styles.playOverlay} onPress={togglePlayPause}>
            <View style={styles.playButton}>
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Trim Slider */}
        <View style={styles.trimSection}>
          <Text style={styles.sectionTitle}>Select 30-Second Clip</Text>
          <Text style={styles.timeDisplay}>
            {formatTime(trimStart)} - {formatTime(Math.min(trimStart + CLIP_DURATION, duration))}
          </Text>
          
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={maxTrimStart}
            value={trimStart}
            onValueChange={seekToPosition}
            minimumTrackTintColor="#10b981"
            maximumTrackTintColor="#334155"
            thumbTintColor="#10b981"
          />
          
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>0:00</Text>
            <Text style={styles.sliderLabel}>{formatTime(duration)}</Text>
          </View>

          <TouchableOpacity style={styles.previewButton} onPress={previewClip}>
            <Ionicons name="play-circle" size={20} color="#10b981" />
            <Text style={styles.previewButtonText}>Preview Selected Clip</Text>
          </TouchableOpacity>
        </View>

        {/* Category Selection */}
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat.id && styles.categoryChipSelected,
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Ionicons 
                  name={cat.icon as any} 
                  size={18} 
                  color={selectedCategory === cat.id ? '#fff' : '#94a3b8'} 
                />
                <Text style={[
                  styles.categoryChipText,
                  selectedCategory === cat.id && styles.categoryChipTextSelected,
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Level Selection */}
        <View style={styles.levelSection}>
          <Text style={styles.sectionTitle}>Level</Text>
          <View style={styles.levelOptions}>
            {levelOptions.map((level) => (
              <TouchableOpacity
                key={level.id}
                style={[
                  styles.levelChip,
                  selectedLevel === level.id && styles.levelChipSelected,
                ]}
                onPress={() => setSelectedLevel(level.id)}
              >
                <Text style={[
                  styles.levelChipText,
                  selectedLevel === level.id && styles.levelChipTextSelected,
                ]}>
                  {level.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Share Publicly Toggle */}
        <View style={styles.shareSection}>
          <View style={styles.shareContent}>
            <Ionicons name="globe" size={24} color="#10b981" />
            <View style={styles.shareTextContainer}>
              <Text style={styles.shareTitle}>Share as Public Reel</Text>
              <Text style={styles.shareDescription}>
                Allow other users to see this clip in the Reels feed
              </Text>
            </View>
          </View>
          <Switch
            value={sharePublicly}
            onValueChange={setSharePublicly}
            trackColor={{ false: '#334155', true: '#10b98150' }}
            thumbColor={sharePublicly ? '#10b981' : '#64748b'}
          />
        </View>

        {/* Upload Button */}
        <TouchableOpacity
          style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
          onPress={uploadVideo}
          disabled={isUploading}
        >
          {isUploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={24} color="#fff" />
              <Text style={styles.uploadButtonText}>
                {sharePublicly ? 'Upload & Share' : 'Upload for AI Analysis'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  videoContainer: {
    height: 220,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: 20,
  },
  video: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 10,
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trimSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  timeDisplay: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
    textAlign: 'center',
    marginBottom: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: 12,
    backgroundColor: '#1e293b',
    borderRadius: 12,
  },
  previewButtonText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
  categorySection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  categoryScroll: {
    flexGrow: 0,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  categoryChipSelected: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  categoryChipText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: '#fff',
  },
  levelSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  levelOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  levelChip: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  levelChipSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  levelChipText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  levelChipTextSelected: {
    color: '#fff',
  },
  shareSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 16,
  },
  shareContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  shareTextContainer: {
    flex: 1,
  },
  shareTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  shareDescription: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 32,
    paddingVertical: 18,
    backgroundColor: '#10b981',
    borderRadius: 16,
  },
  uploadButtonDisabled: {
    opacity: 0.7,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
