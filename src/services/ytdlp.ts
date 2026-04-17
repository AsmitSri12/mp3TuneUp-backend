import { spawn, ChildProcess, spawnSync } from 'child_process';
import { sanitizeUrl } from '../middleware/sanitize';

export interface VideoMetadata {
  title: string;
  thumbnail: string;
  duration: number; // seconds
  uploader: string;
  viewCount: number;
  description: string;
}

const MAX_DURATION = parseInt(process.env.MAX_DURATION_SECONDS || '1800', 10);

// Absolute paths verified on this machine
const YTDLP_BIN = 'C:/Users/ashle/AppData/Roaming/Python/Python314/Scripts/yt-dlp.exe';
const FFMPEG_BIN = 'C:/Users/ashle/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1-full_build/bin/ffmpeg.exe';

/**
 * Fetches video metadata using yt-dlp --dump-json (no download).
 */
export async function getMetadata(url: string): Promise<VideoMetadata> {
  const { safe, url: cleanUrl, error } = sanitizeUrl(url);
  if (!safe) throw new Error(error);

  return new Promise((resolve, reject) => {
    const ytdlp = spawn(YTDLP_BIN, [
      '--dump-json',
      '--no-playlist',
      '--no-warnings',
      cleanUrl,
    ]);

    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => {
      ytdlp.kill('SIGKILL');
      reject(new Error('Metadata fetch timed out after 30 seconds.'));
    }, 30_000);

    ytdlp.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
    ytdlp.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

    ytdlp.on('close', (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        reject(new Error(`yt-dlp exited with code ${code}: ${stderr.trim()}`));
        return;
      }
      try {
        const json = JSON.parse(stdout);
        if (json.duration > MAX_DURATION) {
          reject(
            new Error(
              `Video is too long (${Math.round(json.duration / 60)} min). Maximum allowed is ${Math.round(MAX_DURATION / 60)} min.`
            )
          );
          return;
        }
        resolve({
          title: json.title || 'Unknown Title',
          thumbnail: json.thumbnail || '',
          duration: json.duration || 0,
          uploader: json.uploader || 'Unknown',
          viewCount: json.view_count || 0,
          description: (json.description || '').substring(0, 500),
        });
      } catch {
        reject(new Error('Failed to parse video metadata.'));
      }
    });

    ytdlp.on('error', (err) => {
      clearTimeout(timeout);
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        reject(new Error('yt-dlp is not installed or not found in PATH.'));
      } else {
        reject(err);
      }
    });
  });
}

/**
 * Creates a yt-dlp spawned process that extracts best audio and pipes to stdout.
 * The caller is responsible for piping stdout to ffmpeg.
 */
export function createAudioStream(url: string): ChildProcess {
  const { safe, url: cleanUrl, error } = sanitizeUrl(url);
  if (!safe) throw new Error(error);

  return spawn(YTDLP_BIN, [
    '-f', 'bestaudio',
    '--no-playlist',
    '--no-warnings',
    '-o', '-',    // output to stdout
    cleanUrl,
  ]);
}
