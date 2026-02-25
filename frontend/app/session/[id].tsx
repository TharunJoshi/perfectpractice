import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSessionStore } from '../../src/store/sessionStore';
import { useAuthStore } from '../../src/store/authStore';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

export default function SessionDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { currentSession, getSession, startSession, nextStep, completeSession } = useSessionStore();
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCalorieModal, setShowCalorieModal] = useState(false);
  const [calories, setCalories] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);

  useEffect(() => {
    loadSession();
  }, [id]);

  const loadSession = async () => {
    try {
      setRefreshing(true);
      await getSession(id as string);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleStartSession = async () => {
    if (!currentSession) return;
    
    try {
      setLoading(true);
      await startSession(currentSession.id);
      Alert.alert('Session Started!', 'Begin with your warm-up');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = async () => {
    if (!currentSession) return;
    
    try {
      setLoading(true);
      await nextStep(currentSession.id);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSession = async () => {
    if (!currentSession) return;
    
    Alert.alert(
      'Complete Session',
      'Are you sure you want to complete this session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              setLoading(true);
              await completeSession(currentSession.id);
              Alert.alert('Success', 'Session completed successfully!', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleLogCalories = async () => {
    if (!calories || isNaN(parseFloat(calories))) {
      Alert.alert('Error', 'Please enter a valid number');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${API_URL}/sessions/${id}/activities`,
        { calories: parseFloat(calories) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowCalorieModal(false);
      setCalories('');
      Alert.alert('Success', 'Calories logged successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to log calories');
    }
  };

  const handleUploadShot = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setUploadingMedia(true);
        const token = await AsyncStorage.getItem('token');
        
        const fileType = result.assets[0].type === 'video' ? 'video' : 'image';
        const base64Data = `data:${result.assets[0].mimeType || 'image/jpeg'};base64,${result.assets[0].base64}`;

        const response = await axios.post(
          `${API_URL}/sessions/${id}/media`,
          {
            file_data: base64Data,
            file_type: fileType,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setUploadingMedia(false);
        
        const feedback = response.data.ai_feedback;
        Alert.alert(
          '🎯 AI Feedback',
          `What You're Doing Right:\n${feedback.doing_right.join('\n')}\n\nNeeds Improvement:\n${feedback.needs_improvement.join('\n')}\n\n💡 Tip: ${feedback.correction_tip}`,
          [{ text: 'Got it!' }]
        );
      }
    } catch (error: any) {
      setUploadingMedia(false);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to upload media');
    }
  };

  if (!currentSession || refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  const isHost = currentSession.host_id === user?.id;
  const isSolo = currentSession.is_solo || currentSession.participants.length === 1;
  const participants = currentSession.participants || [];
  
  const currentSteps = 
    currentSession.current_phase === 'warmup' 
      ? currentSession.warmup_steps 
      : currentSession.current_phase === 'practice'
      ? currentSession.practice_steps
      : currentSession.cooldown_steps;
  const currentStep = currentSteps[currentSession.current_step_index];
  const stepVideos = currentStep?.videos || [];

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'warmup':
        return '#f59e0b';
      case 'practice':
        return '#10b981';
      case 'cooldown':
        return '#3b82f6';
      default:
        return '#64748b';
    }
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'warmup':
        return 'flame';
      case 'practice':
        return 'basketball';
      case 'cooldown':
        return 'snow';
      default:
        return 'fitness';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{currentSession.goal}</Text>
        <TouchableOpacity onPress={loadSession}>
          <Ionicons name="refresh" size={24} color="#10b981" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Session Info Card */}
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar" size={20} color="#10b981" />
              <Text style={styles.infoText}>Day {currentSession.day_number}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="time" size={20} color="#10b981" />
              <Text style={styles.infoText}>{currentSession.duration} min</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="trophy" size={20} color="#10b981" />
              <Text style={styles.infoText}>{currentSession.focus_area}</Text>
            </View>
          </View>
          {isSolo && (
            <View style={styles.soloIndicator}>
              <Ionicons name="person" size={16} color="#10b981" />
              <Text style={styles.soloText}>Solo Practice - {currentSession.skill_level}</Text>
            </View>
          )}
          {!isSolo && (
            <View style={styles.participantsRow}>
              <Ionicons name="people" size={16} color="#3b82f6" />
              <Text style={styles.participantsText}>
                {participants.length}/{currentSession.num_players} Players
              </Text>
            </View>
          )}
        </View>

        {/* AI Practice Plan (if available) */}
        {currentSession.ai_practice_plan && currentSession.status === 'waiting' && (
          <View style={styles.aiPlanCard}>
            <View style={styles.aiPlanHeader}>
              <Ionicons name="sparkles" size={24} color="#8b5cf6" />
              <Text style={styles.aiPlanTitle}>AI-Generated Practice Plan</Text>
            </View>
            <Text style={styles.aiPlanGoal}>{currentSession.ai_practice_plan.goal}</Text>
            
            <Text style={styles.aiPlanSectionTitle}>Focus Points:</Text>
            {currentSession.ai_practice_plan.focus_points?.map((point, index) => (
              <View key={index} style={styles.aiPlanItem}>
                <Text style={styles.aiPlanBullet}>•</Text>
                <Text style={styles.aiPlanText}>{point}</Text>
              </View>
            ))}

            {currentSession.ai_practice_plan.personalized_note && (
              <View style={styles.personalizedNote}>
                <Ionicons name="information-circle" size={16} color="#f59e0b" />
                <Text style={styles.personalizedNoteText}>
                  {currentSession.ai_practice_plan.personalized_note}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Join Code (if waiting and not solo) */}
        {currentSession.status === 'waiting' && !isSolo && (
          <View style={styles.joinCodeCard}>
            <Ionicons name="key" size={32} color="#10b981" />
            <Text style={styles.joinCodeLabel}>Join Code</Text>
            <Text style={styles.joinCode}>{currentSession.join_code}</Text>
            <Text style={styles.joinCodeHint}>
              {isHost 
                ? `Share with ${currentSession.num_players - participants.length} more player(s)` 
                : 'Waiting for host to start...'}
            </Text>
            <Text style={styles.participantsCount}>
              {participants.length}/{currentSession.num_players} players joined
            </Text>
          </View>
        )}

        {/* Current Phase (if active) */}
        {currentSession.status === 'active' && (
          <>
            <View style={[styles.phaseCard, { borderColor: getPhaseColor(currentSession.current_phase) }]}>
              <View style={styles.phaseHeader}>
                <Ionicons 
                  name={getPhaseIcon(currentSession.current_phase)} 
                  size={28} 
                  color={getPhaseColor(currentSession.current_phase)} 
                />
                <Text style={styles.phaseTitle}>
                  {currentSession.current_phase.toUpperCase()}
                </Text>
              </View>
              
              <View style={styles.stepCard}>
                <Text style={styles.stepName}>{currentStep.name}</Text>
                <Text style={styles.stepDescription}>{currentStep.description}</Text>
                <View style={styles.stepDuration}>
                  <Ionicons name="timer" size={16} color="#94a3b8" />
                  <Text style={styles.stepDurationText}>{currentStep.duration} minutes</Text>
                </View>

                {/* Instructional Videos */}
                {stepVideos.length > 0 && (
                  <View style={styles.videosSection}>
                    <Text style={styles.videosTitle}>
                      📹 Watch & Learn ({stepVideos.length} videos)
                    </Text>
                    {stepVideos.map((video: any, index: number) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.videoItem}
                        onPress={() => {
                          Alert.alert(
                            video.title,
                            `Video URL: ${video.url}\n\nNote: Video will open in browser. Replace placeholder URLs with your actual cricket training videos.`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Open Video',
                                onPress: () => {
                                  // Open video in browser or WebView
                                  // You can use expo-web-browser or react-native-webview
                                },
                              },
                            ]
                          );
                        }}
                      >
                        <Ionicons name="play-circle" size={24} color="#10b981" />
                        <Text style={styles.videoTitle}>{video.title}</Text>
                        <Ionicons name="chevron-forward" size={20} color="#64748b" />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${((currentSession.current_step_index + 1) / currentSteps.length) * 100}%`,
                      backgroundColor: getPhaseColor(currentSession.current_phase)
                    }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                Step {currentSession.current_step_index + 1} of {currentSteps.length}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => setShowCalorieModal(true)}
              >
                <Ionicons name="flame" size={24} color="#f59e0b" />
                <Text style={styles.actionButtonText}>Log Calories</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleUploadShot}
                disabled={uploadingMedia}
              >
                {uploadingMedia ? (
                  <ActivityIndicator color="#8b5cf6" />
                ) : (
                  <>
                    <Ionicons name="camera" size={24} color="#8b5cf6" />
                    <Text style={styles.actionButtonText}>Upload Shot</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Completed Badge */}
        {currentSession.status === 'completed' && (
          <View style={styles.completedCard}>
            <Ionicons name="checkmark-circle" size={64} color="#10b981" />
            <Text style={styles.completedTitle}>Session Completed!</Text>
            <Text style={styles.completedText}>Great work on completing your practice</Text>
          </View>
        )}

        {/* Host Controls */}
        {isHost && currentSession.status !== 'completed' && (
          <View style={styles.hostControls}>
            {currentSession.status === 'waiting' && (
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleStartSession}
                disabled={loading || participants.length < currentSession.num_players}
              >
                <Text style={styles.buttonText}>
                  {loading 
                    ? 'Starting...' 
                    : participants.length < currentSession.num_players
                    ? `Waiting for ${currentSession.num_players - participants.length} more player(s)...`
                    : 'Start Session'}
                </Text>
              </TouchableOpacity>
            )}

            {currentSession.status === 'active' && (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={handleNextStep}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>
                    {loading ? 'Loading...' : 'Next Step'}
                  </Text>
                </TouchableOpacity>

                {currentSession.current_phase === 'cooldown' && 
                 currentSession.current_step_index === currentSession.cooldown_steps.length - 1 && (
                  <TouchableOpacity
                    style={[styles.button, styles.successButton]}
                    onPress={handleCompleteSession}
                    disabled={loading}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? 'Completing...' : 'Complete Session'}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* Calorie Modal */}
      <Modal
        visible={showCalorieModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCalorieModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Log Calories</Text>
                <TouchableOpacity onPress={() => setShowCalorieModal(false)}>
                  <Ionicons name="close" size={28} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Calories Burned</Text>
                <TextInput
                  style={styles.input}
                  value={calories}
                  onChangeText={setCalories}
                  placeholder="Enter calories"
                  keyboardType="numeric"
                  placeholderTextColor="#64748b"
                />
              </View>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleLogCalories}
              >
                <Text style={styles.modalButtonText}>Log Calories</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  infoItem: {
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#e2e8f0',
    fontWeight: '500',
  },
  joinCodeCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 32,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10b98120',
  },
  joinCodeLabel: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 12,
  },
  joinCode: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#10b981',
    letterSpacing: 8,
    marginTop: 8,
  },
  joinCodeHint: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 12,
    textAlign: 'center',
  },
  phaseCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  phaseTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  stepCard: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  stepName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 12,
  },
  stepDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepDurationText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#0f172a',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  completedCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#10b98120',
  },
  completedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  completedText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
  },
  hostControls: {
    gap: 12,
    marginBottom: 24,
  },
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#10b981',
  },
  successButton: {
    backgroundColor: '#3b82f6',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  soloIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  soloText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  participantsText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  participantsCount: {
    fontSize: 14,
    color: '#10b981',
    marginTop: 8,
    fontWeight: '600',
  },
  aiPlanCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#8b5cf620',
  },
  aiPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  aiPlanTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  aiPlanGoal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  aiPlanSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
    marginTop: 8,
  },
  aiPlanItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 8,
  },
  aiPlanBullet: {
    color: '#10b981',
    marginRight: 8,
    fontSize: 16,
  },
  aiPlanText: {
    flex: 1,
    fontSize: 14,
    color: '#e2e8f0',
    lineHeight: 20,
  },
  personalizedNote: {
    flexDirection: 'row',
    backgroundColor: '#f59e0b20',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    gap: 8,
  },
  personalizedNoteText: {
    flex: 1,
    fontSize: 13,
    color: '#f59e0b',
    lineHeight: 18,
  },
  videosSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  videosTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 12,
  },
  videoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  videoTitle: {
    flex: 1,
    fontSize: 14,
    color: '#e2e8f0',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalContent: {
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
