import { proxyMediaURL } from 'react-native-media-server';
import {
  Parser,
  type Manifest,
  type ByteRange,
  type Segment,
} from 'm3u8-parser';
import { Queue } from './queue';
import { DownloadingWorker } from './downloading-worker';
export interface MediaSegment {
  byteRange: ByteRange;
  uri: string;
  duration: number;
  downloaded: boolean;
}

export interface M3U8MediaSegmentType {
  index: number;
  baseURL: string;
  audioInitial?: MediaSegment;
  audio: MediaSegment;
  videoInitial?: MediaSegment;
  video: MediaSegment;
  duration: number;
  timeStart: number;
  timeEnd: number;
  lastSegment: boolean;
}

interface MediaURLRecord {
  audioURI: string;
  videoURI: string;
  resolution: {
    width: number;
    height: number;
  };
  bandwidth: number;
  frameRate: number;
  averageBandwidth: string;
  audioManifest?: Manifest;
  videoManifest?: Manifest;
  mediaSegments: M3U8MediaSegmentType[];
}

export class MediaManager {
  private downloadingQueue: Queue<M3U8MediaSegmentType> =
    new Queue<M3U8MediaSegmentType>();
  primary: Manifest;
  private currentIndex = 0;
  private readonly baseURL: string;
  readonly proxyURL: string;
  private mediaURLRecords: MediaURLRecord[] = [];
  constructor(uri: string) {
    this.mediaURLRecords = [];
    this.proxyURL = proxyMediaURL(uri);
    this.baseURL = this.getBaseURI();
  }

  get records() {
    return this.mediaURLRecords;
  }

  get currentProfile() {
    return this.mediaURLRecords[this.currentIndex];
  }

  findIndex(
    predicate: (
      value: MediaURLRecord,
      index: number,
      obj: MediaURLRecord[]
    ) => unknown
  ): number {
    return this.mediaURLRecords.findIndex(predicate);
  }

  find(
    predicate: (
      value: MediaURLRecord,
      index: number,
      obj: MediaURLRecord[]
    ) => unknown
  ): MediaURLRecord | undefined {
    return this.mediaURLRecords.find(predicate);
  }

  private set index(value: number) {
    if (value >= 0 && value < this.mediaURLRecords.length) {
      this.currentIndex = value;
    } else {
      throw new Error('Invalid Index for Profiles');
    }
  }

  get index() {
    return this.currentIndex;
  }

  private getBaseURI(): string {
    const [primaryURL] = this.proxyURL.split('?');
    if (!primaryURL) {
      throw new Error('Invalid Proxy URL');
    }

    const parts = primaryURL.split('/');
    const filename = parts[parts.length - 1];
    if (!filename) {
      throw new Error('Invalid Proxy URL');
    }
    return primaryURL.replace(filename, '');
  }

  private generateMediaManifestList() {
    this.mediaURLRecords = [];
    const manifest = this.primary;
    if (!manifest) {
      throw new Error('Invalid Manifest');
    }
    for (const playlist of manifest.playlists) {
      const mediaURLRecord: MediaURLRecord = {
        audioURI: '',
        videoURI: playlist.uri,
        resolution: {
          width: playlist?.attributes?.RESOLUTION?.width,
          height: playlist?.attributes?.RESOLUTION?.height,
        },
        bandwidth: playlist?.attributes?.BANDWIDTH,
        averageBandwidth: playlist?.attributes?.['AVERAGE-BANDWIDTH'],
        frameRate: playlist?.attributes?.['FRAME-RATE'],
        mediaSegments: [],
      };

      if ('AUDIO' in playlist.attributes) {
        const groupKey = playlist.attributes.AUDIO;
        const audioGroup = manifest.mediaGroups.AUDIO[groupKey];
        const subGroupKey = 'Alternate Audio';
        if (audioGroup) {
          if (subGroupKey in audioGroup) {
            mediaURLRecord.audioURI = audioGroup[subGroupKey].uri;
          }
        }
      }
      this.mediaURLRecords.push(mediaURLRecord);
    }
    this.mediaURLRecords.sort((A, B) => {
      return A.bandwidth - B.bandwidth;
    });
  }

  private async downloadPrimaryM3U8File() {
    if (!this.primary) {
      const m3u8Text = await fetch(this.proxyURL).then((res) => res.text());
      const parser = new Parser();
      parser.push(m3u8Text);
      parser.end();
      this.primary = parser.manifest;
    }
    this.generateMediaManifestList();
  }

  private getInitialMediaSegment(
    segment: Segment,
    index: number
  ): MediaSegment {
    if ('map' in segment && index === 0) {
      const map = segment.map;
      if ('uri' in map) {
        const uri = map.uri;
        const byteRange = map.byterange;
        return {
          uri,
          duration: segment.duration,
          byteRange,
          downloaded: false,
        };
      }
    }
    return null;
  }
  private getMediaSegment(segment: Segment): MediaSegment {
    const uri = segment.uri;
    const byteRange = segment.byterange;
    const duration = segment.duration;
    return { uri, byteRange, duration, downloaded: false };
  }

