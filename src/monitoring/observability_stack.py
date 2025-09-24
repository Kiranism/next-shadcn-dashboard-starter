"""
AMT Observability Stack
Comprehensive monitoring, logging, tracing, and alerting system for orchestration platform
"""

import asyncio
import logging
import json
import time
from typing import Dict, List, Optional, Any, Union, Callable
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
from pathlib import Path
import uuid
from contextlib import asynccontextmanager
import threading
from collections import defaultdict, deque

# Observability libraries
try:
    from prometheus_client import Counter, Histogram, Gauge, Summary, CollectorRegistry, generate_latest
    from prometheus_client.openmetrics.exposition import CONTENT_TYPE_LATEST
    PROMETHEUS_AVAILABLE = True
except ImportError:
    logging.warning("Prometheus client not available - metrics collection will be limited")
    PROMETHEUS_AVAILABLE = False

try:
    import opentelemetry
    from opentelemetry import trace, metrics as otel_metrics
    from opentelemetry.exporter.jaeger.thrift import JaegerExporter
    from opentelemetry.exporter.prometheus import PrometheusMetricReader
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import BatchSpanProcessor
    from opentelemetry.sdk.metrics import MeterProvider
    from opentelemetry.instrumentation.requests import RequestsInstrumentor
    from opentelemetry.instrumentation.asyncio import AsyncIOInstrumentor
    OPENTELEMETRY_AVAILABLE = True
except ImportError:
    logging.warning("OpenTelemetry not available - distributed tracing will be limited")
    OPENTELEMETRY_AVAILABLE = False

logger = logging.getLogger(__name__)

class MetricType(str, Enum):
    """Types of metrics collected"""
    COUNTER = "counter"
    GAUGE = "gauge"
    HISTOGRAM = "histogram"
    SUMMARY = "summary"

class LogLevel(str, Enum):
    """Log levels for structured logging"""
    TRACE = "trace"
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

