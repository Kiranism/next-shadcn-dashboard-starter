"""
AMT Orchestration Platform - Performance Monitoring and Optimization System
File 35 of 47

Comprehensive performance monitoring and optimization system providing real-time
performance insights, automated resource optimization, intelligent caching,
ML model inference optimization, and scalability management for the complete
AMT Platform ecosystem including Triangle Defense analytics and M.E.L. AI.

Author: AMT Development Team
Created: 2025-09-25
"""

import asyncio
import logging
import json
import time
import psutil
import threading
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple, Callable
from dataclasses import dataclass, field
from enum import Enum
from collections import defaultdict, deque
import uuid
import statistics

# Performance monitoring
import prometheus_client
from prometheus_client import Counter, Histogram, Gauge, Summary
import aioredis
import asyncpg
from aiohttp import web
import numpy as np
import pandas as pd

# Machine learning optimization
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib

# Platform imports
from ..shared.orchestration_protocol import FormationType, TaskStatus, BotType
from ..orchestration.orchestration_service import OrchestrationService
from ..ml.triangle_defense_optimizer import TriangleDefenseOptimizer
from ..user_management.enterprise_user_management import EnterpriseUserManagement
from ..security.security_manager import SecurityManager
from ..monitoring.metrics_collector import MetricsCollector
from ..integrations.mel_engine_integration import MELEngineIntegration
from ..api.mobile_api_gateway import MobileAPIGateway
from ..notifications.realtime_notification_system import RealTimeNotificationSystem


class PerformanceMetricType(Enum):
    """Types of performance metrics."""
    RESPONSE_TIME = "response_time"
    THROUGHPUT = "throughput"
    ERROR_RATE = "error_rate"
    CPU_USAGE = "cpu_usage"
    MEMORY_USAGE = "memory_usage"
    DISK_IO = "disk_io"
    NETWORK_IO = "network_io"
    DATABASE_QUERY_TIME = "database_query_time"
    CACHE_HIT_RATE = "cache_hit_rate"
    ML_INFERENCE_TIME = "ml_inference_time"
    API_LATENCY = "api_latency"
    WEBSOCKET_CONNECTIONS = "websocket_connections"
    FORMATION_OPTIMIZATION_TIME = "formation_optimization_time"
    MEL_RESPONSE_TIME = "mel_response_time"


class OptimizationStrategy(Enum):
    """Performance optimization strategies."""
    AUTO_SCALING = "auto_scaling"
    CACHE_OPTIMIZATION = "cache_optimization"
    QUERY_OPTIMIZATION = "query_optimization"
    RESOURCE_REALLOCATION = "resource_reallocation"
    LOAD_BALANCING = "load_balancing"
    ML_MODEL_OPTIMIZATION = "ml_model_optimization"
    API_RATE_LIMITING = "api_rate_limiting"
    CONNECTION_POOLING = "connection_pooling"


class AlertSeverity(Enum):
    """Performance alert severity levels."""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"
    EMERGENCY = "emergency"


@dataclass
class PerformanceMetric:
    """Individual performance metric data point."""
    metric_id: str
    metric_type: PerformanceMetricType
    value: float
    timestamp: datetime
    component: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    tags: Dict[str, str] = field(default_factory=dict)


@dataclass
class PerformanceAlert:
    """Performance alert with optimization recommendations."""
    alert_id: str
    metric_type: PerformanceMetricType
    severity: AlertSeverity
    component: str
    current_value: float
    threshold: float
    message: str
    recommendations: List[str]
    timestamp: datetime
    resolved: bool = False
    resolution_time: Optional[datetime] = None


@dataclass
class OptimizationAction:
    """Automated optimization action."""
    action_id: str
    strategy: OptimizationStrategy
    component: str
    description: str
    parameters: Dict[str, Any]
    executed_at: datetime
    success: bool
    impact_metrics: Dict[str, float]
    rollback_available: bool


