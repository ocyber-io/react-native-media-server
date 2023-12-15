import 'react-native-gesture-handler';

import React, { useEffect, useState } from 'react';

import { Dimensions, StyleSheet, View } from 'react-native';
import { ReactNativeMediaServer } from 'react-native-media-server';
import { MediaPlayer } from './media-player';
import Carousel from 'react-native-reanimated-carousel';

let videoUrlList = [
  'https://s3.us-east-1.amazonaws.com/reup-staging-convert/user/new/profileImage/1679657781993/convert.m3u8',
  'https://s3.us-east-1.amazonaws.com/reup-staging-convert/review/new/video/1681895218275/convert.m3u8',
  'https://s3.us-east-1.amazonaws.com/reup-staging-convert/review/new/video/1682587586875/convert.m3u8',
  'https://s3.us-east-1.amazonaws.com/reup-staging-convert/review/new/video/1682590765881/convert.m3u8',
  'https://s3.us-east-1.amazonaws.com/reup-staging-convert/review/new/video/1683192601331/convert.m3u8',
  'https://s3.us-east-1.amazonaws.com/reup-staging-convert/review/new/video/1692572353233/convert.m3u8',
  'https://s3.us-east-1.amazonaws.com/reup-staging-convert/store/new/files/1693867174405/convert.m3u8',
  'https://s3.us-east-1.amazonaws.com/reup-staging-convert/store/new/files/1693867614284/convert.m3u8',
  'https://s3.us-east-1.amazonaws.com/reup-staging-convert/store/new/files/1693890752704/convert.m3u8',
  'https://s3.us-east-1.amazonaws.com/reup-staging-convert/store/new/files/1693908348889/convert.m3u8',
  'https://s3.us-east-1.amazonaws.com/reup-staging-convert/store/new/files/1694609968157/convert.m3u8',
  'https://s3.us-east-1.amazonaws.com/reup-staging-convert/store/new/files/1694609990023/convert.m3u8',
  'https://s3.us-east-1.amazonaws.com/reup-staging-convert/store/new/files/1694768481418/convert.m3u8',
  'https://s3.us-east-1.amazonaws.com/reup-staging-convert/store/new/files/1694776798298/convert.m3u8',
  'https://s3.us-east-1.amazonaws.com/reup-staging-convert/store/new/files/1695131577099/convert.m3u8',
  'https://s3.us-east-1.amazonaws.com/reup-staging-convert/store/new/files/1695214529386/convert.m3u8',
  'https://s3.us-east-1.amazonaws.com/reup-staging-convert/store/new/files/1696258223369/convert.m3u8',
  'https://s3.us-east-1.amazonaws.com/reup-staging-convert/store/new/files/1697592751222/convert.m3u8',
  'https://s3.us-east-1.amazonaws.com/reup-staging-convert/review/new/video/1698110064924/convert.m3u8',
  'https://s3.us-east-1.amazonaws.com/reup-staging-convert/store/new/files/1698226307958/convert.m3u8',
  'https://s3.us-east-1.amazonaws.com/reup-staging-convert/review/new/video/1698895348351/convert.m3u8',
];

interface VideoItem {
  uri: string;
  title: string;
  index: number;
}

let videoItems: VideoItem[] = videoUrlList.map((item, index) => ({
  uri: item,
  title: `Video - ${index + 1}`,
  index: index,
}));
const window = Dimensions.get('window');

export default function App() {
  const [muted, setMuted] = useState(false);

  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  useEffect(() => {
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
      {!loading && (
        <Carousel
          loop={false}
          vertical={true}
          width={window.width}
          height={window.height}
          autoPlay={false}
          defaultIndex={currentIndex}
          data={videoItems}
          onSnapToItem={setCurrentIndex}
          pagingEnabled={true}
          onScrollBegin={() => {
            setMuted(true);
          }}
          onScrollEnd={(index) => {
            setMuted(false);
            setCurrentIndex(index);
          }}
          scrollAnimationDuration={0}
          renderItem={(item) => {
            return (
              <MediaPlayer
                containerStyle={styles.containerStyle}
                style={styles.videoPlayer}
                source={{ uri: item.item.uri }}
                resizeMode="cover"
                muted={currentIndex !== item.index || muted}
              />
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    width: '100%',
    flex: 1,
    flexGrow: 1,
  },
  videoPlayer: {
    width: '100%',
    height: 400, // display: 'none',
  },
  containerStyle: {
    width: window.width,
    height: window.height,
    backgroundColor: 'black',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
