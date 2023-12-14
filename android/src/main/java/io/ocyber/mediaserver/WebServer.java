package io.ocyber.mediaserver;
import android.content.Context;
import android.net.Uri;
import android.os.Build;
import android.util.Log;

import androidx.annotation.RequiresApi;
import java.io.BufferedReader;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.IOException;

import java.io.InputStreamReader;
import java.net.URL;
import java.net.URLConnection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

import fi.iki.elonen.NanoHTTPD;

public class WebServer extends NanoHTTPD {

  private Context context;
  public WebServer( Context context, int port)
  {
    super(port);
    this.context = context;
  }
  @RequiresApi(api = Build.VERSION_CODES.N)
  @Override
  public Response serve(IHTTPSession session) {

    if (session.getUri().equals("/favicon.ico")) {
      return newFixedLengthResponse("404: Not Found" );
    }
    String uri = session.getUri();

    String basePath = context.getFilesDir().getAbsolutePath();
    String modifiedBasePath = removeFileName(basePath+uri);

    final CompletableFuture<Response> responseFuture = new CompletableFuture<>();

    String basePathuRL = "";
    try {
      Map<String, List<String>> params = session.getParameters();
      if (params.isEmpty()){
        basePathuRL = readFileBaseUrl(modifiedBasePath);
      }else {
        basePathuRL = Objects.requireNonNull(session.getParameters().get("baseURL")).get(0);
      }
      Log.d("BASE URL", basePathuRL);
    }catch (Exception e){
      basePathuRL = readFileBaseUrl(modifiedBasePath);
      Log.d("BASE URL Extracted", "URL Extracted in catch"+basePathuRL);
      e.printStackTrace();
    }
    final FileInputStream[] fis = {null};
    String fileName = extractFileName(basePath,uri);
    String fileExtension = extractFileExtension(fileName);
    String mWebPath = basePathuRL + uri;

    if (fileName.equals("0") || fileName.equals("favicon.ico")) {
      return newFixedLengthResponse("404: Not Found" );
    }


    File file = new File(basePath+uri);
    if (!file.exists()) {
      String modifiedPath = removeFileName(file.getAbsolutePath());
      File modifiedFile = new File(modifiedPath);
      if (modifiedFile.mkdirs()){
        Log.d("Directory Created", modifiedFile.getAbsolutePath());
      }
      if (!new File(modifiedFile,"baseUrl.txt" ).exists()) {
        writeBaseUrlToTextFile(modifiedFile, "baseUrl.txt", basePathuRL);
      }
      downloadFile(mWebPath, file, responseFuture::complete);
      try {
        return responseFuture.get(); // Wait for the response
      } catch (InterruptedException | ExecutionException e) {
        return newFixedLengthResponse("Error processing request");
      }
    }


    if (file.exists()){
      try {
        Log.v("File exists", "Already Exists");
        fis[0] = new FileInputStream(file);
        return newChunkedResponse(Response.Status.OK, FileType.getMimeTypeByFileType(fileExtension), fis[0]);

      } catch (Exception e) {
        e.printStackTrace();
        return newFixedLengthResponse("404: Resource Not Found" );
      }

    }else {
      return newFixedLengthResponse("404: Resource Not Found" );
    }
  }

  public void writeBaseUrlToTextFile(File root,String sFileName, String sBody ) {
    try {
      if (!root.exists()) {
        root.mkdirs();
      }
      File gpxfile = new File(root, sFileName);
      FileWriter writer = new FileWriter(gpxfile);
      writer.append(sBody);
      writer.flush();
      writer.close();
    } catch (IOException e) {
      e.printStackTrace();
    }
  }

  public String readFileBaseUrl(String path) {
    StringBuilder stringBuilder = new StringBuilder();

    try {
      File file = new File(path, "baseUrl.txt");
      if (file.exists()) {
        FileInputStream fileInputStream = new FileInputStream(file);
        InputStreamReader inputStreamReader = new InputStreamReader(fileInputStream);
        BufferedReader bufferedReader = new BufferedReader(inputStreamReader);

        String line;
        while ((line = bufferedReader.readLine()) != null) {
          stringBuilder.append(line);
        }

        bufferedReader.close();
        inputStreamReader.close();
        fileInputStream.close();
      } else {
        stringBuilder.append("File not found.");
      }
    } catch (IOException e) {
      e.printStackTrace();
      stringBuilder.append("Error reading the file.");
    }

    return stringBuilder.toString();
  }

  private void downloadFile(String url, File outputFile, OnDownloadCompleteListener listener) {
    try {
      URL u = new URL(url);
      URLConnection conn = u.openConnection();
      int contentLength = conn.getContentLength();

      String mimeType = conn.getHeaderField("Content-Type");
      DataInputStream stream = new DataInputStream(u.openStream());

      byte[] buffer = new byte[contentLength];
      stream.readFully(buffer);
      stream.close();

      DataOutputStream fos = new DataOutputStream(new FileOutputStream(outputFile));
      fos.write(buffer);
      fos.flush();
      fos.close();
      listener.onDownloadComplete(newChunkedResponse(Response.Status.OK, mimeType, new FileInputStream(outputFile)));


    } catch(FileNotFoundException e) {
      listener.onDownloadComplete(newFixedLengthResponse("404: Resource Not Found"));
      e.printStackTrace();

    } catch (IOException e) {
      listener.onDownloadComplete(newFixedLengthResponse("404: Resource Not Found"));
      e.printStackTrace();


    }
  }


  public String removeFileName(String filePath) {
    File file = new File(filePath);

    // Check if the path is a directory
    if (file.isDirectory()) {
      // If it's a directory, get its parent
      File parent = file.getParentFile();
      if (parent != null) {
        return parent.getAbsolutePath();
      } else {
        // If the directory has no parent, return the original path
        return filePath;
      }
    } else {
      // If it's a file, get its parent
      File parent = file.getParentFile();
      if (parent != null) {
        return parent.getAbsolutePath();
      } else {
        // If the file has no parent, return an empty string
        return "";
      }
    }
  }
  public String extractFileName(String baseUrl, String path) {
    Uri baseUri = Uri.parse(baseUrl);
    Uri uri = Uri.parse(baseUri.toString() + path);
    return uri.getLastPathSegment();
  }

  public String extractFileExtension(String lastSegment) {
    int dotIndex = lastSegment.lastIndexOf(".");
    if (dotIndex != -1 && dotIndex < lastSegment.length() - 1) {
      return lastSegment.substring(dotIndex + 1).toLowerCase();
    } else {
      return ""; // No extension found
    }
  }

}

