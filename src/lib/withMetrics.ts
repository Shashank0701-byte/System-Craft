import { NextRequest, NextResponse } from 'next/server';
import { httpRequestsTotal, httpRequestDuration } from './metrics';

type AppRouteHandler = (req: NextRequest, ...args: any[]) => Promise<NextResponse | Response> | NextResponse | Response;

export function withMetrics(routePattern: string, handler: AppRouteHandler): AppRouteHandler {
    return async (req: NextRequest, ...args: any[]) => {
        const method = req.method;
        const timer = httpRequestDuration.startTimer({ method, route: routePattern });
        
        try {
            const response = await handler(req, ...args);
            const status = response.status.toString();
            
            timer({ status });
            httpRequestsTotal.inc({ method, route: routePattern, status });
            
            return response;
        } catch (error) {
            timer({ status: '500' });
            httpRequestsTotal.inc({ method, route: routePattern, status: '500' });
            throw error;
        }
    };
}
