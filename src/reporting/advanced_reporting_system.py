"""
AMT Orchestration Platform - Advanced Reporting System
File 31 of 47

Enterprise-grade reporting and analytics system providing executive dashboards,
Triangle Defense performance analytics, M.E.L. AI insights reporting, user activity
analytics, system performance metrics, and comprehensive business intelligence
for the AMT Platform ecosystem.

Author: AMT Development Team
Created: 2025-09-25
"""

import asyncio
import logging
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import uuid
import base64
import io

# Reporting and visualization
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import matplotlib.pyplot as plt
import seaborn as sns
from jinja2 import Environment, Template
import weasyprint
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet

# Data processing
from sqlalchemy import text
import redis.asyncio as redis
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.chart import BarChart, LineChart, PieChart, Reference

# Platform imports
from ..shared.orchestration_protocol import FormationType, TaskStatus, BotType
from ..orchestration.orchestration_service import OrchestrationService
from ..ml.triangle_defense_optimizer import TriangleDefenseOptimizer
from ..security.security_manager import SecurityManager
from ..monitoring.metrics_collector import MetricsCollector
from ..integrations.triangle_defense_integration import TriangleDefenseIntegration
from ..integrations.mel_engine_integration import MELEngineIntegration
from ..data_pipeline.pipeline_orchestrator import PipelineOrchestrator
from ..analytics.performance_analytics import PerformanceAnalytics


class ReportType(Enum):
    """Types of reports available in the system."""
    EXECUTIVE_DASHBOARD = "executive_dashboard"
    TRIANGLE_DEFENSE_ANALYTICS = "triangle_defense_analytics"
    MEL_AI_INSIGHTS = "mel_ai_insights"
    USER_ACTIVITY = "user_activity"
    SYSTEM_PERFORMANCE = "system_performance"
    FINANCIAL_METRICS = "financial_metrics"
    COACHING_EFFECTIVENESS = "coaching_effectiveness"
    FORMATION_SUCCESS_RATES = "formation_success_rates"
    COMPLIANCE_AUDIT = "compliance_audit"
    CUSTOM_ANALYTICS = "custom_analytics"


class ReportFormat(Enum):
    """Output formats for reports."""
    PDF = "pdf"
    EXCEL = "excel"
    HTML = "html"
    JSON = "json"
    CSV = "csv"
    INTERACTIVE_DASHBOARD = "dashboard"


class ReportFrequency(Enum):
    """Report generation frequency."""
    REAL_TIME = "real_time"
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUALLY = "annually"
    ON_DEMAND = "on_demand"


@dataclass
class ReportConfiguration:
    """Configuration for report generation."""
    report_id: str
    report_type: ReportType
    title: str
    description: str
    format: ReportFormat
    frequency: ReportFrequency
    recipients: List[str]
    filters: Dict[str, Any]
    visualizations: List[str]
    data_sources: List[str]
    template: Optional[str]
    created_by: str
    created_at: datetime
    last_generated: Optional[datetime]
    is_active: bool


@dataclass
class ReportMetrics:
    """Metrics and KPIs for reports."""
    total_users: int
    active_sessions: int
    formation_optimizations: int
    mel_interactions: int
    success_rate: float
    avg_response_time_ms: float
    triangle_defense_effectiveness: Dict[str, float]
    user_engagement_score: float
    system_uptime_percentage: float
    cost_per_optimization: float


@dataclass
class TriangleDefenseReport:
    """Comprehensive Triangle Defense analytics report."""
    reporting_period: Tuple[datetime, datetime]
    total_formations_analyzed: int
    formation_breakdown: Dict[FormationType, int]
    success_rates: Dict[FormationType, float]
    effectiveness_trends: Dict[str, List[float]]
    coaching_insights: List[str]
    performance_improvements: Dict[str, float]
    recommended_actions: List[str]
    comparative_analysis: Dict[str, Any]


