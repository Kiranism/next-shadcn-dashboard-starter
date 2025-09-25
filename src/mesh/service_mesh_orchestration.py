"""
AMT Orchestration Platform - Service Mesh and Microservices Orchestration
File 45 of 47

Enterprise-grade service mesh orchestration providing intelligent service discovery,
load balancing, circuit breakers, traffic management, security policies, and 
inter-service communication coordination across all distributed AMT platform 
components with zero-downtime deployments and automatic failover capabilities.

Author: AMT Development Team
Created: 2025-09-25
"""

import asyncio
import logging
import json
import time
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union, Tuple, Callable, Set
from dataclasses import dataclass, field
from enum import Enum
import uuid
import aioredis
import asyncpg
from aiohttp import web, ClientSession, ClientTimeout
import httpx
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field
import consul.aio
import dns.resolver
import socket
from kubernetes import client, config, watch
from kubernetes.client.rest import ApiException

# Service mesh and networking
import grpc
from grpc import aio as aio_grpc
from grpc_reflection.v1alpha import reflection
import prometheus_client
from opentelemetry import trace, metrics
from opentelemetry.exporter.prometheus import PrometheusMetricReader
from opentelemetry.instrumentation.grpc import GrpcInstrumentorServer

# Circuit breaker and resilience
from circuitbreaker import circuit
import tenacity
from tenacity import retry, stop_after_attempt, wait_exponential

# Platform imports
from ..shared.orchestration_protocol import FormationType, TaskStatus, BotType
from ..orchestration.orchestration_service import OrchestrationService
from ..ml.triangle_defense_optimizer import TriangleDefenseOptimizer
from ..integrations.mel_engine_integration import MELEngineIntegration
from ..integrations.triangle_defense_integration import TriangleDefenseIntegration
from ..integrations.airtable_connector_service import AirtableConnectorService
from ..streaming.realtime_data_streaming_service import RealTimeDataStreamingService
from ..configuration.dynamic_configuration_service import DynamicConfigurationService
from ..user_management.enterprise_user_management import EnterpriseUserManagement
from ..security.security_manager import SecurityManager
from ..monitoring.metrics_collector import MetricsCollector
from ..notifications.realtime_notification_system import RealTimeNotificationSystem
from ..performance.performance_optimization_system import PerformanceOptimizationSystem
from ..diagnostics.system_health_diagnostics import SystemHealthDiagnostics


class ServiceStatus(Enum):
    """Service health status levels."""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"
    STARTING = "starting"
    STOPPING = "stopping"
    MAINTENANCE = "maintenance"


class LoadBalancingStrategy(Enum):
    """Load balancing strategies for service mesh."""
    ROUND_ROBIN = "round_robin"
    WEIGHTED_ROUND_ROBIN = "weighted_round_robin"
    LEAST_CONNECTIONS = "least_connections"
    LEAST_RESPONSE_TIME = "least_response_time"
    RANDOM = "random"
    HASH_BASED = "hash_based"
    GEOGRAPHIC = "geographic"


class CircuitBreakerState(Enum):
    """Circuit breaker states."""
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Failing requests blocked
    HALF_OPEN = "half_open"  # Testing if service recovered


class ServiceType(Enum):
    """Types of services in the AMT platform."""
    CORE_SERVICE = "core_service"
    ML_SERVICE = "ml_service"
    AI_SERVICE = "ai_service"
    INTEGRATION_SERVICE = "integration_service"
    DATA_SERVICE = "data_service"
    STREAMING_SERVICE = "streaming_service"
    SECURITY_SERVICE = "security_service"
    MONITORING_SERVICE = "monitoring_service"
    CONFIGURATION_SERVICE = "configuration_service"
    NOTIFICATION_SERVICE = "notification_service"


@dataclass
class ServiceInstance:
    """Individual service instance metadata."""
    instance_id: str
    service_name: str
    service_type: ServiceType
    host: str
    port: int
    protocol: str  # http, grpc, tcp
    status: ServiceStatus
    health_check_endpoint: str
    last_health_check: datetime
    version: str
    deployment_id: str
    metadata: Dict[str, Any]
    load_balancer_weight: int = 100
    current_connections: int = 0
    response_time_ms: float = 0.0
    error_rate: float = 0.0
    cpu_usage_percent: float = 0.0
    memory_usage_mb: float = 0.0
    geographic_region: str = "us-east-1"
    availability_zone: str = "us-east-1a"


