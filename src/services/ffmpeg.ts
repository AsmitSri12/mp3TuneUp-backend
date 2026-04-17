import { spawn, ChildProcess } from 'child_process';
import { Response } from 'express';

const PROCESS_TIMEOUT_MS = parseInt(process.env.PROCESS_TIMEOUT_MS || '120000', 10);

/**
 * Creates an ffmpeg process that reads audio from ytdlpProcess.stdout
 * and converts it to MP3, streaming the result to the Express response.
 */
export function streamMp3ToResponse(
  ytdlpProcess: ChildProcess,
  res: Response,
  filename: string,
  bitrate: '128k' | '192k' | '320k' = '192k'
): void {
  if (!ytdlpProcess.stdout) {
    res.status(500).json({ error: 'yt-dlp process has no stdout.' });
    return;
  }

  const FFMPEG_BIN = process.env.FFMPEG_BIN || 'ffmpeg';

  const ffmpeg = spawn(FFMPEG_BIN, [
    '-i', 'pipe:0',           // read from stdin
    '-vn',                     // no video
    '-ar', '44100',            // 44.1kHz sample rate
    '-ac', '2',                // stereo
    '-b:a', bitrate,           // audio bitrate
    '-f', 'mp3',               // output format
    '-loglevel', 'error',      // suppress verbose output
    'pipe:1',                  // stream to stdout
  ]);

  let ffmpegErrorOutput = '';
  let timedOut = false;

  // Enforce execution timeout
  const timeout = setTimeout(() => {
    timedOut = true;
    ytdlpProcess.kill('SIGKILL');
    ffmpeg.kill('SIGKILL');
    if (!res.headersSent) {
      res.status(504).json({ error: 'Conversion timed out. Try a shorter video.' });
    }
  }, PROCESS_TIMEOUT_MS);

  // Set streaming headers before piping
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Pipe yt-dlp stdout → ffmpeg stdin
  ytdlpProcess.stdout.pipe(ffmpeg.stdin!);

  // Pipe ffmpeg stdout → HTTP response
  ffmpeg.stdout.pipe(res);

  // Collect ffmpeg errors
  ffmpeg.stderr.on('data', (chunk: Buffer) => {
    ffmpegErrorOutput += chunk.toString();
  });

  ffmpeg.on('close', (code) => {
    clearTimeout(timeout);
    if (timedOut) return;
    if (code !== 0 && !res.writableEnded) {
      console.error('[ffmpeg] Error output:', ffmpegErrorOutput);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Audio conversion failed.' });
      }
    }
  });

  ffmpeg.on('error', (err) => {
    clearTimeout(timeout);
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      if (!res.headersSent) {
        res.status(500).json({ error: 'ffmpeg is not installed or not found in PATH.' });
      }
    } else {
      if (!res.headersSent) {
        res.status(500).json({ error: `ffmpeg error: ${err.message}` });
      }
    }
  });

  ytdlpProcess.on('error', (err) => {
    clearTimeout(timeout);
    ffmpeg.kill('SIGKILL');
    if (!res.headersSent) {
      res.status(500).json({ error: `yt-dlp error: ${err.message}` });
    }
  });

  // If client disconnects mid-stream, kill both processes
  res.on('close', () => {
    clearTimeout(timeout);
    ytdlpProcess.kill('SIGKILL');
    ffmpeg.kill('SIGKILL');
  });
}
