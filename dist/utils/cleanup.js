"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureTmpDir = ensureTmpDir;
exports.cleanOldFiles = cleanOldFiles;
exports.startCleanupJob = startCleanupJob;
const node_cron_1 = __importDefault(require("node-cron"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const TMP_DIR = path_1.default.join(process.env.TEMP || '/tmp', 'mp3tuneup');
const MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes
/**
 * Ensure temp directory exists.
 */
function ensureTmpDir() {
    if (!fs_1.default.existsSync(TMP_DIR)) {
        fs_1.default.mkdirSync(TMP_DIR, { recursive: true });
    }
}
/**
 * Delete files older than MAX_AGE_MS from the tmp directory.
 * Called by the cron job every 5 minutes.
 */
function cleanOldFiles() {
    if (!fs_1.default.existsSync(TMP_DIR))
        return;
    const now = Date.now();
    const files = fs_1.default.readdirSync(TMP_DIR);
    let deleted = 0;
    for (const file of files) {
        const filePath = path_1.default.join(TMP_DIR, file);
        try {
            const stat = fs_1.default.statSync(filePath);
            if (now - stat.mtimeMs > MAX_AGE_MS) {
                fs_1.default.unlinkSync(filePath);
                deleted++;
            }
        }
        catch {
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
function startCleanupJob() {
    ensureTmpDir();
    node_cron_1.default.schedule('*/5 * * * *', () => {
        cleanOldFiles();
    });
    console.log('[cleanup] Cron job started — cleaning stale files every 5 minutes.');
}
//# sourceMappingURL=cleanup.js.map