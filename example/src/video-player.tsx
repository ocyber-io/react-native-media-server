import React from 'react';
import {
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

import { VLCPlayer } from 'react-native-vlc-media-player';
import { proxyMediaURL } from 'react-native-media-server';

interface Props {
  style: StyleProp<ViewStyle>;
}

export function VideoPlayer(props: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Video Player</Text>
      <VLCPlayer
        style={props.style}
        source={{
          uri: proxyMediaURL(
            'https://ocyber.s3.amazonaws.com/fox-and-bird-segmented/fox-and-bird.m3u8'
          ),
        }}
        onBuffering={(e) => {
          console.log('Buffered', e);
        }}
        onLoad={(e) => {
          console.log('Loaded', e);
        }}
        onError={(e) => {
          console.log('Error', e);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 500,
    backgroundColor: 'red',
  },
  text: {
    color: 'white',
  },
});
