"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cleanup_1 = require("./utils/cleanup");
const metadata_1 = __importDefault(require("./routes/metadata"));
const convert_1 = __importDefault(require("./routes/convert"));
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '4000', 10);
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim());
// ─── Security Middleware ───────────────────────────────────────────────────
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (curl, Postman) in dev mode
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error(`CORS: Origin ${origin} not allowed.`));
        }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
}));
app.use(express_1.default.json({ limit: '10kb' }));
app.use(express_1.default.urlencoded({ extended: false, limit: '10kb' }));
// ─── Health Check ─────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
    });
});
// ─── Routes ───────────────────────────────────────────────────────────────
app.use('/metadata', metadata_1.default);
app.use('/convert', convert_1.default);
// ─── 404 Fallback ─────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: 'Not found.' });
});
// ─── Global Error Handler ─────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error('[server] Unhandled error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
});
// ─── Start ────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🎵 mp3TuneUp backend running on http://localhost:${PORT}`);
    console.log(`   Allowed origins: ${allowedOrigins.join(', ')}`);
    (0, cleanup_1.startCleanupJob)();
});
exports.default = app;
//# sourceMappingURL=index.js.map