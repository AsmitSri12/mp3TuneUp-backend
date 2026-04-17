import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { spawnSync } from 'child_process';
import { startCleanupJob } from './utils/cleanup';
import metadataRouter from './routes/metadata';
import convertRouter from './routes/convert';

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);

// ── Startup Health Check (Double-check system binaries) ───
function checkBinaries() {
  const YTDLP_BIN = process.env.YTDLP_BIN || 'yt-dlp';
  const FFMPEG_BIN = process.env.FFMPEG_BIN || 'ffmpeg';

  const ytCheck = spawnSync(YTDLP_BIN, ['--version'], { encoding: 'utf8' });
  const ffCheck = spawnSync(FFMPEG_BIN, ['-version'], { encoding: 'utf8' });

  if (ytCheck.status !== 0) {
    console.error('\x1b[31m[ERROR] yt-dlp is not installed or not in PATH.\x1b[0m');
    console.error('Please install it: winget install yt-dlp');
  } else {
    console.log(`\x1b[32m[HEALTHY] yt-dlp version: ${ytCheck.stdout.trim()}\x1b[0m`);
  }

  if (ffCheck.status !== 0) {
    console.error('\x1b[31m[ERROR] ffmpeg is not installed or not in PATH.\x1b[0m');
    console.error('Please install it: winget install ffmpeg');
  } else {
    console.log(`\x1b[32m[HEALTHY] ffmpeg is present.\x1b[0m`);
  }
}

checkBinaries();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim());

// ─── Security Middleware ───────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman) in dev mode
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin ${origin} not allowed.`));
      }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  })
);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// ─── Health Check ─────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────
app.use('/metadata', metadataRouter);
app.use('/convert', convertRouter);

// ─── 404 Fallback ─────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[server] Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

// ─── Start ────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🎵 mp3TuneUp backend running on http://localhost:${PORT}`);
  console.log(`   Allowed origins: ${allowedOrigins.join(', ')}`);
  startCleanupJob();
});

export default app;