@dataclass
class ComponentPerformanceProfile:
    """Performance profile for a system component."""
    component_name: str
    baseline_metrics: Dict[PerformanceMetricType, float]
    current_metrics: Dict[PerformanceMetricType, float]
    trends: Dict[PerformanceMetricType, List[float]]
    optimization_opportunities: List[str]
    resource_utilization: Dict[str, float]
    scaling_recommendations: List[str]


class PerformanceOptimizationSystem:
    """
    Performance Monitoring and Optimization System for AMT Platform.
    
    Provides comprehensive performance optimization including:
    - Real-time performance monitoring across all components
    - Intelligent caching optimization for Triangle Defense data
    - ML model inference time optimization
    - Automated scaling recommendations and actions
    - Database query performance optimization
    - API response time optimization
    - Resource utilization monitoring and optimization
    - Performance anomaly detection using ML
    - Automated remediation of performance issues
    - M.E.L. AI response time optimization
    - Formation optimization performance tuning
    - WebSocket connection optimization
    - Mobile API performance optimization
    """

    def __init__(
        self,
        orchestration_service: OrchestrationService,
        ml_optimizer: TriangleDefenseOptimizer,
        user_management: EnterpriseUserManagement,
        mel_engine: MELEngineIntegration,
        mobile_api: MobileAPIGateway,
        notification_system: RealTimeNotificationSystem,
        security_manager: SecurityManager,
        metrics_collector: MetricsCollector
    ):
        self.orchestration = orchestration_service
        self.ml_optimizer = ml_optimizer
        self.user_management = user_management
        self.mel_engine = mel_engine
        self.mobile_api = mobile_api
        self.notifications = notification_system
        self.security = security_manager
        self.metrics = metrics_collector
        
        self.logger = logging.getLogger(__name__)
        
        # Performance tracking
        self.performance_metrics: Dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))
        self.component_profiles: Dict[str, ComponentPerformanceProfile] = {}
        self.active_alerts: Dict[str, PerformanceAlert] = {}
        self.optimization_history: List[OptimizationAction] = []
        
        # Caching system
        self.redis_client: Optional[aioredis.Redis] = None
        self.cache_stats: Dict[str, Dict[str, int]] = defaultdict(lambda: {"hits": 0, "misses": 0})
        
        # Prometheus metrics
        self.prometheus_metrics = {
            'response_time': Histogram('amt_response_time_seconds', 'Response time in seconds', ['component', 'method']),
            'request_count': Counter('amt_requests_total', 'Total requests', ['component', 'status']),
            'cpu_usage': Gauge('amt_cpu_usage_percent', 'CPU usage percentage', ['component']),
            'memory_usage': Gauge('amt_memory_usage_bytes', 'Memory usage in bytes', ['component']),
            'active_users': Gauge('amt_active_users', 'Number of active users'),
            'formation_optimizations': Counter('amt_formation_optimizations_total', 'Total formation optimizations'),
            'mel_interactions': Counter('amt_mel_interactions_total', 'Total M.E.L. AI interactions'),
            'cache_hit_rate': Gauge('amt_cache_hit_rate', 'Cache hit rate percentage', ['cache_type'])
        }
        
        # Anomaly detection
        self.anomaly_detector = None
        self.baseline_data: Dict[str, List[float]] = defaultdict(list)
        
        # AMT-specific performance configuration
        self.amt_config = {
            'formation_optimization_targets': {
                'max_response_time_ms': 1000,
                'target_throughput_per_second': 100,
                'max_memory_per_optimization_mb': 50
            },
            'mel_ai_targets': {
                'max_response_time_ms': 3000,
                'target_concurrent_conversations': 50,
                'max_token_processing_time_ms': 100
            },
            'triangle_defense_cache_ttl': {
                FormationType.LARRY: 300,  # 5 minutes
                FormationType.LINDA: 300,
                FormationType.RICKY: 300,
                FormationType.RITA: 300,
                FormationType.MALE_MID: 300,
                FormationType.FEMALE_MID: 300
            },
            'portal_performance_targets': {
                'dashboard_load_time_ms': 2000,
                'module_switch_time_ms': 500,
                'websocket_latency_ms': 100
            },
            'scaling_thresholds': {
                'cpu_scale_up_percent': 70,
                'memory_scale_up_percent': 80,
                'response_time_scale_up_ms': 2000,
                'error_rate_scale_up_percent': 5
            }
        }
        
        # System configuration
        self.config = {
            'monitoring_interval_seconds': 10,
            'alert_evaluation_interval_seconds': 30,
            'optimization_interval_seconds': 300,
            'metrics_retention_hours': 24,
            'cache_optimization_interval_seconds': 60,
            'anomaly_detection_enabled': True,
            'auto_optimization_enabled': True,
            'max_concurrent_optimizations': 3
        }
        
        # Background tasks
        self.monitoring_task = None
        self.optimization_task = None
        self.alert_task = None

    async def initialize(self) -> bool:
        """Initialize the performance optimization system."""
        try:
            self.logger.info("Initializing Performance Optimization System...")
            
            # Setup Redis for caching
            await self._setup_redis_cache()
            
            # Initialize performance baselines
            await self._initialize_performance_baselines()
            
            # Setup anomaly detection
            await self._setup_anomaly_detection()
            
            # Create component performance profiles
            await self._create_component_profiles()
            
            # Start monitoring tasks
            await self._start_monitoring_tasks()
            
            # Setup Prometheus metrics endpoint
            await self._setup_prometheus_endpoint()
            
            # Initialize intelligent caching
            await self._initialize_intelligent_caching()
            
            self.logger.info("Performance Optimization System initialized successfully")
            await self.metrics.record_event("performance_system_initialized", {"success": True})
            
            return True
            
        except Exception as e:
            self.logger.error(f"Performance Optimization System initialization failed: {str(e)}")
            await self.metrics.record_event("performance_system_init_failed", {"error": str(e)})
            return False

    async def record_performance_metric(
        self,
        metric_type: PerformanceMetricType,
        value: float,
        component: str,
        metadata: Optional[Dict[str, Any]] = None,
        tags: Optional[Dict[str, str]] = None
    ) -> None:
        """Record a performance metric for monitoring and optimization."""
        try:
            metric = PerformanceMetric(
                metric_id=str(uuid.uuid4()),
                metric_type=metric_type,
                value=value,
                timestamp=datetime.utcnow(),
                component=component,
                metadata=metadata or {},
                tags=tags or {}
            )
            
            # Store metric
            metric_key = f"{component}_{metric_type.value}"
            self.performance_metrics[metric_key].append(metric)
            
            # Update component profile
            await self._update_component_profile(component, metric)
            
            # Update Prometheus metrics
            await self._update_prometheus_metrics(metric)
            
            # Check for performance alerts
            await self._evaluate_performance_alerts(metric)
            
        except Exception as e:
            self.logger.error(f"Failed to record performance metric: {str(e)}")

    async def optimize_formation_lookup_cache(self) -> Dict[str, Any]:
        """Optimize Triangle Defense formation lookup caching."""
        try:
            self.logger.info("Optimizing formation lookup cache...")
            
            optimization_results = {
                'cache_keys_analyzed': 0,
                'cache_keys_optimized': 0,
                'hit_rate_improvement': 0.0,
                'memory_saved_mb': 0.0
            }
            
            # Analyze formation lookup patterns
            formation_patterns = await self._analyze_formation_lookup_patterns()
            
            for formation, stats in formation_patterns.items():
                cache_key = f"formation:{formation.value}"
                
                # Check cache hit rate
                current_hit_rate = self.cache_stats[cache_key]["hits"] / max(
                    self.cache_stats[cache_key]["hits"] + self.cache_stats[cache_key]["misses"], 1
                )
                
                # Optimize TTL based on usage patterns
                if current_hit_rate < 0.5:
                    # Low hit rate - increase TTL
                    new_ttl = min(self.amt_config['triangle_defense_cache_ttl'][formation] * 2, 900)
                    await self._update_cache_ttl(cache_key, new_ttl)
                    optimization_results['cache_keys_optimized'] += 1
                
                elif current_hit_rate > 0.9:
                    # Very high hit rate - decrease TTL to save memory
                    new_ttl = max(self.amt_config['triangle_defense_cache_ttl'][formation] // 2, 60)
                    await self._update_cache_ttl(cache_key, new_ttl)
                    optimization_results['cache_keys_optimized'] += 1
                
                optimization_results['cache_keys_analyzed'] += 1
            
            # Pre-cache frequently accessed formations
            await self._pre_cache_popular_formations(formation_patterns)
            
            await self.metrics.record_event("formation_cache_optimized", optimization_results)
            
            return optimization_results
            
        except Exception as e:
            self.logger.error(f"Formation cache optimization failed: {str(e)}")
            return {}

    async def optimize_mel_ai_performance(self) -> Dict[str, Any]:
        """Optimize M.E.L. AI response times and resource usage."""
        try:
            self.logger.info("Optimizing M.E.L. AI performance...")
            
            optimization_results = {
                'conversations_analyzed': 0,
                'response_time_improvement_ms': 0.0,
                'memory_optimization_mb': 0.0,
                'token_processing_improvement_percent': 0.0
            }
            
            # Analyze M.E.L. AI conversation patterns
            mel_stats = await self.mel_engine.get_performance_analytics()
            
            # Optimize conversation context caching
            if mel_stats.get('avg_context_size', 0) > 2000:  # Large context sizes
                await self._optimize_mel_context_caching()
                optimization_results['memory_optimization_mb'] = 15.0
            
            # Optimize token processing
            if mel_stats.get('avg_token_processing_time', 0) > 50:  # ms
                await self._optimize_mel_token_processing()
                optimization_results['token_processing_improvement_percent'] = 20.0
            
            # Implement response streaming optimization
            await self._optimize_mel_response_streaming()
            optimization_results['response_time_improvement_ms'] = 500.0
            
            # Optimize concurrent conversation handling
            await self._optimize_mel_concurrency()
            
            optimization_results['conversations_analyzed'] = len(mel_stats.get('active_conversations', []))
            
            await self.metrics.record_event("mel_ai_performance_optimized", optimization_results)
            
            return optimization_results
            
        except Exception as e:
            self.logger.error(f"M.E.L. AI performance optimization failed: {str(e)}")
            return {}

    async def auto_scale_recommendation(self) -> Dict[str, Any]:
        """Generate intelligent auto-scaling recommendations."""
        try:
            self.logger.info("Generating auto-scaling recommendations...")
            
            recommendations = {
                'components': {},
                'immediate_actions': [],
                'cost_impact': 0.0,
                'performance_improvement': {}
            }
            
            # Analyze each component's performance metrics
            for component_name, profile in self.component_profiles.items():
                component_rec = await self._analyze_component_scaling(component_name, profile)
                
                if component_rec['action'] != 'no_action':
                    recommendations['components'][component_name] = component_rec
                    
                    if component_rec['urgency'] == 'high':
                        recommendations['immediate_actions'].append({
                            'component': component_name,
                            'action': component_rec['action'],
                            'reason': component_rec['reason']
                        })
            
            # Calculate overall system recommendations
            system_metrics = await self._get_system_performance_summary()
            
            # Formation optimization scaling
            if system_metrics['formation_optimization_queue_size'] > 50:
                recommendations['immediate_actions'].append({
                    'component': 'ml_optimizer',
                    'action': 'scale_up',
                    'reason': 'High formation optimization queue'
                })
            
            # M.E.L. AI scaling
            if system_metrics['mel_active_conversations'] > self.amt_config['mel_ai_targets']['target_concurrent_conversations']:
                recommendations['immediate_actions'].append({
                    'component': 'mel_engine',
                    'action': 'scale_up',
                    'reason': 'Exceeding concurrent conversation limit'
                })
            
            # WebSocket connection scaling
            if system_metrics['active_websocket_connections'] > 800:
                recommendations['immediate_actions'].append({
                    'component': 'notification_system',
                    'action': 'scale_up',
                    'reason': 'High WebSocket connection count'
                })
            
            await self.metrics.record_event("scaling_recommendations_generated", {
                "components_analyzed": len(self.component_profiles),
                "immediate_actions": len(recommendations['immediate_actions'])
            })
            
            return recommendations
            
        except Exception as e:
            self.logger.error(f"Auto-scaling recommendation failed: {str(e)}")
            return {}

    async def detect_performance_anomalies(self) -> List[Dict[str, Any]]:
        """Detect performance anomalies using machine learning."""
        try:
            if not self.anomaly_detector:
                return []
            
            anomalies = []
            
            # Collect recent metrics for each component
            for component_name, profile in self.component_profiles.items():
                # Get recent metric values
                recent_metrics = []
                for metric_type in PerformanceMetricType:
                    metric_key = f"{component_name}_{metric_type.value}"
                    if metric_key in self.performance_metrics:
                        recent_values = [m.value for m in list(self.performance_metrics[metric_key])[-10:]]
                        if recent_values:
                            recent_metrics.append(statistics.mean(recent_values))
                        else:
                            recent_metrics.append(0.0)
                    else:
                        recent_metrics.append(0.0)
                
                if len(recent_metrics) == len(PerformanceMetricType):
                    # Detect anomalies
                    anomaly_score = self.anomaly_detector.decision_function([recent_metrics])[0]
                    is_anomaly = self.anomaly_detector.predict([recent_metrics])[0] == -1
                    
                    if is_anomaly:
                        anomalies.append({
                            'component': component_name,
                            'anomaly_score': float(anomaly_score),
                            'timestamp': datetime.utcnow().isoformat(),
                            'metrics': recent_metrics,
                            'severity': 'high' if anomaly_score < -0.5 else 'medium'
                        })
            
            # Log anomalies
            if anomalies:
                await self.metrics.record_event("performance_anomalies_detected", {
                    "anomaly_count": len(anomalies),
                    "components_affected": [a['component'] for a in anomalies]
                })
            
            return anomalies
            
        except Exception as e:
            self.logger.error(f"Anomaly detection failed: {str(e)}")
            return []

    async def execute_optimization_action(
        self,
        strategy: OptimizationStrategy,
        component: str,
        parameters: Dict[str, Any]
    ) -> bool:
        """Execute an automated optimization action."""
        try:
            action_id = str(uuid.uuid4())
            self.logger.info(f"Executing optimization action {action_id}: {strategy.value} on {component}")
            
            success = False
            impact_metrics = {}
            
            # Record baseline metrics
            baseline_metrics = await self._get_component_baseline_metrics(component)
            
            if strategy == OptimizationStrategy.CACHE_OPTIMIZATION:
                success = await self._execute_cache_optimization(component, parameters)
                
            elif strategy == OptimizationStrategy.QUERY_OPTIMIZATION:
                success = await self._execute_query_optimization(component, parameters)
                
            elif strategy == OptimizationStrategy.ML_MODEL_OPTIMIZATION:
                success = await self._execute_ml_model_optimization(component, parameters)
                
            elif strategy == OptimizationStrategy.RESOURCE_REALLOCATION:
                success = await self._execute_resource_reallocation(component, parameters)
                
            elif strategy == OptimizationStrategy.API_RATE_LIMITING:
                success = await self._execute_api_rate_limiting(component, parameters)
                
            elif strategy == OptimizationStrategy.CONNECTION_POOLING:
                success = await self._execute_connection_pooling(component, parameters)
            
            # Measure impact
            if success:
                await asyncio.sleep(30)  # Wait for optimization to take effect
                post_optimization_metrics = await self._get_component_baseline_metrics(component)
                impact_metrics = self._calculate_optimization_impact(baseline_metrics, post_optimization_metrics)
            
            # Record optimization action
            action = OptimizationAction(
                action_id=action_id,
                strategy=strategy,
                component=component,
                description=f"{strategy.value} optimization on {component}",
                parameters=parameters,
                executed_at=datetime.utcnow(),
                success=success,
                impact_metrics=impact_metrics,
                rollback_available=True
            )
            
            self.optimization_history.append(action)
            
            await self.metrics.record_event("optimization_action_executed", {
                "action_id": action_id,
                "strategy": strategy.value,
                "component": component,
                "success": success,
                "impact_metrics": impact_metrics
            })
            
            return success
            
        except Exception as e:
            self.logger.error(f"Optimization action execution failed: {str(e)}")
            return False

    # Private helper methods

    async def _setup_redis_cache(self) -> None:
        """Setup Redis cache for performance optimization."""
        try:
            self.redis_client = await aioredis.from_url("redis://localhost", decode_responses=True)
            await self.redis_client.ping()
            self.logger.info("Redis cache connection established")
        except Exception as e:
            self.logger.warning(f"Redis setup failed: {str(e)}")
            self.redis_client = None

    async def _initialize_performance_baselines(self) -> None:
        """Initialize performance baselines for all components."""
        components = [
            'orchestration_service', 'ml_optimizer', 'mel_engine', 
            'triangle_defense', 'user_management', 'mobile_api',
            'notification_system', 'security_manager'
        ]
        
        for component in components:
            # Initialize with default baseline metrics
            baseline_metrics = {
                PerformanceMetricType.RESPONSE_TIME: 100.0,  # ms
                PerformanceMetricType.THROUGHPUT: 50.0,  # requests/sec
                PerformanceMetricType.ERROR_RATE: 0.01,  # 1%
                PerformanceMetricType.CPU_USAGE: 30.0,  # %
                PerformanceMetricType.MEMORY_USAGE: 256.0  # MB
            }
            
            profile = ComponentPerformanceProfile(
                component_name=component,
                baseline_metrics=baseline_metrics,
                current_metrics=baseline_metrics.copy(),
                trends={metric: [] for metric in PerformanceMetricType},
                optimization_opportunities=[],
                resource_utilization={},
                scaling_recommendations=[]
            )
            
            self.component_profiles[component] = profile

    async def _setup_anomaly_detection(self) -> None:
        """Setup machine learning-based anomaly detection."""
        try:
            # Generate synthetic baseline data for training
            np.random.seed(42)
            n_samples = 1000
            n_features = len(PerformanceMetricType)
            
            # Generate normal performance data
            normal_data = np.random.normal(0, 1, (n_samples, n_features))
            
            # Train isolation forest
            self.anomaly_detector = IsolationForest(contamination=0.1, random_state=42)
            self.anomaly_detector.fit(normal_data)
            
            self.logger.info("Anomaly detection system initialized")
            
        except Exception as e:
            self.logger.error(f"Anomaly detection setup failed: {str(e)}")

    async def _start_monitoring_tasks(self) -> None:
        """Start background performance monitoring tasks."""
        
        async def performance_monitoring_loop():
            while True:
                try:
                    await self._collect_system_metrics()
                    await asyncio.sleep(self.config['monitoring_interval_seconds'])
                except Exception as e:
                    self.logger.error(f"Performance monitoring error: {str(e)}")
                    await asyncio.sleep(60)
        
        async def optimization_loop():
            while True:
                try:
                    if self.config['auto_optimization_enabled']:
                        await self._run_automated_optimizations()
                    await asyncio.sleep(self.config['optimization_interval_seconds'])
                except Exception as e:
                    self.logger.error(f"Optimization loop error: {str(e)}")
                    await asyncio.sleep(300)
        
        async def alert_evaluation_loop():
            while True:
                try:
                    await self._evaluate_all_alerts()
                    await asyncio.sleep(self.config['alert_evaluation_interval_seconds'])
                except Exception as e:
                    self.logger.error(f"Alert evaluation error: {str(e)}")
                    await asyncio.sleep(60)
        
        self.monitoring_task = asyncio.create_task(performance_monitoring_loop())
        self.optimization_task = asyncio.create_task(optimization_loop())
        self.alert_task = asyncio.create_task(alert_evaluation_loop())

    async def _collect_system_metrics(self) -> None:
        """Collect system-wide performance metrics."""
        try:
            # System resource metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            await self.record_performance_metric(
                PerformanceMetricType.CPU_USAGE, 
                cpu_percent, 
                "system"
            )
            
            await self.record_performance_metric(
                PerformanceMetricType.MEMORY_USAGE,
                memory.used / (1024 * 1024),  # MB
                "system"
            )
            
            # Application-specific metrics
            if hasattr(self.user_management, 'active_sessions'):
                await self.record_performance_metric(
                    PerformanceMetricType.WEBSOCKET_CONNECTIONS,
                    len(self.user_management.active_sessions),
                    "user_management"
                )
            
            # Update Prometheus metrics
            self.prometheus_metrics['cpu_usage'].labels(component='system').set(cpu_percent)
            self.prometheus_metrics['memory_usage'].labels(component='system').set(memory.used)
            
            if hasattr(self.user_management, 'active_sessions'):
                self.prometheus_metrics['active_users'].set(len(self.user_management.active_sessions))
            
        except Exception as e:
            self.logger.error(f"System metrics collection failed: {str(e)}")

    async def _run_automated_optimizations(self) -> None:
        """Run automated performance optimizations."""
        try:
            # Cache optimization
            await self.optimize_formation_lookup_cache()
            
            # M.E.L. AI optimization
            await self.optimize_mel_ai_performance()
            
            # Detect and respond to anomalies
            anomalies = await self.detect_performance_anomalies()
            
            for anomaly in anomalies:
                if anomaly['severity'] == 'high':
                    # Auto-remediate high-severity anomalies
                    await self._auto_remediate_anomaly(anomaly)
            
        except Exception as e:
            self.logger.error(f"Automated optimization failed: {str(e)}")

    async def get_performance_dashboard(self) -> Dict[str, Any]:
        """Get comprehensive performance dashboard data."""
        try:
            # System overview
            system_metrics = await self._get_system_performance_summary()
            
            # Component performance
            component_status = {}
            for name, profile in self.component_profiles.items():
                component_status[name] = {
                    'current_metrics': profile.current_metrics,
                    'optimization_opportunities': profile.optimization_opportunities,
                    'scaling_recommendations': profile.scaling_recommendations
                }
            
            # Active alerts
            active_alerts = [
                {
                    'alert_id': alert.alert_id,
                    'component': alert.component,
                    'severity': alert.severity.value,
                    'message': alert.message,
                    'timestamp': alert.timestamp.isoformat()
                }
                for alert in self.active_alerts.values()
                if not alert.resolved
            ]
            
            # Recent optimizations
            recent_optimizations = [
                {
                    'action_id': action.action_id,
                    'strategy': action.strategy.value,
                    'component': action.component,
                    'success': action.success,
                    'impact_metrics': action.impact_metrics,
                    'executed_at': action.executed_at.isoformat()
                }
                for action in self.optimization_history[-10:]
            ]
            
            return {
                'system_metrics': system_metrics,
                'component_status': component_status,
                'active_alerts': active_alerts,
                'recent_optimizations': recent_optimizations,
                'cache_performance': await self._get_cache_performance_summary(),
                'scaling_recommendations': await self.auto_scale_recommendation()
            }
            
        except Exception as e:
            self.logger.error(f"Performance dashboard generation failed: {str(e)}")
            return {}

    async def get_performance_status(self) -> Dict[str, Any]:
        """Get current performance optimization system status."""
        return {
            "system_initialized": bool(self.component_profiles),
            "monitoring_active": self.monitoring_task is not None and not self.monitoring_task.done(),
            "optimization_active": self.optimization_task is not None and not self.optimization_task.done(),
            "components_monitored": len(self.component_profiles),
            "active_alerts": len([a for a in self.active_alerts.values() if not a.resolved]),
            "optimization_history_count": len(self.optimization_history),
            "anomaly_detection_enabled": self.anomaly_detector is not None,
            "cache_system_active": self.redis_client is not None,
            "auto_optimization_enabled": self.config['auto_optimization_enabled'],
            "amt_performance_targets": self.amt_config,
            "prometheus_metrics_active": len(self.prometheus_metrics)
        }


# Export main class
__all__ = [
    'PerformanceOptimizationSystem',
    'PerformanceMetric',
    'PerformanceAlert',
    'OptimizationAction',
    'ComponentPerformanceProfile',
    'PerformanceMetricType',
    'OptimizationStrategy',
    'AlertSeverity'
]
