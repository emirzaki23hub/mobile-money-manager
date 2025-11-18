import * as SecureStore from 'expo-secure-store';

// Load from .env file (EXPO_PUBLIC_ prefix is required for client-side access)
const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  console.error("⚠️ EXPO_PUBLIC_API_URL is missing in .env file");
}

export const api = async (endpoint: string, options: RequestInit = {}) => {
  // 2. Retrieve token from secure phone storage
  const token = await SecureStore.getItemAsync("token");
  
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // 3. Handle Unauthorized (Logout)
    if (response.status === 401) {
      await SecureStore.deleteItemAsync("token");
      // In a real app, you would trigger a navigation to Login here
      return null;
    }

    const data = await response.json();
    
    // 4. Handle Errors returned by API
    if (!response.ok) {
      throw new Error(data.error || "Something went wrong");
    }

    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

// Helper to save token after Login
export const saveToken = async (token: string) => {
  await SecureStore.setItemAsync("token", token);
};