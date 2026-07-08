import { ref, computed } from 'vue';
import { AuthService } from '../services/AuthService';

// Shared reactive session state
const session = ref(null);
let initialized = false;

// Refresh session from localStorage
const refreshSession = async () => {
  try {
    const currentSession = await AuthService.getSession();
    session.value = currentSession;
    return currentSession;
  } catch (error) {
    console.debug('No active session found');
    session.value = null;
    return null;
  }
};

// Set session and update reactive state
const setSession = async (sessionData) => {
  await AuthService.setSession(sessionData);
  session.value = sessionData;
};

// Clear session and update reactive state
const clearSession = async () => {
  await AuthService.clearSession();
  session.value = null;
};

// Check if user is admin
const isAdmin = computed(() => {
  return session.value && session.value.role === 'admin';
});

// Check if user is logged in
const isLoggedIn = computed(() => {
  return !!session.value;
});

export function useSession() {
  // Initialize session on first use
  if (!initialized) {
    refreshSession();
    initialized = true;
  }

  return {
    session,
    refreshSession,
    setSession,
    clearSession,
    isAdmin,
    isLoggedIn
  };
}
