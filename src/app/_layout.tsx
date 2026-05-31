import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import React from 'react';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="cadastro" />
        <Stack.Screen name="home-user" />
        <Stack.Screen name="waste-classifier" />
        <Stack.Screen name="mapa" />
        <Stack.Screen name="route-selection" />
        <Stack.Screen name="route-map" />
        <Stack.Screen name="residence-registration" />
        <Stack.Screen name="discount-control" />
        <Stack.Screen name="explore" />
      </Stack>
    </ThemeProvider>
  );
}
