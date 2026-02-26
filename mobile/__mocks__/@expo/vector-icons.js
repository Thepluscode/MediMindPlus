/**
 * Mock for @expo/vector-icons
 */
import React from 'react';
import { Text } from 'react-native';

const createIconMock = (name) => {
  const IconMock = (props) => <Text {...props}>{name}</Text>;
  IconMock.displayName = `${name}Icon`;
  return IconMock;
};

export const Ionicons = createIconMock('Ionicons');
export const FontAwesome = createIconMock('FontAwesome');
export const MaterialIcons = createIconMock('MaterialIcons');
export const MaterialCommunityIcons = createIconMock('MaterialCommunityIcons');
