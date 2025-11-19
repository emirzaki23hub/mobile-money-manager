import * as SecureStore from 'expo-secure-store';

// Load from .env file (EXPO_PUBLIC_ prefix is required for client-side access)
const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  console.error("⚠️ EXPO_PUBLIC_API_URL is missing in .env file");
}

export const api = async (endpoint: string, options: RequestInit = {}) => {
  const fullUrl = `${API_URL}${endpoint}`;
  
  // 1. Log the outgoing request
  console.log(`[API REQUEST] ${options.method || 'GET'} ${fullUrl}`);

  const token = await SecureStore.getItemAsync("token");
  
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    // Handle Unauthorized (Logout)
    if (response.status === 401) {
      console.log(`[API FAIL] 401 Unauthorized for ${endpoint}`);
      await SecureStore.deleteItemAsync("token");
      // In a real app, you would trigger a navigation to Login here
      return null;
    }

    // Try to parse JSON for success and error handling
    let data;
    try {
      data = await response.json();
    } catch (e) {
      // If server returns non-JSON (like an HTML error page)
      console.error(`[API FAIL] ${response.status} Non-JSON response.`);
      throw new Error(`Server returned status ${response.status}.`);
    }
    
    // 4. Handle API Errors (e.g., 404, 400 Bad Request)
    if (!response.ok) {
      console.error(`[API FAIL] ${response.status} for ${endpoint}:`, data.error);
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    // 3. Log successful response data
    console.log(`[API SUCCESS] ${response.status} for ${endpoint}`);
    
    return data;
  } catch (error) {
    // Log network/fetch errors (DNS issues, connection refused, etc.)
    console.log(error)
    console.error(`[NETWORK ERROR] Failed to fetch ${fullUrl}:`, error);
    throw error;
  }
};

// Helper to save token after Login
export const saveToken = async (token: string) => {
  await SecureStore.setItemAsync("token", token);
};