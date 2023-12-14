import { useCallback, useEffect, useState } from 'react';
import { M3U8Manager } from './m3u8-manager';
import { proxyMediaURL } from 'react-native-media-server';

interface M3U8ManagerState {
  loading: boolean;
  profileLoading: boolean;
  proxyURL: string;
  changeURI(uri: string): void;
  changeResolution(width: number, height: number): void;
  changeBandwidth(bandwidth: number): void;
  changeIndex(index: number): void;
}
export function useM3U8Manager(defaultUri: string): M3U8ManagerState {
  const [loading, setLoading] = useState<boolean>(true);
  const [profileLoading, setProfileLoading] = useState<boolean>(true);
  const [url, setURL] = useState<string>(defaultUri);
  const [proxyURL, setProxyURL] = useState<string>('');
  const [manager, setManager] = useState<M3U8Manager>(null);

  useEffect(() => {
    const m3u8Manager = new M3U8Manager(url);
    setManager(m3u8Manager);
    setProxyURL(m3u8Manager.proxyURL);
  }, [url, setManager, setProxyURL]);

  useEffect(() => {
    if (manager) {
      setLoading(true);
      manager
        .waitForM3U8()
        .then(() => {
          console.log(manager.proxyURL);
        })
        .catch(console.error)
        .finally(() => {
          setLoading(false);
        });
    }
  }, [manager]);

  const changeURI = useCallback(
    (uri: string) => {
      setURL(proxyMediaURL(uri));
    },
    [setURL]
  );

  const changeResolution = useCallback(
    (width: number, height: number) => {
      setProfileLoading(true);
      manager
        .changePlaylistByResolution(width, height)
        .then(() => {
          console.log(`Media Resolution Changed ${width}x${height}`);
        })
        .catch(console.error)
        .finally(() => {
          setProfileLoading(false);
        });
    },
    [manager]
  );
  const changeBandwidth = useCallback(
    (bandwidth: number) => {
      setProfileLoading(true);
      manager
        .changePlayListByBandwidth(bandwidth)
        .then(() => {
          console.log(`Media Bandwidth Changed ${bandwidth}`);
        })
        .catch(console.error)
        .finally(() => {
          setProfileLoading(false);
        });
    },
    [manager]
  );

  const changeIndex = useCallback(
    (index: number) => {
      setProfileLoading(true);
      manager.changePlaylistByIndex(index).finally(() => {
        setProfileLoading(false);
      });
    },
    [manager]
  );

  return {
    loading,
    profileLoading,
    proxyURL,
    changeURI,
    changeBandwidth,
    changeIndex,
    changeResolution,
  };
}