@dataclass
class ServiceRoute:
    """Service routing configuration."""
    route_id: str
    service_name: str
    path_pattern: str
    methods: List[str]
    load_balancing_strategy: LoadBalancingStrategy
    timeout_seconds: int
    retry_attempts: int
    circuit_breaker_enabled: bool
    rate_limit_per_second: Optional[int] = None
    authentication_required: bool = True
    authorization_policies: List[str] = field(default_factory=list)
    traffic_split: Dict[str, float] = field(default_factory=dict)  # A/B testing
    custom_headers: Dict[str, str] = field(default_factory=dict)


@dataclass
class CircuitBreaker:
    """Circuit breaker configuration and state."""
    service_name: str
    failure_threshold: int
    recovery_timeout_seconds: int
    state: CircuitBreakerState
    failure_count: int
    last_failure_time: datetime
    last_success_time: datetime
    half_open_max_calls: int = 5
    half_open_success_count: int = 0
    total_requests: int = 0
    total_failures: int = 0


@dataclass
class ServiceDiscoveryEntry:
    """Service discovery registry entry."""
    service_name: str
    instances: List[ServiceInstance]
    last_updated: datetime
    discovery_source: str  # consul, kubernetes, static
    load_balancer_config: Dict[str, Any]
    health_check_config: Dict[str, Any]


@dataclass
class TrafficMetrics:
    """Inter-service traffic metrics."""
    source_service: str
    destination_service: str
    request_count: int
    error_count: int
    total_response_time_ms: float
    min_response_time_ms: float
    max_response_time_ms: float
    avg_response_time_ms: float
    p95_response_time_ms: float
    p99_response_time_ms: float
    timestamp_start: datetime
    timestamp_end: datetime


