"""
AMT Performance Analytics Engine
Advanced analytics and insights for orchestration platform performance optimization
"""

import asyncio
import logging
import json
from typing import Dict, List, Optional, Any, Union, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict, field
from enum import Enum
from pathlib import Path
import statistics
import numpy as np
from collections import defaultdict, deque
import uuid

# Analytics libraries
try:
    import pandas as pd
    import scipy.stats as stats
    from sklearn.cluster import KMeans
    from sklearn.preprocessing import StandardScaler
    from sklearn.decomposition import PCA
    ANALYTICS_LIBRARIES_AVAILABLE = True
except ImportError:
    logging.warning("Analytics libraries not fully available - some features will be limited")
    ANALYTICS_LIBRARIES_AVAILABLE = False

from ..shared.orchestration_protocol import BotType, TaskStatus, SessionState
from ..monitoring.observability_stack import get_observability_stack, trace_async
from ..data_pipeline.pipeline_orchestrator import get_pipeline_orchestrator

logger = logging.getLogger(__name__)

class MetricCategory(str, Enum):
    """Categories of performance metrics"""
    ORCHESTRATION = "orchestration"
    BOT_PERFORMANCE = "bot_performance"
    USER_ENGAGEMENT = "user_engagement"
    SYSTEM_RESOURCES = "system_resources"
    BUSINESS_METRICS = "business_metrics"
    SECURITY_METRICS = "security_metrics"
    TRIANGLE_DEFENSE = "triangle_defense"

class AnalysisType(str, Enum):
    """Types of analytical processes"""
    DESCRIPTIVE = "descriptive"      # What happened
    DIAGNOSTIC = "diagnostic"        # Why it happened
    PREDICTIVE = "predictive"        # What will happen
    PRESCRIPTIVE = "prescriptive"    # What should be done

class TrendDirection(str, Enum):
    """Trend analysis directions"""
    INCREASING = "increasing"
    DECREASING = "decreasing"
    STABLE = "stable"
    VOLATILE = "volatile"

@dataclass
class PerformanceMetric:
    """Individual performance metric"""
    metric_id: str
    name: str
    category: MetricCategory
    value: float
    timestamp: datetime
    unit: str = "count"
    tags: Dict[str, str] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class TrendAnalysis:
    """Trend analysis result"""
    metric_name: str
    time_period: str
    direction: TrendDirection
    slope: float
    confidence: float
    r_squared: float
    predicted_next_value: Optional[float] = None
    predicted_change_percent: Optional[float] = None
    anomalies_detected: List[Dict[str, Any]] = field(default_factory=list)

@dataclass
class CorrelationAnalysis:
    """Correlation analysis between metrics"""
    metric_a: str
    metric_b: str
    correlation_coefficient: float
    p_value: float
    significance_level: str  # "high", "medium", "low", "none"
    relationship_type: str   # "positive", "negative", "none"
    strength: str           # "strong", "moderate", "weak"

@dataclass
class PerformanceInsight:
    """Performance insight and recommendation"""
    insight_id: str
    category: MetricCategory
    title: str
    description: str
    severity: str  # "critical", "high", "medium", "low", "info"
    impact_score: float
    confidence_score: float
    recommendations: List[str]
    supporting_data: Dict[str, Any]
    generated_at: datetime = field(default_factory=datetime.now)

@dataclass
class BenchmarkComparison:
    """Benchmark comparison analysis"""
    metric_name: str
    current_value: float
    benchmark_value: float
    variance_percent: float
    performance_rating: str  # "excellent", "good", "average", "below_average", "poor"
    improvement_potential: float
    benchmark_source: str

