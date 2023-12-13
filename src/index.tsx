import {
  AppState,
  type AppStateStatus,
  type NativeEventSubscription,
  NativeModules,
  Platform,
} from 'react-native';

const LINKING_ERROR =
  `The package 'react-native-media-server' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const MediaServer = NativeModules.MediaServer
  ? NativeModules.MediaServer
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

interface MediaServerDefault {
  port: number;
  root: string | null;
  localhost: string;
}

interface MediaServerOptions {
  localOnly: boolean;
  keepAlive: boolean;
}

export class ReactNativeMediaServer {
  private static serverPort: number = 8080;

  static proxyURL(url: string) {
    const baseURLMatch = url.match(/^https?:\/\/[^/]+/);
    if (!baseURLMatch) {
      throw new Error('Invalid URL format');
    }
    const [baseURL] = baseURLMatch;
    const modifiedURL = url.replace(
      baseURL,
      `http://127.0.0.1:${this.serverPort}`
    );
    return `${modifiedURL}?baseURL=${encodeURIComponent(baseURL)}`;
  }

  private readonly defaultValues: MediaServerDefault = {
    port: 8080,
    root: '',
    localhost: 'http://127.0.0.1:',
  };
  private readonly defaultOptions: MediaServerOptions = {
    localOnly: false,
    keepAlive: false,
  };
  private readonly port: number;
  private readonly root: string | null;
  private readonly localOnly: boolean;
  private readonly keepAlive: boolean;
  private running: boolean = false;
  private started: boolean;
  private origin?: string;
  private appStateChangeEventSubscription: NativeEventSubscription | undefined;

  constructor(port: number, root?: string, opts?: Partial<MediaServerOptions>) {
    this.port = port ?? this.defaultValues.port;
    this.root = root ?? this.defaultValues.root;
    if (typeof opts !== 'undefined') {
      this.localOnly = opts.localOnly ?? this.defaultOptions.localOnly;
      this.keepAlive = opts.keepAlive ?? this.defaultOptions.keepAlive;
    } else {
      this.localOnly = this.defaultOptions.localOnly;
      this.keepAlive = this.defaultOptions.keepAlive;
    }
    ReactNativeMediaServer.serverPort = this.port;
    this.started = false;
    this.origin = undefined;
  }

  start() {
    if (this.running) {
      return Promise.resolve(this.origin);
    }

    this.started = true;
    this.running = true;

    if (!this.keepAlive && Platform.OS === 'android') {
      this.appStateChangeEventSubscription = AppState.addEventListener(
        'change',
        this.onAppStateChange
      );
    }
    return MediaServer.start(
      this.port,
      this.root,
      this.localOnly,
      this.keepAlive
    ).then((origin: string) => {
      this.origin = origin;
      return origin;
    });
  }

  stop() {
    this.running = false;

    return MediaServer.stop();
  }

  kill() {
    this.stop();
    this.started = false;
    this.origin = undefined;
    if (this.appStateChangeEventSubscription) {
      this.appStateChangeEventSubscription.remove();
    }
  }

  isRunning() {
    return MediaServer.isRunning().then((running: boolean) => {
      this.running = running;
      return this.running;
    });
  }

  private onAppStateChange = (appState: AppStateStatus) => {
    if (!this.started) {
      return;
    }

    if (appState === 'active' && !this.running) {
      this.start();
    }

    if (appState === 'background' && this.running) {
      this.stop();
    }

    if (appState === 'inactive' && this.running) {
      this.stop();
    }
  };
}

export function proxyMediaURL(url: string) {
  return ReactNativeMediaServer.proxyURL(url);
}