class AlertSeverity(str, Enum):
    """Alert severity levels"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"

@dataclass
class MetricDefinition:
    """Definition of a metric to be collected"""
    name: str
    description: str
    metric_type: MetricType
    labels: List[str] = None
    buckets: List[float] = None  # For histograms
    namespace: str = "amt_orchestration"

@dataclass
class TraceSpan:
    """Distributed tracing span data"""
    span_id: str
    trace_id: str
    operation_name: str
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_ms: Optional[float] = None
    status: str = "ok"
    tags: Dict[str, Any] = None
    logs: List[Dict[str, Any]] = None
    parent_span_id: Optional[str] = None

@dataclass
class AlertRule:
    """Alert rule configuration"""
    name: str
    description: str
    metric_query: str
    threshold: float
    comparison: str  # "gt", "lt", "eq", "gte", "lte"
    duration: int  # seconds
    severity: AlertSeverity
    labels: Dict[str, str] = None
    annotations: Dict[str, str] = None
    enabled: bool = True

@dataclass
class Alert:
    """Active alert instance"""
    alert_id: str
    rule_name: str
    severity: AlertSeverity
    message: str
    current_value: float
    threshold: float
    started_at: datetime
    labels: Dict[str, str] = None
    annotations: Dict[str, str] = None
    resolved_at: Optional[datetime] = None

class ObservabilityStack:
    """Comprehensive observability stack for AMT orchestration"""
    
    def __init__(
        self,
        service_name: str = "amt-orchestration",
        environment: str = "production",
        jaeger_endpoint: Optional[str] = None,
        prometheus_port: int = 8080
    ):
        self.service_name = service_name
        self.environment = environment
        self.jaeger_endpoint = jaeger_endpoint
        self.prometheus_port = prometheus_port
        
        # Observability components
        self.tracer = None
        self.meter = None
        self.prometheus_registry = None
        
        # Metrics storage
        self.metrics: Dict[str, Any] = {}
        self.custom_metrics: Dict[str, MetricDefinition] = {}
        
        # Alerting
        self.alert_rules: Dict[str, AlertRule] = {}
        self.active_alerts: Dict[str, Alert] = {}
        self.alert_history: deque = deque(maxlen=10000)
        
        # Tracing
        self.active_spans: Dict[str, TraceSpan] = {}
        self.span_history: deque = deque(maxlen=50000)
        
        # Logging
        self.structured_logger = None
        self.log_buffer: deque = deque(maxlen=100000)
        
        # Performance tracking
        self.performance_counters = defaultdict(int)
        self.latency_histograms = defaultdict(list)
        
        # Background tasks
        self.monitoring_tasks: List[asyncio.Task] = []
        
        # Initialize core metrics
        self._initialize_core_metrics()
    
    def _initialize_core_metrics(self):
        """Initialize core system metrics"""
        
        core_metrics = [
            MetricDefinition(
                name="orchestration_requests_total",
                description="Total number of orchestration requests",
                metric_type=MetricType.COUNTER,
                labels=["bot_type", "status", "user_id"]
            ),
            MetricDefinition(
                name="orchestration_request_duration_seconds",
                description="Duration of orchestration requests",
                metric_type=MetricType.HISTOGRAM,
                labels=["bot_type", "status"],
                buckets=[0.1, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0, 60.0]
            ),
            MetricDefinition(
                name="active_sessions_count",
                description="Number of active orchestration sessions",
                metric_type=MetricType.GAUGE
            ),
            MetricDefinition(
                name="bot_response_time_seconds",
                description="Bot response time distribution",
                metric_type=MetricType.HISTOGRAM,
                labels=["bot_type", "task_type"],
                buckets=[0.1, 0.25, 0.5, 1.0, 2.0, 5.0, 10.0]
            ),
            MetricDefinition(
                name="knowledge_base_queries_total",
                description="Total knowledge base queries",
                metric_type=MetricType.COUNTER,
                labels=["query_type", "success"]
            ),
            MetricDefinition(
                name="external_api_calls_total",
                description="External API calls made",
                metric_type=MetricType.COUNTER,
                labels=["service", "endpoint", "status_code"]
            ),
            MetricDefinition(
                name="memory_usage_bytes",
                description="Memory usage in bytes",
                metric_type=MetricType.GAUGE
            ),
            MetricDefinition(
                name="cpu_usage_percent",
                description="CPU usage percentage",
                metric_type=MetricType.GAUGE
            ),
            MetricDefinition(
                name="error_rate_total",
                description="Total error rate",
                metric_type=MetricType.COUNTER,
                labels=["error_type", "component"]
            )
        ]
        
        for metric_def in core_metrics:
            self.custom_metrics[metric_def.name] = metric_def
    
    async def initialize(self) -> bool:
        """Initialize the observability stack"""
        
        try:
            # Initialize structured logging
            self._setup_structured_logging()
            
            # Initialize Prometheus metrics
            if PROMETHEUS_AVAILABLE:
                await self._setup_prometheus_metrics()
            
            # Initialize OpenTelemetry tracing
            if OPENTELEMETRY_AVAILABLE and self.jaeger_endpoint:
                await self._setup_opentelemetry_tracing()
            
            # Initialize alerting rules
            await self._setup_default_alert_rules()
            
            # Start background monitoring tasks
            await self._start_monitoring_tasks()
            
            logger.info("Observability stack initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize observability stack: {str(e)}")
            return False
    
    def _setup_structured_logging(self):
        """Setup structured JSON logging"""
        
        class StructuredFormatter(logging.Formatter):
            def format(self, record):
                log_entry = {
                    "timestamp": datetime.utcnow().isoformat(),
                    "level": record.levelname,
                    "logger": record.name,
                    "message": record.getMessage(),
                    "service": self.service_name,
                    "environment": self.environment
                }
                
                # Add extra fields if present
                if hasattr(record, 'user_id'):
                    log_entry["user_id"] = record.user_id
                if hasattr(record, 'session_id'):
                    log_entry["session_id"] = record.session_id
                if hasattr(record, 'trace_id'):
                    log_entry["trace_id"] = record.trace_id
                if hasattr(record, 'component'):
                    log_entry["component"] = record.component
                
                # Add exception info if present
                if record.exc_info:
                    log_entry["exception"] = self.formatException(record.exc_info)
                
                return json.dumps(log_entry)
        
        # Setup root logger with structured formatter
        handler = logging.StreamHandler()
        handler.setFormatter(StructuredFormatter())
        
        self.structured_logger = logging.getLogger("amt.structured")
        self.structured_logger.setLevel(logging.INFO)
        self.structured_logger.addHandler(handler)
        
        # Add log buffer handler
        buffer_handler = LogBufferHandler(self.log_buffer)
        self.structured_logger.addHandler(buffer_handler)
    
    async def _setup_prometheus_metrics(self):
        """Setup Prometheus metrics collection"""
        
        self.prometheus_registry = CollectorRegistry()
        
        # Create Prometheus metrics from definitions
        for name, metric_def in self.custom_metrics.items():
            labels = metric_def.labels or []
            
            if metric_def.metric_type == MetricType.COUNTER:
                metric = Counter(
                    name,
                    metric_def.description,
                    labels,
                    registry=self.prometheus_registry
                )
            elif metric_def.metric_type == MetricType.GAUGE:
                metric = Gauge(
                    name,
                    metric_def.description,
                    labels,
                    registry=self.prometheus_registry
                )
            elif metric_def.metric_type == MetricType.HISTOGRAM:
                buckets = metric_def.buckets or [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
                metric = Histogram(
                    name,
                    metric_def.description,
                    labels,
                    buckets=buckets,
                    registry=self.prometheus_registry
                )
            elif metric_def.metric_type == MetricType.SUMMARY:
                metric = Summary(
                    name,
                    metric_def.description,
                    labels,
                    registry=self.prometheus_registry
                )
            
            self.metrics[name] = metric
    
    async def _setup_opentelemetry_tracing(self):
        """Setup OpenTelemetry distributed tracing"""
        
        # Configure tracer provider
        trace.set_tracer_provider(TracerProvider())
        tracer_provider = trace.get_tracer_provider()
        
        # Configure Jaeger exporter
        jaeger_exporter = JaegerExporter(
            agent_host_name="localhost",
            agent_port=6831,
            collector_endpoint=self.jaeger_endpoint,
        )
        
        # Configure span processor
        span_processor = BatchSpanProcessor(jaeger_exporter)
        tracer_provider.add_span_processor(span_processor)
        
        # Get tracer
        self.tracer = trace.get_tracer(
            instrumenting_module_name="amt.orchestration",
            instrumenting_library_version="1.0.0"
        )
        
        # Auto-instrument common libraries
        RequestsInstrumentor().instrument()
        AsyncIOInstrumentor().instrument()
    
    async def _setup_default_alert_rules(self):
        """Setup default alerting rules"""
        
        default_rules = [
            AlertRule(
                name="high_error_rate",
                description="Error rate is above 5%",
                metric_query="rate(error_rate_total[5m]) > 0.05",
                threshold=0.05,
                comparison="gt",
                duration=300,
                severity=AlertSeverity.HIGH,
                labels={"team": "orchestration"},
                annotations={"summary": "High error rate detected"}
            ),
            AlertRule(
                name="high_response_time",
                description="95th percentile response time is above 5 seconds",
                metric_query="histogram_quantile(0.95, orchestration_request_duration_seconds) > 5.0",
                threshold=5.0,
                comparison="gt",
                duration=300,
                severity=AlertSeverity.MEDIUM,
                labels={"team": "orchestration"},
                annotations={"summary": "High response time detected"}
            ),
            AlertRule(
                name="memory_usage_high",
                description="Memory usage is above 80%",
                metric_query="memory_usage_bytes / 1073741824 > 0.8",
                threshold=0.8,
                comparison="gt",
                duration=600,
                severity=AlertSeverity.MEDIUM,
                labels={"team": "infrastructure"},
                annotations={"summary": "High memory usage detected"}
            ),
            AlertRule(
                name="active_sessions_spike",
                description="Active sessions count is unusually high",
                metric_query="active_sessions_count > 100",
                threshold=100,
                comparison="gt",
                duration=180,
                severity=AlertSeverity.HIGH,
                labels={"team": "orchestration"},
                annotations={"summary": "Unusual spike in active sessions"}
            )
        ]
        
        for rule in default_rules:
            self.alert_rules[rule.name] = rule
    
    async def _start_monitoring_tasks(self):
        """Start background monitoring tasks"""
        
        # System metrics collector
        system_task = asyncio.create_task(self._collect_system_metrics())
        self.monitoring_tasks.append(system_task)
        
        # Alert evaluator
        alert_task = asyncio.create_task(self._evaluate_alerts())
        self.monitoring_tasks.append(alert_task)
        
        # Cleanup task
        cleanup_task = asyncio.create_task(self._cleanup_old_data())
        self.monitoring_tasks.append(cleanup_task)
    
    async def _collect_system_metrics(self):
        """Background task to collect system metrics"""
        
        import psutil
        
        while True:
            try:
                # CPU usage
                cpu_percent = psutil.cpu_percent(interval=1)
                self.record_gauge("cpu_usage_percent", cpu_percent)
                
                # Memory usage
                memory = psutil.virtual_memory()
                self.record_gauge("memory_usage_bytes", memory.used)
                
                # Performance counters
                for counter_name, value in self.performance_counters.items():
                    self.record_gauge(f"performance_{counter_name}", value)
                
                await asyncio.sleep(30)  # Collect every 30 seconds
                
            except Exception as e:
                logger.error(f"System metrics collection error: {str(e)}")
                await asyncio.sleep(60)
    
    async def _evaluate_alerts(self):
        """Background task to evaluate alert rules"""
        
        while True:
            try:
                await asyncio.sleep(60)  # Evaluate every minute
                
                for rule_name, rule in self.alert_rules.items():
                    if not rule.enabled:
                        continue
                    
                    # Simulate alert evaluation (in production, this would query actual metrics)
                    current_value = self._evaluate_metric_query(rule.metric_query)
                    
                    if self._should_trigger_alert(rule, current_value):
                        await self._trigger_alert(rule, current_value)
                    elif rule_name in self.active_alerts:
                        await self._resolve_alert(rule_name)
                
            except Exception as e:
                logger.error(f"Alert evaluation error: {str(e)}")
    
    def _evaluate_metric_query(self, query: str) -> float:
        """Evaluate metric query (simplified implementation)"""
        
        # This is a simplified implementation
        # In production, this would integrate with Prometheus or similar
        
        if "error_rate_total" in query:
            return self.performance_counters.get("errors", 0) / max(self.performance_counters.get("requests", 1), 1)
        elif "orchestration_request_duration_seconds" in query:
            durations = self.latency_histograms.get("orchestration_requests", [])
            if durations:
                sorted_durations = sorted(durations)
                p95_index = int(0.95 * len(sorted_durations))
                return sorted_durations[p95_index] if p95_index < len(sorted_durations) else 0
        elif "memory_usage_bytes" in query:
            import psutil
            return psutil.virtual_memory().percent / 100.0
        elif "active_sessions_count" in query:
            return self.performance_counters.get("active_sessions", 0)
        
        return 0.0
    
    def _should_trigger_alert(self, rule: AlertRule, current_value: float) -> bool:
        """Determine if alert should be triggered"""
        
        if rule.comparison == "gt":
            return current_value > rule.threshold
        elif rule.comparison == "lt":
            return current_value < rule.threshold
        elif rule.comparison == "eq":
            return current_value == rule.threshold
        elif rule.comparison == "gte":
            return current_value >= rule.threshold
        elif rule.comparison == "lte":
            return current_value <= rule.threshold
        
        return False
    
    async def _trigger_alert(self, rule: AlertRule, current_value: float):
        """Trigger an alert"""
        
        if rule.name in self.active_alerts:
            return  # Alert already active
        
        alert = Alert(
            alert_id=str(uuid.uuid4()),
            rule_name=rule.name,
            severity=rule.severity,
            message=f"{rule.description} (current: {current_value}, threshold: {rule.threshold})",
            current_value=current_value,
            threshold=rule.threshold,
            started_at=datetime.now(),
            labels=rule.labels,
            annotations=rule.annotations
        )
        
        self.active_alerts[rule.name] = alert
        self.alert_history.append(alert)
        
        # Log alert
        self.structured_logger.warning(
            f"Alert triggered: {rule.name}",
            extra={
                "alert_id": alert.alert_id,
                "severity": alert.severity.value,
                "current_value": current_value,
                "threshold": rule.threshold
            }
        )
        
        # Record alert metric
        self.record_counter("alerts_triggered_total", labels={"severity": rule.severity.value, "rule": rule.name})
    
    async def _resolve_alert(self, rule_name: str):
        """Resolve an active alert"""
        
        if rule_name not in self.active_alerts:
            return
        
        alert = self.active_alerts[rule_name]
        alert.resolved_at = datetime.now()
        
        # Log resolution
        self.structured_logger.info(
            f"Alert resolved: {rule_name}",
            extra={
                "alert_id": alert.alert_id,
                "duration_seconds": (alert.resolved_at - alert.started_at).total_seconds()
            }
        )
        
        del self.active_alerts[rule_name]
        self.record_counter("alerts_resolved_total", labels={"severity": alert.severity.value, "rule": rule_name})
    
    async def _cleanup_old_data(self):
        """Background task to cleanup old observability data"""
        
        while True:
            try:
                await asyncio.sleep(3600)  # Cleanup every hour
                
                # Clean up old spans
                cutoff_time = datetime.now() - timedelta(hours=24)
                
                spans_to_remove = []
                for span_id, span in self.active_spans.items():
                    if span.start_time < cutoff_time:
                        spans_to_remove.append(span_id)
                
                for span_id in spans_to_remove:
                    span = self.active_spans.pop(span_id)
                    self.span_history.append(span)
                
                # Clean up performance counters (reset daily)
                if datetime.now().hour == 0:  # Reset at midnight
                    self.performance_counters.clear()
                    for histogram in self.latency_histograms.values():
                        histogram.clear()
                
            except Exception as e:
                logger.error(f"Cleanup task error: {str(e)}")
    
    def record_counter(self, metric_name: str, value: float = 1.0, labels: Dict[str, str] = None):
        """Record a counter metric"""
        
        # Update performance counter
        self.performance_counters[metric_name] += value
        
        # Update Prometheus metric if available
        if PROMETHEUS_AVAILABLE and metric_name in self.metrics:
            metric = self.metrics[metric_name]
            if labels:
                metric.labels(**labels).inc(value)
            else:
                metric.inc(value)
    
    def record_gauge(self, metric_name: str, value: float, labels: Dict[str, str] = None):
        """Record a gauge metric"""
        
        # Update performance counter
        self.performance_counters[metric_name] = value
        
        # Update Prometheus metric if available
        if PROMETHEUS_AVAILABLE and metric_name in self.metrics:
            metric = self.metrics[metric_name]
            if labels:
                metric.labels(**labels).set(value)
            else:
                metric.set(value)
    
    def record_histogram(self, metric_name: str, value: float, labels: Dict[str, str] = None):
        """Record a histogram metric"""
        
        # Update latency histogram
        self.latency_histograms[metric_name].append(value)
        
        # Update Prometheus metric if available
        if PROMETHEUS_AVAILABLE and metric_name in self.metrics:
            metric = self.metrics[metric_name]
            if labels:
                metric.labels(**labels).observe(value)
            else:
                metric.observe(value)
    
    @asynccontextmanager
    async def trace_operation(self, operation_name: str, tags: Dict[str, Any] = None):
        """Context manager for tracing operations"""
        
        span_id = str(uuid.uuid4())
        trace_id = str(uuid.uuid4())
        
        span = TraceSpan(
            span_id=span_id,
            trace_id=trace_id,
            operation_name=operation_name,
            start_time=datetime.now(),
            tags=tags or {}
        )
        
        self.active_spans[span_id] = span
        
        # Set up OpenTelemetry span if available
        otel_span = None
        if self.tracer:
            otel_span = self.tracer.start_span(operation_name)
            if tags:
                for key, value in tags.items():
                    otel_span.set_attribute(key, str(value))
        
        start_time = time.time()
        
        try:
            yield span
            span.status = "ok"
            
        except Exception as e:
            span.status = "error"
            span.tags = span.tags or {}
            span.tags["error"] = str(e)
            
            if otel_span:
                otel_span.record_exception(e)
                otel_span.set_status(trace.Status(trace.StatusCode.ERROR, str(e)))
            
            raise
        
        finally:
            # Complete span
            end_time = time.time()
            span.end_time = datetime.now()
            span.duration_ms = (end_time - start_time) * 1000
            
            # Complete OpenTelemetry span
            if otel_span:
                otel_span.end()
            
            # Move to history
            if span_id in self.active_spans:
                del self.active_spans[span_id]
            self.span_history.append(span)
    
    def log_structured(self, level: LogLevel, message: str, **kwargs):
        """Log structured message with context"""
        
        log_level_map = {
            LogLevel.TRACE: logging.DEBUG,
            LogLevel.DEBUG: logging.DEBUG,
            LogLevel.INFO: logging.INFO,
            LogLevel.WARNING: logging.WARNING,
            LogLevel.ERROR: logging.ERROR,
            LogLevel.CRITICAL: logging.CRITICAL
        }
        
        if self.structured_logger:
            self.structured_logger.log(
                log_level_map[level],
                message,
                extra=kwargs
            )
    
    def add_alert_rule(self, rule: AlertRule):
        """Add custom alert rule"""
        self.alert_rules[rule.name] = rule
    
    def remove_alert_rule(self, rule_name: str):
        """Remove alert rule"""
        if rule_name in self.alert_rules:
            del self.alert_rules[rule_name]
        
        if rule_name in self.active_alerts:
            del self.active_alerts[rule_name]
    
    def get_metrics_export(self) -> str:
        """Export metrics in Prometheus format"""
        
        if PROMETHEUS_AVAILABLE and self.prometheus_registry:
            return generate_latest(self.prometheus_registry).decode()
        
        # Fallback text format
        lines = []
        for name, value in self.performance_counters.items():
            lines.append(f"{name} {value}")
        
        return "\n".join(lines)
    
    def get_active_alerts(self) -> List[Alert]:
        """Get list of active alerts"""
        return list(self.active_alerts.values())
    
    def get_alert_history(self, limit: int = 100) -> List[Alert]:
        """Get alert history"""
        return list(self.alert_history)[-limit:]
    
    def get_trace_history(self, limit: int = 100) -> List[TraceSpan]:
        """Get trace history"""
        return list(self.span_history)[-limit:]
    
    def get_performance_summary(self) -> Dict[str, Any]:
        """Get performance summary"""
        
        summary = {
            "counters": dict(self.performance_counters),
            "active_spans": len(self.active_spans),
            "active_alerts": len(self.active_alerts),
            "total_spans": len(self.span_history),
            "total_alerts": len(self.alert_history),
            "uptime_seconds": time.time() - self.start_time if hasattr(self, 'start_time') else 0
        }
        
        # Add latency percentiles
        if self.latency_histograms:
            summary["latency_percentiles"] = {}
            for metric_name, values in self.latency_histograms.items():
                if values:
                    sorted_values = sorted(values)
                    summary["latency_percentiles"][metric_name] = {
                        "p50": sorted_values[int(0.5 * len(sorted_values))],
                        "p95": sorted_values[int(0.95 * len(sorted_values))],
                        "p99": sorted_values[int(0.99 * len(sorted_values))]
                    }
        
        return summary
    
    async def shutdown(self):
        """Shutdown observability stack"""
        
        logger.info("Shutting down observability stack...")
        
        # Cancel monitoring tasks
        for task in self.monitoring_tasks:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
        
        # Export final metrics
        if hasattr(self, 'prometheus_registry'):
            final_metrics = self.get_metrics_export()
            logger.info(f"Final metrics export:\n{final_metrics}")
        
        logger.info("Observability stack shutdown complete")

class LogBufferHandler(logging.Handler):
    """Custom logging handler that buffers logs in memory"""
    
    def __init__(self, buffer: deque):
        super().__init__()
        self.buffer = buffer
    
    def emit(self, record):
        try:
            msg = self.format(record)
            self.buffer.append({
                "timestamp": datetime.utcnow().isoformat(),
                "level": record.levelname,
                "message": msg,
                "logger": record.name
            })
        except Exception:
            self.handleError(record)

# Decorators for easy instrumentation
def trace_async(operation_name: str = None, tags: Dict[str, Any] = None):
    """Decorator to trace async functions"""
    
    def decorator(func):
        async def wrapper(*args, **kwargs):
            obs_stack = get_observability_stack()
            op_name = operation_name or f"{func.__module__}.{func.__name__}"
            
            async with obs_stack.trace_operation(op_name, tags):
                return await func(*args, **kwargs)
        
        return wrapper
    return decorator

def trace_sync(operation_name: str = None, tags: Dict[str, Any] = None):
    """Decorator to trace sync functions"""
    
    def decorator(func):
        def wrapper(*args, **kwargs):
            obs_stack = get_observability_stack()
            op_name = operation_name or f"{func.__module__}.{func.__name__}"
            
            # For sync functions, we simulate the async context manager
            span_id = str(uuid.uuid4())
            span = TraceSpan(
                span_id=span_id,
                trace_id=str(uuid.uuid4()),
                operation_name=op_name,
                start_time=datetime.now(),
                tags=tags or {}
            )
            
            start_time = time.time()
            
            try:
                result = func(*args, **kwargs)
                span.status = "ok"
                return result
            except Exception as e:
                span.status = "error"
                span.tags = span.tags or {}
                span.tags["error"] = str(e)
                raise
            finally:
                span.end_time = datetime.now()
                span.duration_ms = (time.time() - start_time) * 1000
                obs_stack.span_history.append(span)
        
        return wrapper
    return decorator

def record_metric(metric_name: str, metric_type: MetricType = MetricType.COUNTER, labels: Dict[str, str] = None):
    """Decorator to automatically record metrics for functions"""
    
    def decorator(func):
        async def async_wrapper(*args, **kwargs):
            obs_stack = get_observability_stack()
            start_time = time.time()
            
            try:
                result = await func(*args, **kwargs)
                status = "success"
                return result
            except Exception as e:
                status = "error"
                raise
            finally:
                execution_time = time.time() - start_time
                metric_labels = (labels or {}).copy()
                metric_labels["status"] = status
                metric_labels["function"] = func.__name__
                
                if metric_type == MetricType.COUNTER:
                    obs_stack.record_counter(metric_name, labels=metric_labels)
                elif metric_type == MetricType.HISTOGRAM:
                    obs_stack.record_histogram(metric_name, execution_time, labels=metric_labels)
        
        def sync_wrapper(*args, **kwargs):
            obs_stack = get_observability_stack()
            start_time = time.time()
            
            try:
                result = func(*args, **kwargs)
                status = "success"
                return result
            except Exception as e:
                status = "error"
                raise
            finally:
                execution_time = time.time() - start_time
                metric_labels = (labels or {}).copy()
                metric_labels["status"] = status
                metric_labels["function"] = func.__name__
                
                if metric_type == MetricType.COUNTER:
                    obs_stack.record_counter(metric_name, labels=metric_labels)
                elif metric_type == MetricType.HISTOGRAM:
                    obs_stack.record_histogram(metric_name, execution_time, labels=metric_labels)
        
        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper
    return decorator

# Global observability stack instance
_observability_stack: Optional[ObservabilityStack] = None

def get_observability_stack() -> ObservabilityStack:
    """Get global observability stack instance"""
    global _observability_stack
    
    if _observability_stack is None:
        _observability_stack = ObservabilityStack()
    
    return _observability_stack

async def initialize_observability(
    service_name: str = "amt-orchestration",
    environment: str = "production",
    jaeger_endpoint: Optional[str] = None
) -> bool:
    """Initialize global observability stack"""
    global _observability_stack
    
    _observability_stack = ObservabilityStack(
        service_name=service_name,
        environment=environment,
        jaeger_endpoint=jaeger_endpoint
    )
    
    _observability_stack.start_time = time.time()
    return await _observability_stack.initialize()

# FastAPI integration
def create_metrics_endpoint():
    """Create FastAPI endpoint for metrics export"""
    
    from fastapi import FastAPI, Response
    
    app = FastAPI()
    
    @app.get("/metrics")
    async def metrics_endpoint():
        """Prometheus metrics endpoint"""
        obs_stack = get_observability_stack()
        metrics_data = obs_stack.get_metrics_export()
        
        return Response(
            content=metrics_data,
            media_type="text/plain; version=0.0.4; charset=utf-8"
        )
    
    @app.get("/health")
    async def health_endpoint():
        """Health check endpoint"""
        obs_stack = get_observability_stack()
        
        return {
            "status": "healthy",
            "active_alerts": len(obs_stack.active_alerts),
            "active_spans": len(obs_stack.active_spans),
            "uptime_seconds": time.time() - obs_stack.start_time if hasattr(obs_stack, 'start_time') else 0
        }
    
    return app

# Example usage patterns
"""
# Initialize observability
await initialize_observability(
    service_name="amt-orchestration",
    environment="production",
    jaeger_endpoint="http://jaeger:14268/api/traces"
)

# Use tracing decorator
@trace_async("process_user_request")
async def process_request(user_id: str):
    # Function implementation
    pass

# Use metrics decorator  
@record_metric("api_requests", MetricType.COUNTER, {"endpoint": "process"})
async def api_handler():
    # Function implementation
    pass

# Manual tracing
obs_stack = get_observability_stack()
async with obs_stack.trace_operation("custom_operation", {"user_id": "123"}):
    # Operation code
    pass

# Record custom metrics
obs_stack.record_counter("custom_counter", labels={"type": "test"})
obs_stack.record_histogram("response_time", duration_ms)
"""
