"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMetadata = getMetadata;
exports.createAudioStream = createAudioStream;
const child_process_1 = require("child_process");
const sanitize_1 = require("../middleware/sanitize");
const MAX_DURATION = parseInt(process.env.MAX_DURATION_SECONDS || '1800', 10);
const YTDLP_BIN = process.env.YTDLP_BIN || 'yt-dlp';
const FFMPEG_BIN = process.env.FFMPEG_BIN || 'ffmpeg';
/**
 * Fetches video metadata using yt-dlp --dump-json (no download).
 */
async function getMetadata(url) {
    const { safe, url: cleanUrl, error } = (0, sanitize_1.sanitizeUrl)(url);
    if (!safe)
        throw new Error(error);
    return new Promise((resolve, reject) => {
        const ytdlp = (0, child_process_1.spawn)(YTDLP_BIN, [
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
        }, 30000);
        ytdlp.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
        ytdlp.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
        ytdlp.on('close', (code) => {
            clearTimeout(timeout);
            if (code !== 0) {
                reject(new Error(`yt-dlp exited with code ${code}: ${stderr.trim()}`));
                return;
            }
            try {
                const json = JSON.parse(stdout);
                if (json.duration > MAX_DURATION) {
                    reject(new Error(`Video is too long (${Math.round(json.duration / 60)} min). Maximum allowed is ${Math.round(MAX_DURATION / 60)} min.`));
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
            }
            catch {
                reject(new Error('Failed to parse video metadata.'));
            }
        });
        ytdlp.on('error', (err) => {
            clearTimeout(timeout);
            if (err.code === 'ENOENT') {
                reject(new Error('yt-dlp is not installed or not found in PATH.'));
            }
            else {
                reject(err);
            }
        });
    });
}
/**
 * Creates a yt-dlp spawned process that extracts best audio and pipes to stdout.
 * The caller is responsible for piping stdout to ffmpeg.
 */
function createAudioStream(url) {
    const { safe, url: cleanUrl, error } = (0, sanitize_1.sanitizeUrl)(url);
    if (!safe)
        throw new Error(error);
    return (0, child_process_1.spawn)(YTDLP_BIN, [
        '-f', 'bestaudio',
        '--no-playlist',
        '--no-warnings',
        '-o', '-', // output to stdout
        cleanUrl,
    ]);
}
//# sourceMappingURL=ytdlp.js.map