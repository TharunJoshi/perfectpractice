import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileOnboarding() {
  const router = useRouter();
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');

  const handleContinue = async () => {
    if (!height || !weight) {
      Alert.alert('Error', 'Please enter both height and weight');
      return;
    }

    const heightValue = parseFloat(height);
    const weightValue = parseFloat(weight);

    if (isNaN(heightValue) || isNaN(weightValue)) {
      Alert.alert('Error', 'Please enter valid numbers');
      return;
    }

    // Convert to metric if imperial
    const heightCm = unit === 'imperial' ? heightValue * 2.54 : heightValue;
    const weightKg = unit === 'imperial' ? weightValue * 0.453592 : weightValue;

    // Store temporarily
    await AsyncStorage.setItem('onboarding_height', heightCm.toString());
    await AsyncStorage.setItem('onboarding_weight', weightKg.toString());

    router.push('/onboarding/experience');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.step}>Step 1 of 2</Text>
            <Text style={styles.title}>Tell us about yourself</Text>
            <Text style={styles.subtitle}>
              This helps us personalize your training experience
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.unitSelector}>
              <TouchableOpacity
                style={[
                  styles.unitButton,
                  unit === 'metric' && styles.unitButtonActive,
                ]}
                onPress={() => setUnit('metric')}
              >
                <Text
                  style={[
                    styles.unitText,
                    unit === 'metric' && styles.unitTextActive,
                  ]}
                >
                  Metric
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.unitButton,
                  unit === 'imperial' && styles.unitButtonActive,
                ]}
                onPress={() => setUnit('imperial')}
              >
                <Text
                  style={[
                    styles.unitText,
                    unit === 'imperial' && styles.unitTextActive,
                  ]}
                >
                  Imperial
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Height {unit === 'metric' ? '(cm)' : '(inches)'}
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons name="resize" size={20} color="#64748b" />
                <TextInput
                  style={styles.input}
                  placeholder={unit === 'metric' ? 'e.g. 175' : 'e.g. 69'}
                  placeholderTextColor="#64748b"
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Weight {unit === 'metric' ? '(kg)' : '(lbs)'}
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons name="fitness" size={20} color="#64748b" />
                <TextInput
                  style={styles.input}
                  placeholder={unit === 'metric' ? 'e.g. 70' : 'e.g. 154'}
                  placeholderTextColor="#64748b"
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleContinue}>
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  keyboardView: {
    flex: 1,
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
  form: {
    flex: 1,
  },
  unitSelector: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  unitButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  unitButtonActive: {
    backgroundColor: '#10b981',
  },
  unitText: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '600',
  },
  unitTextActive: {
    color: '#fff',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  input: {
    flex: 1,
    height: 56,
    color: '#fff',
    fontSize: 16,
    marginLeft: 12,
  },
  button: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
