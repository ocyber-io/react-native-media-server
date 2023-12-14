import * as React from 'react';

import { StyleSheet, View } from 'react-native';
import { ReactNativeMediaServer } from 'react-native-media-server';
import { VideoPlayer } from './video-player';
import { useState } from 'react';

export default function App() {
  const [loading, setLoading] = useState(true);
  React.useEffect(() => {
    setLoading(true);
    const server = new ReactNativeMediaServer(8080, 'www');
    server.start();
    setLoading(false);
    return () => {
      server.stop();
    };
  }, [setLoading]);

  return (
    <View style={styles.container}>
      {!loading && <VideoPlayer style={styles.videoPlayer} />}
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
    objectFit: 'contain',
  },
});
