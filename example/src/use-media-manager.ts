import { useCallback, useEffect, useState } from 'react';
import { MediaManager } from './media-manager';
import { proxyMediaURL } from 'react-native-media-server';

interface MediaManagerState {
  loading: boolean;
  profileLoading: boolean;
  proxyURL: string;
  changeURI(uri: string): void;
  changeResolution(width: number, height: number): void;
  changeBandwidth(bandwidth: number): void;
  changeIndex(index: number): void;
  changeProgress(currentTime: number): void;
  loadFirstProfile(): void;
}
export function useMediaManager(defaultUri: string): MediaManagerState {
  const [loading, setLoading] = useState<boolean>(true);
  const [profileLoading, setProfileLoading] = useState<boolean>(true);
  const [url, setURL] = useState<string>(defaultUri);
  const [proxyURL, setProxyURL] = useState<string>('');
  const [manager, setManager] = useState<MediaManager>(null);

  useEffect(() => {
    const m3u8Manager = new MediaManager(url);
    setManager(m3u8Manager);
    setProxyURL(m3u8Manager.proxyURL);
    const worker = m3u8Manager.downloadingWorker();
    worker.start();
    return () => {
      worker.terminate();
    };
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

  const changeProgress = useCallback(
    (currentTime: number) => {
      manager.downloadNext(currentTime);
    },
    [manager]
  );

  const loadFirstProfile = useCallback(() => {
    if (manager && !loading) {
      manager.loadFirstProfileIfNotLoaded();
    }
  }, [manager, loading]);

  return {
    loading,
    profileLoading,
    proxyURL,
    changeURI,
    changeBandwidth,
    changeIndex,
    changeResolution,
    changeProgress,
    loadFirstProfile,
  };
}
