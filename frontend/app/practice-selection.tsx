import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Practice options for each focus area
const PRACTICE_OPTIONS = {
  batting: {
    title: 'BATTING',
    icon: 'baseball',
    gradient: ['#ff6b6b', '#feca57'],
    skills: [
      { id: 'cover_drive', name: 'Cover Drive', description: 'Classic off-side shot through covers', difficulty: 'Intermediate' },
      { id: 'straight_drive', name: 'Straight Drive', description: 'Hit ball straight back past bowler', difficulty: 'Beginner' },
      { id: 'pull_shot', name: 'Pull Shot', description: 'Horizontal bat shot for short balls', difficulty: 'Advanced' },
      { id: 'cut_shot', name: 'Cut Shot', description: 'Square cut for wide deliveries', difficulty: 'Intermediate' },
      { id: 'forward_defense', name: 'Forward Defense', description: 'Block with soft hands', difficulty: 'Beginner' },
      { id: 'back_foot_defense', name: 'Back Foot Defense', description: 'Play short balls on back foot', difficulty: 'Beginner' },
      { id: 'sweep_shot', name: 'Sweep Shot', description: 'Against spin bowling', difficulty: 'Advanced' },
      { id: 'lofted_shot', name: 'Lofted Shot', description: 'Hit over fielders', difficulty: 'Advanced' },
    ],
  },
  bowling: {
    title: 'BOWLING',
    icon: 'ellipse',
    gradient: ['#4ECDC4', '#44A08D'],
    skills: [
      { id: 'outswinger', name: 'Outswinger', description: 'Ball moves away from batsman', difficulty: 'Intermediate' },
      { id: 'inswinger', name: 'Inswinger', description: 'Ball moves into batsman', difficulty: 'Intermediate' },
      { id: 'yorker', name: 'Yorker', description: 'Full delivery at batsman toes', difficulty: 'Advanced' },
      { id: 'bouncer', name: 'Bouncer', description: 'Short-pitched targeting body', difficulty: 'Intermediate' },
      { id: 'slower_ball', name: 'Slower Ball', description: 'Deceptive change of pace', difficulty: 'Advanced' },
      { id: 'off_spin', name: 'Off Spin', description: 'Spin away from right-hander', difficulty: 'Intermediate' },
      { id: 'leg_spin', name: 'Leg Spin', description: 'Spin into right-hander', difficulty: 'Advanced' },
      { id: 'googly', name: 'Googly', description: 'Wrong-un delivery', difficulty: 'Advanced' },
    ],
  },
  fielding: {
    title: 'FIELDING',
    icon: 'hand-left',
    gradient: ['#8B5CF6', '#EC4899'],
    skills: [
      { id: 'high_catch', name: 'High Catch', description: 'Catching aerial balls', difficulty: 'Beginner' },
      { id: 'slip_catch', name: 'Slip Catching', description: 'Reaction catches in slips', difficulty: 'Advanced' },
      { id: 'diving_catch', name: 'Diving Catch', description: 'Full stretch catches', difficulty: 'Advanced' },
      { id: 'ground_fielding', name: 'Ground Fielding', description: 'Pick up and throw', difficulty: 'Beginner' },
      { id: 'direct_hit', name: 'Direct Hit', description: 'Hitting stumps on throw', difficulty: 'Intermediate' },
      { id: 'boundary_save', name: 'Boundary Save', description: 'Stopping at boundary', difficulty: 'Intermediate' },
      { id: 'relay_throw', name: 'Relay Throw', description: 'Quick relay from deep', difficulty: 'Intermediate' },
      { id: 'wicket_keeping', name: 'Wicket Keeping', description: 'Keeping basics', difficulty: 'Advanced' },
    ],
  },
};

