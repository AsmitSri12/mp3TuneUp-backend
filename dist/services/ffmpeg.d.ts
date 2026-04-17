import { ChildProcess } from 'child_process';
import { Response } from 'express';
/**
 * Creates an ffmpeg process that reads audio from ytdlpProcess.stdout
 * and converts it to MP3, streaming the result to the Express response.
 */
export declare function streamMp3ToResponse(ytdlpProcess: ChildProcess, res: Response, filename: string, bitrate?: '128k' | '192k' | '320k'): void;
//# sourceMappingURL=ffmpeg.d.ts.map