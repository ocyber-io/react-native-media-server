import React from 'react';
import {
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

import { VLCPlayer } from 'react-native-vlc-media-player';

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
          uri: 'http://127.0.0.1:8080/reup-staging-convert/store/new/files/1694776798298/convert.m3u8?baseURL=https://s3.us-east-1.amazonaws.com',
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
  videoPlayer: {
    width: '100%',
    height: 400,
  },
});
