import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ICC_GUIDELINES } from '../src/data/iccGuidelines';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type FlowStep = 'pre-workout' | 'technique' | 'post-workout' | 'camera-ready';

// Technique data based on skill
const TECHNIQUE_DATA: Record<string, any> = {
  // Batting techniques
  cover_drive: {
    name: 'Cover Drive',
    steps: [
      'Get to the pitch of the ball with front foot',
      'Full face of bat presented to ball',
      'High elbow through the shot',
      'Follow through towards cover region',
      'Keep head still, eyes on ball throughout',
    ],
    tips: ['Weight transfers to front foot', 'Bat swing in V-shape', 'Stay balanced'],
    common_mistakes: ['Playing away from body', 'Head falling over', 'Not getting to pitch'],
  },
  straight_drive: {
    name: 'Straight Drive',
    steps: [
      'Move front foot to pitch of ball',
      'Bat swing straight down the line',
      'Weight transfer to front foot',
      'Full follow through past the bowler',
      'Keep head over the ball',
    ],
    tips: ['Play close to body', 'Soft hands for control', 'Watch ball onto bat'],
    common_mistakes: ['Opening up too early', 'Hitting across line', 'Weight on back foot'],
  },
  pull_shot: {
    name: 'Pull Shot',
    steps: [
      'Move back and across to get in line',
      'Identify short ball early',
      'Roll wrists over the ball',
      'Hit ball in front of body',
      'Rotate body with the shot',
    ],
    tips: ['Keep eyes on ball', 'Commit to the shot', 'Stay side-on initially'],
    common_mistakes: ['Playing too early', 'Not getting back enough', 'Top edge risk'],
  },
  cut_shot: {
    name: 'Cut Shot',
    steps: [
      'Move back foot towards off-side',
      'Create room by moving away',
      'Arms away from body for swing',
      'Hit ball late, under your eyes',
      'Roll wrists for control',
    ],
    tips: ['Wait for the ball', 'Use wrist work', 'Keep head still'],
    common_mistakes: ['Hitting too early', 'Not creating room', 'Playing at body'],
  },
  forward_defense: {
    name: 'Forward Defense',
    steps: [
      'Lead with front foot towards pitch',
      'Bat comes down straight',
      'Soft hands to deaden ball',
      'Pad and bat close together',
      'Head over front knee',
    ],
    tips: ['Watch ball carefully', 'Absorb impact', 'Stay compact'],
    common_mistakes: ['Hard hands', 'Bat away from pad', 'Pushing at ball'],
  },
  back_foot_defense: {
    name: 'Back Foot Defense',
    steps: [
      'Transfer weight onto back foot',
      'Stand tall with good balance',
      'Keep bat close to body',
      'Play ball under your eyes',
      'Soft hands for control',
    ],
    tips: ['Stay side-on', 'Watch ball onto bat', 'Relax grip'],
    common_mistakes: ['Reaching for ball', 'Playing away from body', 'Stiff hands'],
  },
  // Bowling techniques
  outswinger: {
    name: 'Outswinger',
    steps: [
      'Hold ball with seam upright',
      'Position shiny side facing leg slip',
      'Release with seam angled towards slips',
      'Follow through towards off-side',
      'Bowl full length for maximum swing',
    ],
    tips: ['Keep seam position consistent', 'Bowl at good length', 'Use crease width'],
    common_mistakes: ['Seam wobble', 'Too short', 'Telegraphing variation'],
  },
  inswinger: {
    name: 'Inswinger',
    steps: [
      'Hold ball with seam upright',
      'Shiny side facing fine leg',
      'Release with seam angled towards fine leg',
      'Follow through across body',
      'Target off stump line',
    ],
    tips: ['Maintain seam position', 'Bowl yorker length', 'Create angle'],
    common_mistakes: ['Wrong seam position', 'No wrist action', 'Too wide'],
  },
  yorker: {
    name: 'Yorker',
    steps: [
      'Aim at batsman\'s toes/crease',
      'Full arm speed and extension',
      'Release slightly later than normal',
      'Follow through completely',
      'Stay balanced in delivery stride',
    ],
    tips: ['Practice target bowling', 'Commit to length', 'Use slower ball yorker'],
    common_mistakes: ['Overpitching into half volley', 'Short of length', 'No variation'],
  },
  // Fielding techniques
  high_catch: {
    name: 'High Catch',
    steps: [
      'Judge trajectory early',
      'Get under the ball quickly',
      'Position yourself with time to spare',
      'Fingers pointing up',
      'Watch ball into hands and cushion',
    ],
    tips: ['Call early', 'Steady base', 'Two hands when possible'],
    common_mistakes: ['Moving while catching', 'Snatching at ball', 'Not watching in'],
  },
  ground_fielding: {
    name: 'Ground Fielding',
    steps: [
      'Attack the ball - don\'t wait',
      'Get body behind the ball',
      'Low center of gravity',
      'Clean pickup with both hands',
      'Quick release to target',
    ],
    tips: ['Stay low', 'Move feet', 'Practice weak hand'],
    common_mistakes: ['Standing up too early', 'One hand pickup', 'Slow release'],
  },
  direct_hit: {
    name: 'Direct Hit',
    steps: [
      'Pick up ball cleanly',
      'Get into side-on throwing position',
      'Strong front leg brace',
      'Aim at top of stumps',
      'Full follow through',
    ],
    tips: ['Practice under pressure', 'Pick target early', 'Flat throw'],
    common_mistakes: ['Throwing too high', 'Slow approach', 'Off balance throw'],
  },
};

