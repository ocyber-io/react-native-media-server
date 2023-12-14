declare module 'm3u8-parser' {
  export type ByteRange = { length: number; offset: number };
  export interface PlayList {
    attributes: {
      'AUDIO': string;
      'AVERAGE-BANDWIDTH': string;
      'BANDWIDTH': number;
      'CODECS': string;
      'FRAME-RATE': number;
      'RESOLUTION': {
        height: number;
        width: number;
      };
      'VIDEO-RANGE': string;
    };
    uri: string;
    timeline: number;
  }

  export interface Segment {
    'title': string;
    'byterange': ByteRange;
    'duration': number;
    'programDateTime': number;
    'attributes': {};
    'discontinuity': number;
    'uri': string;
    'timeline': number;
    'key': {
      method: string;
      uri: string;
      iv: string;
    };
    'map': {
      uri: string;
      byterange: ByteRange;
    };
    'cue-out': string;
    'cue-out-cont': string;
    'cue-in': string;
    'custom': { vodTiming: string; mappingExample: string };
  }

  export interface MediaGroup {
    'AUDIO': {
      [group_id: string]: {
        [name: string]: {
          default: boolean;
          autoselect: boolean;
          language: string;
          uri: string;
          instreamId: string;
          characteristics: string;
          forced: boolean;
        };
      };
    };
    'VIDEO': {};
    'CLOSED-CAPTIONS': {};
    'SUBTITLES': {};
  }

  export interface Manifest {
    allowCache: boolean;
    endList: boolean;
    mediaSequence: number;
    dateRanges: any[];
    discontinuitySequence: number;
    independentSegments: boolean;
    playlistType: string;
    custom: {
      framerate: string;
    };
    playlists: PlayList[];
    mediaGroups: MediaGroup;
    dateTimeString: string;
    dateTimeObject: Date;
    targetDuration: number;
    totalDuration: number;
    discontinuityStarts: number[];
    segments: Segment[];
    version: number;
  }

  export class Parser {
    constructor();

    manifest: Manifest;

    push(chunk: string): void;

    end(): void;

    addParser(options: {
      expression: RegExp;
      customType: string;
      dataParser: unknown;
      segment: boolean;
    }): void;

    addTagMapper(options: { expression: RegExp; map: any }): void;
  }
}
