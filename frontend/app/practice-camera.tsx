import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
  PanResponder,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CAMERA_HEIGHT = SCREEN_HEIGHT * 0.6;

type SetupStep = 'arena' | 'position' | 'ready' | 'recording' | 'preview';
type Point = { x: number; y: number };

export default function PracticeCamera() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const cameraRef = useRef<any>(null);
  
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [setupStep, setSetupStep] = useState<SetupStep>('arena');
  const [arenaPoints, setArenaPoints] = useState<Point[]>([]);
  const [playerPosition, setPlayerPosition] = useState<Point>({ x: SCREEN_WIDTH / 2, y: CAMERA_HEIGHT / 2 });
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  
  // Session params
  const focusArea = params.focusArea as string || 'batting';
  const skillLevel = params.skillLevel as string || 'intermediate';
  
  // Pan responder for dragging player position
  const pan = useRef(new Animated.ValueXY({ x: playerPosition.x - 25, y: playerPosition.y - 25 })).current;
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, gesture) => {
        const newX = Math.max(50, Math.min(SCREEN_WIDTH - 50, playerPosition.x + gesture.dx));
        const newY = Math.max(50, Math.min(CAMERA_HEIGHT - 50, playerPosition.y + gesture.dy));
        setPlayerPosition({ x: newX, y: newY });
        pan.setValue({ x: newX - 25, y: newY - 25 });
      },
    })
  ).current;

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Handle arena point tap
  const handleArenaTap = (event: any) => {
    if (setupStep !== 'arena' || arenaPoints.length >= 4) return;
    
    const { locationX, locationY } = event.nativeEvent;
    const newPoint = { x: locationX, y: locationY };
    const newPoints = [...arenaPoints, newPoint];
    setArenaPoints(newPoints);
    
    if (newPoints.length === 4) {
      setTimeout(() => setSetupStep('position'), 500);
    }
  };

  // Start/Stop Recording
  const toggleRecording = async () => {
    if (!cameraRef.current) return;

    if (isRecording) {
      // Stop recording
      cameraRef.current.stopRecording();
      setIsRecording(false);
    } else {
      // Start recording
      setIsRecording(true);
      setRecordingTime(0);
      
      try {
        const video = await cameraRef.current.recordAsync({
          maxDuration: 1200, // 20 minutes max
          quality: '720p',
        });
        setVideoUri(video.uri);
        setSetupStep('preview');
      } catch (error) {
        console.error('Recording error:', error);
        setIsRecording(false);
      }
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get position label based on focus area
  const getPositionLabel = () => {
    switch (focusArea) {
      case 'batting': return 'batting crease';
      case 'bowling': return 'bowling mark';
      case 'fielding': return 'fielding position';
      default: return 'position';
    }
  };

  // Navigate to trimmer
  const goToTrimmer = () => {
    if (videoUri) {
      router.push({
        pathname: '/video-trimmer',
        params: {
          videoUri,
          focusArea,
          skillLevel,
        },
      });
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
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
            We need camera access to record your practice sessions for AI feedback.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
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
        <Text style={styles.headerTitle}>
          {setupStep === 'arena' ? 'Mark Practice Area' :
           setupStep === 'position' ? 'Mark Your Position' :
           setupStep === 'recording' ? 'Recording' :
           setupStep === 'preview' ? 'Preview' : 'Ready to Record'}
        </Text>
        <TouchableOpacity style={styles.flipButton} onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}>
          <Ionicons name="camera-reverse" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={handleArenaTap}
          style={styles.cameraTouchable}
        >
          <CameraView 
            ref={cameraRef}
            style={styles.camera} 
            facing={facing}
            mode="video"
          >
            {/* Arena Points */}
            {arenaPoints.map((point, index) => (
              <View
                key={index}
                style={[
                  styles.arenaPoint,
                  { left: point.x - 15, top: point.y - 15 }
                ]}
              >
                <Text style={styles.arenaPointText}>{index + 1}</Text>
              </View>
            ))}

            {/* Arena Lines */}
            {arenaPoints.length === 4 && (
              <View style={styles.arenaOverlay}>
                {/* Draw lines between points */}
                <View style={[styles.arenaLine, {
                  left: arenaPoints[0].x,
                  top: arenaPoints[0].y,
                  width: Math.sqrt(Math.pow(arenaPoints[1].x - arenaPoints[0].x, 2) + Math.pow(arenaPoints[1].y - arenaPoints[0].y, 2)),
                  transform: [{ rotate: `${Math.atan2(arenaPoints[1].y - arenaPoints[0].y, arenaPoints[1].x - arenaPoints[0].x)}rad` }],
                }]} />
              </View>
            )}

            {/* Player Position Marker */}
            {setupStep !== 'arena' && (
              <Animated.View
                {...panResponder.panHandlers}
                style={[
                  styles.playerMarker,
                  { transform: pan.getTranslateTransform() }
                ]}
              >
                <Ionicons 
                  name={focusArea === 'batting' ? 'baseball' : focusArea === 'bowling' ? 'ellipse' : 'person'} 
                  size={24} 
                  color="#fff" 
                />
              </Animated.View>
            )}

            {/* Recording Indicator */}
            {isRecording && (
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingTime}>{formatTime(recordingTime)}</Text>
              </View>
            )}
          </CameraView>
        </TouchableOpacity>
      </View>

      {/* Instructions & Controls */}
      <View style={styles.controlsContainer}>
        {setupStep === 'arena' && (
          <>
            <Text style={styles.instructionTitle}>Tap to mark 4 corners of your practice area</Text>
            <View style={styles.progressDots}>
              {[0, 1, 2, 3].map(i => (
                <View 
                  key={i} 
                  style={[styles.progressDot, arenaPoints.length > i && styles.progressDotFilled]} 
                />
              ))}
            </View>
            <Text style={styles.instructionText}>
              {arenaPoints.length < 4 
                ? `Point ${arenaPoints.length + 1} of 4` 
                : 'Arena marked!'}
            </Text>
            {arenaPoints.length > 0 && (
              <TouchableOpacity 
                style={styles.resetButton}
                onPress={() => setArenaPoints([])}
              >
                <Text style={styles.resetButtonText}>Reset Points</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {setupStep === 'position' && (
          <>
            <Text style={styles.instructionTitle}>Drag the marker to your {getPositionLabel()}</Text>
            <Text style={styles.instructionText}>
              Position yourself where you'll be {focusArea === 'batting' ? 'batting' : focusArea === 'bowling' ? 'bowling' : 'fielding'}
            </Text>
            <TouchableOpacity 
              style={styles.confirmButton}
              onPress={() => setSetupStep('ready')}
            >
              <Text style={styles.confirmButtonText}>Confirm Position</Text>
              <Ionicons name="checkmark" size={20} color="#fff" />
            </TouchableOpacity>
          </>
        )}

        {setupStep === 'ready' && (
          <>
            <Text style={styles.instructionTitle}>Ready to Record!</Text>
            <Text style={styles.instructionText}>
              Record your {focusArea} practice. You can record up to 20 minutes.
            </Text>
            <View style={styles.tipContainer}>
              <Ionicons name="bulb" size={20} color="#f59e0b" />
              <Text style={styles.tipText}>Tip: You'll trim to 30 seconds for AI analysis</Text>
            </View>
            <TouchableOpacity 
              style={styles.recordButton}
              onPress={toggleRecording}
            >
              <View style={styles.recordButtonInner} />
            </TouchableOpacity>
            <Text style={styles.recordHint}>Tap to start recording</Text>
          </>
        )}

        {setupStep === 'recording' && (
          <>
            <Text style={styles.instructionTitle}>Recording in progress...</Text>
            <Text style={styles.recordingTimeDisplay}>{formatTime(recordingTime)}</Text>
            <TouchableOpacity 
              style={[styles.recordButton, styles.recordButtonActive]}
              onPress={toggleRecording}
            >
              <View style={styles.stopButtonInner} />
            </TouchableOpacity>
            <Text style={styles.recordHint}>Tap to stop recording</Text>
          </>
        )}

        {setupStep === 'preview' && videoUri && (
          <>
            <Text style={styles.instructionTitle}>Recording Complete!</Text>
            <Text style={styles.instructionText}>
              Duration: {formatTime(recordingTime)}
            </Text>
            <View style={styles.previewActions}>
              <TouchableOpacity 
                style={styles.retakeButton}
                onPress={() => {
                  setVideoUri(null);
                  setSetupStep('ready');
                  setRecordingTime(0);
                }}
              >
                <Ionicons name="refresh" size={20} color="#fff" />
                <Text style={styles.retakeButtonText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.trimButton}
                onPress={goToTrimmer}
              >
                <Ionicons name="cut" size={20} color="#fff" />
                <Text style={styles.trimButtonText}>Trim & Upload</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
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
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
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
    height: CAMERA_HEIGHT,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  cameraTouchable: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  arenaPoint: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  arenaPointText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  arenaOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  arenaLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#10b981',
    transformOrigin: 'left center',
  },
  playerMarker: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  recordingIndicator: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ef4444',
    marginRight: 8,
  },
  recordingTime: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  controlsContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  instructionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 20,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#334155',
  },
  progressDotFilled: {
    backgroundColor: '#10b981',
  },
  resetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#334155',
    marginTop: 12,
  },
  resetButtonText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  confirmButton: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 10,
    marginBottom: 24,
  },
  tipText: {
    color: '#f59e0b',
    fontSize: 13,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  recordButtonActive: {
    borderColor: '#ef4444',
  },
  recordButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ef4444',
  },
  stopButtonInner: {
    width: 30,
    height: 30,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  recordHint: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 12,
  },
  recordingTimeDisplay: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 24,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
  },
  retakeButton: {
    flexDirection: 'row',
    backgroundColor: '#334155',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  retakeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  trimButton: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  trimButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
