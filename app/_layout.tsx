import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function Layout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="dashboard" />
        
        <Stack.Screen 
          name="transaction" 
          options={{ 
            headerShown: true, 
            title: "Add Transaction",
            headerStyle: { backgroundColor: '#FFC107' },
            headerTintColor: '#000',
          }} 
        />

        {/* NEW SCREEN */}
        <Stack.Screen 
          name="add-wallet" 
          options={{ 
            headerShown: true, 
            title: "New Wallet",
            headerStyle: { backgroundColor: '#FFC107' },
            headerTintColor: '#000',
          }} 
        />
      </Stack>
    </>
  );
}