export default function PracticeSelection() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const focusArea = (params.focusArea as string) || 'batting';
  const practiceType = params.practiceType as string || 'solo';
  const skillLevel = params.skillLevel as string || 'intermediate';
  const duration = params.duration as string || '60';
  const numPlayers = params.numPlayers as string || '1';
  
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  
  const options = PRACTICE_OPTIONS[focusArea as keyof typeof PRACTICE_OPTIONS];

  const handleSkillSelect = (skillId: string) => {
    setSelectedSkill(skillId);
  };

  const handleStartPractice = () => {
    const skill = options.skills.find(s => s.id === selectedSkill);
    router.push({
      pathname: '/practice-flow',
      params: {
        focusArea,
        practiceType,
        skillLevel,
        duration,
        numPlayers,
        skillId: selectedSkill,
        skillName: skill?.name || '',
        hasCustomPlan: 'true',
      },
    });
  };

  const handleAIPlan = () => {
    router.push({
      pathname: '/practice-flow',
      params: {
        focusArea,
        practiceType,
        skillLevel,
        duration,
        numPlayers,
        skillId: '',
        skillName: '',
        hasCustomPlan: 'false',
      },
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return '#10b981';
      case 'Intermediate': return '#f59e0b';
      case 'Advanced': return '#ef4444';
      default: return '#64748b';
    }
  };

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
          <Text style={styles.headerTitle}>PRACTICE SELECTION</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Question Header */}
          <View style={styles.questionSection}>
            <LinearGradient
              colors={options.gradient}
              style={styles.questionIcon}
            >
              <Ionicons name={options.icon as any} size={32} color="#fff" />
            </LinearGradient>
            <Text style={styles.questionTitle}>What do you want to{'\n'}practice today?</Text>
            <Text style={styles.questionSubtitle}>Select a specific skill or let AI create your plan</Text>
          </View>

          {/* AI Plan Option */}
          <TouchableOpacity style={styles.aiPlanCard} onPress={handleAIPlan}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.aiPlanGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.aiPlanContent}>
                <View style={styles.aiPlanIcon}>
                  <Ionicons name="sparkles" size={28} color="#FFE66D" />
                </View>
                <View style={styles.aiPlanText}>
                  <Text style={styles.aiPlanTitle}>CREATE MY PLAN</Text>
                  <Text style={styles.aiPlanSubtitle}>Let AI design your practice session</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR SELECT A SKILL</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Skills Grid */}
          <View style={styles.skillsGrid}>
            {options.skills.map((skill) => (
              <TouchableOpacity
                key={skill.id}
                style={[
                  styles.skillCard,
                  selectedSkill === skill.id && styles.skillCardSelected,
                ]}
                onPress={() => handleSkillSelect(skill.id)}
              >
                <LinearGradient
                  colors={selectedSkill === skill.id ? options.gradient : ['#1a1a2e', '#16213e']}
                  style={styles.skillCardInner}
                >
                  <View style={styles.skillHeader}>
                    <Text style={styles.skillName}>{skill.name}</Text>
                    {selectedSkill === skill.id && (
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    )}
                  </View>
                  <Text style={styles.skillDescription}>{skill.description}</Text>
                  <View style={[styles.difficultyBadge, { backgroundColor: `${getDifficultyColor(skill.difficulty)}30` }]}>
                    <Text style={[styles.difficultyText, { color: getDifficultyColor(skill.difficulty) }]}>
                      {skill.difficulty}
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Start Button */}
        {selectedSkill && (
          <View style={styles.bottomSection}>
            <TouchableOpacity onPress={handleStartPractice}>
              <LinearGradient
                colors={options.gradient}
                style={styles.startButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.startButtonText}>START PRACTICE</Text>
                <Ionicons name="arrow-forward" size={24} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
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
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFE66D',
    letterSpacing: 3,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  questionSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  questionIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  questionTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 1,
    lineHeight: 34,
  },
  questionSubtitle: {
    fontSize: 14,
    color: '#a0a0b0',
    textAlign: 'center',
    marginTop: 8,
  },
  aiPlanCard: {
    marginHorizontal: 24,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  aiPlanGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  aiPlanContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  aiPlanIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiPlanText: {},
  aiPlanTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
  },
  aiPlanSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '700',
    letterSpacing: 2,
    paddingHorizontal: 16,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 120,
  },
  skillCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  skillCardSelected: {
    borderWidth: 2,
    borderColor: '#FFE66D',
  },
  skillCardInner: {
    padding: 16,
    minHeight: 130,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  skillName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
    flex: 1,
  },
  skillDescription: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 12,
    lineHeight: 16,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(10, 10, 26, 0.95)',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    gap: 12,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 3,
  },
});
