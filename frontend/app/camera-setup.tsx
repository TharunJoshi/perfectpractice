import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSessionStore } from '../src/store/sessionStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function CameraSetup() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { createSession } = useSessionStore();
  
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [loading, setLoading] = useState(false);
  const [areaChecked, setAreaChecked] = useState(false);
  
  // Session params from navigation
  const sessionParams = {
    practiceType: params.practiceType as string || 'solo',
    numPlayers: parseInt(params.numPlayers as string) || 1,
    skillLevel: params.skillLevel as string || 'intermediate',
    focusArea: params.focusArea as string || 'batting',
    duration: parseInt(params.duration as string) || 60,
    goal: params.goal as string || '',
  };

  const handleStartSession = async () => {
    try {
      setLoading(true);
      const session = await createSession({
        day_number: 1,
        duration: sessionParams.duration,
        focus_area: sessionParams.focusArea,
        goal: sessionParams.goal || null,
        num_players: sessionParams.numPlayers,
        skill_level: sessionParams.skillLevel,
      });
      
      router.replace(`/session/${session.id}`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading camera...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={80} color="#10b981" />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            We need camera access to help you check your practice area and record your sessions for AI feedback.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.skipButton} 
            onPress={handleStartSession}
          >
            <Text style={styles.skipButtonText}>Skip & Start Without Camera</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Check Your Practice Area</Text>
        <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
          <Ionicons name="camera-reverse" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Camera Preview */}
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} facing={facing}>
          {/* Grid Overlay */}
          <View style={styles.gridOverlay}>
            {/* Horizontal lines */}
            <View style={[styles.gridLine, styles.horizontalLine, { top: '33%' }]} />
            <View style={[styles.gridLine, styles.horizontalLine, { top: '66%' }]} />
            {/* Vertical lines */}
            <View style={[styles.gridLine, styles.verticalLine, { left: '33%' }]} />
            <View style={[styles.gridLine, styles.verticalLine, { left: '66%' }]} />
          </View>
          
          {/* Practice Area Guide */}
          <View style={styles.practiceAreaGuide}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </CameraView>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>Setup Tips</Text>
        <View style={styles.tipRow}>
          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          <Text style={styles.tipText}>Position camera to capture your full body</Text>
        </View>
        <View style={styles.tipRow}>
          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          <Text style={styles.tipText}>Ensure good lighting in your practice area</Text>
        </View>
        <View style={styles.tipRow}>
          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          <Text style={styles.tipText}>Keep 6-10 feet distance from camera</Text>
        </View>
        <View style={styles.tipRow}>
          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          <Text style={styles.tipText}>Clear the area of obstacles</Text>
        </View>
      </View>

      {/* Session Info */}
      <View style={styles.sessionInfo}>
        <View style={styles.sessionBadge}>
          <Ionicons 
            name={sessionParams.practiceType === 'solo' ? 'person' : 'people'} 
            size={16} 
            color="#10b981" 
          />
          <Text style={styles.sessionBadgeText}>
            {sessionParams.practiceType === 'solo' ? 'Solo' : `Team (${sessionParams.numPlayers})`}
          </Text>
        </View>
        <View style={styles.sessionBadge}>
          <Ionicons name="fitness" size={16} color="#3b82f6" />
          <Text style={styles.sessionBadgeText}>{sessionParams.focusArea}</Text>
        </View>
        <View style={styles.sessionBadge}>
          <Ionicons name="time" size={16} color="#8b5cf6" />
          <Text style={styles.sessionBadgeText}>{sessionParams.duration} min</Text>
        </View>
      </View>

      {/* Confirm Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.confirmButton, loading && styles.buttonDisabled]}
          onPress={handleStartSession}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.confirmButtonText}>Looks Good - Start Practice</Text>
              <Ionicons name="arrow-forward" size={24} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 16,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 24,
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    marginTop: 16,
    padding: 16,
  },
  skipButtonText: {
    color: '#64748b',
    fontSize: 14,
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
  flipButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraContainer: {
    height: SCREEN_HEIGHT * 0.4,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  horizontalLine: {
    left: 0,
    right: 0,
    height: 1,
  },
  verticalLine: {
    top: 0,
    bottom: 0,
    width: 1,
  },
  practiceAreaGuide: {
    ...StyleSheet.absoluteFillObject,
    margin: 24,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#10b981',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  instructionsContainer: {
    padding: 16,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  sessionInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  sessionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  sessionBadgeText: {
    fontSize: 12,
    color: '#e2e8f0',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  buttonContainer: {
    padding: 16,
    marginTop: 'auto',
  },
  confirmButton: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
