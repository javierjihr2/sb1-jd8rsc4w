import { Stack } from 'expo-router';
import React from 'react';

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="security" />
      <Stack.Screen name="gaming" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="blocked-users" />
      <Stack.Screen name="data" />
      <Stack.Screen name="support" />
      <Stack.Screen name="about" />
      <Stack.Screen name="deactivate" />
      <Stack.Screen name="delete" />
    </Stack>
  );
}