import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome } from '@expo/vector-icons';

// Demo Mode Flag - Set to false when you have real OAuth credentials
const DEMO_MODE = true;

export default function Login() {
  const router = useRouter();
  const { login, socialLogin } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  
  // Demo mode states
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoProvider, setDemoProvider] = useState<string>('');
  const [demoName, setDemoName] = useState('');
  const [demoEmail, setDemoEmail] = useState('');

  // Generate mock user data based on provider
  const getMockUserData = (provider: string, name: string, userEmail: string) => {
    const timestamp = Date.now();
    return {
      id: `${provider}_${timestamp}`,
      email: userEmail || `demo.user.${timestamp}@${provider}.com`,
      name: name || `Demo ${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
      picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Demo User')}&background=random&size=200`,
    };
  };

  // Handle Demo Social Login
  const handleDemoSocialLogin = async () => {
    if (!demoName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (!demoEmail.trim() || !demoEmail.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }

    try {
      setSocialLoading(demoProvider);
      setShowDemoModal(false);
      
      const mockUser = getMockUserData(demoProvider, demoName, demoEmail);
      
      // Simulate network delay for realism
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await socialLogin(demoProvider, mockUser);
      
      // Check if onboarding is completed
      const user = useAuthStore.getState().user;
      if (user && !user.onboarding_completed) {
        router.replace('/welcome');
      } else {
        router.replace('/(tabs)/home');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || `${demoProvider} sign-in failed`);
    } finally {
      setSocialLoading(null);
      setDemoName('');
      setDemoEmail('');
    }
  };

  // Handle Social Button Press
  const handleSocialPress = (provider: string) => {
    if (DEMO_MODE) {
      setDemoProvider(provider);
      setShowDemoModal(true);
    } else {
      // Real OAuth flow would go here
      Alert.alert(
        'OAuth Not Configured',
        `Please configure ${provider} OAuth credentials in the app settings.`
      );
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      
      // Check if onboarding is completed
      const user = useAuthStore.getState().user;
      if (user && !user.onboarding_completed) {
        router.replace('/welcome');
      } else {
        router.replace('/(tabs)/home');
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'google': return '#EA4335';
      case 'facebook': return '#1877F2';
      case 'twitter': return '#1DA1F2';
      default: return '#10b981';
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'google': return 'Google';
      case 'facebook': return 'Meta';
      case 'twitter': return 'Twitter';
      default: return provider;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Ionicons name="fitness" size={48} color="#10b981" />
              <Text style={styles.title}>PerfectPractice</Text>
              <Text style={styles.subtitle}>Your Cricket Coaching Journey</Text>
            </View>

            {/* Demo Mode Banner */}
            {DEMO_MODE && (
              <View style={styles.demoBanner}>
                <Ionicons name="information-circle" size={16} color="#f59e0b" />
                <Text style={styles.demoBannerText}>Demo Mode - Social login simulated</Text>
              </View>
            )}

            {/* Social Login Buttons */}
            <View style={styles.socialContainer}>
              <Text style={styles.socialTitle}>Continue with</Text>
              
              <TouchableOpacity
                style={[styles.socialButton, styles.googleButton]}
                onPress={() => handleSocialPress('google')}
                disabled={socialLoading !== null}
              >
                {socialLoading === 'google' ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <FontAwesome name="google" size={20} color="#fff" />
                    <Text style={styles.socialButtonText}>Continue with Google</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialButton, styles.facebookButton]}
                onPress={() => handleSocialPress('facebook')}
                disabled={socialLoading !== null}
              >
                {socialLoading === 'facebook' ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <FontAwesome name="facebook" size={20} color="#fff" />
                    <Text style={styles.socialButtonText}>Continue with Meta</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialButton, styles.twitterButton]}
                onPress={() => handleSocialPress('twitter')}
                disabled={socialLoading !== null}
              >
                {socialLoading === 'twitter' ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <FontAwesome name="twitter" size={20} color="#fff" />
                    <Text style={styles.socialButtonText}>Continue with Twitter</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Email/Password Form */}
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#64748b"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#64748b"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={styles.button}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Login with Email</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={styles.linkText}>
                  Don't have an account? <Text style={styles.linkTextBold}>Register</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Demo Social Login Modal */}
      <Modal
        visible={showDemoModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDemoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalHeader, { backgroundColor: getProviderColor(demoProvider) }]}>
              <FontAwesome 
                name={demoProvider === 'facebook' ? 'facebook' : demoProvider as any} 
                size={32} 
                color="#fff" 
              />
              <Text style={styles.modalTitle}>
                Sign in with {getProviderName(demoProvider)}
              </Text>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalSubtitle}>
                Demo Mode: Enter your details to simulate {getProviderName(demoProvider)} login
              </Text>
              
              <View style={styles.modalInputContainer}>
                <Ionicons name="person-outline" size={20} color="#64748b" />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Your Name"
                  placeholderTextColor="#64748b"
                  value={demoName}
                  onChangeText={setDemoName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.modalInputContainer}>
                <Ionicons name="mail-outline" size={20} color="#64748b" />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Your Email"
                  placeholderTextColor="#64748b"
                  value={demoEmail}
                  onChangeText={setDemoEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: getProviderColor(demoProvider) }]}
                onPress={handleDemoSocialLogin}
              >
                <Text style={styles.modalButtonText}>Continue</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowDemoModal(false);
                  setDemoName('');
                  setDemoEmail('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 8,
  },
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    gap: 8,
  },
  demoBannerText: {
    color: '#f59e0b',
    fontSize: 13,
    fontWeight: '500',
  },
  socialContainer: {
    marginBottom: 16,
  },
  socialTitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 16,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  googleButton: {
    backgroundColor: '#EA4335',
  },
  facebookButton: {
    backgroundColor: '#1877F2',
  },
  twitterButton: {
    backgroundColor: '#1DA1F2',
  },
  socialButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#334155',
  },
  dividerText: {
    color: '#64748b',
    paddingHorizontal: 16,
    fontSize: 14,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    color: '#fff',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  linkText: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
  },
  linkTextBold: {
    color: '#10b981',
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  modalHeader: {
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalBody: {
    padding: 24,
  },
  modalSubtitle: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  modalInput: {
    flex: 1,
    height: 52,
    color: '#fff',
    fontSize: 16,
  },
  modalButton: {
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalCancelButton: {
    marginTop: 12,
    padding: 12,
  },
  modalCancelText: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
  },
});
