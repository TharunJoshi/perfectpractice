import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSessionStore } from '../../src/store/sessionStore';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';

export default function Sessions() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { sessions, isLoading, getMySessions } = useSessionStore();

  useEffect(() => {
    getMySessions();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return '#f59e0b';
      case 'active':
        return '#10b981';
      case 'completed':
        return '#64748b';
      default:
        return '#64748b';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'time';
      case 'active':
        return 'play-circle';
      case 'completed':
        return 'checkmark-circle';
      default:
        return 'help-circle';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderSession = ({ item }: any) => {
    const isHost = item.host_id === user?.id;
    const participants = item.participants || [];
    const isSolo = item.is_solo || participants.length === 1;
    
    return (
      <TouchableOpacity
        style={styles.sessionCard}
        onPress={() => router.push(`/session/${item.id}`)}
      >
        <View style={styles.sessionHeader}>
          <View style={styles.sessionInfo}>
            <View style={styles.goalRow}>
              <Text style={styles.sessionGoal}>{item.goal}</Text>
              {isSolo && (
                <View style={styles.soloTag}>
                  <Ionicons name="person" size={12} color="#10b981" />
                  <Text style={styles.soloText}>Solo</Text>
                </View>
              )}
            </View>
            <Text style={styles.sessionMeta}>
              {item.focus_area} • Day {item.day_number} • {item.duration} min
            </Text>
            {item.skill_level && (
              <Text style={styles.skillLevel}>
                {item.skill_level.charAt(0).toUpperCase() + item.skill_level.slice(1)}
              </Text>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}> 
            <Ionicons name={getStatusIcon(item.status)} size={16} color={getStatusColor(item.status)} />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.sessionFooter}>
          <View style={styles.roleTag}>
            <Ionicons
              name={isHost ? 'star' : 'people'}
              size={14}
              color="#10b981"
            />
            <Text style={styles.roleText}>
              {isHost ? 'Host' : 'Participant'} • {participants.length}/{item.num_players || 2} players
            </Text>
          </View>
          <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
        </View>

        {item.ai_practice_plan && (
          <View style={styles.aiTag}>
            <Ionicons name="sparkles" size={12} color="#8b5cf6" />
            <Text style={styles.aiText}>AI-Generated Plan</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Sessions</Text>
        <TouchableOpacity onPress={getMySessions}>
          <Ionicons name="refresh" size={24} color="#10b981" />
        </TouchableOpacity>
      </View>

      {sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#64748b" />
          <Text style={styles.emptyText}>No sessions yet</Text>
          <Text style={styles.emptySubText}>
            Create or join a session to get started
          </Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderSession}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  listContainer: {
    padding: 24,
    paddingTop: 0,
    gap: 16,
  },
  sessionCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sessionInfo: {
    flex: 1,
    marginRight: 12,
  },
  sessionGoal: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  sessionMeta: {
    fontSize: 14,
    color: '#94a3b8',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  sessionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roleText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
  },
  dateText: {
    fontSize: 14,
    color: '#64748b',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
  },
});