class PerformanceAnalyticsEngine:
    """Advanced performance analytics and insights engine"""
    
    def __init__(self, retention_days: int = 90):
        self.retention_days = retention_days
        
        # Metrics storage and processing
        self.metrics_buffer: Dict[MetricCategory, deque] = {
            category: deque(maxlen=10000) for category in MetricCategory
        }
        self.processed_insights: List[PerformanceInsight] = []
        
        # Analytics state
        self.trend_analyses: Dict[str, TrendAnalysis] = {}
        self.correlation_matrix: Dict[Tuple[str, str], CorrelationAnalysis] = {}
        self.benchmarks: Dict[str, float] = {}
        
        # Machine learning models (if available)
        self.anomaly_detectors: Dict[str, Any] = {}
        self.performance_predictors: Dict[str, Any] = {}
        
        # Background processing
        self.analysis_tasks: List[asyncio.Task] = []
        
        # Initialize benchmarks and models
        self._initialize_benchmarks()
        if ANALYTICS_LIBRARIES_AVAILABLE:
            self._initialize_ml_models()
    
    async def initialize(self) -> bool:
        """Initialize the performance analytics engine"""
        
        try:
            # Load historical data
            await self._load_historical_metrics()
            
            # Start background analysis tasks
            await self._start_analysis_tasks()
            
            logger.info("Performance analytics engine initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize performance analytics engine: {str(e)}")
            return False
    
    def _initialize_benchmarks(self):
        """Initialize performance benchmarks"""
        
        # Industry standard benchmarks for orchestration systems
        self.benchmarks = {
            "session_success_rate": 0.95,
            "avg_response_time_ms": 2000,
            "bot_confidence_score": 0.80,
            "user_satisfaction_score": 0.85,
            "system_availability": 0.999,
            "error_rate": 0.02,
            "knowledge_utilization": 0.70,
            "triangle_defense_accuracy": 0.90,
            "concurrent_sessions_capacity": 1000,
            "data_processing_throughput": 10000  # records per minute
        }
    
    def _initialize_ml_models(self):
        """Initialize machine learning models for advanced analytics"""
        
        if not ANALYTICS_LIBRARIES_AVAILABLE:
            return
        
        # Initialize anomaly detection models
        self.anomaly_detectors = {
            "session_performance": {"model": None, "scaler": StandardScaler()},
            "bot_response_times": {"model": None, "scaler": StandardScaler()},
            "system_resources": {"model": None, "scaler": StandardScaler()}
        }
        
        # Initialize predictive models
        self.performance_predictors = {
            "session_volume": {"model": None, "features": []},
            "resource_usage": {"model": None, "features": []},
            "user_engagement": {"model": None, "features": []}
        }
    
    async def _load_historical_metrics(self):
        """Load historical metrics data"""
        
        # Load data from data pipeline or observability stack
        obs_stack = get_observability_stack()
        
        if obs_stack:
            # Load recent performance data
            performance_summary = obs_stack.get_performance_summary()
            
            # Convert to performance metrics
            for metric_name, value in performance_summary.get("counters", {}).items():
                metric = PerformanceMetric(
                    metric_id=str(uuid.uuid4()),
                    name=metric_name,
                    category=self._categorize_metric(metric_name),
                    value=float(value),
                    timestamp=datetime.now(),
                    unit="count"
                )
                
                self.metrics_buffer[metric.category].append(metric)
    
    def _categorize_metric(self, metric_name: str) -> MetricCategory:
        """Categorize metric based on name"""
        
        name_lower = metric_name.lower()
        
        if any(term in name_lower for term in ["session", "orchestration", "workflow"]):
            return MetricCategory.ORCHESTRATION
        elif any(term in name_lower for term in ["bot", "agent", "response"]):
            return MetricCategory.BOT_PERFORMANCE
        elif any(term in name_lower for term in ["user", "engagement", "satisfaction"]):
            return MetricCategory.USER_ENGAGEMENT
        elif any(term in name_lower for term in ["cpu", "memory", "disk", "network"]):
            return MetricCategory.SYSTEM_RESOURCES
        elif any(term in name_lower for term in ["revenue", "cost", "business"]):
            return MetricCategory.BUSINESS_METRICS
        elif any(term in name_lower for term in ["security", "threat", "auth"]):
            return MetricCategory.SECURITY_METRICS
        elif any(term in name_lower for term in ["triangle", "defense", "formation"]):
            return MetricCategory.TRIANGLE_DEFENSE
        else:
            return MetricCategory.ORCHESTRATION
    
    async def _start_analysis_tasks(self):
        """Start background analysis tasks"""
        
        # Trend analysis task
        trend_task = asyncio.create_task(self._continuous_trend_analysis())
        self.analysis_tasks.append(trend_task)
        
        # Correlation analysis task
        correlation_task = asyncio.create_task(self._continuous_correlation_analysis())
        self.analysis_tasks.append(correlation_task)
        
        # Insight generation task
        insight_task = asyncio.create_task(self._continuous_insight_generation())
        self.analysis_tasks.append(insight_task)
        
        # Anomaly detection task
        if ANALYTICS_LIBRARIES_AVAILABLE:
            anomaly_task = asyncio.create_task(self._continuous_anomaly_detection())
            self.analysis_tasks.append(anomaly_task)
    
    async def record_metric(self, metric: PerformanceMetric):
        """Record a new performance metric"""
        
        # Add to appropriate buffer
        self.metrics_buffer[metric.category].append(metric)
        
        # Trigger immediate analysis if needed
        if self._should_trigger_immediate_analysis(metric):
            await self._analyze_metric_immediately(metric)
    
    def _should_trigger_immediate_analysis(self, metric: PerformanceMetric) -> bool:
        """Check if metric should trigger immediate analysis"""
        
        # Trigger immediate analysis for critical metrics
        critical_patterns = [
            "error_rate", "system_down", "security_breach", 
            "performance_degradation", "triangle_defense_failure"
        ]
        
        return any(pattern in metric.name.lower() for pattern in critical_patterns)
    
    async def _analyze_metric_immediately(self, metric: PerformanceMetric):
        """Perform immediate analysis on critical metric"""
        
        # Check against benchmarks
        if metric.name in self.benchmarks:
            benchmark = self.benchmarks[metric.name]
            variance = abs(metric.value - benchmark) / benchmark
            
            if variance > 0.2:  # 20% variance threshold
                # Generate immediate insight
                insight = PerformanceInsight(
                    insight_id=str(uuid.uuid4()),
                    category=metric.category,
                    title=f"Performance Alert: {metric.name}",
                    description=f"Metric {metric.name} deviates significantly from benchmark",
                    severity="high" if variance > 0.5 else "medium",
                    impact_score=variance,
                    confidence_score=0.9,
                    recommendations=[
                        f"Investigate {metric.name} performance degradation",
                        "Check system resources and dependencies",
                        "Review recent changes and deployments"
                    ],
                    supporting_data={
                        "current_value": metric.value,
                        "benchmark_value": benchmark,
                        "variance_percent": variance * 100
                    }
                )
                
                self.processed_insights.append(insight)
                logger.warning(f"Performance alert: {insight.title}")
    
    @trace_async("trend_analysis")
    async def _continuous_trend_analysis(self):
        """Continuous trend analysis background task"""
        
        while True:
            try:
                await asyncio.sleep(1800)  # Every 30 minutes
                
                for category, metrics_buffer in self.metrics_buffer.items():
                    if len(metrics_buffer) < 10:
                        continue
                    
                    # Group metrics by name
                    metrics_by_name = defaultdict(list)
                    for metric in metrics_buffer:
                        metrics_by_name[metric.name].append(metric)
                    
                    # Analyze trends for each metric
                    for metric_name, metrics in metrics_by_name.items():
                        if len(metrics) >= 5:
                            trend = await self._analyze_trend(metric_name, metrics)
                            if trend:
                                self.trend_analyses[metric_name] = trend
                
            except Exception as e:
                logger.error(f"Trend analysis error: {str(e)}")
    
    async def _analyze_trend(self, metric_name: str, metrics: List[PerformanceMetric]) -> Optional[TrendAnalysis]:
        """Analyze trend for specific metric"""
        
        if len(metrics) < 5:
            return None
        
        try:
            # Sort by timestamp
            sorted_metrics = sorted(metrics, key=lambda m: m.timestamp)
            
            # Extract time series data
            timestamps = [(m.timestamp - sorted_metrics[0].timestamp).total_seconds() for m in sorted_metrics]
            values = [m.value for m in sorted_metrics]
            
            if not ANALYTICS_LIBRARIES_AVAILABLE:
                # Simple trend calculation
                if len(values) >= 2:
                    slope = (values[-1] - values[0]) / len(values)
                    direction = TrendDirection.INCREASING if slope > 0 else TrendDirection.DECREASING
                    if abs(slope) < 0.01:
                        direction = TrendDirection.STABLE
                    
                    return TrendAnalysis(
                        metric_name=metric_name,
                        time_period="recent",
                        direction=direction,
                        slope=slope,
                        confidence=0.7,
                        r_squared=0.0
                    )
                return None
            
            # Advanced statistical analysis
            if len(values) >= 3:
                # Linear regression
                slope, intercept, r_value, p_value, std_err = stats.linregress(timestamps, values)
                
                # Determine direction
                if abs(slope) < std_err * 2:
                    direction = TrendDirection.STABLE
                elif slope > 0:
                    direction = TrendDirection.INCREASING
                else:
                    direction = TrendDirection.DECREASING
                
                # Check for volatility
                coefficient_of_variation = statistics.stdev(values) / statistics.mean(values) if statistics.mean(values) != 0 else 0
                if coefficient_of_variation > 0.3:
                    direction = TrendDirection.VOLATILE
                
                # Predict next value
                next_timestamp = timestamps[-1] + (timestamps[-1] - timestamps[-2])
                predicted_value = slope * next_timestamp + intercept
                
                # Calculate percentage change
                current_value = values[-1]
                predicted_change = (predicted_value - current_value) / current_value * 100 if current_value != 0 else 0
                
                # Detect anomalies
                anomalies = self._detect_trend_anomalies(timestamps, values)
                
                return TrendAnalysis(
                    metric_name=metric_name,
                    time_period=f"{len(values)} data points",
                    direction=direction,
                    slope=slope,
                    confidence=abs(r_value),
                    r_squared=r_value**2,
                    predicted_next_value=predicted_value,
                    predicted_change_percent=predicted_change,
                    anomalies_detected=anomalies
                )
        
        except Exception as e:
            logger.error(f"Trend analysis failed for {metric_name}: {str(e)}")
            return None
    
    def _detect_trend_anomalies(self, timestamps: List[float], values: List[float]) -> List[Dict[str, Any]]:
        """Detect anomalies in trend data"""
        
        if not ANALYTICS_LIBRARIES_AVAILABLE or len(values) < 10:
            return []
        
        try:
            # Use Z-score for anomaly detection
            z_scores = np.abs(stats.zscore(values))
            anomaly_threshold = 2.5
            
            anomalies = []
            for i, z_score in enumerate(z_scores):
                if z_score > anomaly_threshold:
                    anomalies.append({
                        "index": i,
                        "timestamp": timestamps[i],
                        "value": values[i],
                        "z_score": float(z_score),
                        "severity": "high" if z_score > 3.0 else "medium"
                    })
            
            return anomalies
        
        except Exception as e:
            logger.error(f"Anomaly detection failed: {str(e)}")
            return []
    
    async def _continuous_correlation_analysis(self):
        """Continuous correlation analysis background task"""
        
        while True:
            try:
                await asyncio.sleep(3600)  # Every hour
                
                # Collect all metrics for correlation analysis
                all_metrics = defaultdict(list)
                
                for metrics_buffer in self.metrics_buffer.values():
                    for metric in metrics_buffer:
                        all_metrics[metric.name].append(metric.value)
                
                # Calculate correlations between metrics
                metric_names = list(all_metrics.keys())
                
                for i, metric_a in enumerate(metric_names):
                    for metric_b in metric_names[i+1:]:
                        if len(all_metrics[metric_a]) >= 10 and len(all_metrics[metric_b]) >= 10:
                            correlation = await self._calculate_correlation(
                                metric_a, all_metrics[metric_a],
                                metric_b, all_metrics[metric_b]
                            )
                            
                            if correlation and abs(correlation.correlation_coefficient) > 0.3:
                                self.correlation_matrix[(metric_a, metric_b)] = correlation
                
            except Exception as e:
                logger.error(f"Correlation analysis error: {str(e)}")
    
    async def _calculate_correlation(
        self, 
        metric_a: str, values_a: List[float],
        metric_b: str, values_b: List[float]
    ) -> Optional[CorrelationAnalysis]:
        """Calculate correlation between two metrics"""
        
        try:
            # Align lengths
            min_length = min(len(values_a), len(values_b))
            values_a = values_a[-min_length:]
            values_b = values_b[-min_length:]
            
            if not ANALYTICS_LIBRARIES_AVAILABLE:
                # Simple correlation calculation
                if len(values_a) >= 2:
                    mean_a = statistics.mean(values_a)
                    mean_b = statistics.mean(values_b)
                    
                    numerator = sum((a - mean_a) * (b - mean_b) for a, b in zip(values_a, values_b))
                    denominator = (sum((a - mean_a)**2 for a in values_a) * sum((b - mean_b)**2 for b in values_b))**0.5
                    
                    if denominator == 0:
                        return None
                    
                    correlation_coeff = numerator / denominator
                    
                    return CorrelationAnalysis(
                        metric_a=metric_a,
                        metric_b=metric_b,
                        correlation_coefficient=correlation_coeff,
                        p_value=0.1,  # Simplified
                        significance_level="medium",
                        relationship_type="positive" if correlation_coeff > 0 else "negative",
                        strength="strong" if abs(correlation_coeff) > 0.7 else "moderate"
                    )
                return None
            
            # Advanced statistical correlation
            correlation_coeff, p_value = stats.pearsonr(values_a, values_b)
            
            # Determine significance level
            if p_value < 0.01:
                significance = "high"
            elif p_value < 0.05:
                significance = "medium"
            elif p_value < 0.1:
                significance = "low"
            else:
                significance = "none"
            
            # Determine relationship type
            if abs(correlation_coeff) < 0.1:
                relationship = "none"
            elif correlation_coeff > 0:
                relationship = "positive"
            else:
                relationship = "negative"
            
            # Determine strength
            abs_corr = abs(correlation_coeff)
            if abs_corr > 0.7:
                strength = "strong"
            elif abs_corr > 0.3:
                strength = "moderate"
            else:
                strength = "weak"
            
            return CorrelationAnalysis(
                metric_a=metric_a,
                metric_b=metric_b,
                correlation_coefficient=correlation_coeff,
                p_value=p_value,
                significance_level=significance,
                relationship_type=relationship,
                strength=strength
            )
        
        except Exception as e:
            logger.error(f"Correlation calculation failed: {str(e)}")
            return None
    
    async def _continuous_insight_generation(self):
        """Continuous insight generation background task"""
        
        while True:
            try:
                await asyncio.sleep(3600)  # Every hour
                
                # Generate insights based on trends and correlations
                await self._generate_trend_insights()
                await self._generate_correlation_insights()
                await self._generate_benchmark_insights()
                await self._generate_triangle_defense_insights()
                
                # Clean up old insights
                cutoff_time = datetime.now() - timedelta(days=7)
                self.processed_insights = [
                    insight for insight in self.processed_insights
                    if insight.generated_at > cutoff_time
                ]
                
            except Exception as e:
                logger.error(f"Insight generation error: {str(e)}")
    
    async def _generate_trend_insights(self):
        """Generate insights based on trend analysis"""
        
        for metric_name, trend in self.trend_analyses.items():
            # Significant trends
            if trend.confidence > 0.7 and abs(trend.predicted_change_percent or 0) > 10:
                severity = "high" if abs(trend.predicted_change_percent) > 30 else "medium"
                
                if trend.direction == TrendDirection.DECREASING and "success" in metric_name:
                    # Declining performance
                    insight = PerformanceInsight(
                        insight_id=str(uuid.uuid4()),
                        category=self._categorize_metric(metric_name),
                        title=f"Declining Performance: {metric_name}",
                        description=f"{metric_name} shows a declining trend with {trend.predicted_change_percent:.1f}% predicted decrease",
                        severity=severity,
                        impact_score=abs(trend.predicted_change_percent) / 100,
                        confidence_score=trend.confidence,
                        recommendations=[
                            f"Investigate root cause of declining {metric_name}",
                            "Review recent system changes",
                            "Implement performance improvement measures"
                        ],
                        supporting_data=asdict(trend)
                    )
                    self.processed_insights.append(insight)
                
                elif trend.direction == TrendDirection.INCREASING and "error" in metric_name:
                    # Increasing errors
                    insight = PerformanceInsight(
                        insight_id=str(uuid.uuid4()),
                        category=self._categorize_metric(metric_name),
                        title=f"Increasing Errors: {metric_name}",
                        description=f"{metric_name} shows an increasing trend with {trend.predicted_change_percent:.1f}% predicted increase",
                        severity=severity,
                        impact_score=abs(trend.predicted_change_percent) / 100,
                        confidence_score=trend.confidence,
                        recommendations=[
                            f"Urgently address increasing {metric_name}",
                            "Review error logs and system health",
                            "Implement error prevention measures"
                        ],
                        supporting_data=asdict(trend)
                    )
                    self.processed_insights.append(insight)
    
    async def _generate_correlation_insights(self):
        """Generate insights based on correlation analysis"""
        
        for (metric_a, metric_b), correlation in self.correlation_matrix.items():
            if correlation.strength == "strong" and correlation.significance_level in ["high", "medium"]:
                # Strong correlations
                insight = PerformanceInsight(
                    insight_id=str(uuid.uuid4()),
                    category=MetricCategory.ORCHESTRATION,
                    title=f"Strong Correlation: {metric_a} & {metric_b}",
                    description=f"Strong {correlation.relationship_type} correlation ({correlation.correlation_coefficient:.3f}) detected",
                    severity="medium",
                    impact_score=abs(correlation.correlation_coefficient),
                    confidence_score=1.0 - correlation.p_value,
                    recommendations=[
                        f"Monitor {metric_a} when optimizing {metric_b}",
                        "Consider joint optimization strategies",
                        "Use correlation for predictive maintenance"
                    ],
                    supporting_data=asdict(correlation)
                )
                self.processed_insights.append(insight)
    
    async def _generate_benchmark_insights(self):
        """Generate insights based on benchmark comparisons"""
        
        for category, metrics_buffer in self.metrics_buffer.items():
            recent_metrics = defaultdict(list)
            
            # Get recent metrics
            cutoff_time = datetime.now() - timedelta(hours=24)
            for metric in metrics_buffer:
                if metric.timestamp > cutoff_time:
                    recent_metrics[metric.name].append(metric.value)
            
            # Compare with benchmarks
            for metric_name, values in recent_metrics.items():
                if metric_name in self.benchmarks and values:
                    current_avg = statistics.mean(values)
                    benchmark = self.benchmarks[metric_name]
                    variance_percent = abs(current_avg - benchmark) / benchmark * 100
                    
                    if variance_percent > 15:  # 15% variance threshold
                        performance_rating = self._calculate_performance_rating(current_avg, benchmark)
                        
                        insight = PerformanceInsight(
                            insight_id=str(uuid.uuid4()),
                            category=category,
                            title=f"Benchmark Deviation: {metric_name}",
                            description=f"{metric_name} deviates {variance_percent:.1f}% from benchmark ({performance_rating})",
                            severity="high" if variance_percent > 30 else "medium",
                            impact_score=variance_percent / 100,
                            confidence_score=0.8,
                            recommendations=self._get_benchmark_recommendations(metric_name, current_avg, benchmark),
                            supporting_data={
                                "current_value": current_avg,
                                "benchmark_value": benchmark,
                                "variance_percent": variance_percent,
                                "performance_rating": performance_rating
                            }
                        )
                        self.processed_insights.append(insight)
    
    def _calculate_performance_rating(self, current: float, benchmark: float) -> str:
        """Calculate performance rating compared to benchmark"""
        
        ratio = current / benchmark if benchmark != 0 else 1
        
        if ratio >= 1.2:
            return "excellent"
        elif ratio >= 1.05:
            return "good"
        elif ratio >= 0.95:
            return "average"
        elif ratio >= 0.8:
            return "below_average"
        else:
            return "poor"
    
    def _get_benchmark_recommendations(self, metric_name: str, current: float, benchmark: float) -> List[str]:
        """Get recommendations based on benchmark comparison"""
        
        recommendations = []
        
        if "response_time" in metric_name.lower():
            if current > benchmark:
                recommendations.extend([
                    "Optimize response time performance",
                    "Review database query performance",
                    "Consider caching strategies",
                    "Scale computing resources if needed"
                ])
        
        elif "success_rate" in metric_name.lower():
            if current < benchmark:
                recommendations.extend([
                    "Investigate failure causes",
                    "Improve error handling",
                    "Enhance system reliability",
                    "Review user experience flows"
                ])
        
        elif "error_rate" in metric_name.lower():
            if current > benchmark:
                recommendations.extend([
                    "Reduce error rate through better validation",
                    "Improve error monitoring and alerting",
                    "Review code quality and testing",
                    "Implement proactive error prevention"
                ])
        
        else:
            recommendations.extend([
                f"Optimize {metric_name} to meet benchmark standards",
                "Review system configuration and resources",
                "Consider performance tuning initiatives"
            ])
        
        return recommendations
    
    async def _generate_triangle_defense_insights(self):
        """Generate Triangle Defense specific insights"""
        
        triangle_metrics = self.metrics_buffer.get(MetricCategory.TRIANGLE_DEFENSE, deque())
        
        if len(triangle_metrics) < 5:
            return
        
        # Analyze Triangle Defense formation performance
        formation_performance = defaultdict(list)
        for metric in triangle_metrics:
            formation = metric.tags.get("formation", "unknown")
            formation_performance[formation].append(metric.value)
        
        # Generate insights for each formation
        for formation, values in formation_performance.items():
            if len(values) >= 3:
                avg_performance = statistics.mean(values)
                
                if avg_performance < 0.7:  # Below 70% performance
                    insight = PerformanceInsight(
                        insight_id=str(uuid.uuid4()),
                        category=MetricCategory.TRIANGLE_DEFENSE,
                        title=f"Triangle Defense Formation Alert: {formation.upper()}",
                        description=f"Formation {formation} showing suboptimal performance ({avg_performance:.1%})",
                        severity="medium",
                        impact_score=1.0 - avg_performance,
                        confidence_score=0.85,
                        recommendations=[
                            f"Review {formation} formation execution",
                            "Analyze defensive coordination patterns",
                            "Consider formation-specific training",
                            "Validate Triangle Defense methodology application"
                        ],
                        supporting_data={
                            "formation": formation,
                            "average_performance": avg_performance,
                            "sample_size": len(values),
                            "performance_trend": "declining" if len(values) > 1 and values[-1] < values[0] else "stable"
                        }
                    )
                    self.processed_insights.append(insight)
    
    async def _continuous_anomaly_detection(self):
        """Continuous anomaly detection using ML models"""
        
        if not ANALYTICS_LIBRARIES_AVAILABLE:
            return
        
        while True:
            try:
                await asyncio.sleep(1800)  # Every 30 minutes
                
                # Train and update anomaly detection models
                for model_name, model_config in self.anomaly_detectors.items():
                    await self._update_anomaly_model(model_name, model_config)
                
                # Detect anomalies in recent data
                await self._detect_recent_anomalies()
                
            except Exception as e:
                logger.error(f"Anomaly detection error: {str(e)}")
    
    async def _update_anomaly_model(self, model_name: str, model_config: Dict[str, Any]):
        """Update anomaly detection model with recent data"""
        
        # This would implement ML-based anomaly detection
        # For brevity, using a simplified approach
        pass
    
    async def _detect_recent_anomalies(self):
        """Detect anomalies in recent metric data"""
        
        # This would use trained ML models to detect anomalies
        # For brevity, using statistical approach
        
        for category, metrics_buffer in self.metrics_buffer.items():
            recent_metrics = defaultdict(list)
            
            # Get recent metrics
            cutoff_time = datetime.now() - timedelta(hours=4)
            for metric in metrics_buffer:
                if metric.timestamp > cutoff_time:
                    recent_metrics[metric.name].append(metric.value)
            
            # Statistical anomaly detection
            for metric_name, values in recent_metrics.items():
                if len(values) >= 10:
                    z_scores = np.abs(stats.zscore(values))
                    anomaly_indices = np.where(z_scores > 2.5)[0]
                    
                    if len(anomaly_indices) > 0:
                        # Generate anomaly insight
                        insight = PerformanceInsight(
                            insight_id=str(uuid.uuid4()),
                            category=category,
                            title=f"Anomaly Detected: {metric_name}",
                            description=f"Statistical anomalies detected in {metric_name}",
                            severity="medium",
                            impact_score=len(anomaly_indices) / len(values),
                            confidence_score=0.7,
                            recommendations=[
                                f"Investigate anomalous {metric_name} values",
                                "Check for system irregularities",
                                "Review recent changes or events"
                            ],
                            supporting_data={
                                "anomaly_count": len(anomaly_indices),
                                "total_samples": len(values),
                                "anomaly_percentage": len(anomaly_indices) / len(values) * 100
                            }
                        )
                        self.processed_insights.append(insight)
    
    def get_performance_dashboard(self) -> Dict[str, Any]:
        """Get comprehensive performance dashboard data"""
        
        dashboard_data = {
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "total_insights": len(self.processed_insights),
                "critical_insights": len([i for i in self.processed_insights if i.severity == "critical"]),
                "high_priority_insights": len([i for i in self.processed_insights if i.severity == "high"]),
                "trends_analyzed": len(self.trend_analyses),
                "correlations_found": len(self.correlation_matrix)
            },
            "recent_insights": [
                asdict(insight) for insight in sorted(
                    self.processed_insights, 
                    key=lambda x: x.generated_at, 
                    reverse=True
                )[:10]
            ],
            "key_trends": {
                name: asdict(trend) for name, trend in list(self.trend_analyses.items())[:5]
            },
            "top_correlations": [
                {
                    "metrics": [metric_a, metric_b],
                    "correlation": asdict(correlation)
                }
                for (metric_a, metric_b), correlation in sorted(
                    self.correlation_matrix.items(),
                    key=lambda x: abs(x[1].correlation_coefficient),
                    reverse=True
                )[:5]
            ],
            "benchmark_status": self._get_benchmark_status_summary(),
            "category_performance": self._get_category_performance_summary()
        }
        
        return dashboard_data
    
    def _get_benchmark_status_summary(self) -> Dict[str, Any]:
        """Get benchmark status summary"""
        
        benchmark_status = {}
        
        for category, metrics_buffer in self.metrics_buffer.items():
            recent_metrics = defaultdict(list)
            
            # Get recent metrics
            cutoff_time = datetime.now() - timedelta(hours=24)
            for metric in metrics_buffer:
                if metric.timestamp > cutoff_time:
                    recent_metrics[metric.name].append(metric.value)
            
            category_benchmarks = {}
            for metric_name, values in recent_metrics.items():
                if metric_name in self.benchmarks and values:
                    current_avg = statistics.mean(values)
                    benchmark = self.benchmarks[metric_name]
                    
                    category_benchmarks[metric_name] = BenchmarkComparison(
                        metric_name=metric_name,
                        current_value=current_avg,
                        benchmark_value=benchmark,
                        variance_percent=abs(current_avg - benchmark) / benchmark * 100,
                        performance_rating=self._calculate_performance_rating(current_avg, benchmark),
                        improvement_potential=max(0, benchmark - current_avg) / benchmark * 100,
                        benchmark_source="industry_standard"
                    )
            
            if category_benchmarks:
                benchmark_status[category.value] = {
                    name: asdict(comparison) for name, comparison in category_benchmarks.items()
                }
        
        return benchmark_status
    
    def _get_category_performance_summary(self) -> Dict[str, Any]:
        """Get performance summary by category"""
        
        category_summary = {}
        
        for category, metrics_buffer in self.metrics_buffer.items():
            if not metrics_buffer:
                continue
            
            recent_metrics = [
                metric for metric in metrics_buffer
                if metric.timestamp > datetime.now() - timedelta(hours=24)
            ]
            
            if recent_metrics:
                values = [metric.value for metric in recent_metrics]
                
                category_summary[category.value] = {
                    "metric_count": len(recent_metrics),
                    "avg_value": statistics.mean(values),
                    "min_value": min(values),
                    "max_value": max(values),
                    "std_deviation": statistics.stdev(values) if len(values) > 1 else 0,
                    "recent_trend": self._calculate_simple_trend(values),
                    "health_score": self._calculate_category_health_score(category, recent_metrics)
                }
        
        return category_summary
    
    def _calculate_simple_trend(self, values: List[float]) -> str:
        """Calculate simple trend direction"""
        
        if len(values) < 2:
            return "stable"
        
        recent_half = values[len(values)//2:]
        early_half = values[:len(values)//2]
        
        recent_avg = statistics.mean(recent_half)
        early_avg = statistics.mean(early_half)
        
        change_percent = abs(recent_avg - early_avg) / early_avg * 100 if early_avg != 0 else 0
        
        if change_percent < 5:
            return "stable"
        elif recent_avg > early_avg:
            return "increasing"
        else:
            return "decreasing"
    
    def _calculate_category_health_score(self, category: MetricCategory, metrics: List[PerformanceMetric]) -> float:
        """Calculate health score for metric category"""
        
        if not metrics:
            return 0.5
        
        # Base score calculation
        values = [metric.value for metric in metrics]
        
        # Category-specific health scoring
        if category == MetricCategory.ORCHESTRATION:
            # Higher values generally better for orchestration metrics
            normalized_values = [min(1.0, value) for value in values]
            return statistics.mean(normalized_values)
        
        elif category == MetricCategory.SYSTEM_RESOURCES:
            # Resource utilization - optimal around 70%
            optimal_utilization = 0.7
            health_scores = [
                1.0 - abs(value - optimal_utilization) / optimal_utilization
                for value in values if 0 <= value <= 1
            ]
            return statistics.mean(health_scores) if health_scores else 0.5
        
        else:
            # Default: assume higher values are better
            normalized_values = [min(1.0, max(0.0, value)) for value in values]
            return statistics.mean(normalized_values)
    
    def get_insights_by_category(self, category: MetricCategory) -> List[PerformanceInsight]:
        """Get insights filtered by category"""
        
        return [
            insight for insight in self.processed_insights
            if insight.category == category
        ]
    
    def get_insights_by_severity(self, severity: str) -> List[PerformanceInsight]:
        """Get insights filtered by severity"""
        
        return [
            insight for insight in self.processed_insights
            if insight.severity == severity
        ]
    
    def get_metric_analysis(self, metric_name: str) -> Dict[str, Any]:
        """Get detailed analysis for specific metric"""
        
        analysis = {
            "metric_name": metric_name,
            "category": self._categorize_metric(metric_name).value,
            "trend_analysis": None,
            "correlations": [],
            "benchmark_comparison": None,
            "recent_insights": []
        }
        
        # Trend analysis
        if metric_name in self.trend_analyses:
            analysis["trend_analysis"] = asdict(self.trend_analyses[metric_name])
        
        # Correlations
        for (metric_a, metric_b), correlation in self.correlation_matrix.items():
            if metric_name in [metric_a, metric_b]:
                analysis["correlations"].append({
                    "other_metric": metric_b if metric_name == metric_a else metric_a,
                    "correlation": asdict(correlation)
                })
        
        # Benchmark comparison
        if metric_name in self.benchmarks:
            # Get recent values
            recent_values = []
            for metrics_buffer in self.metrics_buffer.values():
                for metric in metrics_buffer:
                    if metric.name == metric_name and metric.timestamp > datetime.now() - timedelta(hours=24):
                        recent_values.append(metric.value)
            
            if recent_values:
                current_avg = statistics.mean(recent_values)
                benchmark = self.benchmarks[metric_name]
                
                analysis["benchmark_comparison"] = asdict(BenchmarkComparison(
                    metric_name=metric_name,
                    current_value=current_avg,
                    benchmark_value=benchmark,
                    variance_percent=abs(current_avg - benchmark) / benchmark * 100,
                    performance_rating=self._calculate_performance_rating(current_avg, benchmark),
                    improvement_potential=max(0, benchmark - current_avg) / benchmark * 100,
                    benchmark_source="industry_standard"
                ))
        
        # Related insights
        analysis["recent_insights"] = [
            asdict(insight) for insight in self.processed_insights
            if metric_name in insight.title or metric_name in str(insight.supporting_data)
        ]
        
        return analysis
    
    async def shutdown(self):
        """Shutdown performance analytics engine"""
        
        logger.info("Shutting down performance analytics engine...")
        
        # Cancel analysis tasks
        for task in self.analysis_tasks:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
        
        logger.info("Performance analytics engine shutdown complete")

# Global analytics engine instance
_performance_analytics: Optional[PerformanceAnalyticsEngine] = None

def get_performance_analytics() -> PerformanceAnalyticsEngine:
    """Get global performance analytics engine instance"""
    global _performance_analytics
    
    if _performance_analytics is None:
        _performance_analytics = PerformanceAnalyticsEngine()
    
    return _performance_analytics

async def initialize_performance_analytics(retention_days: int = 90) -> bool:
    """Initialize global performance analytics engine"""
    global _performance_analytics
    
    _performance_analytics = PerformanceAnalyticsEngine(retention_days)
    return await _performance_analytics.initialize()

# Convenience functions for recording metrics
async def record_orchestration_metric(name: str, value: float, tags: Dict[str, str] = None):
    """Record orchestration performance metric"""
    
    analytics = get_performance_analytics()
    metric = PerformanceMetric(
        metric_id=str(uuid.uuid4()),
        name=name,
        category=MetricCategory.ORCHESTRATION,
        value=value,
        timestamp=datetime.now(),
        tags=tags or {}
    )
    await analytics.record_metric(metric)

async def record_bot_performance_metric(bot_type: BotType, name: str, value: float, tags: Dict[str, str] = None):
    """Record bot performance metric"""
    
    analytics = get_performance_analytics()
    metric_tags = (tags or {}).copy()
    metric_tags["bot_type"] = bot_type.value
    
    metric = PerformanceMetric(
        metric_id=str(uuid.uuid4()),
        name=name,
        category=MetricCategory.BOT_PERFORMANCE,
        value=value,
        timestamp=datetime.now(),
        tags=metric_tags
    )
    await analytics.record_metric(metric)

async def record_triangle_defense_metric(formation: str, name: str, value: float, tags: Dict[str, str] = None):
    """Record Triangle Defense performance metric"""
    
    analytics = get_performance_analytics()
    metric_tags = (tags or {}).copy()
    metric_tags["formation"] = formation
    
    metric = PerformanceMetric(
        metric_id=str(uuid.uuid4()),
        name=name,
        category=MetricCategory.TRIANGLE_DEFENSE,
        value=value,
        timestamp=datetime.now(),
        tags=metric_tags
    )
    await analytics.record_metric(metric)
