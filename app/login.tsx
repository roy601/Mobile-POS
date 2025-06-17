import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { 
  Card, 
  Title, 
  Button, 
  TextInput, 
  useTheme,
  Paragraph
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const theme = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@mobilepos.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('Login Failed', 'Invalid email or password');
      }
    } catch (error) {
      Alert.alert('Error', 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {/* Logo/Header */}
        <View style={styles.header}>
          <MaterialIcons name="point-of-sale" size={64} color={theme.colors.primary} />
          <Title style={[styles.title, { color: theme.colors.onBackground }]}>
            Mobile POS
          </Title>
          <Paragraph style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Point of Sale System
          </Paragraph>
        </View>

        {/* Login Form */}
        <Card style={[styles.loginCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.cardContent}>
            <Title style={[styles.loginTitle, { color: theme.colors.onSurface }]}>
              Sign In
            </Title>
            
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              left={<TextInput.Icon icon="email" />}
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={styles.input}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon 
                  icon={showPassword ? "eye-off" : "eye"} 
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.loginButton}
              contentStyle={styles.loginButtonContent}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>

            {/* Demo Credentials */}
            <View style={styles.demoCredentials}>
              <Paragraph style={[styles.demoTitle, { color: theme.colors.onSurfaceVariant }]}>
                Demo Credentials:
              </Paragraph>
              <Paragraph style={[styles.demoText, { color: theme.colors.onSurfaceVariant }]}>
                Admin: admin@mobilepos.com / admin123
              </Paragraph>
              <Paragraph style={[styles.demoText, { color: theme.colors.onSurfaceVariant }]}>
                Manager: manager@mobilepos.com / manager123
              </Paragraph>
            </View>
          </Card.Content>
        </Card>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.feature}>
            <MaterialIcons name="qr-code-scanner" size={24} color={theme.colors.primary} />
            <Paragraph style={[styles.featureText, { color: theme.colors.onSurfaceVariant }]}>
              Barcode Scanning
            </Paragraph>
          </View>
          <View style={styles.feature}>
            <MaterialIcons name="offline-bolt" size={24} color={theme.colors.primary} />
            <Paragraph style={[styles.featureText, { color: theme.colors.onSurfaceVariant }]}>
              Offline Support
            </Paragraph>
          </View>
          <View style={styles.feature}>
            <MaterialIcons name="analytics" size={24} color={theme.colors.primary} />
            <Paragraph style={[styles.featureText, { color: theme.colors.onSurfaceVariant }]}>
              Real-time Analytics
            </Paragraph>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
  },
  loginCard: {
    elevation: 4,
    marginBottom: 32,
  },
  cardContent: {
    padding: 24,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  loginButton: {
    marginTop: 16,
    marginBottom: 24,
  },
  loginButtonContent: {
    paddingVertical: 8,
  },
  demoCredentials: {
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  demoTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  demoText: {
    fontSize: 12,
    marginBottom: 4,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  feature: {
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 12,
    textAlign: 'center',
  },
});