import {
  type OnProgressEventProps,
  type VideoInfo,
  VLCPlayer,
  type VLCPlayerProps,
} from 'react-native-vlc-media-player';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native';
import { useMediaManager } from './use-media-manager';

interface Props extends VLCPlayerProps {
  containerStyle: StyleProp<ViewStyle>;
}

export function MediaPlayer(props: Props) {
  const ref = useRef<VLCPlayer>();
  const { source, ...rest } = props;
  const {
    loading,
    proxyURL,
    changeResolution,
    changeProgress,
    loadFirstProfile,
  } = useMediaManager(source.uri);

  useEffect(() => {
    if (props.paused) {
      loadFirstProfile();
    }
  }, [loadFirstProfile, props.paused]);

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
      <View style={props.containerStyle}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={props.containerStyle}>
      <VLCPlayer
        ref={ref}
        style={props.style}
        repeat={true}
        source={{
          uri: proxyURL,
        }}
        onLoad={handleOnLoadEvent}
        onProgress={handleProgress}
        {...rest}
      />
    </View>
  );
}
