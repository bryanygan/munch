import React from 'react';
import { StyleSheet, View, ImageStyle, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Blurhash } from 'react-native-blurhash';

type Props = {
  uri: string;
  blurhash?: string;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  contentFit?: 'cover' | 'contain';
};

export const DishImage: React.FC<Props> = ({
  uri, blurhash, style, imageStyle, contentFit = 'cover',
}) => (
  <View style={[styles.root, style]}>
    {blurhash ? (
      <Blurhash blurhash={blurhash} style={StyleSheet.absoluteFill} />
    ) : null}
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
});
