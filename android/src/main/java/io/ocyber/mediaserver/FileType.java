package io.ocyber.mediaserver;

public enum FileType {
    M3U8("m3u8", "application/vnd.apple.mpegurl"),
    CMFA("cmfa", "audio/mp4"),
    CMFV("cmfv", "video/mp4");

    private final String fileType;
    private final String mimeType;

    FileType(String fileType, String mimeType) {
        this.fileType = fileType;
        this.mimeType = mimeType;
    }

    public String getMimeType() {
        return mimeType;
    }

    public static String getMimeTypeByFileType(String fileType) {
        for (FileType type : FileType.values()) {
            if (type.fileType.equalsIgnoreCase(fileType)) {
                return type.mimeType;
            }
        }
        return null; // Return null if no matching fileType is found
    }
}
