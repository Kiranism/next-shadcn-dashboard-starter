"""
AMT Kubernetes Orchestration Deployment
Infrastructure-as-Code for deploying the AI orchestration system on Kubernetes
"""

import asyncio
import logging
import json
import yaml
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
from pathlib import Path
import base64

# Kubernetes client
try:
    from kubernetes import client, config, watch
    from kubernetes.client.rest import ApiException
    KUBERNETES_AVAILABLE = True
except ImportError:
    logging.warning("Kubernetes client not available - deployment functions will be limited")
    KUBERNETES_AVAILABLE = False

logger = logging.getLogger(__name__)

class DeploymentEnvironment(str, Enum):
    """Deployment environment types"""
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"
    TESTING = "testing"

class ComponentType(str, Enum):
    """Types of system components"""
    ORCHESTRATION_SERVICE = "orchestration-service"
    SESSION_MANAGER = "session-manager"
    KNOWLEDGE_BASE = "knowledge-base"
    REALTIME_COORDINATOR = "realtime-coordinator"
    CREATIVE_TOOLS = "creative-tools"
    EXTERNAL_GATEWAY = "external-gateway"
    DASHBOARD_API = "dashboard-api"
    POSTGRES_DB = "postgres-db"
    REDIS_CACHE = "redis-cache"
    KAFKA_CLUSTER = "kafka-cluster"
    FLINK_CLUSTER = "flink-cluster"

@dataclass
class DeploymentConfig:
    """Configuration for Kubernetes deployment"""
    environment: DeploymentEnvironment
    namespace: str
    replicas: int
    cpu_request: str
    memory_request: str
    cpu_limit: str
    memory_limit: str
    storage_size: str = "10Gi"
    image_pull_policy: str = "Always"
    enable_autoscaling: bool = True
    min_replicas: int = 1
    max_replicas: int = 10
    target_cpu_utilization: int = 70

@dataclass
class ServiceConfig:
    """Configuration for Kubernetes service"""
    name: str
    port: int
    target_port: int
    service_type: str = "ClusterIP"
    external_port: Optional[int] = None
    load_balancer_ip: Optional[str] = None