class ServiceMeshOrchestration:
    """
    Enterprise Service Mesh and Microservices Orchestration for AMT Platform.
    
    Provides comprehensive service mesh capabilities including:
    - Intelligent service discovery with multiple backend support (Consul, K8s, static)
    - Advanced load balancing with multiple strategies and geographic awareness
    - Circuit breaker pattern implementation with automatic recovery
    - Traffic management and routing with A/B testing capabilities
    - Inter-service security with mTLS and policy enforcement
    - Comprehensive observability with distributed tracing and metrics
    - Zero-downtime deployments with canary and blue-green strategies
    - Automatic failover and disaster recovery coordination
    - Service dependency mapping and cascade failure prevention
    - Dynamic configuration and routing rule updates
    - Rate limiting and traffic shaping policies
    - Service-to-service authentication and authorization
    - Performance optimization with connection pooling and caching
    - Triangle Defense service coordination and ML model routing
    - M.E.L. AI service mesh integration with intelligent scaling
    - Real-time coaching service orchestration during games
    """

    def __init__(
        self,
        consul_host: str,
        consul_port: int,
        kubernetes_config_path: Optional[str],
        redis_url: str,
        orchestration_service: OrchestrationService,
        ml_optimizer: TriangleDefenseOptimizer,
        mel_engine: MELEngineIntegration,
        triangle_defense: TriangleDefenseIntegration,
        airtable_connector: AirtableConnectorService,
        streaming_service: RealTimeDataStreamingService,
        configuration_service: DynamicConfigurationService,
        user_management: EnterpriseUserManagement,
        notification_system: RealTimeNotificationSystem,
        performance_system: PerformanceOptimizationSystem,
        health_diagnostics: SystemHealthDiagnostics,
        security_manager: SecurityManager,
        metrics_collector: MetricsCollector
    ):
        # Store AMT platform services
        self.orchestration = orchestration_service
        self.ml_optimizer = ml_optimizer
        self.mel_engine = mel_engine
        self.triangle_defense = triangle_defense
        self.airtable_connector = airtable_connector
        self.streaming = streaming_service
        self.configuration = configuration_service
        self.user_management = user_management
        self.notifications = notification_system
        self.performance = performance_system
        self.health_diagnostics = health_diagnostics
        self.security = security_manager
        self.metrics = metrics_collector
        
        self.logger = logging.getLogger(__name__)
        
        # Service mesh configuration
        self.consul_host = consul_host
        self.consul_port = consul_port
        self.kubernetes_config_path = kubernetes_config_path
        self.redis_url = redis_url
        
        # Service mesh components
        self.consul_client = None
        self.kubernetes_client = None
        self.redis_client = None
        
        # Service registry and discovery
        self.service_registry: Dict[str, ServiceDiscoveryEntry] = {}
        self.service_routes: Dict[str, ServiceRoute] = {}
        self.circuit_breakers: Dict[str, CircuitBreaker] = {}
        
        # Load balancing and traffic management
        self.load_balancer_pools: Dict[str, List[ServiceInstance]] = {}
        self.traffic_metrics: Dict[str, TrafficMetrics] = {}
        
        # Service mesh metrics
        self.mesh_metrics = {
            'services_registered': 0,
            'active_instances': 0,
            'total_requests': 0,
            'failed_requests': 0,
            'circuit_breakers_open': 0,
            'avg_response_time_ms': 0.0,
            'service_discoveries': 0,
            'load_balancing_decisions': 0,
            'failovers_executed': 0,
            'zero_downtime_deployments': 0
        }
        
        # AMT-specific service configurations
        self.amt_service_configs = {
            'orchestration_service': {
                'type': ServiceType.CORE_SERVICE,
                'health_check_path': '/health',
                'timeout_seconds': 30,
                'circuit_breaker_threshold': 5,
                'load_balancer_weight': 100
            },
            'ml_optimizer': {
                'type': ServiceType.ML_SERVICE,
                'health_check_path': '/health',
                'timeout_seconds': 45,
                'circuit_breaker_threshold': 3,
                'load_balancer_weight': 80
            },
            'mel_engine': {
                'type': ServiceType.AI_SERVICE,
                'health_check_path': '/health',
                'timeout_seconds': 60,
                'circuit_breaker_threshold': 3,
                'load_balancer_weight': 90
            },
            'triangle_defense': {
                'type': ServiceType.CORE_SERVICE,
                'health_check_path': '/health',
                'timeout_seconds': 20,
                'circuit_breaker_threshold': 5,
                'load_balancer_weight': 100
            },
            'airtable_connector': {
                'type': ServiceType.INTEGRATION_SERVICE,
                'health_check_path': '/health',
                'timeout_seconds': 30,
                'circuit_breaker_threshold': 4,
                'load_balancer_weight': 70
            },
            'streaming_service': {
                'type': ServiceType.STREAMING_SERVICE,
                'health_check_path': '/health',
                'timeout_seconds': 15,
                'circuit_breaker_threshold': 2,
                'load_balancer_weight': 100
            },
            'configuration_service': {
                'type': ServiceType.CONFIGURATION_SERVICE,
                'health_check_path': '/health',
                'timeout_seconds': 10,
                'circuit_breaker_threshold': 5,
                'load_balancer_weight': 90
            },
            'user_management': {
                'type': ServiceType.SECURITY_SERVICE,
                'health_check_path': '/health',
                'timeout_seconds': 25,
                'circuit_breaker_threshold': 4,
                'load_balancer_weight': 95
            },
            'notification_system': {
                'type': ServiceType.NOTIFICATION_SERVICE,
                'health_check_path': '/health',
                'timeout_seconds': 20,
                'circuit_breaker_threshold': 3,
                'load_balancer_weight': 85
            },
            'health_diagnostics': {
                'type': ServiceType.MONITORING_SERVICE,
                'health_check_path': '/health',
                'timeout_seconds': 30,
                'circuit_breaker_threshold': 5,
                'load_balancer_weight': 100
            }
        }
        
        # Background tasks
        self.service_discovery_task = None
        self.health_check_task = None
        self.load_balancer_task = None
        self.circuit_breaker_task = None
        self.metrics_collection_task = None
        self.traffic_analysis_task = None

    async def initialize(self) -> bool:
        """Initialize the service mesh orchestration."""
        try:
            self.logger.info("Initializing Service Mesh Orchestration...")
            
            # Initialize service discovery backends
            await self._initialize_service_discovery()
            
            # Setup service registry
            await self._initialize_service_registry()
            
            # Configure circuit breakers
            await self._initialize_circuit_breakers()
            
            # Setup service routes
            await self._initialize_service_routes()
            
            # Start health checking
            await self._start_health_monitoring()
            
            # Initialize load balancers
            await self._initialize_load_balancers()
            
            # Start background processors
            await self._start_background_processors()
            
            # Register AMT platform services
            await self._register_amt_platform_services()
            
            self.logger.info("Service Mesh Orchestration initialized successfully")
            await self.metrics.record_event("service_mesh_initialized", {
                "services_registered": len(self.service_registry),
                "circuit_breakers": len(self.circuit_breakers),
                "service_routes": len(self.service_routes),
                "load_balancer_pools": len(self.load_balancer_pools)
            })
            
            return True
            
        except Exception as e:
            self.logger.error(f"Service Mesh Orchestration initialization failed: {str(e)}")
            return False

    async def register_service(
        self,
        service_name: str,
        service_type: ServiceType,
        host: str,
        port: int,
        protocol: str = "http",
        health_check_endpoint: str = "/health",
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """Register a new service instance in the mesh."""
        try:
            instance_id = str(uuid.uuid4())
            
            # Create service instance
            instance = ServiceInstance(
                instance_id=instance_id,
                service_name=service_name,
                service_type=service_type,
                host=host,
                port=port,
                protocol=protocol,
                status=ServiceStatus.STARTING,
                health_check_endpoint=health_check_endpoint,
                last_health_check=datetime.utcnow(),
                version="1.0.0",
                deployment_id=str(uuid.uuid4()),
                metadata=metadata or {},
                load_balancer_weight=self.amt_service_configs.get(service_name, {}).get('load_balancer_weight', 100)
            )
            
            # Add to service registry
            if service_name not in self.service_registry:
                self.service_registry[service_name] = ServiceDiscoveryEntry(
                    service_name=service_name,
                    instances=[],
                    last_updated=datetime.utcnow(),
                    discovery_source="service_mesh",
                    load_balancer_config={
                        'strategy': LoadBalancingStrategy.WEIGHTED_ROUND_ROBIN,
                        'health_check_interval': 30
                    },
                    health_check_config={
                        'timeout_seconds': 10,
                        'interval_seconds': 30,
                        'healthy_threshold': 2,
                        'unhealthy_threshold': 3
                    }
                )
            
            self.service_registry[service_name].instances.append(instance)
            self.service_registry[service_name].last_updated = datetime.utcnow()
            
            # Register with external service discovery
            await self._register_with_consul(instance)
            await self._register_with_kubernetes(instance)
            
            # Initialize load balancer pool
            if service_name not in self.load_balancer_pools:
                self.load_balancer_pools[service_name] = []
            self.load_balancer_pools[service_name].append(instance)
            
            # Setup circuit breaker if not exists
            if service_name not in self.circuit_breakers:
                await self._create_circuit_breaker(service_name)
            
            # Perform initial health check
            await self._perform_health_check(instance)
            
            self.mesh_metrics['services_registered'] += 1
            self.mesh_metrics['active_instances'] += 1
            
            await self.metrics.record_event("service_registered", {
                "service_name": service_name,
                "instance_id": instance_id,
                "host": host,
                "port": port,
                "service_type": service_type.value
            })
            
            self.logger.info(f"Service registered: {service_name} ({instance_id}) at {host}:{port}")
            
            return instance_id
            
        except Exception as e:
            self.logger.error(f"Service registration failed: {str(e)}")
            raise

    async def discover_service(
        self,
        service_name: str,
        load_balancing_strategy: LoadBalancingStrategy = LoadBalancingStrategy.WEIGHTED_ROUND_ROBIN
    ) -> Optional[ServiceInstance]:
        """Discover and return an available service instance."""
        try:
            if service_name not in self.service_registry:
                self.logger.warning(f"Service not found: {service_name}")
                return None
            
            # Get healthy instances
            healthy_instances = [
                instance for instance in self.service_registry[service_name].instances
                if instance.status == ServiceStatus.HEALTHY
            ]
            
            if not healthy_instances:
                self.logger.warning(f"No healthy instances found for service: {service_name}")
                return None
            
            # Apply load balancing strategy
            selected_instance = await self._apply_load_balancing(
                healthy_instances,
                load_balancing_strategy
            )
            
            if selected_instance:
                # Update connection count
                selected_instance.current_connections += 1
                
                # Record load balancing decision
                self.mesh_metrics['load_balancing_decisions'] += 1
                self.mesh_metrics['service_discoveries'] += 1
            
            return selected_instance
            
        except Exception as e:
            self.logger.error(f"Service discovery failed for {service_name}: {str(e)}")
            return None

    @circuit(failure_threshold=5, recovery_timeout=60, expected_exception=Exception)
    async def call_service(
        self,
        service_name: str,
        endpoint: str,
        method: str = "GET",
        data: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
        timeout: Optional[int] = None
    ) -> Optional[Dict[str, Any]]:
        """Make a resilient service call through the mesh."""
        start_time = time.time()
        
        try:
            # Discover service instance
            instance = await self.discover_service(service_name)
            
            if not instance:
                raise Exception(f"No available instances for service: {service_name}")
            
            # Check circuit breaker
            circuit_breaker = self.circuit_breakers.get(service_name)
            if circuit_breaker and circuit_breaker.state == CircuitBreakerState.OPEN:
                raise Exception(f"Circuit breaker open for service: {service_name}")
            
            # Construct URL
            url = f"{instance.protocol}://{instance.host}:{instance.port}{endpoint}"
            
            # Set timeout from service configuration or parameter
            request_timeout = timeout or self.amt_service_configs.get(service_name, {}).get('timeout_seconds', 30)
            
            # Make HTTP request
            async with httpx.AsyncClient(timeout=request_timeout) as client:
                if method.upper() == "GET":
                    response = await client.get(url, headers=headers)
                elif method.upper() == "POST":
                    response = await client.post(url, json=data, headers=headers)
                elif method.upper() == "PUT":
                    response = await client.put(url, json=data, headers=headers)
                elif method.upper() == "DELETE":
                    response = await client.delete(url, headers=headers)
                else:
                    raise ValueError(f"Unsupported HTTP method: {method}")
                
                response.raise_for_status()
                
                # Record successful call
                response_time = (time.time() - start_time) * 1000
                await self._record_successful_call(service_name, instance, response_time)
                
                # Update instance metrics
                instance.current_connections = max(0, instance.current_connections - 1)
                instance.response_time_ms = (instance.response_time_ms + response_time) / 2
                
                return response.json() if response.headers.get('content-type', '').startswith('application/json') else {"status": "success"}
                
        except Exception as e:
            # Record failed call
            response_time = (time.time() - start_time) * 1000
            await self._record_failed_call(service_name, instance if 'instance' in locals() else None, response_time, str(e))
            
            # Update circuit breaker
            if service_name in self.circuit_breakers:
                await self._update_circuit_breaker(service_name, success=False)
            
            raise

    async def execute_zero_downtime_deployment(
        self,
        service_name: str,
        new_version: str,
        deployment_strategy: str = "rolling",
        canary_percentage: float = 10.0
    ) -> bool:
        """Execute zero-downtime deployment with specified strategy."""
        try:
            if service_name not in self.service_registry:
                raise ValueError(f"Service not registered: {service_name}")
            
            old_instances = self.service_registry[service_name].instances.copy()
            
            if deployment_strategy == "rolling":
                await self._execute_rolling_deployment(service_name, new_version, old_instances)
            elif deployment_strategy == "blue_green":
                await self._execute_blue_green_deployment(service_name, new_version, old_instances)
            elif deployment_strategy == "canary":
                await self._execute_canary_deployment(service_name, new_version, old_instances, canary_percentage)
            else:
                raise ValueError(f"Unsupported deployment strategy: {deployment_strategy}")
            
            self.mesh_metrics['zero_downtime_deployments'] += 1
            
            await self.metrics.record_event("zero_downtime_deployment", {
                "service_name": service_name,
                "new_version": new_version,
                "strategy": deployment_strategy,
                "old_instances_count": len(old_instances)
            })
            
            return True
            
        except Exception as e:
            self.logger.error(f"Zero-downtime deployment failed: {str(e)}")
            return False

    async def configure_traffic_split(
        self,
        service_name: str,
        traffic_splits: Dict[str, float]
    ) -> bool:
        """Configure A/B testing traffic splits for a service."""
        try:
            if service_name not in self.service_routes:
                # Create default route
                self.service_routes[service_name] = ServiceRoute(
                    route_id=str(uuid.uuid4()),
                    service_name=service_name,
                    path_pattern="/*",
                    methods=["GET", "POST", "PUT", "DELETE"],
                    load_balancing_strategy=LoadBalancingStrategy.WEIGHTED_ROUND_ROBIN,
                    timeout_seconds=30,
                    retry_attempts=3,
                    circuit_breaker_enabled=True
                )
            
            # Validate traffic splits sum to 100%
            total_percentage = sum(traffic_splits.values())
            if abs(total_percentage - 100.0) > 0.01:
                raise ValueError(f"Traffic splits must sum to 100%, got {total_percentage}%")
            
            # Update traffic split configuration
            self.service_routes[service_name].traffic_split = traffic_splits
            
            await self.metrics.record_event("traffic_split_configured", {
                "service_name": service_name,
                "traffic_splits": traffic_splits
            })
            
            return True
            
        except Exception as e:
            self.logger.error(f"Traffic split configuration failed: {str(e)}")
            return False

    # Private helper methods
    
    async def _initialize_service_discovery(self) -> None:
        """Initialize service discovery backends."""
        try:
            # Initialize Consul
            self.consul_client = consul.aio.Consul(
                host=self.consul_host,
                port=self.consul_port
            )
            
            # Test Consul connection
            try:
                await self.consul_client.agent.self()
                self.logger.info("Consul service discovery initialized")
            except Exception as e:
                self.logger.warning(f"Consul initialization failed: {str(e)}")
                self.consul_client = None
            
            # Initialize Kubernetes client (if config provided)
            if self.kubernetes_config_path:
                try:
                    config.load_kube_config(config_file=self.kubernetes_config_path)
                    self.kubernetes_client = client.CoreV1Api()
                    
                    # Test connection
                    await self.kubernetes_client.list_namespace()
                    self.logger.info("Kubernetes service discovery initialized")
                except Exception as e:
                    self.logger.warning(f"Kubernetes initialization failed: {str(e)}")
                    self.kubernetes_client = None
            
            # Initialize Redis for caching
            self.redis_client = await aioredis.from_url(
                self.redis_url,
                decode_responses=True,
                max_connections=10
            )
            await self.redis_client.ping()
            
        except Exception as e:
            self.logger.error(f"Service discovery initialization failed: {str(e)}")
            raise

    async def _apply_load_balancing(
        self,
        instances: List[ServiceInstance],
        strategy: LoadBalancingStrategy
    ) -> Optional[ServiceInstance]:
        """Apply load balancing strategy to select service instance."""
        if not instances:
            return None
        
        if strategy == LoadBalancingStrategy.ROUND_ROBIN:
            # Simple round-robin (stateless implementation)
            current_time = int(time.time())
            index = current_time % len(instances)
            return instances[index]
        
        elif strategy == LoadBalancingStrategy.WEIGHTED_ROUND_ROBIN:
            # Weighted selection based on load balancer weights
            total_weight = sum(instance.load_balancer_weight for instance in instances)
            if total_weight == 0:
                return instances[0]
            
            import random
            random_weight = random.randint(1, total_weight)
            current_weight = 0
            
            for instance in instances:
                current_weight += instance.load_balancer_weight
                if random_weight <= current_weight:
                    return instance
            
            return instances[0]
        
        elif strategy == LoadBalancingStrategy.LEAST_CONNECTIONS:
            # Select instance with least active connections
            return min(instances, key=lambda x: x.current_connections)
        
        elif strategy == LoadBalancingStrategy.LEAST_RESPONSE_TIME:
            # Select instance with lowest response time
            return min(instances, key=lambda x: x.response_time_ms)
        
        elif strategy == LoadBalancingStrategy.RANDOM:
            import random
            return random.choice(instances)
        
        else:
            # Default to first available instance
            return instances[0]

    async def _create_circuit_breaker(self, service_name: str) -> None:
        """Create circuit breaker for service."""
        threshold = self.amt_service_configs.get(service_name, {}).get('circuit_breaker_threshold', 5)
        
        circuit_breaker = CircuitBreaker(
            service_name=service_name,
            failure_threshold=threshold,
            recovery_timeout_seconds=60,
            state=CircuitBreakerState.CLOSED,
            failure_count=0,
            last_failure_time=datetime.utcnow(),
            last_success_time=datetime.utcnow()
        )
        
        self.circuit_breakers[service_name] = circuit_breaker

    async def _record_successful_call(
        self,
        service_name: str,
        instance: ServiceInstance,
        response_time_ms: float
    ) -> None:
        """Record successful service call metrics."""
        self.mesh_metrics['total_requests'] += 1
        
        # Update circuit breaker
        if service_name in self.circuit_breakers:
            await self._update_circuit_breaker(service_name, success=True)
        
        # Update traffic metrics
        await self._update_traffic_metrics(service_name, response_time_ms, success=True)

    async def _record_failed_call(
        self,
        service_name: str,
        instance: Optional[ServiceInstance],
        response_time_ms: float,
        error: str
    ) -> None:
        """Record failed service call metrics."""
        self.mesh_metrics['total_requests'] += 1
        self.mesh_metrics['failed_requests'] += 1
        
        if instance:
            instance.error_rate = (instance.error_rate + 1.0) / 2  # Simple moving average
        
        # Update traffic metrics
        await self._update_traffic_metrics(service_name, response_time_ms, success=False)

    async def _register_amt_platform_services(self) -> None:
        """Register all AMT platform services in the mesh."""
        try:
            # Register orchestration service
            await self.register_service(
                service_name="orchestration_service",
                service_type=ServiceType.CORE_SERVICE,
                host="localhost",
                port=8000,
                metadata={"triangle_defense": True, "ml_enabled": True}
            )
            
            # Register other core services (would be actual hosts/ports in production)
            services_to_register = [
                ("ml_optimizer", ServiceType.ML_SERVICE, 8001),
                ("mel_engine", ServiceType.AI_SERVICE, 8002),
                ("triangle_defense", ServiceType.CORE_SERVICE, 8003),
                ("airtable_connector", ServiceType.INTEGRATION_SERVICE, 8004),
                ("streaming_service", ServiceType.STREAMING_SERVICE, 8005),
                ("configuration_service", ServiceType.CONFIGURATION_SERVICE, 8006),
                ("user_management", ServiceType.SECURITY_SERVICE, 8007),
                ("notification_system", ServiceType.NOTIFICATION_SERVICE, 8008),
                ("health_diagnostics", ServiceType.MONITORING_SERVICE, 8009)
            ]
            
            for service_name, service_type, port in services_to_register:
                await self.register_service(
                    service_name=service_name,
                    service_type=service_type,
                    host="localhost",
                    port=port,
                    metadata={"amt_platform": True, "version": "1.0.0"}
                )
            
            self.logger.info(f"Registered {len(services_to_register) + 1} AMT platform services")
            
        except Exception as e:
            self.logger.error(f"AMT platform service registration failed: {str(e)}")

    async def get_service_mesh_status(self) -> Dict[str, Any]:
        """Get comprehensive service mesh status."""
        return {
            "mesh_initialized": bool(self.service_registry),
            "services_registered": len(self.service_registry),
            "total_instances": sum(len(entry.instances) for entry in self.service_registry.values()),
            "healthy_instances": sum(
                len([i for i in entry.instances if i.status == ServiceStatus.HEALTHY])
                for entry in self.service_registry.values()
            ),
            "circuit_breakers": {
                name: {
                    "state": cb.state.value,
                    "failure_count": cb.failure_count,
                    "total_requests": cb.total_requests,
                    "failure_rate": cb.total_failures / max(cb.total_requests, 1)
                }
                for name, cb in self.circuit_breakers.items()
            },
            "load_balancer_pools": {
                name: len(instances) for name, instances in self.load_balancer_pools.items()
            },
            "mesh_metrics": self.mesh_metrics.copy(),
            "service_discovery_backends": {
                "consul_connected": self.consul_client is not None,
                "kubernetes_connected": self.kubernetes_client is not None,
                "redis_connected": self.redis_client is not None
            },
            "background_tasks": {
                "service_discovery": self.service_discovery_task is not None and not self.service_discovery_task.done(),
                "health_check": self.health_check_task is not None and not self.health_check_task.done(),
                "load_balancer": self.load_balancer_task is not None and not self.load_balancer_task.done(),
                "circuit_breaker": self.circuit_breaker_task is not None and not self.circuit_breaker_task.done(),
                "metrics_collection": self.metrics_collection_task is not None and not self.metrics_collection_task.done(),
                "traffic_analysis": self.traffic_analysis_task is not None and not self.traffic_analysis_task.done()
            },
            "amt_services_status": {
                name: {
                    "instances": len(entry.instances),
                    "healthy": len([i for i in entry.instances if i.status == ServiceStatus.HEALTHY]),
                    "last_updated": entry.last_updated.isoformat()
                }
                for name, entry in self.service_registry.items()
                if any(i.metadata.get("amt_platform") for i in entry.instances)
            }
        }


# Export main class
__all__ = [
    'ServiceMeshOrchestration',
    'ServiceInstance',
    'ServiceRoute',
    'CircuitBreaker',
    'ServiceDiscoveryEntry',
    'TrafficMetrics',
    'ServiceStatus',
    'LoadBalancingStrategy',
    'CircuitBreakerState',
    'ServiceType'
]
