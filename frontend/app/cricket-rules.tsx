import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ICC_GUIDELINES, FORMAT_CONDITIONS } from '../src/data/iccGuidelines';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabType = 'rules' | 'techniques' | 'safety' | 'warmup';

export default function CricketRules() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('rules');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const tabs = [
    { id: 'rules', label: 'Rules 2025', icon: 'book' },
    { id: 'techniques', label: 'Techniques', icon: 'baseball' },
    { id: 'safety', label: 'Safety', icon: 'shield-checkmark' },
    { id: 'warmup', label: 'Warm-up', icon: 'fitness' },
  ];

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const renderRulesTab = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>ICC Rule Changes 2025-26</Text>
      <Text style={styles.sectionSubtitle}>Latest updates to playing conditions</Text>
      
      {ICC_GUIDELINES.ruleChanges2025.map((rule, index) => (
        <TouchableOpacity
          key={index}
          style={styles.ruleCard}
          onPress={() => toggleSection(`rule-${index}`)}
        >
          <View style={styles.ruleHeader}>
            <View style={styles.ruleBadge}>
              <Text style={styles.ruleBadgeText}>{rule.format}</Text>
            </View>
            <Ionicons
              name={expandedSection === `rule-${index}` ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#64748b"
            />
          </View>
          <Text style={styles.ruleTitle}>{rule.rule}</Text>
          <Text style={styles.ruleDescription}>{rule.description}</Text>
          
          {expandedSection === `rule-${index}` && (
            <View style={styles.ruleDetails}>
              {rule.details && (
                <Text style={styles.ruleDetailText}>• {rule.details}</Text>
              )}
              {rule.penalty && (
                <Text style={styles.ruleDetailText}>• Penalty: {rule.penalty}</Text>
              )}
              <Text style={styles.effectiveDate}>Effective: {rule.effectiveDate}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Format Conditions</Text>
      
      {Object.entries(FORMAT_CONDITIONS).map(([format, conditions]) => (
        <TouchableOpacity
          key={format}
          style={styles.formatCard}
          onPress={() => toggleSection(`format-${format}`)}
        >
          <View style={styles.formatHeader}>
            <Text style={styles.formatTitle}>{format.toUpperCase()}</Text>
            <Ionicons
              name={expandedSection === `format-${format}` ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#64748b"
            />
          </View>
          
          {expandedSection === `format-${format}` && (
            <View style={styles.formatDetails}>
              <Text style={styles.formatItem}>• Overs: {conditions.overs}</Text>
              <Text style={styles.formatItem}>• Innings: {conditions.innings}</Text>
              <Text style={styles.formatItem}>• DRS Reviews: {conditions.drs_reviews}</Text>
              {conditions.new_ball && (
                <Text style={styles.formatItem}>• New Ball: {conditions.new_ball}</Text>
              )}
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderTechniquesTab = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Batting Section */}
      <Text style={styles.sectionTitle}>Batting Techniques</Text>
      
      <TouchableOpacity
        style={styles.techniqueCard}
        onPress={() => toggleSection('stance')}
      >
        <View style={styles.techniqueHeader}>
          <Ionicons name="body" size={24} color="#10b981" />
          <Text style={styles.techniqueTitle}>Batting Stance</Text>
        </View>
        {expandedSection === 'stance' && (
          <View style={styles.techniqueContent}>
            {ICC_GUIDELINES.battingTechniques.stance.keyPoints.map((point, i) => (
              <Text key={i} style={styles.keyPoint}>✓ {point}</Text>
            ))}
            <Text style={styles.faultsTitle}>Common Faults:</Text>
            {ICC_GUIDELINES.battingTechniques.stance.commonFaults.map((fault, i) => (
              <Text key={i} style={styles.faultItem}>✗ {fault}</Text>
            ))}
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.techniqueCard}
        onPress={() => toggleSection('shots')}
      >
        <View style={styles.techniqueHeader}>
          <Ionicons name="baseball" size={24} color="#3b82f6" />
          <Text style={styles.techniqueTitle}>Cricket Shots</Text>
        </View>
        {expandedSection === 'shots' && (
          <View style={styles.techniqueContent}>
            <Text style={styles.shotCategory}>Defensive Shots:</Text>
            {ICC_GUIDELINES.battingTechniques.shots.defensive.map((shot, i) => (
              <View key={i} style={styles.shotItem}>
                <Text style={styles.shotName}>{shot.name}</Text>
                <Text style={styles.shotDesc}>{shot.description}</Text>
              </View>
            ))}
            <Text style={[styles.shotCategory, { marginTop: 12 }]}>Attacking Shots:</Text>
            {ICC_GUIDELINES.battingTechniques.shots.attacking.map((shot, i) => (
              <View key={i} style={styles.shotItem}>
                <Text style={styles.shotName}>{shot.name}</Text>
                <Text style={styles.shotDesc}>{shot.description}</Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>

      {/* Bowling Section */}
      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Bowling Techniques</Text>
      
      <TouchableOpacity
        style={styles.techniqueCard}
        onPress={() => toggleSection('bowling-action')}
      >
        <View style={styles.techniqueHeader}>
          <Ionicons name="ellipse" size={24} color="#f59e0b" />
          <Text style={styles.techniqueTitle}>Fast Bowling Action</Text>
        </View>
        {expandedSection === 'bowling-action' && (
          <View style={styles.techniqueContent}>
            <Text style={styles.subTitle}>Run-up:</Text>
            {ICC_GUIDELINES.bowlingTechniques.fastBowling.runUp.keyPoints.map((point, i) => (
              <Text key={i} style={styles.keyPoint}>✓ {point}</Text>
            ))}
            <Text style={[styles.subTitle, { marginTop: 12 }]}>Action:</Text>
            {ICC_GUIDELINES.bowlingTechniques.fastBowling.action.keyPoints.map((point, i) => (
              <Text key={i} style={styles.keyPoint}>✓ {point}</Text>
            ))}
            <Text style={[styles.subTitle, { marginTop: 12, color: '#ef4444' }]}>Legal Requirements:</Text>
            {ICC_GUIDELINES.bowlingTechniques.fastBowling.action.legalRequirements.map((req, i) => (
              <Text key={i} style={styles.legalItem}>⚠️ {req}</Text>
            ))}
          </View>
        )}
      </TouchableOpacity>

      {/* Fielding Section */}
      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Fielding Techniques</Text>
      
      <TouchableOpacity
        style={styles.techniqueCard}
        onPress={() => toggleSection('catching')}
      >
        <View style={styles.techniqueHeader}>
          <Ionicons name="hand-left" size={24} color="#8b5cf6" />
          <Text style={styles.techniqueTitle}>Catching</Text>
        </View>
        {expandedSection === 'catching' && (
          <View style={styles.techniqueContent}>
            <Text style={styles.subTitle}>High Catch:</Text>
            {ICC_GUIDELINES.fieldingTechniques.catching.highCatch.map((point, i) => (
              <Text key={i} style={styles.keyPoint}>✓ {point}</Text>
            ))}
            <Text style={[styles.subTitle, { marginTop: 12 }]}>Slip Catching:</Text>
            {ICC_GUIDELINES.fieldingTechniques.catching.slip.map((point, i) => (
              <Text key={i} style={styles.keyPoint}>✓ {point}</Text>
            ))}
          </View>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  const renderSafetyTab = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>ICC Safety Guidelines</Text>
      <Text style={styles.sectionSubtitle}>Equipment and practice area requirements</Text>

      <TouchableOpacity
        style={styles.safetyCard}
        onPress={() => toggleSection('batting-equipment')}
      >
        <View style={styles.safetyHeader}>
          <View style={[styles.safetyIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
            <Ionicons name="baseball" size={24} color="#10b981" />
          </View>
          <Text style={styles.safetyTitle}>Batting Equipment</Text>
        </View>
        {expandedSection === 'batting-equipment' && (
          <View style={styles.safetyContent}>
            {ICC_GUIDELINES.safetyGuidelines.equipment.batting.map((item, i) => (
              <View key={i} style={styles.safetyItem}>
                <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                <Text style={styles.safetyText}>{item}</Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.safetyCard}
        onPress={() => toggleSection('fielding-equipment')}
      >
        <View style={styles.safetyHeader}>
          <View style={[styles.safetyIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
            <Ionicons name="hand-left" size={24} color="#3b82f6" />
          </View>
          <Text style={styles.safetyTitle}>Fielding Equipment</Text>
        </View>
        {expandedSection === 'fielding-equipment' && (
          <View style={styles.safetyContent}>
            {ICC_GUIDELINES.safetyGuidelines.equipment.fielding.map((item, i) => (
              <View key={i} style={styles.safetyItem}>
                <Ionicons name="checkmark-circle" size={18} color="#3b82f6" />
                <Text style={styles.safetyText}>{item}</Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.safetyCard}
        onPress={() => toggleSection('practice-area')}
      >
        <View style={styles.safetyHeader}>
          <View style={[styles.safetyIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
            <Ionicons name="location" size={24} color="#f59e0b" />
          </View>
          <Text style={styles.safetyTitle}>Practice Area</Text>
        </View>
        {expandedSection === 'practice-area' && (
          <View style={styles.safetyContent}>
            {ICC_GUIDELINES.safetyGuidelines.practiceArea.map((item, i) => (
              <View key={i} style={styles.safetyItem}>
                <Ionicons name="alert-circle" size={18} color="#f59e0b" />
                <Text style={styles.safetyText}>{item}</Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.safetyCard}
        onPress={() => toggleSection('heat-guidelines')}
      >
        <View style={styles.safetyHeader}>
          <View style={[styles.safetyIcon, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
            <Ionicons name="sunny" size={24} color="#ef4444" />
          </View>
          <Text style={styles.safetyTitle}>Heat Guidelines</Text>
        </View>
        {expandedSection === 'heat-guidelines' && (
          <View style={styles.safetyContent}>
            {ICC_GUIDELINES.safetyGuidelines.heatGuidelines.map((item, i) => (
              <View key={i} style={styles.safetyItem}>
                <Ionicons name="water" size={18} color="#ef4444" />
                <Text style={styles.safetyText}>{item}</Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  const renderWarmupTab = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>ICC Warm-up Protocol</Text>
      <Text style={styles.sectionSubtitle}>
        {ICC_GUIDELINES.warmup.duration} minute structured warm-up
      </Text>

      {ICC_GUIDELINES.warmup.phases.map((phase, index) => (
        <View key={index} style={styles.warmupPhase}>
          <View style={styles.warmupHeader}>
            <View style={styles.warmupNumber}>
              <Text style={styles.warmupNumberText}>{index + 1}</Text>
            </View>
            <View style={styles.warmupInfo}>
              <Text style={styles.warmupName}>{phase.name}</Text>
              <Text style={styles.warmupDuration}>{phase.duration} minutes</Text>
            </View>
          </View>
          <Text style={styles.warmupDesc}>{phase.description}</Text>
          <View style={styles.exerciseList}>
            {phase.exercises.map((exercise, i) => (
              <View key={i} style={styles.exerciseItem}>
                <Ionicons name="fitness" size={16} color="#10b981" />
                <Text style={styles.exerciseText}>{exercise}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Cool-down Protocol</Text>
      <Text style={styles.sectionSubtitle}>
        {ICC_GUIDELINES.cooldown.duration} minute structured cool-down
      </Text>

      {ICC_GUIDELINES.cooldown.phases.map((phase, index) => (
        <View key={index} style={styles.warmupPhase}>
          <View style={styles.warmupHeader}>
            <View style={[styles.warmupNumber, { backgroundColor: '#3b82f6' }]}>
              <Text style={styles.warmupNumberText}>{index + 1}</Text>
            </View>
            <View style={styles.warmupInfo}>
              <Text style={styles.warmupName}>{phase.name}</Text>
              <Text style={styles.warmupDuration}>{phase.duration} minutes</Text>
            </View>
          </View>
          <Text style={styles.warmupDesc}>{phase.description}</Text>
          <View style={styles.exerciseList}>
            {phase.exercises.map((exercise, i) => (
              <View key={i} style={styles.exerciseItem}>
                <Ionicons name="body" size={16} color="#3b82f6" />
                <Text style={styles.exerciseText}>{exercise}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ICC Guidelines</Text>
        <View style={styles.iccBadge}>
          <Text style={styles.iccBadgeText}>2025</Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id as TabType)}
          >
            <Ionicons
              name={tab.icon as any}
              size={18}
              color={activeTab === tab.id ? '#10b981' : '#64748b'}
            />
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'rules' && renderRulesTab()}
      {activeTab === 'techniques' && renderTechniquesTab()}
      {activeTab === 'safety' && renderSafetyTab()}
      {activeTab === 'warmup' && renderWarmupTab()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
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
    borderRadius: 20,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  iccBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  iccBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    gap: 6,
  },
  tabActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  tabText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#10b981',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  // Rule Cards
  ruleCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ruleBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ruleBadgeText: {
    color: '#3b82f6',
    fontSize: 11,
    fontWeight: '600',
  },
  ruleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  ruleDescription: {
    fontSize: 14,
    color: '#94a3b8',
  },
  ruleDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  ruleDetailText: {
    fontSize: 13,
    color: '#cbd5e1',
    marginBottom: 4,
  },
  effectiveDate: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 8,
    fontWeight: '500',
  },
  // Format Cards
  formatCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  formatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  formatDetails: {
    marginTop: 12,
  },
  formatItem: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 6,
  },
  // Technique Cards
  techniqueCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  techniqueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  techniqueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  techniqueContent: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  keyPoint: {
    fontSize: 14,
    color: '#10b981',
    marginBottom: 6,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  faultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
    marginTop: 12,
    marginBottom: 8,
  },
  faultItem: {
    fontSize: 14,
    color: '#ef4444',
    marginBottom: 4,
  },
  legalItem: {
    fontSize: 13,
    color: '#f59e0b',
    marginBottom: 4,
  },
  shotCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
  },
  shotItem: {
    marginBottom: 8,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#334155',
  },
  shotName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  shotDesc: {
    fontSize: 12,
    color: '#64748b',
  },
  // Safety Cards
  safetyCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  safetyIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safetyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  safetyContent: {
    marginTop: 16,
  },
  safetyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  safetyText: {
    flex: 1,
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  // Warmup
  warmupPhase: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  warmupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  warmupNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  warmupNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  warmupInfo: {
    flex: 1,
  },
  warmupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  warmupDuration: {
    fontSize: 12,
    color: '#64748b',
  },
  warmupDesc: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 12,
  },
  exerciseList: {
    gap: 8,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  exerciseText: {
    fontSize: 13,
    color: '#cbd5e1',
    flex: 1,
  },
});
