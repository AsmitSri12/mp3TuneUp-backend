import { ChildProcess } from 'child_process';
export interface VideoMetadata {
    title: string;
    thumbnail: string;
    duration: number;
    uploader: string;
    viewCount: number;
    description: string;
}
/**
 * Fetches video metadata using yt-dlp --dump-json (no download).
 */
export declare function getMetadata(url: string): Promise<VideoMetadata>;
/**
 * Creates a yt-dlp spawned process that extracts best audio and pipes to stdout.
 * The caller is responsible for piping stdout to ffmpeg.
 */
export declare function createAudioStream(url: string): ChildProcess;
//# sourceMappingURL=ytdlp.d.ts.map