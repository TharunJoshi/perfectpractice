import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useAuthStore } from '../../src/store/authStore';

export default function ExperienceOnboarding() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();

  const options = [
    {
      id: 'practice_beginner',
      icon: 'leaf',
      title: 'Practice as a Beginner',
      description: 'I\'m new to cricket and want to learn the basics',
      experience: 'beginner',
    },
    {
      id: 'learn_more_skills',
      icon: 'trophy',
      title: 'Learn More Skills',
      description: 'I know the basics but want to improve my game',
      experience: 'intermediate',
    },
    {
      id: 'advanced_training',
      icon: 'flame',
      title: 'Advanced Training',
      description: 'I\'m experienced and want professional-level practice',
      experience: 'advanced',
    },
  ];

  const handleComplete = async () => {
    if (!selected) {
      Alert.alert('Please select an option', 'Tell us why you\'re here');
      return;
    }

    try {
      setLoading(true);

      // Get stored height and weight
      const height = await AsyncStorage.getItem('onboarding_height');
      const weight = await AsyncStorage.getItem('onboarding_weight');
      const token = await AsyncStorage.getItem('token');

      if (!height || !weight) {
        Alert.alert('Error', 'Missing profile data. Please go back and complete step 1.');
        return;
      }

      const selectedOption = options.find((o) => o.id === selected);

      // Submit onboarding data
      await axios.post(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/auth/onboarding`,
        {
          height: parseFloat(height),
          weight: parseFloat(weight),
          experience_level: selectedOption?.experience,
          why_here: selected,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Clear temporary storage
      await AsyncStorage.removeItem('onboarding_height');
      await AsyncStorage.removeItem('onboarding_weight');

      // Navigate to home
      Alert.alert(
        'Welcome to PerfectPractice! 🏏',
        'Your profile is complete. Let\'s start practicing!',
        [{ text: 'Let\'s Go!', onPress: () => router.replace('/(tabs)/home') }]
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.detail || 'Failed to complete onboarding'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.step}>Step 2 of 2</Text>
          <Text style={styles.title}>Why are you here?</Text>
          <Text style={styles.subtitle}>
            Help us customize your training experience
          </Text>
        </View>

        <View style={styles.options}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                selected === option.id && styles.optionCardSelected,
              ]}
              onPress={() => setSelected(option.id)}
            >
              <View
                style={[
                  styles.iconContainer,
                  selected === option.id && styles.iconContainerSelected,
                ]}
              >
                <Ionicons
                  name={option.icon as any}
                  size={32}
                  color={selected === option.id ? '#fff' : '#10b981'}
                />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              {selected === option.id && (
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, !selected && styles.buttonDisabled]}
          onPress={handleComplete}
          disabled={loading || !selected}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Complete Setup</Text>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  header: {
    marginBottom: 32,
  },
  step: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    lineHeight: 22,
  },
  options: {
    flex: 1,
    gap: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#334155',
    gap: 16,
  },
  optionCardSelected: {
    borderColor: '#10b981',
    backgroundColor: '#1e293b',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10b98120',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerSelected: {
    backgroundColor: '#10b981',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonDisabled: {
    backgroundColor: '#334155',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
