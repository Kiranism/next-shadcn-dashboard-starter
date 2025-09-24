"""
AMT Metrics Collector
Comprehensive performance monitoring and analytics for orchestration system
"""

import asyncio
import time
import logging
import psutil
import json
from typing import Dict, List, Optional, Any, Callable, Set
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict, field
from enum import Enum
from collections import deque, defaultdict
import statistics

from ..shared.orchestration_protocol import (
    BotType, TaskStatus, BotResponse, HealthCheck
)

logger = logging.getLogger(__name__)

class MetricType(str, Enum):
    """Types of metrics collected"""
    COUNTER = "counter"           # Incrementing values
    GAUGE = "gauge"              # Point-in-time values
    HISTOGRAM = "histogram"      # Distribution of values
    TIMING = "timing"            # Duration measurements
    RATE = "rate"                # Events per time period

class MetricScope(str, Enum):
    """Scope of metrics"""
    SYSTEM = "system"            # System-wide metrics
    SESSION = "session"          # Per-session metrics
    BOT = "bot"                  # Per-bot metrics
    USER = "user"               # Per-user metrics
    FEATURE = "feature"         # Feature-specific metrics

@dataclass
class MetricPoint:
    """Individual metric data point"""
    name: str
    value: float
    timestamp: datetime
    metric_type: MetricType
    scope: MetricScope
    tags: Dict[str, str] = field(default_factory=dict)
    labels: Dict[str, str] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "value": self.value,
            "timestamp": self.timestamp.isoformat(),
            "type": self.metric_type,
            "scope": self.scope,
            "tags": self.tags,
            "labels": self.labels
        }

@dataclass
class MetricSummary:
    """Statistical summary of metric values"""
    name: str
    count: int
    sum: float
    min: float
    max: float
    mean: float
    median: float
    p95: float
    p99: float
    std_dev: float
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

class TimeSeries:
    """Time series data structure for metrics"""
    
    def __init__(self, max_points: int = 1440):  # 24 hours of minutes
        self.max_points = max_points
        self.points: deque = deque(maxlen=max_points)
        self.last_cleanup = datetime.now()
    
    def add_point(self, value: float, timestamp: Optional[datetime] = None):
        """Add a data point to the time series"""
        if timestamp is None:
            timestamp = datetime.now()
        
        self.points.append((timestamp, value))
        
        # Periodic cleanup of old points
        if datetime.now() - self.last_cleanup > timedelta(minutes=5):
            self._cleanup_old_points()
    
    def _cleanup_old_points(self):
        """Remove points older than retention period"""
        cutoff = datetime.now() - timedelta(hours=24)
        
        while self.points and self.points[0][0] < cutoff:
            self.points.popleft()
        
        self.last_cleanup = datetime.now()
    
    def get_values(self, since: Optional[datetime] = None) -> List[float]:
        """Get values since specified time"""
        if since is None:
            return [point[1] for point in self.points]
        
        return [point[1] for point in self.points if point[0] >= since]
    
    def get_latest(self) -> Optional[float]:
        """Get most recent value"""
        return self.points[-1][1] if self.points else None
    
    def get_average(self, since: Optional[datetime] = None) -> Optional[float]:
        """Get average value since specified time"""
        values = self.get_values(since)
        return statistics.mean(values) if values else None
    
    def get_summary(self, since: Optional[datetime] = None) -> Optional[Dict[str, float]]:
        """Get statistical summary"""
        values = self.get_values(since)
        
        if not values:
            return None
        
        return {
            "count": len(values),
            "sum": sum(values),
            "min": min(values),
            "max": max(values),
            "mean": statistics.mean(values),
            "median": statistics.median(values) if len(values) > 1 else values[0],
            "std_dev": statistics.stdev(values) if len(values) > 1 else 0.0
        }

