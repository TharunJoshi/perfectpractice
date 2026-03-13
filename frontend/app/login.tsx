import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DEMO_MODE = true;

// Animated sparkle component
const Sparkle = ({ delay, style }: { delay: number; style: any }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1.2, duration: 300, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.5, duration: 500, useNativeDriver: true }),
        ]),
      ]).start(() => animate());
    };
    animate();
  }, []);

  return (
    <Animated.View style={[style, { opacity, transform: [{ scale }] }]}>
      <Text style={{ fontSize: 20 }}>✦</Text>
    </Animated.View>
  );
};

export default function Login() {
  const router = useRouter();
  const { login, socialLogin } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoProvider, setDemoProvider] = useState<string>('');
  const [demoName, setDemoName] = useState('');
  const [demoEmail, setDemoEmail] = useState('');

  // Animations
  const titleGlow = useRef(new Animated.Value(0)).current;
  const buttonPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Title glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(titleGlow, { toValue: 1, duration: 2000, useNativeDriver: false }),
        Animated.timing(titleGlow, { toValue: 0, duration: 2000, useNativeDriver: false }),
      ])
    ).start();

    // Button pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonPulse, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(buttonPulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const getMockUserData = (provider: string, name: string, userEmail: string) => {
    const timestamp = Date.now();
    return {
      id: `${provider}_${timestamp}`,
      email: userEmail || `demo.user.${timestamp}@${provider}.com`,
      name: name || `Demo ${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
      picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Demo User')}&background=random&size=200`,
    };
  };

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
      await new Promise(resolve => setTimeout(resolve, 1000));
      await socialLogin(demoProvider, mockUser);
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

  const handleSocialPress = (provider: string) => {
    if (DEMO_MODE) {
      setDemoProvider(provider);
      setShowDemoModal(true);
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

  const getProviderGradient = (provider: string): string[] => {
    switch (provider) {
      case 'google': return ['#EA4335', '#FF6B6B'];
      case 'facebook': return ['#1877F2', '#4ECDC4'];
      case 'twitter': return ['#1DA1F2', '#00f5ff'];
      default: return ['#667eea', '#764ba2'];
    }
  };

  const glowColor = titleGlow.interpolate({
    inputRange: [0, 1],
    outputRange: ['#ff6b6b', '#00f5ff'],
  });

  return (
    <LinearGradient
      colors={['#0a0a1a', '#1a1a2e', '#16213e']}
      style={styles.gradientContainer}
    >
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
            {/* Sparkles */}
            <Sparkle delay={0} style={[styles.sparkle, { top: 50, left: 30 }]} />
            <Sparkle delay={500} style={[styles.sparkle, { top: 80, right: 40 }]} />
            <Sparkle delay={1000} style={[styles.sparkle, { top: 150, left: 60 }]} />
            <Sparkle delay={1500} style={[styles.sparkle, { top: 120, right: 70 }]} />

            <View style={styles.content}>
              {/* Anime-style Header */}
              <View style={styles.header}>
                <View style={styles.logoContainer}>
                  <LinearGradient
                    colors={['#ff6b6b', '#feca57', '#ff9ff3']}
                    style={styles.logoGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <MaterialCommunityIcons name="cricket" size={40} color="#fff" />
                  </LinearGradient>
                  <View style={styles.logoGlow} />
                </View>
                
                <Animated.Text style={[styles.title, { textShadowColor: glowColor }]}>
                  PERFECT
                </Animated.Text>
                <Text style={styles.titleAccent}>PRACTICE</Text>
                <Text style={styles.subtitle}>⚡ Level Up Your Cricket Game ⚡</Text>
              </View>

              {/* Demo Mode Banner */}
              {DEMO_MODE && (
                <LinearGradient
                  colors={['rgba(255, 107, 107, 0.2)', 'rgba(78, 205, 196, 0.2)']}
                  style={styles.demoBanner}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.demoBannerText}>★ DEMO MODE ★</Text>
                </LinearGradient>
              )}

              {/* Social Login Buttons - Anime Style */}
              <View style={styles.socialContainer}>
                <Text style={styles.socialTitle}>— QUICK START —</Text>
                
                {/* Google */}
                <TouchableOpacity
                  style={styles.socialButtonWrapper}
                  onPress={() => handleSocialPress('google')}
                  disabled={socialLoading !== null}
                >
                  <LinearGradient
                    colors={['#EA4335', '#FF6B6B']}
                    style={styles.socialButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {socialLoading === 'google' ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <FontAwesome name="google" size={22} color="#fff" />
                        <Text style={styles.socialButtonText}>Continue with Google</Text>
                        <View style={styles.arrowContainer}>
                          <Ionicons name="chevron-forward" size={20} color="#fff" />
                        </View>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Facebook/Meta */}
                <TouchableOpacity
                  style={styles.socialButtonWrapper}
                  onPress={() => handleSocialPress('facebook')}
                  disabled={socialLoading !== null}
                >
                  <LinearGradient
                    colors={['#1877F2', '#4ECDC4']}
                    style={styles.socialButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {socialLoading === 'facebook' ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <FontAwesome name="facebook" size={22} color="#fff" />
                        <Text style={styles.socialButtonText}>Continue with Meta</Text>
                        <View style={styles.arrowContainer}>
                          <Ionicons name="chevron-forward" size={20} color="#fff" />
                        </View>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Twitter */}
                <TouchableOpacity
                  style={styles.socialButtonWrapper}
                  onPress={() => handleSocialPress('twitter')}
                  disabled={socialLoading !== null}
                >
                  <LinearGradient
                    colors={['#1DA1F2', '#00f5ff']}
                    style={styles.socialButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {socialLoading === 'twitter' ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <FontAwesome name="twitter" size={22} color="#fff" />
                        <Text style={styles.socialButtonText}>Continue with Twitter</Text>
                        <View style={styles.arrowContainer}>
                          <Ionicons name="chevron-forward" size={20} color="#fff" />
                        </View>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Divider */}
              <View style={styles.divider}>
                <LinearGradient
                  colors={['transparent', '#ff6b6b', 'transparent']}
                  style={styles.dividerLine}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
                <Text style={styles.dividerText}>OR</Text>
                <LinearGradient
                  colors={['transparent', '#00f5ff', 'transparent']}
                  style={styles.dividerLine}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>

              {/* Email/Password Form */}
              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <LinearGradient
                    colors={['rgba(255, 107, 107, 0.3)', 'rgba(78, 205, 196, 0.3)']}
                    style={styles.inputGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="mail" size={20} color="#ff6b6b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      placeholderTextColor="#666"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </LinearGradient>
                </View>

                <View style={styles.inputContainer}>
                  <LinearGradient
                    colors={['rgba(78, 205, 196, 0.3)', 'rgba(255, 107, 107, 0.3)']}
                    style={styles.inputGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="lock-closed" size={20} color="#4ECDC4" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor="#666"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />
                  </LinearGradient>
                </View>

                <Animated.View style={{ transform: [{ scale: buttonPulse }] }}>
                  <TouchableOpacity
                    style={styles.loginButtonWrapper}
                    onPress={handleLogin}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={['#667eea', '#764ba2', '#f093fb']}
                      style={styles.loginButton}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Text style={styles.loginButtonText}>LOGIN</Text>
                          <Ionicons name="flash" size={20} color="#FFE66D" />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>

                <TouchableOpacity onPress={() => router.push('/register')}>
                  <Text style={styles.linkText}>
                    New Player? <Text style={styles.linkTextBold}>Join Now!</Text>
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
          animationType="fade"
          onRequestClose={() => setShowDemoModal(false)}
        >
          <View style={styles.modalOverlay}>
            <LinearGradient
              colors={['#1a1a2e', '#16213e']}
              style={styles.modalContent}
            >
              <LinearGradient
                colors={getProviderGradient(demoProvider)}
                style={styles.modalHeader}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <FontAwesome 
                  name={demoProvider === 'facebook' ? 'facebook' : demoProvider as any} 
                  size={32} 
                  color="#fff" 
                />
                <Text style={styles.modalTitle}>
                  {demoProvider.charAt(0).toUpperCase() + demoProvider.slice(1)} Login
                </Text>
              </LinearGradient>
              
              <View style={styles.modalBody}>
                <Text style={styles.modalSubtitle}>Enter your details</Text>
                
                <View style={styles.modalInputContainer}>
                  <Ionicons name="person" size={20} color="#ff6b6b" />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Your Name"
                    placeholderTextColor="#666"
                    value={demoName}
                    onChangeText={setDemoName}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.modalInputContainer}>
                  <Ionicons name="mail" size={20} color="#4ECDC4" />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Your Email"
                    placeholderTextColor="#666"
                    value={demoEmail}
                    onChangeText={setDemoEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity
                  style={styles.modalButtonWrapper}
                  onPress={handleDemoSocialLogin}
                >
                  <LinearGradient
                    colors={getProviderGradient(demoProvider)}
                    style={styles.modalButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.modalButtonText}>LET'S GO!</Text>
                    <Ionicons name="rocket" size={20} color="#fff" />
                  </LinearGradient>
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
  sparkle: {
    position: 'absolute',
    color: '#FFE66D',
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFE66D',
  },
  logoGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 107, 107, 0.3)',
    top: -10,
    left: -10,
    zIndex: -1,
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 6,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  titleAccent: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFE66D',
    letterSpacing: 8,
    marginTop: -8,
    textShadowColor: '#ff6b6b',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  subtitle: {
    fontSize: 14,
    color: '#4ECDC4',
    marginTop: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  demoBanner: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  demoBannerText: {
    color: '#FFE66D',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 3,
  },
  socialContainer: {
    marginBottom: 20,
  },
  socialTitle: {
    fontSize: 12,
    color: '#a0a0b0',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '700',
    letterSpacing: 4,
  },
  socialButtonWrapper: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  socialButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 16,
    flex: 1,
    letterSpacing: 1,
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 2,
    borderRadius: 1,
  },
  dividerText: {
    color: '#FFE66D',
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  inputGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginButtonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 4,
  },
  linkText: {
    color: '#a0a0b0',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
  },
  linkTextBold: {
    color: '#FFE66D',
    fontWeight: '800',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ff6b6b',
  },
  modalHeader: {
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
  },
  modalBody: {
    padding: 24,
  },
  modalSubtitle: {
    color: '#a0a0b0',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 107, 0.3)',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  modalInput: {
    flex: 1,
    height: 52,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 3,
  },
  modalCancelButton: {
    marginTop: 16,
    padding: 12,
  },
  modalCancelText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
});
