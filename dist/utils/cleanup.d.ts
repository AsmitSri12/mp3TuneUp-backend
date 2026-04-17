/**
 * Ensure temp directory exists.
 */
export declare function ensureTmpDir(): void;
/**
 * Delete files older than MAX_AGE_MS from the tmp directory.
 * Called by the cron job every 5 minutes.
 */
export declare function cleanOldFiles(): void;
/**
 * Start the scheduled cleanup cron job (every 5 minutes).
 */
export declare function startCleanupJob(): void;
//# sourceMappingURL=cleanup.d.ts.map