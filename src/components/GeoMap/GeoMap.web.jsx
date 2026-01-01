import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MapView = ({ style, children }) => (
  <View style={[styles.container, style]}>
    <Text style={styles.message}>Mapa disponível apenas nos apps Android/iOS.</Text>
    {children}
  </View>
);

export const Marker = () => null;
export const Circle = () => null;
export const PROVIDER_GOOGLE = null;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 220,
    borderWidth: 1,
    borderColor: '#dfe3e5',
    borderRadius: 16,
    backgroundColor: '#fafafa',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 12
  },
  message: {
    color: '#626c71',
    textAlign: 'center'
  }
});

export default MapView;
