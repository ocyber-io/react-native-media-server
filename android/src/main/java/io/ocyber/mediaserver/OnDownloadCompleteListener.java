package io.ocyber.mediaserver;

import fi.iki.elonen.NanoHTTPD;

public interface OnDownloadCompleteListener {
  void onDownloadComplete(NanoHTTPD.Response reponse);
}
