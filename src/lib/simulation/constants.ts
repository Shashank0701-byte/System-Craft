export const NODE_CAPACITIES: Record<string, number> = {
  Client: Infinity,     // Clients generate load, no limits
  Server: 5000,         // Standard app server handles 5k RPS
  Function: 2000,       // Serverless function handles 2k concurrent
  LB: 100000,           // Load Balancer handles 100k RPS
  CDN: 500000,          // CDN handles 500k RPS (edge cached)
  SQL: 3000,            // Relational DB handles 3k writes/reads
  Cache: 50000,         // Redis Cache handles 50k RPS
  Blob: 10000,          // S3 handles 10k RPS
  Queue: 20000,         // Message queue handles 20k RPS
  Kafka: 100000,        // Distributed log handles 100k RPS
};

export interface NodeMetrics {
    trafficIn: number;
    trafficOut: number;
    capacity: number;
    status: 'normal' | 'bottlenecked' | 'warning';
}

export interface EdgeMetrics {
    trafficFlow: number;
}
