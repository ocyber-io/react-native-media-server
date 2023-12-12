import * as React from 'react';

import { StyleSheet, View } from 'react-native';
import { ReactNativeMediaServer } from 'react-native-media-server';
import { VideoPlayer } from './video-player';

export default function App() {
  React.useEffect(() => {
    const server = new ReactNativeMediaServer(8080);
    server.start();

    return () => {
      server.stop();
    };
  }, []);

  return (
    <View style={styles.container}>
      <VideoPlayer style={styles.videoPlayer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayer: {
    width: '100%',
    height: 400,
  },
});
