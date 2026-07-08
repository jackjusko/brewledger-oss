import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export const AuthService = {
  async getSession() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    // Check if token is still valid on server
    try {
      return {
        token,
        orgId: localStorage.getItem('orgId'),
        userId: localStorage.getItem('userId'),
        orgName: localStorage.getItem('orgName'),
        maxLocations: localStorage.getItem('maxLocations'),
        userName: localStorage.getItem('userName'),
        role: localStorage.getItem('userRole'),
        lastSyncTimestamp: localStorage.getItem('lastSyncTimestamp'),
        trialEndsAt: localStorage.getItem('trialEndsAt'),
        subscriptionPlan: localStorage.getItem('subscriptionPlan'),
        subscriptionStatus: localStorage.getItem('subscriptionStatus')
      };
    } catch (e) {
      this.logout();
      return null;
    }
  },

  // Check token validity proactively
  async checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      // Just try to fetch updates with empty changes to verify token
      await axios.post(`${API_BASE_URL}/sync`, 
        { changes: {}, lastSyncTimestamp: null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return true;
    } catch (e) {
      if (e.response && e.response.status === 401) {
        this.logout();
      }
      return false;
    }
  },

  async setSession(session) {
    localStorage.setItem('token', session.token);
    localStorage.setItem('orgId', session.orgId);
    localStorage.setItem('userId', session.userId);
    localStorage.setItem('orgName', session.orgName);
    if (session.maxLocations) localStorage.setItem('maxLocations', session.maxLocations);
    if (session.userName) localStorage.setItem('userName', session.userName);
    if (session.role) localStorage.setItem('userRole', session.role);
    if (session.deviceId) localStorage.setItem('device_id', session.deviceId);
    if (session.lastSyncTimestamp) localStorage.setItem('lastSyncTimestamp', session.lastSyncTimestamp);
    
    // Explicitly handle null/undefined for subscription fields to ensure they are updated or cleared
    if (session.trialEndsAt !== undefined) localStorage.setItem('trialEndsAt', session.trialEndsAt || '');
    if (session.subscriptionPlan !== undefined) localStorage.setItem('subscriptionPlan', session.subscriptionPlan || '');
    if (session.subscriptionStatus !== undefined) localStorage.setItem('subscriptionStatus', session.subscriptionStatus || '');
    // lastSeq is legacy/local naming, we use lastSyncTimestamp mostly now
  },

  async clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('orgId');
    localStorage.removeItem('userId');
    localStorage.removeItem('orgName');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('lastSyncTimestamp');
    localStorage.removeItem('trialEndsAt');
    localStorage.removeItem('subscriptionPlan');
    localStorage.removeItem('subscriptionStatus');
    // Don't clear device_id usually
  },

  async logout() {
    await this.clearSession();
    window.location.href = '/login';
  },

  async getDeviceId() {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = uuidv4();
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  },
  
  async updateLastSync(timestamp) {
    if (timestamp) {
      localStorage.setItem('lastSyncTimestamp', timestamp);
    }
  }
};
