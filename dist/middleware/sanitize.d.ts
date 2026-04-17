import { Request, Response, NextFunction } from 'express';
export declare function sanitizeUrl(raw: string): {
    safe: boolean;
    url: string;
    error?: string;
};
export declare function sanitizeMiddleware(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=sanitize.d.ts.map