class KubernetesOrchestrator:
    """Kubernetes deployment orchestrator for AMT system"""
    
    def __init__(self, kubeconfig_path: Optional[str] = None):
        self.kubeconfig_path = kubeconfig_path
        
        # Kubernetes clients
        self.v1_core = None
        self.v1_apps = None
        self.v1_autoscaling = None
        self.v1_networking = None
        
        # Deployment configurations
        self.deployment_configs = self._initialize_deployment_configs()
        self.service_configs = self._initialize_service_configs()
        
        # Deployment state
        self.deployed_components = {}
        self.deployment_status = {}
        
    def _initialize_deployment_configs(self) -> Dict[ComponentType, Dict[DeploymentEnvironment, DeploymentConfig]]:
        """Initialize deployment configurations for all components and environments"""
        
        configs = {}
        
        # Orchestration Service configurations
        configs[ComponentType.ORCHESTRATION_SERVICE] = {
            DeploymentEnvironment.DEVELOPMENT: DeploymentConfig(
                environment=DeploymentEnvironment.DEVELOPMENT,
                namespace="amt-dev",
                replicas=1,
                cpu_request="200m",
                memory_request="512Mi",
                cpu_limit="500m",
                memory_limit="1Gi"
            ),
            DeploymentEnvironment.STAGING: DeploymentConfig(
                environment=DeploymentEnvironment.STAGING,
                namespace="amt-staging",
                replicas=2,
                cpu_request="500m",
                memory_request="1Gi",
                cpu_limit="1000m",
                memory_limit="2Gi"
            ),
            DeploymentEnvironment.PRODUCTION: DeploymentConfig(
                environment=DeploymentEnvironment.PRODUCTION,
                namespace="amt-production",
                replicas=3,
                cpu_request="1000m",
                memory_request="2Gi",
                cpu_limit="2000m",
                memory_limit="4Gi",
                min_replicas=2,
                max_replicas=20
            )
        }
        
        # Knowledge Base configurations
        configs[ComponentType.KNOWLEDGE_BASE] = {
            DeploymentEnvironment.DEVELOPMENT: DeploymentConfig(
                environment=DeploymentEnvironment.DEVELOPMENT,
                namespace="amt-dev",
                replicas=1,
                cpu_request="100m",
                memory_request="256Mi",
                cpu_limit="300m",
                memory_limit="512Mi",
                storage_size="5Gi"
            ),
            DeploymentEnvironment.PRODUCTION: DeploymentConfig(
                environment=DeploymentEnvironment.PRODUCTION,
                namespace="amt-production",
                replicas=2,
                cpu_request="500m",
                memory_request="1Gi",
                cpu_limit="1000m",
                memory_limit="2Gi",
                storage_size="50Gi",
                min_replicas=2,
                max_replicas=5
            )
        }
        
        # External Gateway configurations
        configs[ComponentType.EXTERNAL_GATEWAY] = {
            DeploymentEnvironment.DEVELOPMENT: DeploymentConfig(
                environment=DeploymentEnvironment.DEVELOPMENT,
                namespace="amt-dev",
                replicas=1,
                cpu_request="100m",
                memory_request="256Mi",
                cpu_limit="300m",
                memory_limit="512Mi"
            ),
            DeploymentEnvironment.PRODUCTION: DeploymentConfig(
                environment=DeploymentEnvironment.PRODUCTION,
                namespace="amt-production",
                replicas=3,
                cpu_request="300m",
                memory_request="512Mi",
                cpu_limit="600m",
                memory_limit="1Gi",
                min_replicas=2,
                max_replicas=15
            )
        }
        
        # Dashboard API configurations
        configs[ComponentType.DASHBOARD_API] = {
            DeploymentEnvironment.DEVELOPMENT: DeploymentConfig(
                environment=DeploymentEnvironment.DEVELOPMENT,
                namespace="amt-dev",
                replicas=1,
                cpu_request="100m",
                memory_request="256Mi",
                cpu_limit="300m",
                memory_limit="512Mi"
            ),
            DeploymentEnvironment.PRODUCTION: DeploymentConfig(
                environment=DeploymentEnvironment.PRODUCTION,
                namespace="amt-production",
                replicas=2,
                cpu_request="200m",
                memory_request="512Mi",
                cpu_limit="500m",
                memory_limit="1Gi",
                min_replicas=2,
                max_replicas=10
            )
        }
        
        return configs
    
    def _initialize_service_configs(self) -> Dict[ComponentType, ServiceConfig]:
        """Initialize service configurations"""
        
        return {
            ComponentType.ORCHESTRATION_SERVICE: ServiceConfig(
                name="orchestration-service",
                port=8000,
                target_port=8000,
                service_type="ClusterIP"
            ),
            ComponentType.DASHBOARD_API: ServiceConfig(
                name="dashboard-api",
                port=8001,
                target_port=8001,
                service_type="LoadBalancer",
                external_port=80
            ),
            ComponentType.EXTERNAL_GATEWAY: ServiceConfig(
                name="external-gateway",
                port=8002,
                target_port=8002,
                service_type="ClusterIP"
            ),
            ComponentType.KNOWLEDGE_BASE: ServiceConfig(
                name="knowledge-base",
                port=8003,
                target_port=8003,
                service_type="ClusterIP"
            ),
            ComponentType.POSTGRES_DB: ServiceConfig(
                name="postgres-db",
                port=5432,
                target_port=5432,
                service_type="ClusterIP"
            ),
            ComponentType.REDIS_CACHE: ServiceConfig(
                name="redis-cache",
                port=6379,
                target_port=6379,
                service_type="ClusterIP"
            )
        }
    
    async def initialize_kubernetes_clients(self):
        """Initialize Kubernetes API clients"""
        
        if not KUBERNETES_AVAILABLE:
            raise RuntimeError("Kubernetes client not available")
        
        try:
            # Load kubeconfig
            if self.kubeconfig_path:
                config.load_kube_config(config_file=self.kubeconfig_path)
            else:
                # Try in-cluster config first, then local config
                try:
                    config.load_incluster_config()
                except config.ConfigException:
                    config.load_kube_config()
            
            # Initialize clients
            self.v1_core = client.CoreV1Api()
            self.v1_apps = client.AppsV1Api()
            self.v1_autoscaling = client.AutoscalingV2Api()
            self.v1_networking = client.NetworkingV1Api()
            
            logger.info("Kubernetes clients initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Kubernetes clients: {str(e)}")
            raise
    
    async def create_namespace(self, namespace: str) -> bool:
        """Create Kubernetes namespace if it doesn't exist"""
        
        try:
            # Check if namespace exists
            try:
                self.v1_core.read_namespace(name=namespace)
                logger.info(f"Namespace {namespace} already exists")
                return True
            except ApiException as e:
                if e.status != 404:
                    raise
            
            # Create namespace
            namespace_body = client.V1Namespace(
                metadata=client.V1ObjectMeta(
                    name=namespace,
                    labels={
                        "app.kubernetes.io/name": "amt-orchestration",
                        "app.kubernetes.io/part-of": "analyzemyteam",
                        "environment": namespace.split("-")[-1]
                    }
                )
            )
            
            self.v1_core.create_namespace(body=namespace_body)
            logger.info(f"Created namespace: {namespace}")
            return True
            
        except ApiException as e:
            logger.error(f"Failed to create namespace {namespace}: {str(e)}")
            return False
    
    async def deploy_component(
        self,
        component_type: ComponentType,
        environment: DeploymentEnvironment,
        image_tag: str = "latest"
    ) -> bool:
        """Deploy a specific component to Kubernetes"""
        
        try:
            # Get deployment configuration
            if component_type not in self.deployment_configs:
                raise ValueError(f"No deployment configuration for {component_type}")
            
            env_configs = self.deployment_configs[component_type]
            if environment not in env_configs:
                raise ValueError(f"No configuration for {component_type} in {environment}")
            
            config = env_configs[environment]
            
            # Ensure namespace exists
            await self.create_namespace(config.namespace)
            
            # Create deployment manifests
            deployment = self._create_deployment_manifest(component_type, config, image_tag)
            service = self._create_service_manifest(component_type, config)
            
            # Apply deployment
            try:
                self.v1_apps.create_namespaced_deployment(
                    namespace=config.namespace,
                    body=deployment
                )
                logger.info(f"Created deployment for {component_type}")
            except ApiException as e:
                if e.status == 409:  # Already exists
                    self.v1_apps.patch_namespaced_deployment(
                        name=deployment.metadata.name,
                        namespace=config.namespace,
                        body=deployment
                    )
                    logger.info(f"Updated deployment for {component_type}")
                else:
                    raise
            
            # Apply service
            if service:
                try:
                    self.v1_core.create_namespaced_service(
                        namespace=config.namespace,
                        body=service
                    )
                    logger.info(f"Created service for {component_type}")
                except ApiException as e:
                    if e.status == 409:  # Already exists
                        self.v1_core.patch_namespaced_service(
                            name=service.metadata.name,
                            namespace=config.namespace,
                            body=service
                        )
                        logger.info(f"Updated service for {component_type}")
                    else:
                        raise
            
            # Create HPA if autoscaling enabled
            if config.enable_autoscaling:
                hpa = self._create_hpa_manifest(component_type, config)
                try:
                    self.v1_autoscaling.create_namespaced_horizontal_pod_autoscaler(
                        namespace=config.namespace,
                        body=hpa
                    )
                    logger.info(f"Created HPA for {component_type}")
                except ApiException as e:
                    if e.status == 409:  # Already exists
                        self.v1_autoscaling.patch_namespaced_horizontal_pod_autoscaler(
                            name=hpa.metadata.name,
                            namespace=config.namespace,
                            body=hpa
                        )
                        logger.info(f"Updated HPA for {component_type}")
                    else:
                        raise
            
            # Track deployment
            self.deployed_components[component_type] = {
                "environment": environment,
                "namespace": config.namespace,
                "deployed_at": datetime.now(),
                "image_tag": image_tag
            }
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to deploy {component_type}: {str(e)}")
            return False
    
    def _create_deployment_manifest(
        self,
        component_type: ComponentType,
        config: DeploymentConfig,
        image_tag: str
    ) -> client.V1Deployment:
        """Create Kubernetes deployment manifest"""
        
        # Image name mapping
        image_names = {
            ComponentType.ORCHESTRATION_SERVICE: "amt-orchestration-service",
            ComponentType.KNOWLEDGE_BASE: "amt-knowledge-base",
            ComponentType.EXTERNAL_GATEWAY: "amt-external-gateway",
            ComponentType.DASHBOARD_API: "amt-dashboard-api",
            ComponentType.REALTIME_COORDINATOR: "amt-realtime-coordinator",
            ComponentType.CREATIVE_TOOLS: "amt-creative-tools"
        }
        
        image_name = image_names.get(component_type, component_type.value)
        full_image = f"analyzemyteam/{image_name}:{image_tag}"
        
        # Environment variables
        env_vars = self._get_environment_variables(component_type, config)
        
        # Container ports
        container_ports = self._get_container_ports(component_type)
        
        # Volume mounts for persistent components
        volume_mounts = []
        volumes = []
        
        if component_type == ComponentType.KNOWLEDGE_BASE:
            volume_mounts.append(
                client.V1VolumeMount(
                    name="knowledge-storage",
                    mount_path="/app/knowledge_base"
                )
            )
            volumes.append(
                client.V1Volume(
                    name="knowledge-storage",
                    persistent_volume_claim=client.V1PersistentVolumeClaimVolumeSource(
                        claim_name=f"{component_type.value}-storage"
                    )
                )
            )
        
        # Create container spec
        container = client.V1Container(
            name=component_type.value,
            image=full_image,
            image_pull_policy=config.image_pull_policy,
            ports=container_ports,
            env=env_vars,
            volume_mounts=volume_mounts if volume_mounts else None,
            resources=client.V1ResourceRequirements(
                requests={
                    "cpu": config.cpu_request,
                    "memory": config.memory_request
                },
                limits={
                    "cpu": config.cpu_limit,
                    "memory": config.memory_limit
                }
            ),
            liveness_probe=self._create_liveness_probe(component_type),
            readiness_probe=self._create_readiness_probe(component_type)
        )
        
        # Create deployment spec
        deployment = client.V1Deployment(
            api_version="apps/v1",
            kind="Deployment",
            metadata=client.V1ObjectMeta(
                name=component_type.value,
                namespace=config.namespace,
                labels={
                    "app.kubernetes.io/name": component_type.value,
                    "app.kubernetes.io/part-of": "amt-orchestration",
                    "app.kubernetes.io/version": image_tag,
                    "environment": config.environment.value
                }
            ),
            spec=client.V1DeploymentSpec(
                replicas=config.replicas,
                selector=client.V1LabelSelector(
                    match_labels={
                        "app.kubernetes.io/name": component_type.value
                    }
                ),
                template=client.V1PodTemplateSpec(
                    metadata=client.V1ObjectMeta(
                        labels={
                            "app.kubernetes.io/name": component_type.value,
                            "app.kubernetes.io/part-of": "amt-orchestration",
                            "environment": config.environment.value
                        }
                    ),
                    spec=client.V1PodSpec(
                        containers=[container],
                        volumes=volumes if volumes else None,
                        restart_policy="Always",
                        dns_policy="ClusterFirst"
                    )
                ),
                strategy=client.V1DeploymentStrategy(
                    type="RollingUpdate",
                    rolling_update=client.V1RollingUpdateDeployment(
                        max_unavailable="25%",
                        max_surge="25%"
                    )
                )
            )
        )
        
        return deployment
    
    def _create_service_manifest(
        self,
        component_type: ComponentType,
        config: DeploymentConfig
    ) -> Optional[client.V1Service]:
        """Create Kubernetes service manifest"""
        
        if component_type not in self.service_configs:
            return None
        
        service_config = self.service_configs[component_type]
        
        # Service ports
        ports = [
            client.V1ServicePort(
                name="http",
                port=service_config.port,
                target_port=service_config.target_port,
                protocol="TCP"
            )
        ]
        
        # External port for LoadBalancer services
        if service_config.external_port and service_config.service_type == "LoadBalancer":
            ports.append(
                client.V1ServicePort(
                    name="external",
                    port=service_config.external_port,
                    target_port=service_config.target_port,
                    protocol="TCP"
                )
            )
        
        service = client.V1Service(
            api_version="v1",
            kind="Service",
            metadata=client.V1ObjectMeta(
                name=service_config.name,
                namespace=config.namespace,
                labels={
                    "app.kubernetes.io/name": component_type.value,
                    "app.kubernetes.io/part-of": "amt-orchestration"
                }
            ),
            spec=client.V1ServiceSpec(
                selector={
                    "app.kubernetes.io/name": component_type.value
                },
                ports=ports,
                type=service_config.service_type,
                load_balancer_ip=service_config.load_balancer_ip
            )
        )
        
        return service
    
    def _create_hpa_manifest(
        self,
        component_type: ComponentType,
        config: DeploymentConfig
    ) -> client.V2HorizontalPodAutoscaler:
        """Create Horizontal Pod Autoscaler manifest"""
        
        hpa = client.V2HorizontalPodAutoscaler(
            api_version="autoscaling/v2",
            kind="HorizontalPodAutoscaler",
            metadata=client.V1ObjectMeta(
                name=f"{component_type.value}-hpa",
                namespace=config.namespace,
                labels={
                    "app.kubernetes.io/name": component_type.value,
                    "app.kubernetes.io/part-of": "amt-orchestration"
                }
            ),
            spec=client.V2HorizontalPodAutoscalerSpec(
                scale_target_ref=client.V2CrossVersionObjectReference(
                    api_version="apps/v1",
                    kind="Deployment",
                    name=component_type.value
                ),
                min_replicas=config.min_replicas,
                max_replicas=config.max_replicas,
                metrics=[
                    client.V2MetricSpec(
                        type="Resource",
                        resource=client.V2ResourceMetricSource(
                            name="cpu",
                            target=client.V2MetricTarget(
                                type="Utilization",
                                average_utilization=config.target_cpu_utilization
                            )
                        )
                    )
                ]
            )
        )
        
        return hpa
    
    def _get_environment_variables(
        self,
        component_type: ComponentType,
        config: DeploymentConfig
    ) -> List[client.V1EnvVar]:
        """Get environment variables for component"""
        
        base_env = [
            client.V1EnvVar(name="ENVIRONMENT", value=config.environment.value),
            client.V1EnvVar(name="NAMESPACE", value=config.namespace),
            client.V1EnvVar(name="LOG_LEVEL", value="INFO"),
            client.V1EnvVar(name="PYTHONPATH", value="/app")
        ]
        
        # Component-specific environment variables
        if component_type == ComponentType.ORCHESTRATION_SERVICE:
            base_env.extend([
                client.V1EnvVar(name="ORCHESTRATION_PORT", value="8000"),
                client.V1EnvVar(name="ENABLE_DEBUG", value="false" if config.environment == DeploymentEnvironment.PRODUCTION else "true")
            ])
        
        elif component_type == ComponentType.KNOWLEDGE_BASE:
            base_env.extend([
                client.V1EnvVar(name="KNOWLEDGE_BASE_PATH", value="/app/knowledge_base"),
                client.V1EnvVar(name="GRIPTAPE_LEARNING_ENABLED", value="true")
            ])
        
        elif component_type == ComponentType.EXTERNAL_GATEWAY:
            base_env.extend([
                client.V1EnvVar(name="TRIANGLE_DEFENSE_ENDPOINT", value="http://triangle-defense-service:8000"),
                client.V1EnvVar(name="MVA_ANALYTICS_ENDPOINT", value="http://mva-analytics-service:8000"),
                client.V1EnvVar(name="MEL_ENGINE_ENDPOINT", value="http://mel-engine-service:8000")
            ])
        
        # Database connections
        base_env.extend([
            client.V1EnvVar(
                name="DATABASE_URL",
                value_from=client.V1EnvVarSource(
                    secret_key_ref=client.V1SecretKeySelector(
                        name="amt-secrets",
                        key="database_url"
                    )
                )
            ),
            client.V1EnvVar(
                name="REDIS_URL",
                value=f"redis://redis-cache:6379/0"
            )
        ])
        
        return base_env
    
    def _get_container_ports(self, component_type: ComponentType) -> List[client.V1ContainerPort]:
        """Get container ports for component"""
        
        service_config = self.service_configs.get(component_type)
        if not service_config:
            return []
        
        return [
            client.V1ContainerPort(
                name="http",
                container_port=service_config.target_port,
                protocol="TCP"
            )
        ]
    
    def _create_liveness_probe(self, component_type: ComponentType) -> client.V1Probe:
        """Create liveness probe for component"""
        
        service_config = self.service_configs.get(component_type)
        port = service_config.target_port if service_config else 8000
        
        return client.V1Probe(
            http_get=client.V1HTTPGetAction(
                path="/health",
                port=port
            ),
            initial_delay_seconds=60,
            period_seconds=30,
            timeout_seconds=10,
            failure_threshold=3
        )
    
    def _create_readiness_probe(self, component_type: ComponentType) -> client.V1Probe:
        """Create readiness probe for component"""
        
        service_config = self.service_configs.get(component_type)
        port = service_config.target_port if service_config else 8000
        
        return client.V1Probe(
            http_get=client.V1HTTPGetAction(
                path="/ready",
                port=port
            ),
            initial_delay_seconds=30,
            period_seconds=10,
            timeout_seconds=5,
            failure_threshold=3
        )
    
    async def deploy_full_stack(
        self,
        environment: DeploymentEnvironment,
        image_tag: str = "latest",
        include_dependencies: bool = True
    ) -> Dict[str, bool]:
        """Deploy complete AMT orchestration stack"""
        
        deployment_results = {}
        
        # Core orchestration components
        core_components = [
            ComponentType.ORCHESTRATION_SERVICE,
            ComponentType.KNOWLEDGE_BASE,
            ComponentType.EXTERNAL_GATEWAY,
            ComponentType.DASHBOARD_API
        ]
        
        # Deploy dependencies first
        if include_dependencies:
            dependency_components = [
                ComponentType.POSTGRES_DB,
                ComponentType.REDIS_CACHE
            ]
            
            for component in dependency_components:
                logger.info(f"Deploying dependency: {component}")
                result = await self.deploy_component(component, environment, image_tag)
                deployment_results[component.value] = result
                
                if not result:
                    logger.error(f"Failed to deploy dependency {component}")
                    return deployment_results
        
        # Deploy core components
        for component in core_components:
            logger.info(f"Deploying component: {component}")
            result = await self.deploy_component(component, environment, image_tag)
            deployment_results[component.value] = result
            
            if result:
                logger.info(f"Successfully deployed {component}")
            else:
                logger.error(f"Failed to deploy {component}")
        
        # Check overall deployment success
        successful_deployments = sum(1 for success in deployment_results.values() if success)
        total_deployments = len(deployment_results)
        
        logger.info(f"Deployment complete: {successful_deployments}/{total_deployments} successful")
        
        return deployment_results
    
    async def get_deployment_status(self, namespace: str) -> Dict[str, Any]:
        """Get status of all deployments in namespace"""
        
        try:
            deployments = self.v1_apps.list_namespaced_deployment(namespace=namespace)
            services = self.v1_core.list_namespaced_service(namespace=namespace)
            pods = self.v1_core.list_namespaced_pod(namespace=namespace)
            
            status = {
                "namespace": namespace,
                "timestamp": datetime.now().isoformat(),
                "deployments": [],
                "services": [],
                "pods": {
                    "total": len(pods.items),
                    "running": len([p for p in pods.items if p.status.phase == "Running"]),
                    "pending": len([p for p in pods.items if p.status.phase == "Pending"]),
                    "failed": len([p for p in pods.items if p.status.phase == "Failed"])
                }
            }
            
            # Deployment status
            for deployment in deployments.items:
                deployment_status = {
                    "name": deployment.metadata.name,
                    "replicas": deployment.spec.replicas,
                    "ready_replicas": deployment.status.ready_replicas or 0,
                    "available_replicas": deployment.status.available_replicas or 0,
                    "updated_replicas": deployment.status.updated_replicas or 0,
                    "conditions": []
                }
                
                if deployment.status.conditions:
                    deployment_status["conditions"] = [
                        {
                            "type": condition.type,
                            "status": condition.status,
                            "reason": condition.reason,
                            "message": condition.message
                        }
                        for condition in deployment.status.conditions
                    ]
                
                status["deployments"].append(deployment_status)
            
            # Service status
            for service in services.items:
                service_status = {
                    "name": service.metadata.name,
                    "type": service.spec.type,
                    "cluster_ip": service.spec.cluster_ip,
                    "external_ips": service.status.load_balancer.ingress if service.status.load_balancer and service.status.load_balancer.ingress else [],
                    "ports": [
                        {
                            "name": port.name,
                            "port": port.port,
                            "target_port": port.target_port,
                            "protocol": port.protocol
                        }
                        for port in service.spec.ports
                    ]
                }
                
                status["services"].append(service_status)
            
            return status
            
        except ApiException as e:
            logger.error(f"Failed to get deployment status: {str(e)}")
            return {"error": str(e)}
    
    async def scale_deployment(
        self,
        component_type: ComponentType,
        namespace: str,
        replicas: int
    ) -> bool:
        """Scale a deployment to specified number of replicas"""
        
        try:
            # Get current deployment
            deployment = self.v1_apps.read_namespaced_deployment(
                name=component_type.value,
                namespace=namespace
            )
            
            # Update replica count
            deployment.spec.replicas = replicas
            
            # Patch deployment
            self.v1_apps.patch_namespaced_deployment(
                name=component_type.value,
                namespace=namespace,
                body=deployment
            )
            
            logger.info(f"Scaled {component_type.value} to {replicas} replicas")
            return True
            
        except ApiException as e:
            logger.error(f"Failed to scale {component_type.value}: {str(e)}")
            return False
    
    async def rollback_deployment(
        self,
        component_type: ComponentType,
        namespace: str,
        revision: Optional[int] = None
    ) -> bool:
        """Rollback deployment to previous or specified revision"""
        
        try:
            # Get deployment
            deployment = self.v1_apps.read_namespaced_deployment(
                name=component_type.value,
                namespace=namespace
            )
            
            # Trigger rollback by updating deployment annotation
            if not deployment.metadata.annotations:
                deployment.metadata.annotations = {}
            
            deployment.metadata.annotations["deployment.kubernetes.io/revision"] = str(revision) if revision else "previous"
            
            # Patch deployment
            self.v1_apps.patch_namespaced_deployment(
                name=component_type.value,
                namespace=namespace,
                body=deployment
            )
            
            logger.info(f"Initiated rollback for {component_type.value}")
            return True
            
        except ApiException as e:
            logger.error(f"Failed to rollback {component_type.value}: {str(e)}")
            return False
    
    def generate_deployment_yaml(
        self,
        component_type: ComponentType,
        environment: DeploymentEnvironment,
        output_dir: Path
    ) -> Path:
        """Generate deployment YAML files for GitOps"""
        
        if component_type not in self.deployment_configs:
            raise ValueError(f"No configuration for {component_type}")
        
        env_configs = self.deployment_configs[component_type]
        if environment not in env_configs:
            raise ValueError(f"No configuration for {component_type} in {environment}")
        
        config = env_configs[environment]
        
        # Create manifests
        deployment = self._create_deployment_manifest(component_type, config, "latest")
        service = self._create_service_manifest(component_type, config)
        
        # Convert to dictionaries for YAML serialization
        manifests = []
        
        # Add deployment
        deployment_dict = self.v1_apps.api_client.sanitize_for_serialization(deployment)
        manifests.append(deployment_dict)
        
        # Add service if exists
        if service:
            service_dict = self.v1_core.api_client.sanitize_for_serialization(service)
            manifests.append(service_dict)
        
        # Add HPA if autoscaling enabled
        if config.enable_autoscaling:
            hpa = self._create_hpa_manifest(component_type, config)
            hpa_dict = self.v1_autoscaling.api_client.sanitize_for_serialization(hpa)
            manifests.append(hpa_dict)
        
        # Write YAML file
        output_dir.mkdir(parents=True, exist_ok=True)
        yaml_file = output_dir / f"{component_type.value}-{environment.value}.yaml"
        
        with open(yaml_file, 'w') as f:
            for i, manifest in enumerate(manifests):
                if i > 0:
                    f.write("---\n")
                yaml.dump(manifest, f, default_flow_style=False)
        
        logger.info(f"Generated deployment YAML: {yaml_file}")
        return yaml_file
    
    async def cleanup_deployment(
        self,
        component_type: ComponentType,
        namespace: str
    ) -> bool:
        """Clean up deployment, service, and HPA for component"""
        
        try:
            # Delete deployment
            try:
                self.v1_apps.delete_namespaced_deployment(
                    name=component_type.value,
                    namespace=namespace
                )
                logger.info(f"Deleted deployment: {component_type.value}")
            except ApiException as e:
                if e.status != 404:
                    raise
            
            # Delete service
            service_config = self.service_configs.get(component_type)
            if service_config:
                try:
                    self.v1_core.delete_namespaced_service(
                        name=service_config.name,
                        namespace=namespace
                    )
                    logger.info(f"Deleted service: {service_config.name}")
                except ApiException as e:
                    if e.status != 404:
                        raise
            
            # Delete HPA
            try:
                self.v1_autoscaling.delete_namespaced_horizontal_pod_autoscaler(
                    name=f"{component_type.value}-hpa",
                    namespace=namespace
                )
                logger.info(f"Deleted HPA: {component_type.value}-hpa")
            except ApiException as e:
                if e.status != 404:
                    raise
            
            # Remove from tracking
            if component_type in self.deployed_components:
                del self.deployed_components[component_type]
            
            return True
            
        except ApiException as e:
            logger.error(f"Failed to cleanup {component_type}: {str(e)}")
            return False

