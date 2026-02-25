import { create } from 'zustand';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

interface Step {
  name: string;
  duration: number;
  description: string;
}

interface Session {
  id: string;
  host_id: string;
  guest_id: string | null;
  join_code: string;
  day_number: number;
  duration: number;
  focus_area: string;
  goal: string;
  status: string;
  warmup_steps: Step[];
  practice_steps: Step[];
  cooldown_steps: Step[];
  current_step_index: number;
  current_phase: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface SessionState {
  currentSession: Session | null;
  sessions: Session[];
  isLoading: boolean;
  createSession: (data: any) => Promise<Session>;
  joinSession: (joinCode: string) => Promise<Session>;
  startSession: (sessionId: string) => Promise<Session>;
  nextStep: (sessionId: string) => Promise<Session>;
  completeSession: (sessionId: string) => Promise<Session>;
  getSession: (sessionId: string) => Promise<Session>;
  getMySessions: () => Promise<void>;
  setCurrentSession: (session: Session | null) => void;
}

const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const useSessionStore = create<SessionState>((set) => ({
  currentSession: null,
  sessions: [],
  isLoading: false,

  createSession: async (data: any) => {
    try {
      set({ isLoading: true });
      const headers = await getAuthHeaders();
      const response = await axios.post(`${API_URL}/sessions`, data, headers);
      const session = response.data;
      set({ currentSession: session, isLoading: false });
      return session;
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.detail || 'Failed to create session');
    }
  },

  joinSession: async (joinCode: string) => {
    try {
      set({ isLoading: true });
      const headers = await getAuthHeaders();
      const response = await axios.post(`${API_URL}/sessions/join`, { join_code: joinCode }, headers);
      const session = response.data;
      set({ currentSession: session, isLoading: false });
      return session;
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.detail || 'Failed to join session');
    }
  },

  startSession: async (sessionId: string) => {
    try {
      set({ isLoading: true });
      const headers = await getAuthHeaders();
      const response = await axios.post(`${API_URL}/sessions/${sessionId}/start`, {}, headers);
      const session = response.data;
      set({ currentSession: session, isLoading: false });
      return session;
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.detail || 'Failed to start session');
    }
  },

  nextStep: async (sessionId: string) => {
    try {
      set({ isLoading: true });
      const headers = await getAuthHeaders();
      const response = await axios.post(`${API_URL}/sessions/${sessionId}/next-step`, {}, headers);
      const session = response.data;
      set({ currentSession: session, isLoading: false });
      return session;
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.detail || 'Failed to advance step');
    }
  },

  completeSession: async (sessionId: string) => {
    try {
      set({ isLoading: true });
      const headers = await getAuthHeaders();
      const response = await axios.post(`${API_URL}/sessions/${sessionId}/complete`, {}, headers);
      const session = response.data;
      set({ currentSession: session, isLoading: false });
      return session;
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.detail || 'Failed to complete session');
    }
  },

  getSession: async (sessionId: string) => {
    try {
      set({ isLoading: true });
      const headers = await getAuthHeaders();
      const response = await axios.get(`${API_URL}/sessions/${sessionId}`, headers);
      const session = response.data;
      set({ currentSession: session, isLoading: false });
      return session;
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.detail || 'Failed to get session');
    }
  },

  getMySessions: async () => {
    try {
      set({ isLoading: true });
      const headers = await getAuthHeaders();
      const response = await axios.get(`${API_URL}/sessions/my-sessions/list`, headers);
      set({ sessions: response.data, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.detail || 'Failed to get sessions');
    }
  },

  setCurrentSession: (session: Session | null) => {
    set({ currentSession: session });
  },
}));
