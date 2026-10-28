import React from 'react';
import { StyleSheet, View, ImageStyle, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '@/shared/theme';
import { thumbhashToDataUri } from '@/shared/utils/thumbhash';

type Props = {
  uri: string;
  thumbhash?: string; // base64-encoded thumbhash string
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  contentFit?: 'cover' | 'contain';
};

export const DishImage: React.FC<Props> = ({
  uri, thumbhash, style, imageStyle, contentFit = 'cover',
}) => {
  const placeholderUri = thumbhash ? thumbhashToDataUri(thumbhash) : null;
  return (
    <View style={[styles.root, style]}>
      {placeholderUri ? (
        <Image
          source={{ uri: placeholderUri }}
          style={StyleSheet.absoluteFill}
          contentFit={contentFit}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.placeholder]} />
      )}
      <Image
        source={{ uri }}
        style={[StyleSheet.absoluteFill, imageStyle]}
        contentFit={contentFit}
        transition={200}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { overflow: 'hidden' },
  placeholder: { backgroundColor: colors.divider },
});