// AI Generated plans based on skill level and focus
const generateAIPlan = (focusArea: string, skillLevel: string) => {
  const plans: Record<string, Record<string, any>> = {
    batting: {
      beginner: {
        name: 'Batting Fundamentals',
        focus: 'Build strong defensive base',
        drills: [
          { name: 'Stance & Grip Practice', duration: '5 min', description: 'Perfect your batting stance and grip' },
          { name: 'Forward Defense Drill', duration: '10 min', description: 'Practice blocking with soft hands' },
          { name: 'Back Foot Defense', duration: '10 min', description: 'Defend short pitched balls' },
          { name: 'Straight Bat Swings', duration: '10 min', description: 'Shadow practice for timing' },
        ],
      },
      intermediate: {
        name: 'Attacking Batting',
        focus: 'Develop scoring shots',
        drills: [
          { name: 'Cover Drive Practice', duration: '10 min', description: 'Classic off-side shot' },
          { name: 'Straight Drive Drill', duration: '10 min', description: 'Hitting down the ground' },
          { name: 'Rotation Shots', duration: '8 min', description: 'Singles and running between wickets' },
          { name: 'Match Simulation', duration: '7 min', description: 'Game scenarios' },
        ],
      },
      advanced: {
        name: 'Match Winning Batting',
        focus: 'Dominate all conditions',
        drills: [
          { name: 'Pull & Hook Practice', duration: '10 min', description: 'Attack short bowling' },
          { name: 'Lofted Shots', duration: '10 min', description: 'Hitting over fielders' },
          { name: 'Spin Attack', duration: '8 min', description: 'Sweep and reverse sweep' },
          { name: 'Death Overs Batting', duration: '7 min', description: 'High pressure finishing' },
        ],
      },
    },
    bowling: {
      beginner: {
        name: 'Bowling Basics',
        focus: 'Build consistent action',
        drills: [
          { name: 'Run-up Practice', duration: '5 min', description: 'Find your rhythm' },
          { name: 'Basic Seam Position', duration: '10 min', description: 'Hold seam upright' },
          { name: 'Target Practice', duration: '10 min', description: 'Hit the stumps' },
          { name: 'Line & Length', duration: '10 min', description: 'Consistent accuracy' },
        ],
      },
      intermediate: {
        name: 'Swing Bowling',
        focus: 'Master conventional swing',
        drills: [
          { name: 'Outswing Practice', duration: '10 min', description: 'Away from right-hander' },
          { name: 'Inswing Drill', duration: '10 min', description: 'Into right-hander' },
          { name: 'Variations', duration: '8 min', description: 'Slower balls' },
          { name: 'Death Bowling', duration: '7 min', description: 'Yorkers and wide yorkers' },
        ],
      },
      advanced: {
        name: 'Wicket Taking Bowling',
        focus: 'Dismiss quality batsmen',
        drills: [
          { name: 'Yorker Mastery', duration: '10 min', description: 'Toe crushers' },
          { name: 'Bouncer Setup', duration: '8 min', description: 'Short ball tactics' },
          { name: 'Reverse Swing', duration: '8 min', description: 'Late movement' },
          { name: 'Match Scenarios', duration: '9 min', description: 'Pressure situations' },
        ],
      },
    },
    fielding: {
      beginner: {
        name: 'Fielding Foundations',
        focus: 'Basic catching and throwing',
        drills: [
          { name: 'High Catch Practice', duration: '10 min', description: 'Under the ball' },
          { name: 'Ground Fielding', duration: '10 min', description: 'Attack and pickup' },
          { name: 'Throwing Accuracy', duration: '8 min', description: 'Hit the stumps' },
          { name: 'Agility Drills', duration: '7 min', description: 'Quick movements' },
        ],
      },
      intermediate: {
        name: 'Athletic Fielding',
        focus: 'Pressure fielding situations',
        drills: [
          { name: 'Slip Catching', duration: '10 min', description: 'React and catch' },
          { name: 'Direct Hit Practice', duration: '10 min', description: 'Run out chances' },
          { name: 'Diving Catches', duration: '8 min', description: 'Full commitment' },
          { name: 'Relay Throws', duration: '7 min', description: 'Quick relay from deep' },
        ],
      },
      advanced: {
        name: 'Match Winning Fielding',
        focus: 'Game changing moments',
        drills: [
          { name: 'Boundary Saves', duration: '8 min', description: 'Stop and throw back' },
          { name: 'Spectacular Catches', duration: '10 min', description: 'Full stretch diving' },
          { name: 'Pressure Run Outs', duration: '10 min', description: 'Critical moments' },
          { name: 'High Ball Practice', duration: '7 min', description: 'Skyers in the sun' },
        ],
      },
    },
  };

  return plans[focusArea]?.[skillLevel] || plans.batting.intermediate;
};

