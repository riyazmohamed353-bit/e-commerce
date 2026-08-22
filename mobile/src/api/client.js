import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export const BASE_URL = 'https://used-electronics-product-sale.onrender.com/api';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // Render free tier can take 30-50s to wake from sleep
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default client;