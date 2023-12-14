import {
  type OnProgressEventProps,
  type VideoInfo,
  VLCPlayer,
  type VLCPlayerProps,
} from 'react-native-vlc-media-player';
import React, { useCallback } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useMediaManager } from './useMediaManager';

interface Props extends VLCPlayerProps {}

export function MediaPlayer(props: Props) {
  const { source, ...rest } = props;
  const { loading, proxyURL, changeResolution, changeProgress } =
    useMediaManager(source.uri);

  const handleOnLoadEvent = useCallback(
    (event: VideoInfo) => {
      console.log('Loaded => ', event);
      if (event.videoSize) {
        changeResolution(event.videoSize.width, event.videoSize.height);
      }
    },
    [changeResolution]
  );

  const handleProgress = useCallback(
    (event: OnProgressEventProps) => {
      changeProgress(event.currentTime);
    },
    [changeProgress]
  );
  if (loading) {
    return (
      <View style={props.style}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }
  return (
    <VLCPlayer
      style={props.style}
      source={{
        uri: proxyURL,
      }}
      onLoad={handleOnLoadEvent}
      onProgress={handleProgress}
      {...rest}
    />
  );
}
