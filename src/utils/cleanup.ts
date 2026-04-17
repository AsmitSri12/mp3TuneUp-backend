import cron from 'node-cron';
import fs from 'fs';
import path from 'path';

const TMP_DIR = path.join(process.env.TEMP || '/tmp', 'mp3tuneup');
const MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Ensure temp directory exists.
 */
export function ensureTmpDir(): void {
  if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true });
  }
}

/**
 * Delete files older than MAX_AGE_MS from the tmp directory.
 * Called by the cron job every 5 minutes.
 */
export function cleanOldFiles(): void {
  if (!fs.existsSync(TMP_DIR)) return;

  const now = Date.now();
  const files = fs.readdirSync(TMP_DIR);

  let deleted = 0;
  for (const file of files) {
    const filePath = path.join(TMP_DIR, file);
    try {
      const stat = fs.statSync(filePath);
      if (now - stat.mtimeMs > MAX_AGE_MS) {
        fs.unlinkSync(filePath);
        deleted++;
      }
    } catch {
      // File may have already been deleted
    }
  }

  if (deleted > 0) {
    console.log(`[cleanup] Deleted ${deleted} stale file(s) from ${TMP_DIR}`);
  }
}

/**
 * Start the scheduled cleanup cron job (every 5 minutes).
 */
export function startCleanupJob(): void {
  ensureTmpDir();
  cron.schedule('*/5 * * * *', () => {
    cleanOldFiles();
  });
  console.log('[cleanup] Cron job started — cleaning stale files every 5 minutes.');
}
