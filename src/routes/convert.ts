import { Router, Request, Response } from 'express';
import { convertLimiter } from '../middleware/rateLimiter';
import { sanitizeMiddleware } from '../middleware/sanitize';
import { createAudioStream, getMetadata } from '../services/ytdlp';
import { streamMp3ToResponse } from '../services/ffmpeg';

const router = Router();

/**
 * POST /convert
 * Body: { url: string, quality?: "128k" | "192k" | "320k" }
 * Streams MP3 audio back to the client.
 */
router.post(
  '/',
  convertLimiter,
  sanitizeMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    const url = (req as Request & { cleanUrl: string }).cleanUrl;
    const quality = (['128k', '192k', '320k'].includes(req.body?.quality)
      ? req.body.quality
      : '192k') as '128k' | '192k' | '320k';

    try {
      // Validate metadata first to check duration limit before spawning conversion
      const metadata = await getMetadata(url);

      const safeTitle = metadata.title
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '_')
        .substring(0, 100);
      const filename = `${safeTitle || 'audio'}.mp3`;

      console.log(`[convert] Starting: "${metadata.title}" | ${metadata.duration}s | ${quality}`);

      const ytdlpProcess = createAudioStream(url);
      streamMp3ToResponse(ytdlpProcess, res, filename, quality);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Conversion failed.';
      console.error('[convert] Error:', message);

      const status =
        message.includes('too long') || message.includes('Invalid')
          ? 400
          : message.includes('timed out')
          ? 504
          : 500;

      if (!res.headersSent) {
        res.status(status).json({ success: false, error: message });
      }
    }
  }
);

export default router;
