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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { useSessionStore } from '../../src/store/sessionStore';
import { useRouter } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { createSession, joinSession } = useSessionStore();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  
  // Create session form
  const [dayNumber, setDayNumber] = useState('1');
  const [duration, setDuration] = useState('60');
  const [focusArea, setFocusArea] = useState('batting');
  const [goal, setGoal] = useState('');
  
  // Join session form
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateSession = async () => {
    if (!goal.trim()) {
      Alert.alert('Error', 'Please enter a practice goal');
      return;
    }

    const durationNum = parseInt(duration);
    if (durationNum < 30) {
      Alert.alert('Error', 'Duration must be at least 30 minutes');
      return;
    }

    try {
      setLoading(true);
      const session = await createSession({
        day_number: parseInt(dayNumber),
        duration: durationNum,
        focus_area: focusArea,
        goal: goal.trim(),
      });
      
      setShowCreateModal(false);
      Alert.alert(
        'Session Created!',
        `Share this join code with your partner: ${session.join_code}`,
        [
          {
            text: 'OK',
            onPress: () => router.push(`/session/${session.id}`),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
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
      Alert.alert('Joined Successfully!', 'You have joined the session', [
        {
          text: 'OK',
          onPress: () => router.push(`/session/${session.id}`),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name}!</Text>
            <Text style={styles.subGreeting}>Ready for perfect practice?</Text>
          </View>
          <View style={styles.iconContainer}>
            <Ionicons name="fitness" size={32} color="#10b981" />
          </View>
        </View>

        <View style={styles.cardContainer}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => setShowCreateModal(true)}
          >
            <View style={styles.cardIcon}>
              <Ionicons name="add-circle" size={48} color="#10b981" />
            </View>
            <Text style={styles.cardTitle}>Create Session</Text>
            <Text style={styles.cardDescription}>
              Start a new practice session and invite your partner
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => setShowJoinModal(true)}
          >
            <View style={styles.cardIcon}>
              <Ionicons name="enter" size={48} color="#3b82f6" />
            </View>
            <Text style={styles.cardTitle}>Join Session</Text>
            <Text style={styles.cardDescription}>
              Enter a join code to join an existing session
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How It Works</Text>
          <View style={styles.infoCard}>
            <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            <Text style={styles.infoText}>10-minute mandatory warm-up</Text>
          </View>
          <View style={styles.infoCard}>
            <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            <Text style={styles.infoText}>Structured practice drills</Text>
          </View>
          <View style={styles.infoCard}>
            <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            <Text style={styles.infoText}>10-minute mandatory cool-down</Text>
          </View>
          <View style={styles.infoCard}>
            <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            <Text style={styles.infoText}>AI-powered shot analysis</Text>
          </View>
        </View>
      </ScrollView>

      {/* Create Session Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAwareScrollView
            style={styles.modalContainer}
            contentContainerStyle={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Practice Session</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={28} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Day Number</Text>
              <TextInput
                style={styles.input}
                value={dayNumber}
                onChangeText={setDayNumber}
                keyboardType="number-pad"
                placeholderTextColor="#64748b"
              />
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
                <TouchableOpacity
                  style={[
                    styles.segment,
                    focusArea === 'batting' && styles.segmentActive,
                  ]}
                  onPress={() => setFocusArea('batting')}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      focusArea === 'batting' && styles.segmentTextActive,
                    ]}
                  >
                    Batting
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.segment,
                    focusArea === 'bowling' && styles.segmentActive,
                  ]}
                  onPress={() => setFocusArea('bowling')}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      focusArea === 'bowling' && styles.segmentTextActive,
                    ]}
                  >
                    Bowling
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.segment,
                    focusArea === 'fielding' && styles.segmentActive,
                  ]}
                  onPress={() => setFocusArea('fielding')}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      focusArea === 'fielding' && styles.segmentTextActive,
                    ]}
                  >
                    Fielding
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Goal / Technique</Text>
              <TextInput
                style={styles.input}
                value={goal}
                onChangeText={setGoal}
                placeholder="e.g., cover drive, yorker"
                placeholderTextColor="#64748b"
              />
            </View>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleCreateSession}
              disabled={loading}
            >
              <Text style={styles.modalButtonText}>
                {loading ? 'Creating...' : 'Create Session'}
              </Text>
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
    padding: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subGreeting: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  cardIcon: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  infoSection: {
    padding: 24,
    marginTop: 16,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#e2e8f0',
    flex: 1,
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
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155',
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
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
