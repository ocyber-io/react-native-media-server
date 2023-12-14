package io.ocyber.mediaserver;

import android.content.Context;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

import java.io.IOException;

import fi.iki.elonen.NanoHTTPD;

@ReactModule(name = MediaServerModule.NAME)
public class MediaServerModule extends ReactContextBaseJavaModule {
  Context context;

  WebServer server;
  public static final String NAME = "MediaServer";

  public MediaServerModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.context = reactContext.getApplicationContext();
  }

  @Override
  @NonNull
  public String getName() {
    return NAME;
  }


  // Example method
  // See https://reactnative.dev/docs/native-modules-android
  @ReactMethod
  public void stop() {
    if (server != null)
      server.stop();
  }
  // Example method
  // See https://reactnative.dev/docs/native-modules-android

  @ReactMethod
  public void start(int port, String root, boolean localOnly, boolean keepAlive, Promise promise) {
    try {
      server = new WebServer(this.context, port);
      server.start(NanoHTTPD.SOCKET_READ_TIMEOUT, false);
      promise.resolve("Server started successfully");
    }catch (IOException e){
      e.printStackTrace();
      promise.reject("SERVER_ERROR", "Failed to start server: " + e.getMessage());
    }
  }
  @ReactMethod
  public void isRunning(Promise promise) {
    if (server != null && server.isAlive()) {
      promise.resolve(true);
    } else {
      promise.resolve(false);
    }
  }
}