# Global orchestrator instance
_k8s_orchestrator: Optional[KubernetesOrchestrator] = None

def get_kubernetes_orchestrator() -> KubernetesOrchestrator:
    """Get global Kubernetes orchestrator instance"""
    global _k8s_orchestrator
    
    if _k8s_orchestrator is None:
        _k8s_orchestrator = KubernetesOrchestrator()
    
    return _k8s_orchestrator

async def deploy_amt_orchestration(
    environment: DeploymentEnvironment,
    image_tag: str = "latest",
    kubeconfig_path: Optional[str] = None
) -> Dict[str, bool]:
    """Deploy AMT orchestration system to Kubernetes"""
    
    orchestrator = KubernetesOrchestrator(kubeconfig_path)
    await orchestrator.initialize_kubernetes_clients()
    
    return await orchestrator.deploy_full_stack(environment, image_tag)

# CLI interface
async def main():
    """Main CLI interface for Kubernetes deployment"""
    
    import argparse
    
    parser = argparse.ArgumentParser(description="AMT Kubernetes Orchestration Deployment")
    parser.add_argument("--environment", choices=["development", "staging", "production"], required=True)
    parser.add_argument("--image-tag", default="latest", help="Docker image tag to deploy")
    parser.add_argument("--kubeconfig", help="Path to kubeconfig file")
    parser.add_argument("--component", help="Specific component to deploy")
    parser.add_argument("--action", choices=["deploy", "status", "scale", "cleanup", "generate-yaml"], default="deploy")
    parser.add_argument("--replicas", type=int, help="Number of replicas for scaling")
    parser.add_argument("--output-dir", type=Path, help="Output directory for YAML generation")
    
    args = parser.parse_args()
    
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    
    try:
        orchestrator = KubernetesOrchestrator(args.kubeconfig)
        await orchestrator.initialize_kubernetes_clients()
        
        environment = DeploymentEnvironment(args.environment)
        
        if args.action == "deploy":
            if args.component:
                component = ComponentType(args.component)
                result = await orchestrator.deploy_component(component, environment, args.image_tag)
                print(f"Deployment result: {result}")
            else:
                results = await orchestrator.deploy_full_stack(environment, args.image_tag)
                print(f"Full stack deployment results: {results}")
        
        elif args.action == "status":
            namespace = f"amt-{args.environment}"
            status = await orchestrator.get_deployment_status(namespace)
            print(json.dumps(status, indent=2))
        
        elif args.action == "generate-yaml":
            if not args.component or not args.output_dir:
                print("--component and --output-dir required for YAML generation")
                return
            
            component = ComponentType(args.component)
            yaml_file = orchestrator.generate_deployment_yaml(component, environment, args.output_dir)
            print(f"Generated YAML: {yaml_file}")
        
        else:
            print(f"Action {args.action} not implemented")
            
    except Exception as e:
        logger.error(f"Deployment failed: {str(e)}")
        raise

if __name__ == "__main__":
    asyncio.run(main())