export default function PracticeFlow() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const focusArea = params.focusArea as string || 'batting';
  const skillId = params.skillId as string || '';
  const skillName = params.skillName as string || '';
  const hasCustomPlan = params.hasCustomPlan === 'true';
  const skillLevel = params.skillLevel as string || 'intermediate';
  const practiceType = params.practiceType as string || 'solo';
  const duration = params.duration as string || '60';
  const numPlayers = params.numPlayers as string || '1';
  
  const [currentStep, setCurrentStep] = useState<FlowStep>('pre-workout');
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Get technique data
  const technique = hasCustomPlan && skillId ? TECHNIQUE_DATA[skillId] : null;
  const aiPlan = !hasCustomPlan ? generateAIPlan(focusArea, skillLevel) : null;

  // Get current phase data
  const getCurrentPhaseData = () => {
    switch (currentStep) {
      case 'pre-workout':
        return ICC_GUIDELINES.warmup;
      case 'post-workout':
        return ICC_GUIDELINES.cooldown;
      default:
        return null;
    }
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Progress animation
  useEffect(() => {
    const stepIndex = ['pre-workout', 'technique', 'post-workout', 'camera-ready'].indexOf(currentStep);
    Animated.timing(progressAnim, {
      toValue: (stepIndex + 1) / 4,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNextStep = () => {
    setTimer(0);
    setCurrentExerciseIndex(0);
    
    switch (currentStep) {
      case 'pre-workout':
        setCurrentStep('technique');
        break;
      case 'technique':
        setCurrentStep('post-workout');
        break;
      case 'post-workout':
        setCurrentStep('camera-ready');
        break;
      case 'camera-ready':
        // Navigate to camera with 30 sec limit
        router.push({
          pathname: '/practice-camera',
          params: {
            focusArea,
            skillLevel,
            practiceType,
            duration,
            numPlayers,
            maxRecordingTime: '30', // 30 seconds max
            skillName: hasCustomPlan ? skillName : aiPlan?.name,
          },
        });
        break;
    }
  };

  const getStepGradient = (): string[] => {
    switch (currentStep) {
      case 'pre-workout': return ['#11998e', '#38ef7d'];
      case 'technique': return ['#ff6b6b', '#feca57'];
      case 'post-workout': return ['#4ECDC4', '#44A08D'];
      case 'camera-ready': return ['#667eea', '#764ba2'];
      default: return ['#667eea', '#764ba2'];
    }
  };

  const getStepIcon = () => {
    switch (currentStep) {
      case 'pre-workout': return 'fitness';
      case 'technique': return 'school';
      case 'post-workout': return 'body';
      case 'camera-ready': return 'videocam';
      default: return 'fitness';
    }
  };

  const renderPreWorkout = () => {
    const phase = getCurrentPhaseData();
    if (!phase) return null;

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.phaseHeader}>
          <Text style={styles.phaseTitle}>PRE-WORKOUT</Text>
          <Text style={styles.phaseDuration}>{phase.duration} minutes</Text>
        </View>
        
        <Text style={styles.phaseDescription}>
          Warm up your body following ICC standard protocols
        </Text>

        {phase.phases.map((p: any, index: number) => (
          <View key={index} style={styles.exerciseCard}>
            <LinearGradient
              colors={currentExerciseIndex === index ? getStepGradient() : ['#1a1a2e', '#16213e']}
              style={styles.exerciseCardInner}
            >
              <View style={styles.exerciseHeader}>
                <View style={styles.exerciseNumber}>
                  <Text style={styles.exerciseNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{p.name}</Text>
                  <Text style={styles.exerciseDuration}>{p.duration} min</Text>
                </View>
                {currentExerciseIndex > index && (
                  <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                )}
              </View>
              
              <Text style={styles.exerciseDescription}>{p.description}</Text>
              
              {currentExerciseIndex === index && (
                <View style={styles.exerciseList}>
                  {p.exercises.map((exercise: string, i: number) => (
                    <View key={i} style={styles.exerciseItem}>
                      <Text style={styles.bullet}>•</Text>
                      <Text style={styles.exerciseText}>{exercise}</Text>
                    </View>
                  ))}
                </View>
              )}
            </LinearGradient>
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderTechnique = () => {
    if (hasCustomPlan && technique) {
      return (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.phaseHeader}>
            <Text style={styles.phaseTitle}>{technique.name.toUpperCase()}</Text>
            <Text style={styles.phaseDuration}>Technique Guide</Text>
          </View>

          <Text style={styles.sectionLabel}>HOW TO PLAY</Text>
          {technique.steps.map((step: string, index: number) => (
            <View key={index} style={styles.stepCard}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}

          <Text style={styles.sectionLabel}>PRO TIPS</Text>
          <View style={styles.tipsContainer}>
            {technique.tips.map((tip: string, index: number) => (
              <View key={index} style={styles.tipItem}>
                <Ionicons name="bulb" size={18} color="#FFE66D" />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionLabel}>COMMON MISTAKES</Text>
          <View style={styles.mistakesContainer}>
            {technique.common_mistakes.map((mistake: string, index: number) => (
              <View key={index} style={styles.mistakeItem}>
                <Ionicons name="close-circle" size={18} color="#ef4444" />
                <Text style={styles.mistakeText}>{mistake}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      );
    }

    // AI Generated Plan
    if (aiPlan) {
      return (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.phaseHeader}>
            <Text style={styles.phaseTitle}>{aiPlan.name.toUpperCase()}</Text>
            <Text style={styles.phaseDuration}>AI Generated Plan</Text>
          </View>

          <View style={styles.aiFocusBanner}>
            <Ionicons name="sparkles" size={20} color="#FFE66D" />
            <Text style={styles.aiFocusText}>Focus: {aiPlan.focus}</Text>
          </View>

          <Text style={styles.sectionLabel}>YOUR DRILLS</Text>
          {aiPlan.drills.map((drill: any, index: number) => (
            <View key={index} style={styles.drillCard}>
              <LinearGradient
                colors={['#1a1a2e', '#16213e']}
                style={styles.drillCardInner}
              >
                <View style={styles.drillHeader}>
                  <View style={styles.drillNumber}>
                    <Text style={styles.drillNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.drillInfo}>
                    <Text style={styles.drillName}>{drill.name}</Text>
                    <Text style={styles.drillDuration}>{drill.duration}</Text>
                  </View>
                </View>
                <Text style={styles.drillDescription}>{drill.description}</Text>
              </LinearGradient>
            </View>
          ))}
        </ScrollView>
      );
    }

    return null;
  };

  const renderPostWorkout = () => {
    const phase = getCurrentPhaseData();
    if (!phase) return null;

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.phaseHeader}>
          <Text style={styles.phaseTitle}>POST-WORKOUT</Text>
          <Text style={styles.phaseDuration}>{phase.duration} minutes</Text>
        </View>
        
        <Text style={styles.phaseDescription}>
          Cool down properly to prevent injury and aid recovery
        </Text>

        {phase.phases.map((p: any, index: number) => (
          <View key={index} style={styles.exerciseCard}>
            <LinearGradient
              colors={['#1a1a2e', '#16213e']}
              style={styles.exerciseCardInner}
            >
              <View style={styles.exerciseHeader}>
                <View style={[styles.exerciseNumber, { backgroundColor: '#4ECDC4' }]}>
                  <Text style={styles.exerciseNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{p.name}</Text>
                  <Text style={styles.exerciseDuration}>{p.duration} min</Text>
                </View>
              </View>
              
              <Text style={styles.exerciseDescription}>{p.description}</Text>
              
              <View style={styles.exerciseList}>
                {p.exercises.map((exercise: string, i: number) => (
                  <View key={i} style={styles.exerciseItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.exerciseText}>{exercise}</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderCameraReady = () => (
    <View style={styles.cameraReadyContainer}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.cameraReadyIcon}
      >
        <Ionicons name="videocam" size={48} color="#fff" />
      </LinearGradient>
      
      <Text style={styles.cameraReadyTitle}>READY TO RECORD!</Text>
      <Text style={styles.cameraReadySubtitle}>
        Capture your best shot
      </Text>
      
      <View style={styles.cameraInfoCard}>
        <View style={styles.cameraInfoItem}>
          <Ionicons name="time" size={24} color="#FFE66D" />
          <Text style={styles.cameraInfoText}>30 seconds max</Text>
        </View>
        <View style={styles.cameraInfoItem}>
          <Ionicons name="film" size={24} color="#4ECDC4" />
          <Text style={styles.cameraInfoText}>Best shot only</Text>
        </View>
        <View style={styles.cameraInfoItem}>
          <Ionicons name="sparkles" size={24} color="#ff6b6b" />
          <Text style={styles.cameraInfoText}>AI feedback</Text>
        </View>
      </View>
      
      <Text style={styles.cameraHint}>
        You'll set up your camera area and record your best {focusArea} shot for AI analysis
      </Text>
    </View>
  );

  return (
    <LinearGradient
      colors={['#0a0a1a', '#1a1a2e', '#0a0a1a']}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View 
                style={[
                  styles.progressFill, 
                  { 
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    })
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {currentStep === 'pre-workout' && '1/4'}
              {currentStep === 'technique' && '2/4'}
              {currentStep === 'post-workout' && '3/4'}
              {currentStep === 'camera-ready' && '4/4'}
            </Text>
          </View>

          <View style={styles.placeholder} />
        </View>

        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          <LinearGradient
            colors={getStepGradient()}
            style={styles.stepIconContainer}
          >
            <Ionicons name={getStepIcon() as any} size={24} color="#fff" />
          </LinearGradient>
          <Text style={styles.stepLabel}>
            {currentStep === 'pre-workout' && 'PRE-WORKOUT'}
            {currentStep === 'technique' && 'TECHNIQUE'}
            {currentStep === 'post-workout' && 'POST-WORKOUT'}
            {currentStep === 'camera-ready' && 'RECORD'}
          </Text>
        </View>

        {/* Content */}
        {currentStep === 'pre-workout' && renderPreWorkout()}
        {currentStep === 'technique' && renderTechnique()}
        {currentStep === 'post-workout' && renderPostWorkout()}
        {currentStep === 'camera-ready' && renderCameraReady()}

        {/* Bottom Button */}
        <View style={styles.bottomSection}>
          <TouchableOpacity onPress={handleNextStep}>
            <LinearGradient
              colors={getStepGradient()}
              style={styles.nextButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.nextButtonText}>
                {currentStep === 'camera-ready' ? 'START RECORDING' : 'CONTINUE'}
              </Text>
              <Ionicons 
                name={currentStep === 'camera-ready' ? 'videocam' : 'arrow-forward'} 
                size={24} 
                color="#fff" 
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flex: 1,
    marginHorizontal: 16,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFE66D',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: '#a0a0b0',
    marginTop: 4,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  stepIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepLabel: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFE66D',
    letterSpacing: 3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  phaseHeader: {
    marginBottom: 16,
  },
  phaseTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
  },
  phaseDuration: {
    fontSize: 14,
    color: '#a0a0b0',
    marginTop: 4,
  },
  phaseDescription: {
    fontSize: 14,
    color: '#a0a0b0',
    marginBottom: 20,
    lineHeight: 22,
  },
  exerciseCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  exerciseCardInner: {
    padding: 16,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseNumber: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#11998e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exerciseNumberText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  exerciseDuration: {
    fontSize: 12,
    color: '#a0a0b0',
  },
  exerciseDescription: {
    fontSize: 13,
    color: '#a0a0b0',
    marginBottom: 12,
  },
  exerciseList: {
    gap: 6,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bullet: {
    color: '#FFE66D',
    fontSize: 14,
  },
  exerciseText: {
    flex: 1,
    fontSize: 13,
    color: '#e0e0e0',
    lineHeight: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFE66D',
    letterSpacing: 3,
    marginTop: 20,
    marginBottom: 12,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ff6b6b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#e0e0e0',
    lineHeight: 22,
  },
  tipsContainer: {
    backgroundColor: 'rgba(255, 230, 109, 0.1)',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#FFE66D',
  },
  mistakesContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 100,
  },
  mistakeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mistakeText: {
    flex: 1,
    fontSize: 13,
    color: '#ef4444',
  },
  aiFocusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 20,
  },
  aiFocusText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFE66D',
  },
  drillCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  drillCardInner: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
  },
  drillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  drillNumber: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  drillNumberText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
  },
  drillInfo: {
    flex: 1,
  },
  drillName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  drillDuration: {
    fontSize: 12,
    color: '#a0a0b0',
  },
  drillDescription: {
    fontSize: 13,
    color: '#a0a0b0',
  },
  cameraReadyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  cameraReadyIcon: {
    width: 100,
    height: 100,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  cameraReadyTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 3,
    textAlign: 'center',
  },
  cameraReadySubtitle: {
    fontSize: 16,
    color: '#a0a0b0',
    marginTop: 8,
    textAlign: 'center',
  },
  cameraInfoCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    marginTop: 32,
    width: '100%',
    gap: 16,
  },
  cameraInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cameraInfoText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  cameraHint: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  bottomSection: {
    padding: 20,
    backgroundColor: 'rgba(10, 10, 26, 0.95)',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    gap: 12,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 3,
  },
});
