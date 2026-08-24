import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        try {
          const { data } = await client.get('/auth/me');
          setUser(data);
        } catch {
          await SecureStore.deleteItemAsync('token');
        }
      }
      setLoading(false);
    })();
  }, []);

  // Step 1 of signup: creates the account and triggers an emailed OTP.
  // Does NOT log the user in yet - returns { email, requiresOtp }.
  const register = async (name, email, password, phone) => {
    try {
      const { data } = await client.post('/auth/register', { name, email, password, phone });
      return data;
    } catch (err) {
      console.log('REGISTER ERROR >>>', JSON.stringify({
        message: err.message,
        code: err.code,
        baseURL: err.config?.baseURL,
        url: err.config?.url,
        responseStatus: err.response?.status,
        responseData: err.response?.data,
      }, null, 2));
      throw err;
    }
  };

  // Step 2 of signup: confirms the OTP and completes login.
  const verifyOtp = async (email, otp) => {
    const { data } = await client.post('/auth/verify-otp', { email, otp });
    await SecureStore.setItemAsync('token', data.token);
    setUser(data.user);
    return data;
  };

  const resendOtp = async (email, purpose = 'verify') => {
    const { data } = await client.post('/auth/resend-otp', { email, purpose });
    return data;
  };

  // Normal login. If the account was never verified, the backend responds
  // 403 with { requiresOtp: true, email } and resends a fresh code -
  // the caller (LoginScreen) should route to the OTP screen in that case.
  const login = async (email, password) => {
    const { data } = await client.post('/auth/login', { email, password });
    await SecureStore.setItemAsync('token', data.token);
    setUser(data.user);
    return data;
  };

  const forgotPassword = async (email) => {
    const { data } = await client.post('/auth/forgot-password', { email });
    return data;
  };

  const resetPassword = async (email, otp, newPassword) => {
    const { data } = await client.post('/auth/reset-password', { email, otp, newPassword });
    await SecureStore.setItemAsync('token', data.token);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('token');
    setUser(null);
  };

  const updateProfile = async (fields) => {
    const { data } = await client.patch('/auth/profile', fields);
    setUser(data);
    return data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        verifyOtp,
        resendOtp,
        forgotPassword,
        resetPassword,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);