  private generateSegmentMap(profile: MediaURLRecord) {
    let startTime = 0;
    if (profile && profile.videoManifest) {
      for (
        let segmentIndex = 0;
        segmentIndex < profile.videoManifest.segments.length;
        segmentIndex++
      ) {
        const video: Segment = profile.videoManifest.segments[segmentIndex];
        let audio: Segment = null;
        if (profile.audioManifest) {
          audio = profile.audioManifest.segments[segmentIndex];
        }
        const segmentItem: M3U8MediaSegmentType = {
          index: segmentIndex,
          baseURL: this.baseURL,
          audioInitial: this.getInitialMediaSegment(audio, segmentIndex),
          videoInitial: this.getInitialMediaSegment(video, segmentIndex),
          audio: this.getMediaSegment(audio),
          video: this.getMediaSegment(video),
          timeStart: startTime * 1000,
          timeEnd: (startTime + video.duration) * 1000,
          duration: video.duration * 1000,
          lastSegment:
            segmentIndex === profile.videoManifest.segments.length - 1,
        };
        profile.mediaSegments.push(segmentItem);
        startTime += video.duration;
      }
    }
  }

  private async getProfileByIndex(index: number) {
    const profile = this.mediaURLRecords[index];
    if (profile) {
      return profile;
    }
    throw new Error('No Media Profile Available');
  }
  private async downloadM3U8File(file: string) {
    const url = `${this.baseURL}${file}`;
    const m3u8Text = await fetch(url).then((res) => res.text());
    const parser = new Parser();
    parser.push(m3u8Text);
    parser.end();
    return parser.manifest;
  }
  private async downloadMediaFile(segment: MediaSegment) {
    const url = `${this.baseURL}${segment.uri}`;
    const headers: Headers = new Headers();
    if (segment.byteRange) {
      headers.set(
        'Range',
        `bytes=${segment.byteRange.offset}-${
          segment.byteRange.offset + segment.byteRange.length - 1
        }`
      );
    }
    const request = new Request(url, {
      headers: headers,
      mode: 'no-cors',
    });
    return await fetch(request);
  }

  waitForM3U8() {
    return new Promise(async (resolve, reject) => {
      this.downloadPrimaryM3U8File().then(resolve).catch(reject);
    });
  }

  async downloadCurrentIndexProfile() {
    const profile = await this.getProfileByIndex(this.currentIndex);
    if (!profile.audioManifest) {
      profile.audioManifest = await this.downloadM3U8File(profile.audioURI);
    }

    if (!profile.videoManifest) {
      profile.videoManifest = await this.downloadM3U8File(profile.videoURI);
    }

    this.generateSegmentMap(profile);
  }

  async changePlayListByBandwidth(bandwidth: number) {
    this.index = this.findIndex((item) => item.bandwidth === bandwidth);
    await this.downloadCurrentIndexProfile();
  }

  async changePlaylistByResolution(width: number, height: number) {
    this.index = this.findIndex(
      (item) =>
        item.resolution.width === width && item.resolution.height === height
    );
    await this.downloadCurrentIndexProfile();
  }

  async changePlaylistByIndex(index: number) {
    this.index = index;
    await this.downloadCurrentIndexProfile();
  }

  private findSegmentIndexByTime(currentTime: number) {
    if (!this.currentProfile) {
      return -1;
    }
    return this.currentProfile.mediaSegments.findIndex((item) => {
      return item.timeStart <= currentTime && item.timeEnd >= currentTime;
    });
  }

  downloadingWorker() {
    const downloadingWorker = new DownloadingWorker();
    downloadingWorker.worker = async (self) => {
      while (
        (await this.downloadingQueue.waitForNextAvailable()) &&
        self.open
      ) {
        const item = this.downloadingQueue.dequeue();
        console.log(item);
        if (item.videoInitial) {
          await this.downloadMediaFile(item.videoInitial);
        }
        if (item.audioInitial) {
          await this.downloadMediaFile(item.audioInitial);
        }
        if (item.video) {
          await this.downloadMediaFile(item.video);
        }
        if (item.audio) {
          await this.downloadMediaFile(item.audio);
        }
      }
    };
    return downloadingWorker;
  }

  downloadNext(currentTime: number) {
    const segmentIndex = this.findSegmentIndexByTime(currentTime);
    if (segmentIndex !== -1) {
      this.downloadByIndex(segmentIndex);
      this.downloadByIndex(segmentIndex + 1);
      this.downloadByIndex(segmentIndex + 2);
    }
  }

  downloadByIndex(index: number) {
    if (
      !this.currentProfile &&
      index >= this.currentProfile.mediaSegments.length
    ) {
      return;
    }
    const segment = this.currentProfile.mediaSegments[index];
    if (segment) {
      const dequeued = this.downloadingQueue.isDeQueued(
        (item) =>
          item.baseURL === segment.baseURL && item.index === segment.index
      );
      if (!dequeued) {
        this.downloadingQueue.enqueue(segment);
      }
    }
  }
}
