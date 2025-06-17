import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Camera } from 'expo-camera';
import { 
  Button, 
  Title, 
  Paragraph, 
  useTheme,
  Surface,
  IconButton
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface BarcodeScannerProps {
  onBarcodeScanned: (barcode: string) => void;
  onClose: () => void;
  title?: string;
  description?: string;
}

export default function BarcodeScanner({ 
  onBarcodeScanned, 
  onClose, 
  title = "Scan Barcode",
  description = "Point your camera at a barcode to scan"
}: BarcodeScannerProps) {
  const theme = useTheme();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getBarCodeScannerPermissions();
  }, []);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (!scanned) {
      setScanned(true);
      onBarcodeScanned(data);
    }
  };

  const resetScanner = () => {
    setScanned(false);
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContent}>
          <Title style={{ color: theme.colors.onBackground }}>Requesting camera permission...</Title>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContent}>
          <MaterialIcons name="camera-alt" size={64} color={theme.colors.onSurfaceVariant} />
          <Title style={[styles.permissionTitle, { color: theme.colors.onBackground }]}>
            Camera Permission Required
          </Title>
          <Paragraph style={[styles.permissionText, { color: theme.colors.onSurfaceVariant }]}>
            This app needs camera access to scan barcodes. Please enable camera permission in your device settings.
          </Paragraph>
          <Button mode="contained" onPress={onClose} style={styles.permissionButton}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'black' }]}>
      {/* Header */}
      <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.headerContent}>
          <IconButton 
            icon="close" 
            size={24} 
            onPress={onClose}
            iconColor={theme.colors.onSurface}
          />
          <View style={styles.headerText}>
            <Title style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
              {title}
            </Title>
            <Paragraph style={[styles.headerDescription, { color: theme.colors.onSurfaceVariant }]}>
              {description}
            </Paragraph>
          </View>
          <IconButton 
            icon={flashOn ? "flash-on" : "flash-off"}
            size={24} 
            onPress={() => setFlashOn(!flashOn)}
            iconColor={theme.colors.onSurface}
          />
        </View>
      </Surface>

      {/* Camera */}
      <View style={styles.cameraContainer}>
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={styles.camera}
          flashMode={flashOn ? Camera.Constants.FlashMode.torch : Camera.Constants.FlashMode.off}
        />
        
        {/* Scanning Overlay */}
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.topLeft, { borderColor: theme.colors.primary }]} />
            <View style={[styles.corner, styles.topRight, { borderColor: theme.colors.primary }]} />
            <View style={[styles.corner, styles.bottomLeft, { borderColor: theme.colors.primary }]} />
            <View style={[styles.corner, styles.bottomRight, { borderColor: theme.colors.primary }]} />
          </View>
        </View>

        {/* Instructions */}
        <Surface style={[styles.instructions, { backgroundColor: theme.colors.surface + 'CC' }]}>
          <Paragraph style={[styles.instructionText, { color: theme.colors.onSurface }]}>
            {scanned ? 'Barcode scanned successfully!' : 'Align barcode within the frame'}
          </Paragraph>
        </Surface>
      </View>

      {/* Bottom Actions */}
      <Surface style={[styles.bottomActions, { backgroundColor: theme.colors.surface }]}>
        {scanned ? (
          <View style={styles.scannedActions}>
            <Button 
              mode="outlined" 
              onPress={resetScanner}
              style={styles.actionButton}
            >
              Scan Another
            </Button>
            <Button 
              mode="contained" 
              onPress={onClose}
              style={styles.actionButton}
            >
              Done
            </Button>
          </View>
        ) : (
          <View style={styles.scanningActions}>
            <Button 
              mode="outlined" 
              onPress={onClose}
              style={styles.actionButton}
            >
              Cancel
            </Button>
            <Button 
              mode="text" 
              onPress={() => {
                Alert.prompt(
                  'Enter Barcode',
                  'Manually enter the barcode:',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'OK', 
                      onPress: (barcode) => {
                        if (barcode) {
                          onBarcodeScanned(barcode);
                        }
                      }
                    }
                  ]
                );
              }}
              style={styles.actionButton}
            >
              Enter Manually
            </Button>
          </View>
        )}
      </Surface>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  permissionButton: {
    marginTop: 16,
  },
  header: {
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  headerText: {
    flex: 1,
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerDescription: {
    fontSize: 14,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instructions: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 8,
  },
  instructionText: {
    textAlign: 'center',
    fontSize: 16,
  },
  bottomActions: {
    padding: 16,
    elevation: 4,
  },
  scannedActions: {
    flexDirection: 'row',
    gap: 12,
  },
  scanningActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
  },
});