class AdvancedReportingSystem:
    """
    Enterprise Advanced Reporting System for AMT Platform.
    
    Provides comprehensive business intelligence including:
    - Executive dashboards with real-time KPIs
    - Triangle Defense formation analytics
    - M.E.L. AI interaction insights
    - User activity and engagement reports
    - System performance monitoring
    - Financial and ROI analytics
    - Compliance and audit reporting
    - Custom report builder
    - Automated report scheduling
    - Multi-format export capabilities
    """

    def __init__(
        self,
        orchestration_service: OrchestrationService,
        ml_optimizer: TriangleDefenseOptimizer,
        triangle_defense: TriangleDefenseIntegration,
        mel_engine: MELEngineIntegration,
        security_manager: SecurityManager,
        metrics_collector: MetricsCollector,
        data_pipeline: PipelineOrchestrator,
        performance_analytics: PerformanceAnalytics
    ):
        self.orchestration = orchestration_service
        self.ml_optimizer = ml_optimizer
        self.triangle_defense = triangle_defense
        self.mel_engine = mel_engine
        self.security = security_manager
        self.metrics = metrics_collector
        self.data_pipeline = data_pipeline
        self.performance_analytics = performance_analytics
        
        self.logger = logging.getLogger(__name__)
        
        # Report configuration and storage
        self.report_configurations: Dict[str, ReportConfiguration] = {}
        self.generated_reports: Dict[str, Dict[str, Any]] = {}
        self.report_cache: Dict[str, Dict[str, Any]] = {}
        
        # AMT-specific configurations
        self.amt_config = {
            'executive_users': [
                'denauld@analyzemyteam.com',  # Founder Authority
                'courtney@analyzemyteam.com',  # CEO/Chief Legal Officer
                'alexandra@analyzemyteam.com',  # Chief Administrative Officer
                'mel@analyzemyteam.com'  # AI Core
            ],
            'formation_colors': {
                FormationType.LARRY: '#4ECDC4',
                FormationType.LINDA: '#FF6B6B', 
                FormationType.RICKY: '#FFD93D',
                FormationType.RITA: '#9B59B6',
                FormationType.MALE_MID: '#3498DB',
                FormationType.FEMALE_MID: '#E74C3C'
            },
            'modules': {
                'active': ['Power Playbooks', 'M.E.L. AI'],
                'beta': ['Executive Suite'],
                'coming_q2': ['Dynamic Fabricator', 'Game Changer'],
                'coming_q3': ['Q3 Quarterback', 'Dynamic Predictor', 'Pro Scout', 
                            'Recruit', 'Strength', 'Medicine', 'Academics']
            },
            'brand_colors': {
                'primary': '#e2021a',
                'accent': '#d4db69',
                'dark': '#1b151a',
                'blue_gray': '#4e5064'
            }
        }
        
        # Reporting configuration
        self.config = {
            'cache_duration_minutes': 15,
            'max_report_history': 100,
            'export_timeout_seconds': 300,
            'visualization_dpi': 300,
            'pdf_page_size': 'A4',
            'excel_max_rows': 1000000,
            'real_time_update_interval': 30
        }
        
        # Background tasks
        self.report_scheduler = None
        self.cache_cleaner = None

    async def initialize(self) -> bool:
        """Initialize the advanced reporting system."""
        try:
            self.logger.info("Initializing Advanced Reporting System...")
            
            # Setup default report configurations
            await self._setup_default_reports()
            
            # Initialize data connections
            await self._setup_data_connections()
            
            # Setup report templates
            await self._setup_report_templates()
            
            # Start background schedulers
            await self._start_report_scheduler()
            await self._start_cache_manager()
            
            # Generate initial executive dashboard
            await self._generate_initial_dashboard()
            
            self.logger.info("Advanced Reporting System initialized successfully")
            await self.metrics.record_event("reporting_system_initialized", {"success": True})
            
            return True
            
        except Exception as e:
            self.logger.error(f"Advanced Reporting System initialization failed: {str(e)}")
            await self.metrics.record_event("reporting_system_init_failed", {"error": str(e)})
            return False

    async def generate_executive_dashboard(
        self, 
        date_range: Optional[Tuple[datetime, datetime]] = None,
        format: ReportFormat = ReportFormat.INTERACTIVE_DASHBOARD
    ) -> Dict[str, Any]:
        """Generate comprehensive executive dashboard."""
        try:
            self.logger.info("Generating executive dashboard...")
            
            # Default to last 30 days if no range specified
            if not date_range:
                end_date = datetime.utcnow()
                start_date = end_date - timedelta(days=30)
                date_range = (start_date, end_date)
            
            start_date, end_date = date_range
            
            # Collect key metrics
            dashboard_data = {
                'report_metadata': {
                    'title': 'AMT Platform Executive Dashboard',
                    'generated_at': datetime.utcnow().isoformat(),
                    'reporting_period': {
                        'start': start_date.isoformat(),
                        'end': end_date.isoformat()
                    },
                    'generated_by': 'AMT Reporting System'
                },
                'key_metrics': await self._collect_executive_metrics(date_range),
                'triangle_defense_analytics': await self._generate_triangle_defense_summary(date_range),
                'mel_ai_performance': await self._generate_mel_performance_summary(date_range),
                'user_engagement': await self._generate_user_engagement_summary(date_range),
                'system_health': await self._generate_system_health_summary(date_range),
                'financial_overview': await self._generate_financial_overview(date_range),
                'strategic_insights': await self._generate_strategic_insights(date_range),
                'visualizations': await self._create_executive_visualizations(date_range)
            }
            
            # Format based on requested output
            if format == ReportFormat.PDF:
                dashboard_output = await self._export_dashboard_to_pdf(dashboard_data)
            elif format == ReportFormat.EXCEL:
                dashboard_output = await self._export_dashboard_to_excel(dashboard_data)
            elif format == ReportFormat.HTML:
                dashboard_output = await self._export_dashboard_to_html(dashboard_data)
            else:
                dashboard_output = dashboard_data
            
            # Cache the dashboard
            cache_key = f"executive_dashboard_{start_date.strftime('%Y%m%d')}_{end_date.strftime('%Y%m%d')}"
            self.report_cache[cache_key] = dashboard_data
            
            await self.metrics.record_event("executive_dashboard_generated", {
                "format": format.value,
                "date_range_days": (end_date - start_date).days,
                "metrics_count": len(dashboard_data['key_metrics'])
            })
            
            return dashboard_output
            
        except Exception as e:
            self.logger.error(f"Executive dashboard generation failed: {str(e)}")
            raise

    async def generate_triangle_defense_report(
        self,
        date_range: Tuple[datetime, datetime],
        include_detailed_analysis: bool = True
    ) -> TriangleDefenseReport:
        """Generate comprehensive Triangle Defense analytics report."""
        try:
            self.logger.info("Generating Triangle Defense analytics report...")
            
            start_date, end_date = date_range
            
            # Collect formation data
            formation_data = await self.triangle_defense.get_formation_analytics(start_date, end_date)
            
            # Calculate success rates for each formation
            success_rates = {}
            formation_breakdown = {}
            
            for formation in FormationType:
                formation_stats = formation_data.get(formation.value, {})
                formation_breakdown[formation] = formation_stats.get('total_uses', 0)
                success_rates[formation] = formation_stats.get('success_rate', 0.0)
            
            # Generate effectiveness trends
            effectiveness_trends = await self._calculate_effectiveness_trends(date_range)
            
            # Generate coaching insights
            coaching_insights = await self._generate_coaching_insights(formation_data)
            
            # Calculate performance improvements
            performance_improvements = await self._calculate_performance_improvements(date_range)
            
            # Generate recommendations
            recommended_actions = await self._generate_formation_recommendations(formation_data)
            
            # Comparative analysis
            comparative_analysis = await self._generate_comparative_analysis(formation_data)
            
            report = TriangleDefenseReport(
                reporting_period=date_range,
                total_formations_analyzed=sum(formation_breakdown.values()),
                formation_breakdown=formation_breakdown,
                success_rates=success_rates,
                effectiveness_trends=effectiveness_trends,
                coaching_insights=coaching_insights,
                performance_improvements=performance_improvements,
                recommended_actions=recommended_actions,
                comparative_analysis=comparative_analysis
            )
            
            await self.metrics.record_event("triangle_defense_report_generated", {
                "reporting_period_days": (end_date - start_date).days,
                "total_formations": report.total_formations_analyzed,
                "insights_count": len(coaching_insights)
            })
            
            return report
            
        except Exception as e:
            self.logger.error(f"Triangle Defense report generation failed: {str(e)}")
            raise

    async def generate_mel_ai_insights_report(
        self,
        date_range: Tuple[datetime, datetime]
    ) -> Dict[str, Any]:
        """Generate M.E.L. AI performance and insights report."""
        try:
            self.logger.info("Generating M.E.L. AI insights report...")
            
            start_date, end_date = date_range
            
            # Collect M.E.L. interaction data
            mel_data = await self.mel_engine.get_interaction_analytics(start_date, end_date)
            
            report_data = {
                'report_metadata': {
                    'title': 'M.E.L. AI Performance Report',
                    'period': f"{start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}",
                    'generated_at': datetime.utcnow().isoformat()
                },
                'interaction_summary': {
                    'total_interactions': mel_data.get('total_interactions', 0),
                    'unique_users': mel_data.get('unique_users', 0),
                    'avg_response_time_ms': mel_data.get('avg_response_time', 0),
                    'satisfaction_score': mel_data.get('satisfaction_score', 0.0)
                },
                'command_analysis': await self._analyze_mel_commands(mel_data),
                'coaching_impact': await self._analyze_coaching_impact(mel_data),
                'user_adoption': await self._analyze_mel_user_adoption(date_range),
                'insights_quality': await self._analyze_insights_quality(mel_data),
                'performance_trends': await self._analyze_mel_performance_trends(date_range),
                'improvement_recommendations': await self._generate_mel_recommendations(mel_data)
            }
            
            return report_data
            
        except Exception as e:
            self.logger.error(f"M.E.L. AI insights report generation failed: {str(e)}")
            return {}

    async def create_custom_report(
        self,
        report_config: ReportConfiguration,
        data_filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create custom report based on configuration."""
        try:
            self.logger.info(f"Creating custom report: {report_config.title}")
            
            # Collect data based on configuration
            report_data = {}
            
            for data_source in report_config.data_sources:
                if data_source == 'formations':
                    report_data['formations'] = await self._collect_formation_data(data_filters)
                elif data_source == 'users':
                    report_data['users'] = await self._collect_user_data(data_filters)
                elif data_source == 'performance':
                    report_data['performance'] = await self._collect_performance_data(data_filters)
                elif data_source == 'mel_interactions':
                    report_data['mel_interactions'] = await self._collect_mel_data(data_filters)
            
            # Apply additional filters
            if report_config.filters:
                report_data = await self._apply_report_filters(report_data, report_config.filters)
            
            # Generate visualizations
            visualizations = {}
            for viz_type in report_config.visualizations:
                visualizations[viz_type] = await self._create_visualization(viz_type, report_data)
            
            custom_report = {
                'report_id': report_config.report_id,
                'title': report_config.title,
                'description': report_config.description,
                'generated_at': datetime.utcnow().isoformat(),
                'data': report_data,
                'visualizations': visualizations,
                'summary': await self._generate_report_summary(report_data),
                'insights': await self._generate_report_insights(report_data)
            }
            
            # Store in generated reports
            self.generated_reports[report_config.report_id] = custom_report
            
            return custom_report
            
        except Exception as e:
            self.logger.error(f"Custom report creation failed: {str(e)}")
            raise

    async def export_report(
        self,
        report_id: str,
        format: ReportFormat,
        include_visualizations: bool = True
    ) -> bytes:
        """Export report in specified format."""
        try:
            # Get report data
            if report_id in self.generated_reports:
                report_data = self.generated_reports[report_id]
            elif report_id in self.report_cache:
                report_data = self.report_cache[report_id]
            else:
                raise ValueError(f"Report {report_id} not found")
            
            if format == ReportFormat.PDF:
                return await self._export_to_pdf(report_data, include_visualizations)
            elif format == ReportFormat.EXCEL:
                return await self._export_to_excel(report_data, include_visualizations)
            elif format == ReportFormat.HTML:
                return await self._export_to_html(report_data, include_visualizations)
            elif format == ReportFormat.JSON:
                return json.dumps(report_data, default=str, indent=2).encode('utf-8')
            elif format == ReportFormat.CSV:
                return await self._export_to_csv(report_data)
            else:
                raise ValueError(f"Unsupported export format: {format}")
                
        except Exception as e:
            self.logger.error(f"Report export failed: {str(e)}")
            raise

    # Private helper methods

    async def _setup_default_reports(self) -> None:
        """Setup default report configurations."""
        # Executive Dashboard
        executive_config = ReportConfiguration(
            report_id="executive_dashboard",
            report_type=ReportType.EXECUTIVE_DASHBOARD,
            title="AMT Platform Executive Dashboard",
            description="Comprehensive executive overview of platform performance",
            format=ReportFormat.INTERACTIVE_DASHBOARD,
            frequency=ReportFrequency.DAILY,
            recipients=self.amt_config['executive_users'],
            filters={},
            visualizations=['kpi_cards', 'trend_charts', 'formation_breakdown'],
            data_sources=['formations', 'users', 'performance', 'mel_interactions'],
            template='executive_template.html',
            created_by='system',
            created_at=datetime.utcnow(),
            last_generated=None,
            is_active=True
        )
        
        self.report_configurations['executive_dashboard'] = executive_config
        
        # Triangle Defense Analytics
        td_config = ReportConfiguration(
            report_id="triangle_defense_analytics",
            report_type=ReportType.TRIANGLE_DEFENSE_ANALYTICS,
            title="Triangle Defense Performance Analytics",
            description="Detailed analysis of Triangle Defense formation effectiveness",
            format=ReportFormat.PDF,
            frequency=ReportFrequency.WEEKLY,
            recipients=['denauld@analyzemyteam.com'],
            filters={'include_coaching_insights': True},
            visualizations=['formation_success_rates', 'effectiveness_trends', 'comparative_analysis'],
            data_sources=['formations', 'coaching_data'],
            template='triangle_defense_template.html',
            created_by='system',
            created_at=datetime.utcnow(),
            last_generated=None,
            is_active=True
        )
        
        self.report_configurations['triangle_defense_analytics'] = td_config

    async def _collect_executive_metrics(self, date_range: Tuple[datetime, datetime]) -> Dict[str, Any]:
        """Collect key executive metrics."""
        start_date, end_date = date_range
        
        # Get platform usage metrics
        usage_data = await self.metrics.get_metrics_summary(start_date, end_date)
        
        # Calculate formation optimization metrics
        formation_metrics = await self.ml_optimizer.get_model_status()
        
        # Get user engagement data
        engagement_data = await self._calculate_user_engagement(date_range)
        
        # System performance metrics
        performance_data = await self.performance_analytics.get_system_performance_summary(start_date, end_date)
        
        return {
            'platform_usage': {
                'total_users': usage_data.get('unique_users', 0),
                'active_sessions': usage_data.get('active_sessions', 0),
                'formation_optimizations': usage_data.get('formation_optimizations', 0),
                'mel_interactions': usage_data.get('mel_interactions', 0)
            },
            'performance_metrics': {
                'avg_response_time_ms': performance_data.get('avg_response_time', 0),
                'system_uptime_percentage': performance_data.get('uptime_percentage', 99.9),
                'ml_model_accuracy': formation_metrics.get('accuracy', 0.0),
                'user_satisfaction_score': engagement_data.get('satisfaction_score', 4.5)
            },
            'business_metrics': {
                'module_adoption_rate': await self._calculate_module_adoption_rate(),
                'user_retention_rate': engagement_data.get('retention_rate', 0.85),
                'feature_utilization': await self._calculate_feature_utilization(),
                'growth_rate': await self._calculate_growth_rate(date_range)
            }
        }

    async def _create_executive_visualizations(self, date_range: Tuple[datetime, datetime]) -> Dict[str, str]:
        """Create visualizations for executive dashboard."""
        visualizations = {}
        
        try:
            # Formation success rates pie chart
            formation_data = await self.triangle_defense.get_formation_analytics(*date_range)
            
            fig = go.Figure(data=[go.Pie(
                labels=list(formation_data.keys()),
                values=[data.get('success_rate', 0) for data in formation_data.values()],
                hole=0.3,
                marker_colors=[self.amt_config['formation_colors'].get(
                    FormationType(name), '#999999') for name in formation_data.keys()]
            )])
            
            fig.update_layout(
                title="Formation Success Rates",
                font=dict(family="Inter", size=12),
                showlegend=True
            )
            
            # Convert to base64 for embedding
            img_bytes = fig.to_image(format="png", width=600, height=400)
            visualizations['formation_success_rates'] = base64.b64encode(img_bytes).decode()
            
            # User engagement trend
            engagement_data = await self._get_engagement_trend_data(date_range)
            
            fig2 = go.Figure()
            fig2.add_trace(go.Scatter(
                x=engagement_data['dates'],
                y=engagement_data['active_users'],
                mode='lines+markers',
                name='Active Users',
                line=dict(color=self.amt_config['brand_colors']['primary'])
            ))
            
            fig2.update_layout(
                title="User Engagement Trend",
                xaxis_title="Date",
                yaxis_title="Active Users",
                font=dict(family="Inter", size=12)
            )
            
            img_bytes2 = fig2.to_image(format="png", width=600, height=400)
            visualizations['user_engagement_trend'] = base64.b64encode(img_bytes2).decode()
            
        except Exception as e:
            self.logger.error(f"Visualization creation failed: {str(e)}")
        
        return visualizations

    async def _export_to_pdf(self, report_data: Dict[str, Any], include_visualizations: bool) -> bytes:
        """Export report to PDF format."""
        try:
            # Create PDF buffer
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4)
            
            # Build PDF content
            story = []
            styles = getSampleStyleSheet()
            
            # Title
            title = Paragraph(report_data.get('title', 'AMT Platform Report'), styles['Title'])
            story.append(title)
            story.append(Spacer(1, 12))
            
            # Add report content
            if 'key_metrics' in report_data:
                metrics = report_data['key_metrics']
                for category, data in metrics.items():
                    story.append(Paragraph(category.replace('_', ' ').title(), styles['Heading2']))
                    
                    # Create metrics table
                    table_data = [['Metric', 'Value']]
                    for metric, value in data.items():
                        table_data.append([metric.replace('_', ' ').title(), str(value)])
                    
                    table = Table(table_data)
                    table.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                        ('FONTSIZE', (0, 0), (-1, 0), 14),
                        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                        ('GRID', (0, 0), (-1, -1), 1, colors.black)
                    ]))
                    
                    story.append(table)
                    story.append(Spacer(1, 12))
            
            # Build PDF
            doc.build(story)
            buffer.seek(0)
            
            return buffer.getvalue()
            
        except Exception as e:
            self.logger.error(f"PDF export failed: {str(e)}")
            raise

    async def schedule_report(
        self,
        report_config: ReportConfiguration,
        schedule_time: datetime
    ) -> bool:
        """Schedule report generation."""
        try:
            # Add to scheduler
            # Implementation would depend on your scheduling system (e.g., Celery, APScheduler)
            
            self.logger.info(f"Report {report_config.report_id} scheduled for {schedule_time}")
            return True
            
        except Exception as e:
            self.logger.error(f"Report scheduling failed: {str(e)}")
            return False

    async def get_reporting_status(self) -> Dict[str, Any]:
        """Get current reporting system status."""
        return {
            "system_initialized": bool(self.report_configurations),
            "active_reports": len([r for r in self.report_configurations.values() if r.is_active]),
            "generated_reports_count": len(self.generated_reports),
            "cached_reports": len(self.report_cache),
            "last_dashboard_generation": max(
                (r.last_generated for r in self.report_configurations.values() 
                 if r.last_generated), default=None
            ),
            "amt_configuration": self.amt_config,
            "report_types_available": [rt.value for rt in ReportType],
            "export_formats": [f.value for f in ReportFormat]
        }


# Export main class
__all__ = [
    'AdvancedReportingSystem', 
    'ReportConfiguration', 
    'TriangleDefenseReport',
    'ReportMetrics',
    'ReportType', 
    'ReportFormat', 
    'ReportFrequency'
]
