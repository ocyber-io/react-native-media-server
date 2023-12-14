import {
  type VideoInfo,
  VLCPlayer,
  type VLCPlayerProps,
} from 'react-native-vlc-media-player';
import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useM3U8Manager } from './useM3U8Manager';

interface Props extends VLCPlayerProps {}

export function MediaPlayer(props: Props) {
  const { source, ...rest } = props;
  const { loading, proxyURL, changeResolution } = useM3U8Manager(source.uri);

  const handleOnLoadEvent = useCallback(
    (event: VideoInfo) => {
      if (event.videoSize) {
        changeResolution(event.videoSize.width, event.videoSize.height);
      }
    },
    [changeResolution]
  );
  if (loading) {
    return <View style={props.style} />;
  }
  return (
    <VLCPlayer
      style={props.style}
      source={{
        uri: proxyURL,
      }}
      onLoad={handleOnLoadEvent}
      {...rest}
    />
  );
}
