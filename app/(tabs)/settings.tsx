import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Moon, 
  Globe, 
  Volume2, 
  Wifi, 
  Database, 
  Shield, 
  Smartphone,
  Download,
  Trash2,
  RefreshCw,
  Info
} from 'lucide-react-native';
import { useState } from 'react';

export default function SettingsScreen() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [wifiOnly, setWifiOnly] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear the app cache? This will free up storage space but may slow down the app temporarily.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => {
          // Implement cache clearing logic
          Alert.alert('Success', 'Cache cleared successfully');
        }}
      ]
    );
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'This will reset all settings to their default values. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => {
          setDarkMode(false);
          setNotifications(true);
          setSoundEnabled(true);
          setWifiOnly(false);
          setAutoBackup(true);
          Alert.alert('Success', 'Settings reset to defaults');
        }}
      ]
    );
  };

  const settingSections = [
    {
      title: 'Appearance',
      items: [
        {
          icon: Moon,
          title: 'Dark Mode',
          subtitle: 'Switch between light and dark themes',
          color: '#6366F1',
          hasSwitch: true,
          switchValue: darkMode,
          onSwitchChange: setDarkMode,
        },
        {
          icon: Globe,
          title: 'Language',
          subtitle: 'English (US)',
          color: '#059669',
          hasChevron: true,
        },
      ]
    },
    {
      title: 'Notifications',
      items: [
        {
          icon: Volume2,
          title: 'Push Notifications',
          subtitle: 'Receive notifications for updates',
          color: '#DC2626',
          hasSwitch: true,
          switchValue: notifications,
          onSwitchChange: setNotifications,
        },
        {
          icon: Volume2,
          title: 'Sound Effects',
          subtitle: 'Play sounds for interactions',
          color: '#7C3AED',
          hasSwitch: true,
          switchValue: soundEnabled,
          onSwitchChange: setSoundEnabled,
        },
      ]
    },
    {
      title: 'Data & Storage',
      items: [
        {
          icon: Wifi,
          title: 'WiFi Only Downloads',
          subtitle: 'Download content only on WiFi',
          color: '#0891B2',
          hasSwitch: true,
          switchValue: wifiOnly,
          onSwitchChange: setWifiOnly,
        },
        {
          icon: Database,
          title: 'Auto Backup',
          subtitle: 'Automatically backup your data',
          color: '#EA580C',
          hasSwitch: true,
          switchValue: autoBackup,
          onSwitchChange: setAutoBackup,
        },
        {
          icon: Download,
          title: 'Download Quality',
          subtitle: 'High Quality',
          color: '#16A34A',
          hasChevron: true,
        },
      ]
    },
    {
      title: 'Security',
      items: [
        {
          icon: Shield,
          title: 'Privacy Settings',
          subtitle: 'Manage your privacy preferences',
          color: '#9333EA',
          hasChevron: true,
        },
        {
          icon: Smartphone,
          title: 'App Lock',
          subtitle: 'Secure app with biometrics',
          color: '#BE185D',
          hasChevron: true,
        },
      ]
    },
    {
      title: 'Advanced',
      items: [
        {
          icon: Trash2,
          title: 'Clear Cache',
          subtitle: 'Free up storage space',
          color: '#EF4444',
          onPress: handleClearCache,
        },
        {
          icon: RefreshCw,
          title: 'Reset Settings',
          subtitle: 'Reset all settings to default',
          color: '#F59E0B',
          onPress: handleResetSettings,
        },
        {
          icon: Info,
          title: 'About',
          subtitle: 'App version and information',
          color: '#6B7280',
          hasChevron: true,
        },
      ]
    }
  ];

  const renderSettingItem = (item: any, index: number) => (
    <TouchableOpacity 
      key={index} 
      style={styles.settingItem}
      onPress={item.onPress}
    >
      <View style={styles.settingItemLeft}>
        <View style={[styles.settingIcon, { backgroundColor: item.color + '20' }]}>
          <item.icon size={20} color={item.color} />
        </View>
        <View style={styles.settingItemText}>
          <Text style={styles.settingItemTitle}>{item.title}</Text>
          <Text style={styles.settingItemSubtitle}>{item.subtitle}</Text>
        </View>
      </View>
      <View style={styles.settingItemRight}>
        {item.hasSwitch && (
          <Switch
            value={item.switchValue}
            onValueChange={item.onSwitchChange}
            trackColor={{ false: '#E5E7EB', true: item.color + '40' }}
            thumbColor={item.switchValue ? item.color : '#F3F4F6'}
          />
        )}
        {item.hasChevron && (
          <Text style={styles.chevronText}>›</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* Settings Sections */}
        {settingSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => renderSettingItem(item, itemIndex))}
            </View>
          </View>
        ))}

        {/* Storage Info */}
        <View style={styles.storageSection}>
          <Text style={styles.sectionTitle}>Storage</Text>
          <View style={styles.storageCard}>
            <View style={styles.storageInfo}>
              <Text style={styles.storageTitle}>App Storage</Text>
              <Text style={styles.storageSubtitle}>2.4 GB of 64 GB used</Text>
            </View>
            <View style={styles.storageBar}>
              <View style={[styles.storageProgress, { width: '15%' }]} />
            </View>
            <View style={styles.storageDetails}>
              <View style={styles.storageDetailItem}>
                <View style={[styles.storageColorDot, { backgroundColor: '#3B82F6' }]} />
                <Text style={styles.storageDetailText}>App Data: 1.2 GB</Text>
              </View>
              <View style={styles.storageDetailItem}>
                <View style={[styles.storageColorDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.storageDetailText}>Cache: 800 MB</Text>
              </View>
              <View style={styles.storageDetailItem}>
                <View style={[styles.storageColorDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.storageDetailText}>Downloads: 400 MB</Text>
              </View>
            </View>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Version 1.0.0 (Build 100)</Text>
          <Text style={styles.appInfoText}>© 2024 Your Company Name</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingItemText: {
    flex: 1,
  },
  settingItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  settingItemSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  settingItemRight: {
    marginLeft: 12,
  },
  chevronText: {
    fontSize: 20,
    color: '#9CA3AF',
    fontWeight: '300',
  },
  storageSection: {
    marginBottom: 24,
  },
  storageCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  storageInfo: {
    marginBottom: 16,
  },
  storageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  storageSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  storageBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  storageProgress: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  storageDetails: {
    gap: 8,
  },
  storageDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  storageColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  storageDetailText: {
    fontSize: 14,
    color: '#64748B',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 4,
  },
  appInfoText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});