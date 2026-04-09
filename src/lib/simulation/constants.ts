export const NODE_CAPACITIES: Record<string, number> = {
  Client: Infinity,     // Clients generate load, no limits
  Server: 5000,         // Standard app server handles 5k RPS
  Function: 2000,       // Serverless function handles 2k concurrent
  Worker: 3000,         // Background worker handles 3k jobs/s
  Container: 6000,      // Containerized service handles 6k RPS
  Gateway: 50000,       // API Gateway handles 50k RPS
  LB: 100000,           // Load Balancer handles 100k RPS
  CDN: 500000,          // CDN handles 500k RPS (edge cached)
  DNS: Infinity,        // DNS resolution is effectively unlimited
  Firewall: 200000,     // Network firewall handles 200k RPS
  Proxy: 80000,         // Reverse proxy handles 80k RPS
  SQL: 3000,            // Relational DB handles 3k writes/reads
  NoSQL: 15000,         // Document DB handles 15k RPS
  Cache: 50000,         // Redis Cache handles 50k RPS
  Blob: 10000,          // S3 handles 10k RPS
  Search: 8000,         // Search engine handles 8k queries/s
  GraphDB: 5000,        // Graph DB handles 5k traversals/s
  Queue: 20000,         // Message queue handles 20k RPS
  Kafka: 100000,        // Distributed log handles 100k RPS
  PubSub: 50000,        // Pub/Sub handles 50k messages/s
  WebSocket: 10000,     // WebSocket server handles 10k concurrent
  Logger: Infinity,     // Log aggregator is a sink, no limits
  Metrics: Infinity,    // Metrics collector is a sink, no limits
  Tracer: Infinity,     // Tracer is a sink, no limits
  Auth: 10000,          // Auth service handles 10k verifications/s
  WAF: 150000,          // Web App Firewall handles 150k RPS
  Vault: 5000,          // Secret manager handles 5k reads/s
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
