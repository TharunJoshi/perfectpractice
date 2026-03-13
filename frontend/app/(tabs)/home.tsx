import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { useSessionStore } from '../../src/store/sessionStore';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48 - 12) / 2;

// Animated pulse component
const PulseView = ({ children, style }: { children: React.ReactNode; style?: any }) => {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.02, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[style, { transform: [{ scale: pulse }] }]}>
      {children}
    </Animated.View>
  );
};

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { joinSession } = useSessionStore();
  
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [practiceType, setPracticeType] = useState<'solo' | 'team'>('solo');
  const [duration, setDuration] = useState('60');
  const [focusArea, setFocusArea] = useState('batting');
  const [goal, setGoal] = useState('');
  const [numPlayers, setNumPlayers] = useState(2);
  const [skillLevel, setSkillLevel] = useState('intermediate');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Animations
  const headerGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(headerGlow, { toValue: 1, duration: 3000, useNativeDriver: false }),
        Animated.timing(headerGlow, { toValue: 0, duration: 3000, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const handlePracticeSelect = (type: 'solo' | 'team') => {
    setPracticeType(type);
    setNumPlayers(type === 'solo' ? 1 : 2);
    setShowConfigModal(true);
  };

  const handleProceedToCamera = () => {
    const durationNum = parseInt(duration);
    if (durationNum < 30) {
      Alert.alert('⚠️ Error', 'Duration must be at least 30 minutes');
      return;
    }
    setShowConfigModal(false);
    router.push({
      pathname: '/practice-camera',
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
      router.push({
        pathname: '/practice-camera',
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

  const glowColor = headerGlow.interpolate({
    inputRange: [0, 1],
    outputRange: ['#ff6b6b', '#4ECDC4'],
  });

  return (
    <LinearGradient
      colors={['#0a0a1a', '#1a1a2e', '#0a0a1a']}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Anime Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Animated.Text style={[styles.greeting, { textShadowColor: glowColor }]}>
                Welcome back,
              </Animated.Text>
              <Text style={styles.userName}>{user?.name?.split(' ')[0] || 'Player'}!</Text>
              <Text style={styles.tagline}>⚡ Ready to level up? ⚡</Text>
            </View>
            <TouchableOpacity style={styles.avatarContainer}>
              <LinearGradient
                colors={['#ff6b6b', '#feca57', '#ff9ff3']}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </LinearGradient>
              <View style={styles.avatarGlow} />
            </TouchableOpacity>
          </View>

          {/* Stats Banner */}
          <LinearGradient
            colors={['rgba(102, 126, 234, 0.3)', 'rgba(118, 75, 162, 0.3)']}
            style={styles.statsBanner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>SESSIONS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0h</Text>
              <Text style={styles.statLabel}>PRACTICE</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>--</Text>
              <Text style={styles.statLabel}>STREAK</Text>
            </View>
          </LinearGradient>

          {/* Practice Cards - Side by Side */}
          <Text style={styles.sectionTitle}>🎯 START PRACTICE</Text>
          <View style={styles.practiceCardsRow}>
            {/* Solo Practice Card */}
            <PulseView>
              <TouchableOpacity
                style={styles.practiceCardWrapper}
                onPress={() => handlePracticeSelect('solo')}
              >
                <LinearGradient
                  colors={['#1a1a2e', '#16213e']}
                  style={styles.practiceCard}
                >
                  <LinearGradient
                    colors={['#ff6b6b', '#feca57']}
                    style={styles.cardIconCircle}
                  >
                    <Ionicons name="person" size={28} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.cardTitle}>SOLO</Text>
                  <Text style={styles.cardSubtitle}>PRACTICE</Text>
                  <Text style={styles.cardDescription}>AI-guided training</Text>
                  <View style={styles.instantBadge}>
                    <Text style={styles.instantBadgeText}>⚡ INSTANT</Text>
                  </View>
                </LinearGradient>
                <View style={styles.cardBorderGlow} />
              </TouchableOpacity>
            </PulseView>

            {/* Team Practice Card */}
            <TouchableOpacity
              style={styles.practiceCardWrapper}
              onPress={() => handlePracticeSelect('team')}
            >
              <LinearGradient
                colors={['#1a1a2e', '#16213e']}
                style={styles.practiceCard}
              >
                <LinearGradient
                  colors={['#4ECDC4', '#44A08D']}
                  style={styles.cardIconCircle}
                >
                  <Ionicons name="people" size={28} color="#fff" />
                </LinearGradient>
                <Text style={styles.cardTitle}>TEAM</Text>
                <Text style={styles.cardSubtitle}>PRACTICE</Text>
                <Text style={styles.cardDescription}>2-10 players</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Join Session Card */}
          <TouchableOpacity
            style={styles.joinCardWrapper}
            onPress={() => setShowJoinModal(true)}
          >
            <LinearGradient
              colors={['rgba(139, 92, 246, 0.3)', 'rgba(236, 72, 153, 0.3)']}
              style={styles.joinCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.joinCardContent}>
                <LinearGradient
                  colors={['#8B5CF6', '#EC4899']}
                  style={styles.joinIconCircle}
                >
                  <Ionicons name="enter" size={24} color="#fff" />
                </LinearGradient>
                <View style={styles.joinTextContainer}>
                  <Text style={styles.joinTitle}>JOIN SESSION</Text>
                  <Text style={styles.joinDescription}>Enter code to join team</Text>
                </View>
              </View>
              <View style={styles.joinArrow}>
                <Ionicons name="chevron-forward" size={24} color="#EC4899" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Features Section */}
          <Text style={styles.sectionTitle}>✨ FEATURES</Text>
          <View style={styles.featuresGrid}>
            <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(255, 107, 107, 0.2)' }]}>
                <Ionicons name="sparkles" size={20} color="#ff6b6b" />
              </View>
              <Text style={styles.featureText}>AI Plans</Text>
            </LinearGradient>
            <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(78, 205, 196, 0.2)' }]}>
                <Ionicons name="videocam" size={20} color="#4ECDC4" />
              </View>
              <Text style={styles.featureText}>Analysis</Text>
            </LinearGradient>
            <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
                <Ionicons name="analytics" size={20} color="#8B5CF6" />
              </View>
              <Text style={styles.featureText}>Progress</Text>
            </LinearGradient>
            <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(255, 230, 109, 0.2)' }]}>
                <Ionicons name="trophy" size={20} color="#FFE66D" />
              </View>
              <Text style={styles.featureText}>Levels</Text>
            </LinearGradient>
          </View>

          {/* ICC Guidelines Card */}
          <TouchableOpacity
            style={styles.iccCardWrapper}
            onPress={() => router.push('/cricket-rules')}
          >
            <LinearGradient
              colors={['#11998e', '#38ef7d']}
              style={styles.iccCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.iccContent}>
                <MaterialCommunityIcons name="book-open-variant" size={28} color="#fff" />
                <View style={styles.iccTextContainer}>
                  <Text style={styles.iccTitle}>ICC GUIDELINES 2025</Text>
                  <Text style={styles.iccSubtitle}>Rules • Techniques • Safety</Text>
                </View>
              </View>
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>

        {/* Configure Session Modal */}
        <Modal
          visible={showConfigModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowConfigModal(false)}
        >
          <View style={styles.modalOverlay}>
            <KeyboardAwareScrollView style={styles.modalScroll}>
              <LinearGradient
                colors={['#1a1a2e', '#16213e', '#1a1a2e']}
                style={styles.modalContent}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {practiceType === 'solo' ? '⚡ SOLO MODE' : '👥 TEAM MODE'}
                  </Text>
                  <TouchableOpacity onPress={() => setShowConfigModal(false)}>
                    <Ionicons name="close-circle" size={32} color="#ff6b6b" />
                  </TouchableOpacity>
                </View>

                {practiceType === 'team' && (
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>PLAYERS</Text>
                    <View style={styles.playerSelector}>
                      {[2, 3, 4, 5, 6].map((num) => (
                        <TouchableOpacity
                          key={num}
                          onPress={() => setNumPlayers(num)}
                        >
                          <LinearGradient
                            colors={numPlayers === num ? ['#ff6b6b', '#feca57'] : ['#1a1a2e', '#16213e']}
                            style={styles.playerButton}
                          >
                            <Text style={[styles.playerButtonText, numPlayers === num && styles.playerButtonTextActive]}>
                              {num}
                            </Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                <View style={styles.formGroup}>
                  <Text style={styles.label}>SKILL LEVEL</Text>
                  <View style={styles.segmentControl}>
                    {['beginner', 'intermediate', 'advanced'].map((level) => (
                      <TouchableOpacity
                        key={level}
                        style={[styles.segment, skillLevel === level && styles.segmentActive]}
                        onPress={() => setSkillLevel(level)}
                      >
                        <Text style={[styles.segmentText, skillLevel === level && styles.segmentTextActive]}>
                          {level.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>DURATION (MIN)</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.modalInput}
                      value={duration}
                      onChangeText={setDuration}
                      keyboardType="number-pad"
                      placeholder="Minimum 30"
                      placeholderTextColor="#666"
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>FOCUS AREA</Text>
                  <View style={styles.focusSelector}>
                    {[
                      { id: 'batting', icon: 'baseball', label: 'BAT' },
                      { id: 'bowling', icon: 'ellipse', label: 'BOWL' },
                      { id: 'fielding', icon: 'hand-left', label: 'FIELD' },
                    ].map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => setFocusArea(item.id)}
                      >
                        <LinearGradient
                          colors={focusArea === item.id ? ['#4ECDC4', '#44A08D'] : ['#1a1a2e', '#16213e']}
                          style={styles.focusButton}
                        >
                          <Ionicons name={item.icon as any} size={24} color={focusArea === item.id ? '#fff' : '#666'} />
                          <Text style={[styles.focusLabel, focusArea === item.id && styles.focusLabelActive]}>
                            {item.label}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>GOAL <Text style={styles.optional}>(Optional)</Text></Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.modalInput}
                      value={goal}
                      onChangeText={setGoal}
                      placeholder="AI will create your plan"
                      placeholderTextColor="#666"
                    />
                  </View>
                </View>

                <TouchableOpacity onPress={handleProceedToCamera}>
                  <LinearGradient
                    colors={['#667eea', '#764ba2', '#f093fb']}
                    style={styles.startButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.startButtonText}>NEXT: CAMERA SETUP</Text>
                    <Ionicons name="arrow-forward" size={24} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
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
            <LinearGradient
              colors={['#1a1a2e', '#16213e']}
              style={styles.joinModalContent}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>🎮 JOIN SESSION</Text>
                <TouchableOpacity onPress={() => setShowJoinModal(false)}>
                  <Ionicons name="close-circle" size={32} color="#ff6b6b" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>ENTER CODE</Text>
                <View style={styles.codeInputWrapper}>
                  <TextInput
                    style={styles.codeInput}
                    value={joinCode}
                    onChangeText={setJoinCode}
                    placeholder="6-DIGIT CODE"
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholderTextColor="#666"
                  />
                </View>
              </View>

              <TouchableOpacity onPress={handleJoinSession} disabled={loading}>
                <LinearGradient
                  colors={['#8B5CF6', '#EC4899']}
                  style={styles.startButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.startButtonText}>{loading ? 'JOINING...' : 'JOIN NOW'}</Text>
                  <Ionicons name="enter" size={24} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
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
    paddingBottom: 20,
  },
  headerLeft: {},
  greeting: {
    fontSize: 14,
    color: '#a0a0b0',
    fontWeight: '600',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  userName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 12,
    color: '#FFE66D',
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 2,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFE66D',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
  },
  avatarGlow: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 107, 107, 0.3)',
    top: -7,
    left: -7,
    zIndex: -1,
  },
  statsBanner: {
    flexDirection: 'row',
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.5)',
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
  },
  statLabel: {
    fontSize: 10,
    color: '#a0a0b0',
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFE66D',
    letterSpacing: 4,
    marginHorizontal: 24,
    marginBottom: 16,
  },
  practiceCardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 16,
  },
  practiceCardWrapper: {
    width: CARD_WIDTH,
    position: 'relative',
  },
  practiceCard: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 107, 0.5)',
  },
  cardBorderGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#ff6b6b',
    opacity: 0.5,
  },
  cardIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 3,
  },
  cardSubtitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFE66D',
    letterSpacing: 2,
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 11,
    color: '#a0a0b0',
    fontWeight: '600',
  },
  instantBadge: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  instantBadgeText: {
    color: '#ff6b6b',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  joinCardWrapper: {
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  joinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.5)',
    borderRadius: 16,
  },
  joinCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  joinIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinTextContainer: {},
  joinTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
  },
  joinDescription: {
    fontSize: 12,
    color: '#a0a0b0',
    fontWeight: '600',
  },
  joinArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(236, 72, 153, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 24,
  },
  featureItem: {
    width: (SCREEN_WIDTH - 48 - 12) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 1,
  },
  iccCardWrapper: {
    marginHorizontal: 24,
    marginBottom: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  iccCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 16,
  },
  iccContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iccTextContainer: {},
  iccTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
  },
  iccSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    marginTop: 2,
  },
  newBadge: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalScroll: {
    maxHeight: '90%',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: '#ff6b6b',
  },
  joinModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: '#8B5CF6',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFE66D',
    letterSpacing: 3,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: '#a0a0b0',
    letterSpacing: 3,
    marginBottom: 10,
  },
  optional: {
    color: '#666',
    fontWeight: '600',
    letterSpacing: 1,
  },
  inputWrapper: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  modalInput: {
    padding: 16,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  playerSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  playerButton: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  playerButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#666',
  },
  playerButtonTextActive: {
    color: '#fff',
  },
  segmentControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
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
    backgroundColor: '#ff6b6b',
  },
  segmentText: {
    color: '#666',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  segmentTextActive: {
    color: '#fff',
  },
  focusSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  focusButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    gap: 8,
  },
  focusLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#666',
    letterSpacing: 2,
  },
  focusLabelActive: {
    color: '#fff',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    gap: 12,
    marginTop: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 3,
  },
  codeInputWrapper: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.5)',
  },
  codeInput: {
    padding: 20,
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 10,
  },
});
