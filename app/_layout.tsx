import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function Layout() {
  return (
    <>
      <StatusBar style="dark" />
      
      {/* ⭐️ REMOVED: headerShown: false ⭐️ */}
      <Stack>
        
        {/* Screens where the header MUST be hidden (e.g., Auth, Loading) */}
        <Stack.Screen name="index" options={{ headerShown: false }}/>
        <Stack.Screen name="login" options={{ headerShown: false }}/>

        {/* 🌟 Group that contains the Tab Bar (Dashboard, Calendar, etc.) 🌟 */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }}/> 
        
        {/* 🛑 REMOVED: <Stack.Screen name="dashboard" /> (It belongs in (tabs)) 🛑 */}
        
       {/* ✅ The header is now guaranteed to show for Transaction ✅ */}
       <Stack.Screen 
          name="transaction" 
          options={{ 
            headerShown: true, // Now this will be respected!
            title: "Transaction", 
            headerStyle: { backgroundColor: '#FFC107' },
            headerTintColor: '#000',
          }} 
        />

        <Stack.Screen 
          name="add-wallet" 
          options={{ 
            headerShown: true, 
            title: "New Wallet",
            headerStyle: { backgroundColor: '#FFC107' },
            headerTintColor: '#000',
          }} 
        />
         <Stack.Screen 
          name="calendar" 
          options={{ 
            headerShown: true, 
            title: "Calendar",
            headerStyle: { backgroundColor: '#FFC107' },
            headerTintColor: '#000',
          }} 
        />
      </Stack>
    </>
  );
}