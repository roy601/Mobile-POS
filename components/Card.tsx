import { View, StyleSheet, ViewStyle } from 'react-native';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  padding?: number;
  shadow?: boolean;
}

export default function Card({ children, style, padding = 16, shadow = true }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        { padding },
        shadow && styles.shadow,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});