import {
  Activity,
  AlertTriangle,
  Archive,
  BarChart,
  BarChart3,
  Bell,
  Box,
  CheckCircle,
  Cloud,
  Container,
  Copy,
  Cpu,
  CreditCard,
  Database,
  ExternalLink,
  FileText,
  Folder,
  Gauge,
  GitBranch,
  Globe,
  Globe2,
  HardDrive,
  Image,
  Inbox,
  Key,
  Layers,
  Lock,
  Mail,
  MemoryStick,
  MessageCircle,
  MessageSquare,
  Monitor,
  Network,
  Package,
  Puzzle,
  Router,
  Search,
  Send,
  Server,
  Shield,
  Smartphone,
  Table,
  Timer,
  TrendingUp,
  UserCheck,
  Video,
  Webhook,
  Workflow,
  XCircle,
  Zap,
} from "lucide-react";
import type { ArchitectureNodeData } from "@/lib/architecture-types";

export type NodeCategory =
  | "clients"
  | "compute"
  | "databases"
  | "caching"
  | "storage"
  | "networking"
  | "messaging"
  | "security"
  | "monitoring"
  | "analytics"
  | "external"
  | "queue";

export interface DesignNode {
  type: string;
  label: string;
  details: string;
  category: NodeCategory;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

export const NODE_CATEGORIES: {
  id: NodeCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}[] = [
  { id: "clients", label: "Clients", icon: Globe, color: "slate" },
  { id: "compute", label: "Compute", icon: Server, color: "blue" },
  { id: "databases", label: "Databases", icon: Database, color: "emerald" },
  { id: "caching", label: "Caching", icon: Zap, color: "amber" },
  { id: "storage", label: "Storage", icon: HardDrive, color: "purple" },
  { id: "networking", label: "Networking", icon: Router, color: "rose" },
  { id: "messaging", label: "Messaging", icon: MessageSquare, color: "cyan" },
  { id: "queue", label: "Message Queues", icon: Inbox, color: "orange" },
  { id: "security", label: "Security", icon: Shield, color: "red" },
  { id: "monitoring", label: "Monitoring", icon: Activity, color: "teal" },
  { id: "analytics", label: "Analytics", icon: BarChart3, color: "indigo" },
  {
    id: "external",
    label: "External Services",
    icon: ExternalLink,
    color: "violet",
  },
];

export const DESIGN_NODES: DesignNode[] = [
  // Clients / Users
  {
    type: "web_client",
    label: "Web Client",
    details: "Browser / SPA",
    category: "clients",
    icon: Monitor,
    description: "Web browsers, Single Page Applications",
  },
  {
    type: "mobile_client",
    label: "Mobile App",
    details: "iOS / Android",
    category: "clients",
    icon: Smartphone,
    description: "Native mobile applications",
  },
  {
    type: "desktop_client",
    label: "Desktop App",
    details: "Windows / Mac / Linux",
    category: "clients",
    icon: Monitor,
    description: "Desktop client applications",
  },
  {
    type: "iot_device",
    label: "IoT Device",
    details: "Sensors / Smart Devices",
    category: "clients",
    icon: Cpu,
    description: "Internet of Things devices",
  },
  {
    type: "api_consumer",
    label: "API Consumer",
    details: "Third-party API",
    category: "clients",
    icon: Globe2,
    description: "External API consumers",
  },

  // Compute
  {
    type: "api_gateway",
    label: "API Gateway",
    details: "Entry Point",
    category: "compute",
    icon: Globe,
    description: "API Gateway for request routing",
  },
  {
    type: "load_balancer",
    label: "Load Balancer",
    details: "Traffic Distribution",
    category: "compute",
    icon: Layers,
    description: "Distributes traffic across servers",
  },
  {
    type: "web_server",
    label: "Web Server",
    details: "Nginx / Apache",
    category: "compute",
    icon: Server,
    description: "HTTP web server",
  },
  {
    type: "app_server",
    label: "App Server",
    details: "Application Logic",
    category: "compute",
    icon: Container,
    description: "Application server for business logic",
  },
  {
    type: "microservice",
    label: "Microservice",
    details: "Single Responsibility",
    category: "compute",
    icon: Puzzle,
    description: "Individual microservice",
  },
  {
    type: "function",
    label: "Serverless Function",
    details: "Lambda / Cloud Functions",
    category: "compute",
    icon: Zap,
    description: "Serverless compute function",
  },
  {
    type: "worker",
    label: "Background Worker",
    details: "Async Processing",
    category: "compute",
    icon: Workflow,
    description: "Background job processor",
  },
  {
    type: "scheduler",
    label: "Job Scheduler",
    details: "Cron / Tasks",
    category: "compute",
    icon: Timer,
    description: "Scheduled job executor",
  },
  {
    type: "container",
    label: "Container",
    details: "Docker / K8s Pod",
    category: "compute",
    icon: Box,
    description: "Containerized service",
  },
  {
    type: "kubernetes",
    label: "Kubernetes Cluster",
    details: "Orchestration",
    category: "compute",
    icon: Cloud,
    description: "K8s cluster for container orchestration",
  },
  {
    type: "edge_computing",
    label: "Edge Node",
    details: "Edge Location",
    category: "compute",
    icon: Network,
    description: "Edge computing node",
  },

  // Databases
  {
    type: "relational_db",
    label: "Relational DB",
    details: "PostgreSQL / MySQL",
    category: "databases",
    icon: Database,
    description: "SQL relational database",
  },
  {
    type: "document_db",
    label: "Document DB",
    details: "MongoDB / DynamoDB",
    category: "databases",
    icon: FileText,
    description: "NoSQL document database",
  },
  {
    type: "key_value_store",
    label: "Key-Value Store",
    details: "Redis / DynamoDB",
    category: "databases",
    icon: Key,
    description: "Key-value storage",
  },
  {
    type: "wide_column_db",
    label: "Wide Column DB",
    details: "Cassandra / HBase",
    category: "databases",
    icon: Table,
    description: "Wide column NoSQL database",
  },
  {
    type: "graph_db",
    label: "Graph DB",
    details: "Neo4j",
    category: "databases",
    icon: GitBranch,
    description: "Graph database for relationships",
  },
  {
    type: "time_series_db",
    label: "Time Series DB",
    details: "InfluxDB / TimescaleDB",
    category: "databases",
    icon: TrendingUp,
    description: "Time series data storage",
  },
  {
    type: "search_engine",
    label: "Search Engine",
    details: "Elasticsearch",
    category: "databases",
    icon: Search,
    description: "Full-text search engine",
  },
  {
    type: "replica",
    label: "DB Replica",
    details: "Read Replica",
    category: "databases",
    icon: Copy,
    description: "Database read replica",
  },
  {
    type: "primary_db",
    label: "Primary Database",
    details: "Write Master",
    category: "databases",
    icon: Database,
    description: "Primary write database",
  },

  // Caching
  {
    type: "redis_cache",
    label: "Redis Cache",
    details: "In-Memory Cache",
    category: "caching",
    icon: Zap,
    description: "Redis caching layer",
  },
  {
    type: "memcached",
    label: "Memcached",
    details: "Distributed Cache",
    category: "caching",
    icon: MemoryStick,
    description: "Memcached distributed cache",
  },
  {
    type: "cdn_cache",
    label: "CDN Cache",
    details: "Edge Caching",
    category: "caching",
    icon: Globe2,
    description: "Content delivery network cache",
  },
  {
    type: "application_cache",
    label: "App Cache",
    details: "Local Cache",
    category: "caching",
    icon: Archive,
    description: "Application-level cache",
  },

  // Storage
  {
    type: "object_storage",
    label: "Object Storage",
    details: "S3 / Blob Storage",
    category: "storage",
    icon: HardDrive,
    description: "Object/blob storage",
  },
  {
    type: "file_storage",
    label: "File Storage",
    details: "NFS / EFS",
    category: "storage",
    icon: Folder,
    description: "Shared file storage",
  },
  {
    type: "block_storage",
    label: "Block Storage",
    details: "EBS / iSCSI",
    category: "storage",
    icon: Database,
    description: "Block-level storage",
  },
  {
    type: "archive_storage",
    label: "Archive Storage",
    details: "Glacier / Cold Storage",
    category: "storage",
    icon: Archive,
    description: "Long-term archival storage",
  },
  {
    type: "backup_storage",
    label: "Backup Storage",
    details: "Backups",
    category: "storage",
    icon: Package,
    description: "Backup storage location",
  },
  {
    type: "media_storage",
    label: "Media Storage",
    details: "Images / Videos",
    category: "storage",
    icon: Image,
    description: "Media file storage",
  },

  // Networking
  {
    type: "cdn",
    label: "CDN",
    details: "Content Delivery",
    category: "networking",
    icon: Globe2,
    description: "Content Delivery Network",
  },
  {
    type: "dns",
    label: "DNS",
    details: "Domain Name System",
    category: "networking",
    icon: Globe,
    description: "DNS service",
  },
  {
    type: "dns_lb",
    label: "DNS Load Balancer",
    details: "GeoDNS",
    category: "networking",
    icon: Globe,
    description: "DNS-based load balancing",
  },
  {
    type: "vpc",
    label: "VPC",
    details: "Virtual Private Cloud",
    category: "networking",
    icon: Cloud,
    description: "Virtual private cloud",
  },
  {
    type: "subnet",
    label: "Subnet",
    details: "Private / Public",
    category: "networking",
    icon: Network,
    description: "VPC subnet",
  },
  {
    type: "firewall",
    label: "Firewall",
    details: "Security Group",
    category: "networking",
    icon: Shield,
    description: "Network firewall",
  },
  {
    type: "vpn",
    label: "VPN",
    details: "Secure Tunnel",
    category: "networking",
    icon: Lock,
    description: "VPN gateway",
  },
  {
    type: "nat_gateway",
    label: "NAT Gateway",
    details: "Outbound Access",
    category: "networking",
    icon: Router,
    description: "NAT gateway for outbound traffic",
  },
  {
    type: "api_gateway_v2",
    label: "API Gateway v2",
    details: "REST / GraphQL",
    category: "networking",
    icon: Globe,
    description: "API management gateway",
  },

  // Messaging / Message Queues
  {
    type: "message_queue",
    label: "Message Queue",
    details: "SQS / RabbitMQ",
    category: "messaging",
    icon: Inbox,
    description: "Message queue broker",
  },
  {
    type: "pub_sub",
    label: "Pub/Sub",
    details: "Kafka / Pub-Sub",
    category: "messaging",
    icon: MessageSquare,
    description: "Publish-subscribe messaging",
  },
  {
    type: "event_bus",
    label: "Event Bus",
    details: "Event Streaming",
    category: "messaging",
    icon: Workflow,
    description: "Central event bus",
  },
  {
    type: "webhook",
    label: "Webhook",
    details: "HTTP Callback",
    category: "messaging",
    icon: Webhook,
    description: "Webhook endpoint",
  },
  {
    type: "service_mesh",
    label: "Service Mesh",
    details: "Istio / Linkerd",
    category: "messaging",
    icon: Network,
    description: "Service mesh for microservices",
  },
  {
    type: "grpc",
    label: "gRPC",
    details: "RPC Communication",
    category: "messaging",
    icon: Send,
    description: "gRPC service communication",
  },

  // Queue
  {
    type: "kafka",
    label: "Kafka",
    details: "Event Streaming",
    category: "queue",
    icon: Inbox,
    description: "Apache Kafka cluster",
  },
  {
    type: "rabbitmq",
    label: "RabbitMQ",
    details: "Message Broker",
    category: "queue",
    icon: MessageSquare,
    description: "RabbitMQ message broker",
  },
  {
    type: "sqs",
    label: "SQS",
    details: "AWS Message Queue",
    category: "queue",
    icon: Inbox,
    description: "AWS Simple Queue Service",
  },
  {
    type: "dead_letter_queue",
    label: "Dead Letter Queue",
    details: "Failed Messages",
    category: "queue",
    icon: XCircle,
    description: "DLQ for failed messages",
  },

  // Security
  {
    type: "auth_service",
    label: "Auth Service",
    details: "Authentication",
    category: "security",
    icon: Lock,
    description: "Authentication service",
  },
  {
    type: "oauth_provider",
    label: "OAuth Provider",
    details: "SSO / OAuth",
    category: "security",
    icon: Key,
    description: "OAuth 2.0 provider",
  },
  {
    type: "identity_provider",
    label: "Identity Provider",
    details: "User Identity",
    category: "security",
    icon: UserCheck,
    description: "Identity provider (IdP)",
  },
  {
    type: "waf",
    label: "WAF",
    details: "Web Application Firewall",
    category: "security",
    icon: Shield,
    description: "Web application firewall",
  },
  {
    type: "ddos_protection",
    label: "DDoS Protection",
    details: "DDoS Mitigation",
    category: "security",
    icon: Shield,
    description: "DDoS protection service",
  },
  {
    type: "secret_manager",
    label: "Secret Manager",
    details: "Secrets Storage",
    category: "security",
    icon: Key,
    description: "Secrets management service",
  },
  {
    type: "kms",
    label: "KMS",
    details: "Key Management",
    category: "security",
    icon: Key,
    description: "Key management service",
  },
  {
    type: "certificate_manager",
    label: "Certificate Manager",
    details: "TLS / SSL",
    category: "security",
    icon: Shield,
    description: "SSL/TLS certificate management",
  },

  // Monitoring
  {
    type: "monitoring",
    label: "Monitoring",
    details: "Prometheus / Grafana",
    category: "monitoring",
    icon: Activity,
    description: "Monitoring and observability",
  },
  {
    type: "logging",
    label: "Logging Service",
    details: "ELK / CloudWatch",
    category: "monitoring",
    icon: FileText,
    description: "Centralized logging",
  },
  {
    type: "tracing",
    label: "Distributed Tracing",
    details: "Jaeger / Zipkin",
    category: "monitoring",
    icon: Workflow,
    description: "Distributed tracing system",
  },
  {
    type: "alerting",
    label: "Alert Manager",
    details: "Alerts / PagerDuty",
    category: "monitoring",
    icon: AlertTriangle,
    description: "Alert management system",
  },
  {
    type: "metrics",
    label: "Metrics Collector",
    details: "Data Collection",
    category: "monitoring",
    icon: Gauge,
    description: "Metrics collection service",
  },
  {
    type: "health_check",
    label: "Health Check",
    details: "Service Health",
    category: "monitoring",
    icon: CheckCircle,
    description: "Health check endpoint",
  },

  // Analytics
  {
    type: "analytics",
    label: "Analytics Engine",
    details: "Data Processing",
    category: "analytics",
    icon: BarChart3,
    description: "Analytics processing engine",
  },
  {
    type: "data_warehouse",
    label: "Data Warehouse",
    details: "Snowflake / Redshift",
    category: "analytics",
    icon: Database,
    description: "Data warehouse for analytics",
  },
  {
    type: "etl",
    label: "ETL Pipeline",
    details: "Extract Transform Load",
    category: "analytics",
    icon: Workflow,
    description: "ETL data pipeline",
  },
  {
    type: "bi_dashboard",
    label: "BI Dashboard",
    details: "Business Intelligence",
    category: "analytics",
    icon: BarChart,
    description: "Business intelligence dashboard",
  },
  {
    type: "ml_pipeline",
    label: "ML Pipeline",
    details: "Machine Learning",
    category: "analytics",
    icon: Cpu,
    description: "Machine learning pipeline",
  },
  {
    type: "data_lake",
    label: "Data Lake",
    details: "Raw Data Storage",
    category: "analytics",
    icon: HardDrive,
    description: "Data lake for raw data",
  },

  // External Services
  {
    type: "payment_gateway",
    label: "Payment Gateway",
    details: "Stripe / PayPal",
    category: "external",
    icon: CreditCard,
    description: "Payment processing service",
  },
  {
    type: "email_service",
    label: "Email Service",
    details: "SES / SendGrid",
    category: "external",
    icon: Mail,
    description: "Email delivery service",
  },
  {
    type: "sms_service",
    label: "SMS Service",
    details: "Twilio",
    category: "external",
    icon: MessageCircle,
    description: "SMS notification service",
  },
  {
    type: "notification_service",
    label: "Push Notifications",
    details: "FCM / APNs",
    category: "external",
    icon: Bell,
    description: "Push notification service",
  },
  {
    type: "third_party_api",
    label: "Third-Party API",
    details: "External Integration",
    category: "external",
    icon: ExternalLink,
    description: "External API integration",
  },
  {
    type: "search_service",
    label: "Search Service",
    details: "Algolia",
    category: "external",
    icon: Search,
    description: "Hosted search service",
  },
  {
    type: "cdn_provider",
    label: "CDN Provider",
    details: "Cloudflare / Fastly",
    category: "external",
    icon: Globe2,
    description: "CDN provider",
  },
  {
    type: "storage_provider",
    label: "Cloud Storage",
    details: "AWS S3 / GCS",
    category: "external",
    icon: Cloud,
    description: "Cloud storage provider",
  },
  {
    type: "video_processing",
    label: "Video Processing",
    details: "Transcoding",
    category: "external",
    icon: Video,
    description: "Video processing service",
  },
  {
    type: "cdnanalytics",
    label: "CDN Analytics",
    details: "Cache Analytics",
    category: "external",
    icon: BarChart,
    description: "CDN analytics service",
  },
];

export const DESIGN_NODE_BY_TYPE = new Map(
  DESIGN_NODES.map((node) => [node.type, node]),
);

const DEFAULT_DEPLOYMENT_TIER_BY_CATEGORY: Record<
  NodeCategory,
  ArchitectureNodeData["deploymentTier"]
> = {
  clients: "EDGE",
  compute: "REGIONAL",
  databases: "MULTI_REGION",
  caching: "REGIONAL",
  storage: "MULTI_REGION",
  networking: "MULTI_REGION",
  messaging: "REGIONAL",
  queue: "REGIONAL",
  security: "REGIONAL",
  monitoring: "MULTI_REGION",
  analytics: "REGIONAL",
  external: "MULTI_REGION",
};

const DEFAULT_CRITICALITY_BY_CATEGORY: Record<
  NodeCategory,
  ArchitectureNodeData["criticality"]
> = {
  clients: "MEDIUM",
  compute: "HIGH",
  databases: "HIGH",
  caching: "MEDIUM",
  storage: "HIGH",
  networking: "HIGH",
  messaging: "MEDIUM",
  queue: "MEDIUM",
  security: "HIGH",
  monitoring: "MEDIUM",
  analytics: "LOW",
  external: "MEDIUM",
};

export function getDesignNodeByType(type: string) {
  return DESIGN_NODE_BY_TYPE.get(type);
}

export function buildArchitectureNodeData(type: string): ArchitectureNodeData {
  const template = getDesignNodeByType(type);

  if (!template) {
    return {
      label: "Custom Component",
      type,
      details: "Custom service",
      description: "User-defined system component",
      category: "compute",
      technology: "",
      deploymentTier: "REGIONAL",
      instances: 1,
      capacity: "",
      notes: "",
      criticality: "MEDIUM",
    };
  }

  return {
    label: template.label,
    type: template.type,
    details: template.details,
    description: template.description,
    category: template.category,
    technology: "",
    deploymentTier: DEFAULT_DEPLOYMENT_TIER_BY_CATEGORY[template.category],
    instances:
      template.category === "compute" || template.category === "networking"
        ? 2
        : 1,
    capacity: "",
    notes: "",
    criticality: DEFAULT_CRITICALITY_BY_CATEGORY[template.category],
  };
}

export const CUSTOM_NODES = {
  systemNode: "systemNode",
} as const;

export function getNodesByCategory(category: NodeCategory): DesignNode[] {
  return DESIGN_NODES.filter((node) => node.category === category);
}

export function getNodeByType(type: string): DesignNode | undefined {
  return DESIGN_NODES.find((node) => node.type === type);
}
