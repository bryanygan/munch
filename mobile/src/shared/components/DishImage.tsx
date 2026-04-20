import React from 'react';
import { StyleSheet, View, ImageStyle, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '@/shared/theme';

type Props = {
  uri: string;
  blurhash?: string; // reserved for future use; ignored in Expo Go build
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  contentFit?: 'cover' | 'contain';
};

export const DishImage: React.FC<Props> = ({
  uri, style, imageStyle, contentFit = 'cover',
}) => (
  <View style={[styles.root, style]}>
    <View style={[StyleSheet.absoluteFill, styles.placeholder]} />
    <Image
      source={{ uri }}
      style={[StyleSheet.absoluteFill, imageStyle]}
      contentFit={contentFit}
      transition={200}
    />
  </View>
);

const styles = StyleSheet.create({
  root: { overflow: 'hidden' },
  placeholder: { backgroundColor: colors.divider },
});
