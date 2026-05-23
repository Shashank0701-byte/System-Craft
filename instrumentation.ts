/**
 * Next.js Instrumentation API
 * Runs once on server startup — used to initialise prom-client default metrics.
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Dynamically import so the module is only loaded on the server
    await import('@/src/lib/metrics');
  }
}
