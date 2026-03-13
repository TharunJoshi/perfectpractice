import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { useSessionStore } from '../../src/store/sessionStore';
import { useRouter } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48 - 12) / 2; // 24px padding each side, 12px gap

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { joinSession } = useSessionStore();
  
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  
  // Practice type selected
  const [practiceType, setPracticeType] = useState<'solo' | 'team'>('solo');
  
  // Create session form
  const [duration, setDuration] = useState('60');
  const [focusArea, setFocusArea] = useState('batting');
  const [goal, setGoal] = useState('');
  const [numPlayers, setNumPlayers] = useState(2);
  const [skillLevel, setSkillLevel] = useState('intermediate');
  
  // Join session form
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePracticeSelect = (type: 'solo' | 'team') => {
    setPracticeType(type);
    if (type === 'solo') {
      setNumPlayers(1);
    } else {
      setNumPlayers(2);
    }
    setShowConfigModal(true);
  };

  const handleProceedToCamera = () => {
    const durationNum = parseInt(duration);
    if (durationNum < 30) {
      Alert.alert('Error', 'Duration must be at least 30 minutes');
      return;
    }
    
    setShowConfigModal(false);
    
    // Navigate to camera setup with session params
    router.push({
      pathname: '/camera-setup',
      params: {
        practiceType,
        numPlayers: practiceType === 'solo' ? 1 : numPlayers,
        skillLevel,
        focusArea,
        duration: durationNum,
        goal: goal.trim(),
      },
    });
  };

  const handleJoinSession = async () => {
    if (!joinCode.trim()) {
      Alert.alert('Error', 'Please enter a join code');
      return;
    }

    try {
      setLoading(true);
      const session = await joinSession(joinCode.trim());
      setShowJoinModal(false);
      setJoinCode('');
      
      // Navigate to camera setup for joining session
      router.push({
        pathname: '/camera-setup',
        params: {
          practiceType: 'team',
          numPlayers: session.num_players,
          skillLevel: session.skill_level,
          focusArea: session.focus_area,
          duration: session.duration,
          goal: session.goal || '',
          sessionId: session.id,
          isJoining: 'true',
        },
      });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]}!</Text>
            <Text style={styles.subGreeting}>Ready for perfect practice?</Text>
          </View>
          <View style={styles.iconContainer}>
            <Ionicons name="fitness" size={32} color="#10b981" />
          </View>
        </View>

        {/* Practice Cards - Side by Side */}
        <View style={styles.practiceCardsRow}>
          {/* Solo Practice Card */}
          <TouchableOpacity
            style={[styles.practiceCard, styles.soloCard]}
            onPress={() => handlePracticeSelect('solo')}
          >
            <View style={[styles.cardIconCircle, styles.soloIconCircle]}>
              <Ionicons name="person" size={32} color="#10b981" />
            </View>
            <Text style={styles.cardTitle}>Solo</Text>
            <Text style={styles.cardSubtitle}>Practice</Text>
            <Text style={styles.cardDescription}>AI-guided training</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Instant Start</Text>
            </View>
          </TouchableOpacity>

          {/* Team Practice Card */}
          <TouchableOpacity
            style={[styles.practiceCard, styles.teamCard]}
            onPress={() => handlePracticeSelect('team')}
          >
            <View style={[styles.cardIconCircle, styles.teamIconCircle]}>
              <Ionicons name="people" size={32} color="#3b82f6" />
            </View>
            <Text style={styles.cardTitle}>Team</Text>
            <Text style={styles.cardSubtitle}>Practice</Text>
            <Text style={styles.cardDescription}>2-10 players</Text>
          </TouchableOpacity>
        </View>

        {/* Join Session Card - Full Width */}
        <TouchableOpacity
          style={styles.joinCard}
          onPress={() => setShowJoinModal(true)}
        >
          <View style={styles.joinCardContent}>
            <View style={[styles.cardIconCircle, styles.joinIconCircle]}>
              <Ionicons name="enter" size={28} color="#8b5cf6" />
            </View>
            <View style={styles.joinTextContainer}>
              <Text style={styles.joinTitle}>Join Session</Text>
              <Text style={styles.joinDescription}>Enter code to join existing session</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#64748b" />
        </TouchableOpacity>

        {/* Features Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>✨ Features</Text>
          <View style={styles.featuresGrid}>
            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="sparkles" size={20} color="#10b981" />
              </View>
              <Text style={styles.featureText}>AI Practice Plans</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="videocam" size={20} color="#3b82f6" />
              </View>
              <Text style={styles.featureText}>Video Analysis</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="analytics" size={20} color="#8b5cf6" />
              </View>
              <Text style={styles.featureText}>Track Progress</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="trophy" size={20} color="#f59e0b" />
              </View>
              <Text style={styles.featureText}>Skill Levels</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Configure Session Modal */}
      <Modal
        visible={showConfigModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowConfigModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAwareScrollView
            style={styles.modalContainer}
            contentContainerStyle={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {practiceType === 'solo' ? 'Solo Practice' : 'Team Practice'}
              </Text>
              <TouchableOpacity onPress={() => setShowConfigModal(false)}>
                <Ionicons name="close" size={28} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {practiceType === 'team' && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Number of Players</Text>
                <View style={styles.playerSelector}>
                  {[2, 3, 4, 5, 6].map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={[
                        styles.playerButton,
                        numPlayers === num && styles.playerButtonActive,
                      ]}
                      onPress={() => setNumPlayers(num)}
                    >
                      <Text
                        style={[
                          styles.playerButtonText,
                          numPlayers === num && styles.playerButtonTextActive,
                        ]}
                      >
                        {num}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Skill Level</Text>
              <View style={styles.segmentControl}>
                {['beginner', 'intermediate', 'advanced'].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.segment,
                      skillLevel === level && styles.segmentActive,
                    ]}
                    onPress={() => setSkillLevel(level)}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        skillLevel === level && styles.segmentTextActive,
                      ]}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Duration (minutes)</Text>
              <TextInput
                style={styles.input}
                value={duration}
                onChangeText={setDuration}
                keyboardType="number-pad"
                placeholder="Minimum 30 minutes"
                placeholderTextColor="#64748b"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Focus Area</Text>
              <View style={styles.segmentControl}>
                {['batting', 'bowling', 'fielding'].map((area) => (
                  <TouchableOpacity
                    key={area}
                    style={[
                      styles.segment,
                      focusArea === area && styles.segmentActive,
                    ]}
                    onPress={() => setFocusArea(area)}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        focusArea === area && styles.segmentTextActive,
                      ]}
                    >
                      {area.charAt(0).toUpperCase() + area.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Goal <Text style={styles.optional}>(Optional)</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={goal}
                onChangeText={setGoal}
                placeholder="Leave blank for AI-generated plan"
                placeholderTextColor="#64748b"
              />
              <Text style={styles.hint}>
                💡 AI will create a personalized {skillLevel} plan for you!
              </Text>
            </View>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleProceedToCamera}
            >
              <Text style={styles.modalButtonText}>Next: Check Camera Area</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </KeyboardAwareScrollView>
        </View>
      </Modal>

      {/* Join Session Modal */}
      <Modal
        visible={showJoinModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowJoinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Join Session</Text>
                <TouchableOpacity onPress={() => setShowJoinModal(false)}>
                  <Ionicons name="close" size={28} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Enter Join Code</Text>
                <TextInput
                  style={styles.input}
                  value={joinCode}
                  onChangeText={setJoinCode}
                  placeholder="6-digit code"
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholderTextColor="#64748b"
                />
              </View>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleJoinSession}
                disabled={loading}
              >
                <Text style={styles.modalButtonText}>
                  {loading ? 'Joining...' : 'Join Session'}
                </Text>
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
  },
  subGreeting: {
    fontSize: 15,
    color: '#94a3b8',
    marginTop: 4,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Side by side cards
  practiceCardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 16,
  },
  practiceCard: {
    width: CARD_WIDTH,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#334155',
  },
  soloCard: {
    borderColor: '#10b981',
  },
  teamCard: {
    borderColor: '#334155',
  },
  cardIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  soloIconCircle: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  teamIconCircle: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardSubtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
  },
  badge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 12,
  },
  badgeText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '600',
  },
  // Join card
  joinCard: {
    marginHorizontal: 24,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 24,
  },
  joinCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  joinIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  joinTextContainer: {
    gap: 2,
  },
  joinTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  joinDescription: {
    fontSize: 13,
    color: '#94a3b8',
  },
  // Features section
  infoSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureItem: {
    width: (SCREEN_WIDTH - 48 - 12) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  featureIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 13,
    color: '#e2e8f0',
    fontWeight: '500',
    flex: 1,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
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
  optional: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '400',
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
  hint: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
    fontStyle: 'italic',
  },
  playerSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  playerButton: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  playerButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  playerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
  },
  playerButtonTextActive: {
    color: '#fff',
  },
  segmentControl: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: '#10b981',
  },
  segmentText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#fff',
  },
  modalButton: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
