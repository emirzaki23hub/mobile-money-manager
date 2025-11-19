import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';

// Assuming these paths are correct for your project
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Calendar } from 'lucide-react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarButton: HapticTab,
        headerShown: false, // Ensures the header is hidden on tab screens
        
        // 🛑 CRITICAL: This hides the entire bottom tab bar 🛑
        tabBarStyle: { display: 'none' }, 
        
        tabBarLabelStyle: styles.tabBarLabel,
      }}>
      
      <Tabs.Screen
        name="index" // Your Dashboard/Home screen
        options={{
          title: 'Home',
          headerShown: false, 
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          href: null, // Hides this tab button
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="paperplane.fill" color={color} />,
        }}
      />
      
      <Tabs.Screen 
        name="calendar" 
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color }) => <Calendar size={22} color={color} />,
        }}
      />
      
      {/* NOTE: Any other screen defined here (e.g., 'transaction') will also have the tab bar hidden. 
      Remember to use custom navigation buttons (like the Floating Action Button and header icons) 
      to move between these screens now that the bar is gone.
      */}
      
    </Tabs>
  );
}

const styles = StyleSheet.create({
    // Only includes the label style, as the bar itself is hidden via inline style
    tabBarLabel: {
        fontSize: 11,
        fontWeight: '600',
    }
});