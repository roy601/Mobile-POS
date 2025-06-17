import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import { AuthProvider } from '../contexts/AuthContext';
import { DatabaseProvider } from '../contexts/DatabaseContext';
import { theme } from '../constants/theme'
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

export default function RootLayout() {
  useFrameworkReady();
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <DatabaseProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="login" />
            <Stack.Screen name="scanner" options={{ presentation: 'modal' }} />
          </Stack>
          <StatusBar style="auto" />
          <Toast />
        </DatabaseProvider>
      </AuthProvider>
    </PaperProvider>
  );
}