class MetricsCollector:
    """Comprehensive metrics collection and analysis system"""
    
    def __init__(
        self,
        session_manager=None,
        orchestrator=None,
        realtime_coordinator=None,
        config_manager=None
    ):
        self.session_manager = session_manager
        self.orchestrator = orchestrator
        self.realtime_coordinator = realtime_coordinator
        self.config_manager = config_manager
        
        # Metrics storage
        self.metric_points: List[MetricPoint] = []
        self.time_series: Dict[str, TimeSeries] = {}
        self.counters: Dict[str, int] = defaultdict(int)
        self.gauges: Dict[str, float] = {}
        self.histograms: Dict[str, List[float]] = defaultdict(list)
        
        # System monitoring
        self.system_metrics_enabled = True
        self.collection_interval = 60  # seconds
        self.retention_hours = 24
        
        # Performance tracking
        self.bot_performance: Dict[BotType, Dict[str, Any]] = {}
        self.session_metrics: Dict[str, Dict[str, Any]] = {}
        self.user_metrics: Dict[str, Dict[str, Any]] = {}
        
        # Alerting thresholds
        self.alert_thresholds = {
            "cpu_usage": 80.0,
            "memory_usage": 85.0,
            "disk_usage": 90.0,
            "error_rate": 10.0,
            "response_time_p95": 5000.0,  # milliseconds
            "session_failure_rate": 15.0
        }
        
        # Background tasks
        self._collection_tasks: List[asyncio.Task] = []
        self._system_monitor_task: Optional[asyncio.Task] = None
        self._metrics_aggregator_task: Optional[asyncio.Task] = None
        self._alert_processor_task: Optional[asyncio.Task] = None
        
        # Callbacks for alerts and reporting
        self.alert_callbacks: List[Callable] = []
        self.report_callbacks: List[Callable] = []
        
        # Feature flags
        self.enable_detailed_timing = True
        self.enable_bot_performance_tracking = True
        self.enable_user_analytics = True
        self.enable_predictive_alerts = True
    
    async def initialize(self):
        """Initialize metrics collection system"""
        
        # Load configuration
        if self.config_manager and self.config_manager.config:
            config = self.config_manager.config.monitoring
            self.system_metrics_enabled = config.enabled
            
            # Update collection settings based on config
            if hasattr(config, 'collection_interval_seconds'):
                self.collection_interval = config.collection_interval_seconds
        
        # Start background collection tasks
        self._system_monitor_task = asyncio.create_task(self._system_monitor())
        self._metrics_aggregator_task = asyncio.create_task(self._metrics_aggregator())
        self._alert_processor_task = asyncio.create_task(self._alert_processor())
        
        self._collection_tasks.extend([
            self._system_monitor_task,
            self._metrics_aggregator_task,
            self._alert_processor_task
        ])
        
        # Register with other components
        if self.session_manager:
            self.session_manager.add_global_session_callback(self._on_session_event)
        
        logger.info("Metrics collector initialized")
    
    def record_metric(
        self,
        name: str,
        value: float,
        metric_type: MetricType,
        scope: MetricScope,
        tags: Dict[str, str] = None,
        labels: Dict[str, str] = None,
        timestamp: Optional[datetime] = None
    ):
        """Record a metric data point"""
        
        if timestamp is None:
            timestamp = datetime.now()
        
        metric_point = MetricPoint(
            name=name,
            value=value,
            timestamp=timestamp,
            metric_type=metric_type,
            scope=scope,
            tags=tags or {},
            labels=labels or {}
        )
        
        # Store metric point
        self.metric_points.append(metric_point)
        
        # Update appropriate storage based on metric type
        metric_key = f"{scope}.{name}"
        
        if metric_type == MetricType.COUNTER:
            self.counters[metric_key] += value
        elif metric_type == MetricType.GAUGE:
            self.gauges[metric_key] = value
        elif metric_type == MetricType.HISTOGRAM or metric_type == MetricType.TIMING:
            self.histograms[metric_key].append(value)
            
            # Limit histogram size
            if len(self.histograms[metric_key]) > 10000:
                self.histograms[metric_key] = self.histograms[metric_key][-5000:]
        
        # Update time series
        if metric_key not in self.time_series:
            self.time_series[metric_key] = TimeSeries()
        
        self.time_series[metric_key].add_point(value, timestamp)
        
        # Clean up old metric points periodically
        if len(self.metric_points) > 100000:
            cutoff = datetime.now() - timedelta(hours=self.retention_hours)
            self.metric_points = [
                point for point in self.metric_points 
                if point.timestamp > cutoff
            ]
    
    def increment_counter(
        self,
        name: str,
        scope: MetricScope,
        increment: float = 1.0,
        tags: Dict[str, str] = None
    ):
        """Increment a counter metric"""
        
        self.record_metric(
            name=name,
            value=increment,
            metric_type=MetricType.COUNTER,
            scope=scope,
            tags=tags
        )
    
    def set_gauge(
        self,
        name: str,
        value: float,
        scope: MetricScope,
        tags: Dict[str, str] = None
    ):
        """Set a gauge metric"""
        
        self.record_metric(
            name=name,
            value=value,
            metric_type=MetricType.GAUGE,
            scope=scope,
            tags=tags
        )
    
    def record_timing(
        self,
        name: str,
        duration_ms: float,
        scope: MetricScope,
        tags: Dict[str, str] = None
    ):
        """Record a timing metric"""
        
        self.record_metric(
            name=name,
            value=duration_ms,
            metric_type=MetricType.TIMING,
            scope=scope,
            tags=tags
        )
    
    def record_histogram(
        self,
        name: str,
        value: float,
        scope: MetricScope,
        tags: Dict[str, str] = None
    ):
        """Record a histogram metric"""
        
        self.record_metric(
            name=name,
            value=value,
            metric_type=MetricType.HISTOGRAM,
            scope=scope,
            tags=tags
        )
    
    def time_function(self, metric_name: str, scope: MetricScope, tags: Dict[str, str] = None):
        """Decorator to time function execution"""
        
        def decorator(func):
            async def async_wrapper(*args, **kwargs):
                start_time = time.time()
                try:
                    result = await func(*args, **kwargs)
                    success = True
                except Exception as e:
                    success = False
                    raise
                finally:
                    duration_ms = (time.time() - start_time) * 1000
                    timing_tags = (tags or {}).copy()
                    timing_tags["success"] = str(success)
                    timing_tags["function"] = func.__name__
                    
                    self.record_timing(metric_name, duration_ms, scope, timing_tags)
                
                return result
            
            def sync_wrapper(*args, **kwargs):
                start_time = time.time()
                try:
                    result = func(*args, **kwargs)
                    success = True
                except Exception as e:
                    success = False
                    raise
                finally:
                    duration_ms = (time.time() - start_time) * 1000
                    timing_tags = (tags or {}).copy()
                    timing_tags["success"] = str(success)
                    timing_tags["function"] = func.__name__
                    
                    self.record_timing(metric_name, duration_ms, scope, timing_tags)
                
                return result
            
            return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper
        
        return decorator
    
    async def record_bot_performance(
        self,
        bot_type: BotType,
        task_type: str,
        response: BotResponse
    ):
        """Record bot performance metrics"""
        
        if not self.enable_bot_performance_tracking:
            return
        
        # Initialize bot metrics if needed
        if bot_type not in self.bot_performance:
            self.bot_performance[bot_type] = {
                "total_tasks": 0,
                "successful_tasks": 0,
                "failed_tasks": 0,
                "total_execution_time": 0.0,
                "task_types": defaultdict(int),
                "response_times": [],
                "confidence_scores": []
            }
        
        bot_metrics = self.bot_performance[bot_type]
        
        # Update bot metrics
        bot_metrics["total_tasks"] += 1
        bot_metrics["task_types"][task_type] += 1
        bot_metrics["total_execution_time"] += response.execution_time_seconds
        bot_metrics["response_times"].append(response.execution_time_seconds)
        bot_metrics["confidence_scores"].append(response.confidence_score)
        
        # Limit list sizes
        if len(bot_metrics["response_times"]) > 1000:
            bot_metrics["response_times"] = bot_metrics["response_times"][-500:]
        if len(bot_metrics["confidence_scores"]) > 1000:
            bot_metrics["confidence_scores"] = bot_metrics["confidence_scores"][-500:]
        
        if response.status == TaskStatus.COMPLETED:
            bot_metrics["successful_tasks"] += 1
        else:
            bot_metrics["failed_tasks"] += 1
        
        # Record individual metrics
        tags = {"bot_type": bot_type, "task_type": task_type}
        
        self.record_timing(
            "bot_response_time",
            response.execution_time_seconds * 1000,
            MetricScope.BOT,
            tags
        )
        
        self.record_histogram(
            "bot_confidence_score",
            response.confidence_score,
            MetricScope.BOT,
            tags
        )
        
        self.increment_counter(
            "bot_tasks_total",
            MetricScope.BOT,
            tags=tags
        )
        
        if response.status == TaskStatus.COMPLETED:
            self.increment_counter(
                "bot_tasks_successful",
                MetricScope.BOT,
                tags=tags
            )
        else:
            self.increment_counter(
                "bot_tasks_failed",
                MetricScope.BOT,
                tags=tags
            )
    
    async def record_session_metrics(
        self,
        session_id: str,
        user_id: str,
        metrics: Dict[str, Any]
    ):
        """Record session-level metrics"""
        
        # Store session metrics
        self.session_metrics[session_id] = {
            "user_id": user_id,
            "metrics": metrics,
            "recorded_at": datetime.now()
        }
        
        # Record individual metrics
        tags = {"session_id": session_id, "user_id": user_id}
        
        for metric_name, value in metrics.items():
            if isinstance(value, (int, float)):
                self.record_histogram(
                    f"session_{metric_name}",
                    float(value),
                    MetricScope.SESSION,
                    tags
                )
        
        # Update user metrics
        if self.enable_user_analytics:
            await self._update_user_metrics(user_id, metrics)
    
    async def _update_user_metrics(self, user_id: str, session_metrics: Dict[str, Any]):
        """Update user-level metrics"""
        
        if user_id not in self.user_metrics:
            self.user_metrics[user_id] = {
                "total_sessions": 0,
                "successful_sessions": 0,
                "failed_sessions": 0,
                "total_execution_time": 0.0,
                "avg_session_success_rate": 0.0,
                "last_activity": datetime.now()
            }
        
        user_data = self.user_metrics[user_id]
        user_data["total_sessions"] += 1
        user_data["last_activity"] = datetime.now()
        
        # Update based on session success
        session_success_rate = session_metrics.get("success_rate", 0.0)
        if session_success_rate > 0.8:
            user_data["successful_sessions"] += 1
        else:
            user_data["failed_sessions"] += 1
        
        # Update execution time
        execution_time = session_metrics.get("execution_time_seconds", 0.0)
        user_data["total_execution_time"] += execution_time
        
        # Recalculate average success rate
        total_sessions = user_data["total_sessions"]
        user_data["avg_session_success_rate"] = (
            user_data["successful_sessions"] / total_sessions if total_sessions > 0 else 0.0
        )
        
        # Record user metrics
        tags = {"user_id": user_id}
        
        self.increment_counter(
            "user_sessions_total",
            MetricScope.USER,
            tags=tags
        )
        
        self.set_gauge(
            "user_avg_success_rate",
            user_data["avg_session_success_rate"],
            MetricScope.USER,
            tags
        )
    
    async def _system_monitor(self):
        """Background task for system metrics collection"""
        
        while True:
            try:
                if not self.system_metrics_enabled:
                    await asyncio.sleep(self.collection_interval)
                    continue
                
                # CPU metrics
                cpu_percent = psutil.cpu_percent(interval=1)
                self.set_gauge("cpu_usage_percent", cpu_percent, MetricScope.SYSTEM)
                
                # Memory metrics
                memory = psutil.virtual_memory()
                self.set_gauge("memory_usage_percent", memory.percent, MetricScope.SYSTEM)
                self.set_gauge("memory_available_gb", memory.available / (1024**3), MetricScope.SYSTEM)
                
                # Disk metrics
                disk = psutil.disk_usage('/')
                disk_percent = (disk.used / disk.total) * 100
                self.set_gauge("disk_usage_percent", disk_percent, MetricScope.SYSTEM)
                self.set_gauge("disk_free_gb", disk.free / (1024**3), MetricScope.SYSTEM)
                
                # Network metrics
                network = psutil.net_io_counters()
                self.set_gauge("network_bytes_sent", network.bytes_sent, MetricScope.SYSTEM)
                self.set_gauge("network_bytes_received", network.bytes_recv, MetricScope.SYSTEM)
                
                # Process metrics
                process = psutil.Process()
                self.set_gauge("process_cpu_percent", process.cpu_percent(), MetricScope.SYSTEM)
                self.set_gauge("process_memory_mb", process.memory_info().rss / (1024**2), MetricScope.SYSTEM)
                
                # Active sessions
                if self.session_manager:
                    active_count = len(self.session_manager.active_sessions)
                    self.set_gauge("active_sessions_count", active_count, MetricScope.SYSTEM)
                
                await asyncio.sleep(self.collection_interval)
                
            except Exception as e:
                logger.error(f"System monitor error: {str(e)}")
                await asyncio.sleep(self.collection_interval)
    
    async def _metrics_aggregator(self):
        """Background task for metrics aggregation and calculation"""
        
        while True:
            try:
                await asyncio.sleep(300)  # Run every 5 minutes
                
                # Calculate bot performance summaries
                for bot_type, metrics in self.bot_performance.items():
                    if metrics["response_times"]:
                        # Calculate percentiles
                        response_times = sorted(metrics["response_times"])
                        p50 = response_times[len(response_times) // 2]
                        p95 = response_times[int(len(response_times) * 0.95)]
                        p99 = response_times[int(len(response_times) * 0.99)]
                        
                        tags = {"bot_type": bot_type}
                        self.set_gauge("bot_response_time_p50", p50 * 1000, MetricScope.BOT, tags)
                        self.set_gauge("bot_response_time_p95", p95 * 1000, MetricScope.BOT, tags)
                        self.set_gauge("bot_response_time_p99", p99 * 1000, MetricScope.BOT, tags)
                        
                        # Success rate
                        success_rate = (
                            metrics["successful_tasks"] / max(metrics["total_tasks"], 1) * 100
                        )
                        self.set_gauge("bot_success_rate", success_rate, MetricScope.BOT, tags)
                
                # Calculate system-wide aggregations
                await self._calculate_system_aggregations()
                
            except Exception as e:
                logger.error(f"Metrics aggregator error: {str(e)}")
    
    async def _calculate_system_aggregations(self):
        """Calculate system-wide metric aggregations"""
        
        current_time = datetime.now()
        last_hour = current_time - timedelta(hours=1)
        
        # Session metrics aggregations
        recent_sessions = [
            session for session in self.session_metrics.values()
            if session["recorded_at"] > last_hour
        ]
        
        if recent_sessions:
            # Average session success rate
            success_rates = [
                session["metrics"].get("success_rate", 0.0)
                for session in recent_sessions
            ]
            avg_success_rate = statistics.mean(success_rates)
            self.set_gauge("system_avg_session_success_rate", avg_success_rate, MetricScope.SYSTEM)
            
            # Session throughput
            session_count = len(recent_sessions)
            self.set_gauge("system_sessions_per_hour", session_count, MetricScope.SYSTEM)
        
        # Error rate calculations
        error_count = self.counters.get("system.errors_total", 0)
        total_operations = self.counters.get("system.operations_total", 1)
        error_rate = (error_count / total_operations) * 100
        self.set_gauge("system_error_rate", error_rate, MetricScope.SYSTEM)
    
    async def _alert_processor(self):
        """Background task for processing alerts based on metrics"""
        
        while True:
            try:
                await asyncio.sleep(60)  # Check every minute
                
                alerts = []
                
                # Check system resource alerts
                cpu_usage = self.gauges.get("system.cpu_usage_percent", 0)
                if cpu_usage > self.alert_thresholds["cpu_usage"]:
                    alerts.append({
                        "type": "resource_alert",
                        "metric": "cpu_usage",
                        "value": cpu_usage,
                        "threshold": self.alert_thresholds["cpu_usage"],
                        "severity": "high" if cpu_usage > 90 else "medium"
                    })
                
                memory_usage = self.gauges.get("system.memory_usage_percent", 0)
                if memory_usage > self.alert_thresholds["memory_usage"]:
                    alerts.append({
                        "type": "resource_alert",
                        "metric": "memory_usage",
                        "value": memory_usage,
                        "threshold": self.alert_thresholds["memory_usage"],
                        "severity": "high" if memory_usage > 95 else "medium"
                    })
                
                # Check performance alerts
                error_rate = self.gauges.get("system.system_error_rate", 0)
                if error_rate > self.alert_thresholds["error_rate"]:
                    alerts.append({
                        "type": "performance_alert",
                        "metric": "error_rate",
                        "value": error_rate,
                        "threshold": self.alert_thresholds["error_rate"],
                        "severity": "high"
                    })
                
                # Check bot performance alerts
                for bot_type in BotType:
                    bot_key = f"bot.bot_response_time_p95"
                    p95_response_time = self.gauges.get(bot_key, 0)
                    
                    if p95_response_time > self.alert_thresholds["response_time_p95"]:
                        alerts.append({
                            "type": "bot_performance_alert",
                            "metric": "response_time_p95",
                            "bot_type": bot_type,
                            "value": p95_response_time,
                            "threshold": self.alert_thresholds["response_time_p95"],
                            "severity": "medium"
                        })
                
                # Process alerts
                for alert in alerts:
                    await self._process_alert(alert)
                
            except Exception as e:
                logger.error(f"Alert processor error: {str(e)}")
    
    async def _process_alert(self, alert: Dict[str, Any]):
        """Process and dispatch an alert"""
        
        alert["timestamp"] = datetime.now().isoformat()
        alert["id"] = f"alert_{int(time.time())}_{alert['metric']}"
        
        logger.warning(f"Alert triggered: {alert}")
        
        # Record alert as metric
        self.increment_counter(
            "alerts_triggered",
            MetricScope.SYSTEM,
            tags={"type": alert["type"], "severity": alert.get("severity", "unknown")}
        )
        
        # Notify callbacks
        for callback in self.alert_callbacks:
            try:
                await callback(alert)
            except Exception as e:
                logger.error(f"Alert callback failed: {str(e)}")
        
        # Send to real-time coordinator
        if self.realtime_coordinator:
            await self.realtime_coordinator.notify_error(
                "system",
                {
                    "type": "metrics_alert",
                    "alert": alert
                },
                priority=4 if alert.get("severity") == "high" else 3
            )
    
    async def _on_session_event(self, event_type: str, session):
        """Handle session events for metrics"""
        
        if event_type == "session_archived":
            # Record final session metrics
            await self.record_session_metrics(
                session.session_id,
                session.context.user_id,
                {
                    "success_rate": session.metrics.success_rate,
                    "execution_time_seconds": session.metrics.execution_time_seconds,
                    "completed_tasks": session.metrics.completed_tasks,
                    "failed_tasks": session.metrics.failed_tasks,
                    "knowledge_contributions": session.metrics.knowledge_contributions,
                    "errors_encountered": session.metrics.errors_encountered,
                    "errors_recovered": session.metrics.errors_recovered
                }
            )
    
    def get_metric_summary(
        self,
        metric_name: str,
        scope: MetricScope,
        since: Optional[datetime] = None
    ) -> Optional[MetricSummary]:
        """Get statistical summary for a metric"""
        
        metric_key = f"{scope}.{metric_name}"
        
        if metric_key not in self.time_series:
            return None
        
        summary_data = self.time_series[metric_key].get_summary(since)
        
        if not summary_data:
            return None
        
        # Calculate percentiles for timing/histogram metrics
        values = self.time_series[metric_key].get_values(since)
        sorted_values = sorted(values)
        
        p95 = sorted_values[int(len(sorted_values) * 0.95)] if sorted_values else 0.0
        p99 = sorted_values[int(len(sorted_values) * 0.99)] if sorted_values else 0.0
        
        return MetricSummary(
            name=metric_name,
            count=summary_data["count"],
            sum=summary_data["sum"],
            min=summary_data["min"],
            max=summary_data["max"],
            mean=summary_data["mean"],
            median=summary_data["median"],
            p95=p95,
            p99=p99,
            std_dev=summary_data["std_dev"]
        )
    
    def get_bot_performance_report(self, bot_type: BotType) -> Dict[str, Any]:
        """Get comprehensive bot performance report"""
        
        if bot_type not in self.bot_performance:
            return {"error": "No performance data available"}
        
        metrics = self.bot_performance[bot_type]
        
        # Calculate statistics
        response_times = metrics["response_times"]
        confidence_scores = metrics["confidence_scores"]
        
        report = {
            "bot_type": bot_type,
            "total_tasks": metrics["total_tasks"],
            "successful_tasks": metrics["successful_tasks"],
            "failed_tasks": metrics["failed_tasks"],
            "success_rate": metrics["successful_tasks"] / max(metrics["total_tasks"], 1),
            "task_distribution": dict(metrics["task_types"])
        }
        
        if response_times:
            sorted_times = sorted(response_times)
            report["response_times"] = {
                "mean": statistics.mean(response_times),
                "median": statistics.median(response_times),
                "p95": sorted_times[int(len(sorted_times) * 0.95)],
                "p99": sorted_times[int(len(sorted_times) * 0.99)],
                "min": min(response_times),
                "max": max(response_times)
            }
        
        if confidence_scores:
            report["confidence"] = {
                "mean": statistics.mean(confidence_scores),
                "median": statistics.median(confidence_scores),
                "min": min(confidence_scores),
                "max": max(confidence_scores)
            }
        
        return report
    
    def get_system_health_report(self) -> Dict[str, Any]:
        """Get comprehensive system health report"""
        
        return {
            "timestamp": datetime.now().isoformat(),
            "system_resources": {
                "cpu_usage": self.gauges.get("system.cpu_usage_percent", 0),
                "memory_usage": self.gauges.get("system.memory_usage_percent", 0),
                "disk_usage": self.gauges.get("system.disk_usage_percent", 0),
                "active_sessions": self.gauges.get("system.active_sessions_count", 0)
            },
            "performance_metrics": {
                "error_rate": self.gauges.get("system.system_error_rate", 0),
                "avg_session_success_rate": self.gauges.get("system.system_avg_session_success_rate", 0),
                "sessions_per_hour": self.gauges.get("system.system_sessions_per_hour", 0)
            },
            "bot_health": {
                bot_type: {
                    "success_rate": self.gauges.get(f"bot.bot_success_rate", 0),
                    "avg_response_time": self.gauges.get(f"bot.bot_response_time_p50", 0)
                }
                for bot_type in BotType
            },
            "alerts_summary": {
                "total_alerts": self.counters.get("system.alerts_triggered", 0)
            }
        }
    
    def add_alert_callback(self, callback: Callable):
        """Add alert callback"""
        self.alert_callbacks.append(callback)
    
    def remove_alert_callback(self, callback: Callable):
        """Remove alert callback"""
        if callback in self.alert_callbacks:
            self.alert_callbacks.remove(callback)
    
    def set_alert_threshold(self, metric_name: str, threshold: float):
        """Set alert threshold for metric"""
        self.alert_thresholds[metric_name] = threshold
    
    async def export_metrics(self, format_type: str = "json") -> str:
        """Export metrics in specified format"""
        
        if format_type == "json":
            return json.dumps({
                "timestamp": datetime.now().isoformat(),
                "counters": dict(self.counters),
                "gauges": self.gauges,
                "bot_performance": {str(k): v for k, v in self.bot_performance.items()},
                "session_count": len(self.session_metrics),
                "user_count": len(self.user_metrics)
            }, indent=2, default=str)
        
        elif format_type == "prometheus":
            # Export in Prometheus format
            lines = []
            
            for name, value in self.gauges.items():
                prometheus_name = name.replace(".", "_")
                lines.append(f"{prometheus_name} {value}")
            
            for name, value in self.counters.items():
                prometheus_name = name.replace(".", "_")
                lines.append(f"{prometheus_name}_total {value}")
            
            return "\n".join(lines)
        
        else:
            raise ValueError(f"Unsupported export format: {format_type}")
    
    async def shutdown(self):
        """Shutdown metrics collector"""
        
        logger.info("Shutting down metrics collector...")
        
        # Cancel background tasks
        for task in self._collection_tasks:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
        
        # Clear callbacks and data
        self.alert_callbacks.clear()
        self.report_callbacks.clear()
        
        logger.info("Metrics collector shutdown complete")
