"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertLimiter = exports.metadataLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
exports.metadataLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many metadata requests. Please wait 15 minutes before trying again.',
        retryAfter: 15 * 60,
    },
    keyGenerator: (req) => {
        return (req.headers['x-forwarded-for']?.split(',')[0].trim() ||
            req.socket.remoteAddress ||
            'unknown');
    },
});
exports.convertLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many conversion requests. Please wait 15 minutes before trying again.',
        retryAfter: 15 * 60,
    },
    keyGenerator: (req) => {
        return (req.headers['x-forwarded-for']?.split(',')[0].trim() ||
            req.socket.remoteAddress ||
            'unknown');
    },
});
//# sourceMappingURL=rateLimiter.js.map