"""
AMT Orchestration Platform - Airtable Connector Service
File 42 of 47

Comprehensive Airtable integration service providing bidirectional synchronization
with the Triangle Defense methodology database. Handles 33+ table integration,
AI Text field processing, M.E.L. AI coordination, real-time webhooks, role-based
access control, formation analysis workflows, and enterprise-grade data sync.

Author: AMT Development Team
Created: 2025-09-25
"""

import asyncio
import logging
import json
import hashlib
import hmac
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union, Tuple, Callable
from dataclasses import dataclass, field
from enum import Enum
import uuid
import aioredis
import asyncpg
from aiohttp import web, ClientSession
import httpx
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field
import pandas as pd
from cryptography.fernet import Fernet

# Airtable integration
from pyairtable import Api, Base, Table
from pyairtable.formulas import match

# Platform imports
from ..shared.orchestration_protocol import FormationType, TaskStatus, BotType
from ..orchestration.orchestration_service import OrchestrationService
from ..ml.triangle_defense_optimizer import TriangleDefenseOptimizer
from ..user_management.enterprise_user_management import EnterpriseUserManagement
from ..security.security_manager import SecurityManager
from ..monitoring.metrics_collector import MetricsCollector
from ..integrations.mel_engine_integration import MELEngineIntegration
from ..integrations.triangle_defense_integration import TriangleDefenseIntegration
from ..notifications.realtime_notification_system import RealTimeNotificationSystem
from ..automation.workflow_automation_system import WorkflowAutomationSystem
from ..content.content_management_system import ContentManagementSystem
from ..compliance.audit_compliance_system import AuditComplianceSystem


class SyncDirection(Enum):
    """Data synchronization direction."""
    BIDIRECTIONAL = "bidirectional"
    AIRTABLE_TO_AMT = "airtable_to_amt"
    AMT_TO_AIRTABLE = "amt_to_airtable"
    READ_ONLY = "read_only"


class SyncPriority(Enum):
    """Sync operation priority levels."""
    CRITICAL = "critical"      # Formation changes, game situations
    HIGH = "high"             # AI insights, coaching recommendations
    NORMAL = "normal"         # Staff updates, performance data
    LOW = "low"              # Historical data, analytics


class TriangleDefenseFormation(Enum):
    """Triangle Defense formation types with color coding."""
    LARRY_MALE = ("Larry (Male)", "#4ECDC4", "blueLight2")
    LINDA_FEMALE = ("Linda (Female)", "#FF6B6B", "cyanLight2")
    RICKY_MALE = ("Ricky (Male)", "#45B7D1", "greenLight2")
    RITA_FEMALE = ("Rita (Female)", "#96CEB4", "tealLight2")
    LEON_MALE = ("Leon (Male)", "#FFEAA7", "yellowLight2")
    RANDY_MALE = ("Randy (Male)", "#DDA0DD", "orangeLight2")
    PAT_NEUTRAL = ("Pat (Neutral)", "#98D8C8", "redLight2")


@dataclass
class AirtableTableConfig:
    """Configuration for Airtable table integration."""
    table_id: str
    table_name: str
    sync_direction: SyncDirection
    sync_priority: SyncPriority
    sync_interval_seconds: int = 300
    webhook_enabled: bool = True
    ai_fields_enabled: bool = False
    primary_key_field: str = "record_id"
    dependent_tables: List[str] = field(default_factory=list)
    transformation_rules: Dict[str, Any] = field(default_factory=dict)


@dataclass
class SyncOperation:
    """Represents a data synchronization operation."""
    operation_id: str
    table_config: AirtableTableConfig
    operation_type: str  # create, update, delete, bulk_sync
    direction: SyncDirection
    priority: SyncPriority
    data: Dict[str, Any]
    timestamp: datetime
    retry_count: int = 0
    max_retries: int = 3
    status: str = "pending"
    error_message: Optional[str] = None


@dataclass
class WebhookEvent:
    """Airtable webhook event data."""
    event_id: str
    base_id: str
    table_id: str
    record_id: str
    action_type: str  # created, updated, deleted
    changed_fields: List[str]
    webhook_id: str
    timestamp: datetime
    verified: bool = False


@dataclass
class FormationAnalysisSync:
    """Triangle Defense formation analysis sync data."""
    analysis_id: str
    formation_type: TriangleDefenseFormation
    hash_position: str
    field_zone: str
    down_situation: str
    mo_player_number: str
    expected_run_percentage: float
    actual_run_percentage: float
    pattern_status: str
    ai_insights: Dict[str, str]
    effectiveness_score: float
    coaching_recommendations: List[str]


class AirtableConnectorService:
    """
    Comprehensive Airtable Connector Service for AMT Platform.
    
    Provides enterprise-grade integration with Triangle Defense methodology
    database including:
    - Bidirectional sync with 33+ Airtable tables
    - Real-time webhook processing for critical formation changes
    - AI Text field integration with M.E.L. Claude Sonnet 4 engine
    - Triangle Defense 5-phase analysis workflow automation
    - Formation pattern recognition and break point detection
    - MO (Middle of 5 Offensive Eligibles) tracking system
    - Role-based access control across AMT organizational tiers
    - Intelligent caching and performance optimization
    - Enterprise security and compliance integration
    - Complex relationship mapping and dependency management
    - Automated conflict resolution and data validation
    - Performance analytics and sync monitoring
    """

    def __init__(
        self,
        airtable_api_key: str,
        base_id: str,
        webhook_secret: str,
        orchestration_service: OrchestrationService,
        ml_optimizer: TriangleDefenseOptimizer,
        user_management: EnterpriseUserManagement,
        mel_engine: MELEngineIntegration,
        triangle_defense: TriangleDefenseIntegration,
        notification_system: RealTimeNotificationSystem,
        workflow_system: WorkflowAutomationSystem,
        content_management: ContentManagementSystem,
        compliance_system: AuditComplianceSystem,
        security_manager: SecurityManager,
        metrics_collector: MetricsCollector
    ):
        # Store AMT platform services
        self.orchestration = orchestration_service
        self.ml_optimizer = ml_optimizer
        self.user_management = user_management
        self.mel_engine = mel_engine
        self.triangle_defense = triangle_defense
        self.notifications = notification_system
        self.workflows = workflow_system
        self.content_management = content_management
        self.compliance = compliance_system
        self.security = security_manager
        self.metrics = metrics_collector
        
        self.logger = logging.getLogger(__name__)
        
        # Airtable configuration
        self.api_key = airtable_api_key
        self.base_id = base_id
        self.webhook_secret = webhook_secret
        
        # Initialize Airtable API
        self.airtable_api = Api(self.api_key)
        self.base = self.airtable_api.base(self.base_id)
        
        # Table configurations based on discovered schema
        self.table_configs = self._initialize_table_configs()
        
        # Sync operation queue
        self.sync_queue = asyncio.Queue()
        self.webhook_queue = asyncio.Queue()
        
        # Caching and state management
        self.cache = {}
        self.sync_state = {}
        self.webhook_handlers = {}
        
        # Performance tracking
        self.sync_metrics = {
            'total_operations': 0,
            'successful_syncs': 0,
            'failed_syncs': 0,
            'webhook_events_processed': 0,
            'ai_field_updates': 0,
            'formation_analyses_synced': 0
        }
        
        # Background tasks
        self.sync_processor_task = None
        self.webhook_processor_task = None
        self.health_monitor_task = None
        
        # Triangle Defense configuration
        self.triangle_defense_config = {
            'formation_mappings': {
                'Larry (Male)': {
                    'color': '#4ECDC4',
                    'airtable_color': 'blueLight2',
                    'characteristics': ['mo_left', 'male_left', 'short_yardage'],
                    'effectiveness_threshold': 75.0
                },
                'Linda (Female)': {
                    'color': '#FF6B6B',
                    'airtable_color': 'cyanLight2',
                    'characteristics': ['female_left', 'balanced_attack'],
                    'effectiveness_threshold': 70.0
                },
                'Ricky (Male)': {
                    'color': '#45B7D1',
                    'airtable_color': 'greenLight2',
                    'characteristics': ['power_defense', 'mo_right'],
                    'effectiveness_threshold': 72.0
                },
                'Rita (Female)': {
                    'color': '#96CEB4',
                    'airtable_color': 'tealLight2',
                    'characteristics': ['female_right', 'pass_defense'],
                    'effectiveness_threshold': 68.0
                },
                'Leon (Male)': {
                    'color': '#FFEAA7',
                    'airtable_color': 'yellowLight2',
                    'characteristics': ['male_mid', 'versatile'],
                    'effectiveness_threshold': 71.0
                },
                'Randy (Male)': {
                    'color': '#DDA0DD',
                    'airtable_color': 'orangLight2',
                    'characteristics': ['male_mid', 'power_run'],
                    'effectiveness_threshold': 73.0
                },
                'Pat (Neutral)': {
                    'color': '#98D8C8',
                    'airtable_color': 'redLight2',
                    'characteristics': ['neutral', 'adaptive'],
                    'effectiveness_threshold': 69.0
                }
            },
            'phase_analysis': {
                'phase_1': 'Formation_Type',
                'phase_2': 'Hash_Position',
                'phase_3': 'Field_Zone',
                'phase_4': 'Formation_State',
                'phase_5': 'Down_Situation'
            },
            'ai_analysis_fields': [
                'Formation_Transition_Patterns',
                'MO_Movement_Sequences',
                'Effectiveness_Evaluation',
                'Pattern_Breaks_and_Deviations',
                'Comprehensive_Formation_Intelligence',
                'RP_Tendencies_by_Down',
                'Integrated_Tactical_Recommendations'
            ]
        }

    async def initialize(self) -> bool:
        """Initialize the Airtable connector service."""
        try:
            self.logger.info("Initializing Airtable Connector Service...")
            
            # Validate Airtable connection
            await self._validate_airtable_connection()
            
            # Setup webhook endpoints
            await self._setup_webhook_handlers()
            
            # Initialize table sync states
            await self._initialize_sync_states()
            
            # Setup caching
            await self._initialize_cache()
            
            # Start background processors
            await self._start_background_processors()
            
            # Perform initial sync check
            await self._perform_initial_sync_assessment()
            
            self.logger.info("Airtable Connector Service initialized successfully")
            await self.metrics.record_event("airtable_connector_initialized", {
                "tables_configured": len(self.table_configs),
                "webhook_handlers": len(self.webhook_handlers),
                "base_id": self.base_id
            })
            
            return True
            
        except Exception as e:
            self.logger.error(f"Airtable Connector Service initialization failed: {str(e)}")
            return False

    def _initialize_table_configs(self) -> Dict[str, AirtableTableConfig]:
        """Initialize table configurations based on discovered Airtable schema."""
        configs = {}
        
        # Core Triangle Defense Tables
        configs['triangle_influence_analysis'] = AirtableTableConfig(
            table_id='tblNvUVjYnmEU54tE',
            table_name='Triangle Influence Analysis',
            sync_direction=SyncDirection.BIDIRECTIONAL,
            sync_priority=SyncPriority.CRITICAL,
            sync_interval_seconds=60,
            webhook_enabled=True,
            ai_fields_enabled=True,
            dependent_tables=['amt_ai_agents', 'denauld_vision_hub']
        )
        
        configs['formation_breakdown'] = AirtableTableConfig(
            table_id='tblRRRbNqWGztTZ3d',
            table_name='Formation_Breakdown',
            sync_direction=SyncDirection.BIDIRECTIONAL,
            sync_priority=SyncPriority.CRITICAL,
            sync_interval_seconds=90,
            webhook_enabled=True,
            ai_fields_enabled=True
        )
        
        # M.E.L. AI Integration
        configs['mel_integration_hub'] = AirtableTableConfig(
            table_id='tbltiwxUbstUeey7G',
            table_name='MEL_Integration_Hub',
            sync_direction=SyncDirection.BIDIRECTIONAL,
            sync_priority=SyncPriority.HIGH,
            sync_interval_seconds=120,
            webhook_enabled=True,
            ai_fields_enabled=True
        )
        
        # Staff and User Management
        configs['amt_complete_staff_directory'] = AirtableTableConfig(
            table_id='tblmtQeXQOmZQPnHe',
            table_name='AMT_Complete_Staff_Directory_v2',
            sync_direction=SyncDirection.BIDIRECTIONAL,
            sync_priority=SyncPriority.HIGH,
            sync_interval_seconds=300,
            webhook_enabled=True,
            dependent_tables=['amt_ai_agents']
        )
        
        configs['amt_ai_agents'] = AirtableTableConfig(
            table_id='tblx4qFC4Ech1cuJj',
            table_name='AMT_AI_Agents',
            sync_direction=SyncDirection.BIDIRECTIONAL,
            sync_priority=SyncPriority.HIGH,
            sync_interval_seconds=180,
            webhook_enabled=True,
            dependent_tables=['triangle_influence_analysis']
        )
        
        # Mission Control and Operations
        configs['mission_control'] = AirtableTableConfig(
            table_id='tblgVLFsyL6ml97Cm',
            table_name='ANALYZEMEATEAM_MISSION_CONTROL',
            sync_direction=SyncDirection.BIDIRECTIONAL,
            sync_priority=SyncPriority.NORMAL,
            sync_interval_seconds=300,
            webhook_enabled=True
        )
        
        # Supporting Analysis Tables
        configs['larry_linda_classification'] = AirtableTableConfig(
            table_id='tbl0nqRpBT14afW72',
            table_name='Larry_Linda_Classification',
            sync_direction=SyncDirection.AIRTABLE_TO_AMT,
            sync_priority=SyncPriority.HIGH,
            sync_interval_seconds=120
        )
        
        configs['ricky_rita_classification'] = AirtableTableConfig(
            table_id='tblNtI2RBs2dUfj9Q',
            table_name='Ricky_Rita_Classification',
            sync_direction=SyncDirection.AIRTABLE_TO_AMT,
            sync_priority=SyncPriority.HIGH,
            sync_interval_seconds=120
        )
        
        configs['mo_position_tracking'] = AirtableTableConfig(
            table_id='tblEpKwSo31EZdzkW',
            table_name='MO_Position_Tracking',
            sync_direction=SyncDirection.BIDIRECTIONAL,
            sync_priority=SyncPriority.CRITICAL,
            sync_interval_seconds=60
        )
        
        configs['trigger_tilt_triangle_results'] = AirtableTableConfig(
            table_id='tbluGtoL7pVkRjuDz',
            table_name='Trigger_Tilt_Triangle_Results',
            sync_direction=SyncDirection.BIDIRECTIONAL,
            sync_priority=SyncPriority.HIGH,
            sync_interval_seconds=120
        )
        
        # Analytics and Performance
        configs['531_formation_analysis'] = AirtableTableConfig(
            table_id='tblpxLM3WjAn6sRhp',
            table_name='531_Formation_Analysis',
            sync_direction=SyncDirection.BIDIRECTIONAL,
            sync_priority=SyncPriority.NORMAL,
            sync_interval_seconds=300
        )
        
        configs['nfl_transactions'] = AirtableTableConfig(
            table_id='tblzhzzXQrAT9l67y',
            table_name='NFL_Transactions',
            sync_direction=SyncDirection.AIRTABLE_TO_AMT,
            sync_priority=SyncPriority.LOW,
            sync_interval_seconds=3600
        )
        
        return configs

    async def sync_triangle_defense_analysis(
        self,
        analysis_data: FormationAnalysisSync,
        force_update: bool = False
    ) -> bool:
        """Sync Triangle Defense formation analysis with Airtable."""
        try:
            # Get triangle influence analysis table
            table = self.base.table('Triangle Influence Analysis')
            
            # Prepare sync data with all 5-phase analysis components
            airtable_record = {
                'Formation_Type': analysis_data.formation_type.value[0],
                'Hash_Position': analysis_data.hash_position,
                'Field_Zone': analysis_data.field_zone,
                'Formation_State': 'Static (No Movement)' if 'static' in analysis_data.formation_type.value[2].lower() else 'Fluid (Pre-snap Movement)',
                'Down_Situation': analysis_data.down_situation,
                'MO_Player_Number': analysis_data.mo_player_number,
                'Expected_Run_Percentage': analysis_data.expected_run_percentage,
                'Actual_Run_Percentage': analysis_data.actual_run_percentage,
                'Pattern_Status': analysis_data.pattern_status,
                'Total_Influence_Percentages': analysis_data.effectiveness_score / 100.0,
                'Success_Rate': analysis_data.effectiveness_score / 100.0
            }
            
            # Check if record exists
            existing_records = table.all(formula=match({'Formation_Analysis_ID': analysis_data.analysis_id}))
            
            if existing_records and not force_update:
                # Update existing record
                record_id = existing_records[0]['id']
                updated_record = table.update(record_id, airtable_record)
                operation_type = 'update'
            else:
                # Create new record
                airtable_record['Formation_Analysis_ID'] = analysis_data.analysis_id
                created_record = table.create(airtable_record)
                operation_type = 'create'
                
            # Queue AI field processing for comprehensive analysis
            if analysis_data.ai_insights:
                await self._queue_ai_field_processing(
                    table_name='Triangle Influence Analysis',
                    record_id=created_record['id'] if operation_type == 'create' else record_id,
                    ai_insights=analysis_data.ai_insights
                )
            
            # Trigger M.E.L. AI coaching recommendations
            await self._trigger_mel_coaching_analysis(analysis_data)
            
            # Update sync metrics
            self.sync_metrics['formation_analyses_synced'] += 1
            
            await self.metrics.record_event("triangle_defense_analysis_synced", {
                "analysis_id": analysis_data.analysis_id,
                "formation_type": analysis_data.formation_type.value[0],
                "operation_type": operation_type,
                "effectiveness_score": analysis_data.effectiveness_score
            })
            
            return True
            
        except Exception as e:
            self.logger.error(f"Triangle Defense analysis sync failed: {str(e)}")
            return False

    async def process_webhook_event(self, webhook_data: Dict[str, Any]) -> bool:
        """Process incoming Airtable webhook events."""
        try:
            # Verify webhook signature
            if not await self._verify_webhook_signature(webhook_data):
                self.logger.warning("Invalid webhook signature received")
                return False
            
            # Parse webhook event
            event = WebhookEvent(
                event_id=str(uuid.uuid4()),
                base_id=webhook_data.get('base_id', self.base_id),
                table_id=webhook_data.get('table_id'),
                record_id=webhook_data.get('record_id'),
                action_type=webhook_data.get('action_type'),
                changed_fields=webhook_data.get('changed_fields', []),
                webhook_id=webhook_data.get('webhook_id'),
                timestamp=datetime.utcnow(),
                verified=True
            )
            
            # Queue webhook event for processing
            await self.webhook_queue.put(event)
            
            # For critical Triangle Defense changes, process immediately
            if await self._is_critical_formation_change(event):
                await self._process_critical_formation_change(event)
            
            self.sync_metrics['webhook_events_processed'] += 1
            
            return True
            
        except Exception as e:
            self.logger.error(f"Webhook event processing failed: {str(e)}")
            return False

    async def sync_mel_ai_insights(
        self,
        insights: Dict[str, Any],
        target_table: str = 'MEL_Integration_Hub'
    ) -> bool:
        """Sync M.E.L. AI coaching insights to Airtable."""
        try:
            table = self.base.table(target_table)
            
            # Prepare M.E.L. insights record
            mel_record = {
                'Integration_ID': insights.get('integration_id', str(uuid.uuid4())),
                'Analysis_Type': insights.get('analysis_type', 'Formation Analysis'),
                'Overall_MEL_Score': insights.get('mel_score', 0.0),
                'Analysis_Status': 'Completed',
                'Key_Insights_Summary': insights.get('insights_summary', ''),
                'Delivery_Date': datetime.utcnow().isoformat(),
                'Analysis_Complexity': insights.get('complexity_level', 'Intermediate')
            }
            
            # Add AI-generated analysis fields
            if 'mel_integration_insights' in insights:
                mel_record['MEL_Integration_Insights'] = insights['mel_integration_insights']
            
            if 'feedback_analysis' in insights:
                mel_record['Feedback_Analysis'] = insights['feedback_analysis']
            
            # Create or update record
            created_record = table.create(mel_record)
            
            # Trigger workflow automation for insights distribution
            await self._trigger_insights_distribution_workflow(insights, created_record['id'])
            
            self.sync_metrics['ai_field_updates'] += 1
            
            return True
            
        except Exception as e:
            self.logger.error(f"M.E.L. AI insights sync failed: {str(e)}")
            return False

    async def get_formation_analysis_data(
        self,
        formation_type: Optional[str] = None,
        field_zone: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Retrieve Triangle Defense formation analysis data from Airtable."""
        try:
            table = self.base.table('Triangle Influence Analysis')
            
            # Build filter formula
            filters = []
            if formation_type:
                filters.append(f"{{Formation_Type}} = '{formation_type}'")
            if field_zone:
                filters.append(f"{{Field_Zone}} = '{field_zone}'")
            
            formula = None
            if filters:
                formula = "AND(" + ", ".join(filters) + ")"
            
            # Fetch records
            records = table.all(formula=formula, max_records=limit)
            
            # Transform to standardized format
            analysis_data = []
            for record in records:
                fields = record['fields']
                analysis_data.append({
                    'record_id': record['id'],
                    'analysis_id': fields.get('Triangle_Analysis_ID'),
                    'formation_type': fields.get('Formation_Type'),
                    'hash_position': fields.get('Hash_Position'),
                    'field_zone': fields.get('Field_Zone'),
                    'down_situation': fields.get('Down_Situation'),
                    'mo_player_number': fields.get('MO_Player_Number'),
                    'expected_run_percentage': fields.get('Expected_Run_Percentage', 0.0),
                    'actual_run_percentage': fields.get('Actual_Run_Percentage', 0.0),
                    'pattern_status': fields.get('Pattern_Status'),
                    'effectiveness_score': fields.get('Total_Influence_Percentages', 0.0) * 100,
                    'success_rate': fields.get('Success_Rate', 0.0) * 100,
                    'ai_insights': {
                        'formation_transition_patterns': fields.get('Formation_Transition_Patterns'),
                        'mo_movement_sequences': fields.get('MO_Movement_Sequences'),
                        'effectiveness_evaluation': fields.get('Effectiveness_Evaluation'),
                        'pattern_breaks_deviations': fields.get('Pattern_Breaks_and_Deviations'),
                        'comprehensive_intelligence': fields.get('Comprehensive_Formation_Intelligence'),
                        'rp_tendencies': fields.get('RP_Tendencies_by_Down'),
                        'tactical_recommendations': fields.get('Integrated_Tactical_Recommendations')
                    }
                })
            
            return analysis_data
            
        except Exception as e:
            self.logger.error(f"Formation analysis data retrieval failed: {str(e)}")
            return []

    async def sync_staff_directory_updates(self) -> bool:
        """Sync AMT staff directory changes with user management system."""
        try:
            table = self.base.table('AMT_Complete_Staff_Directory_v2')
            
            # Get all active staff records
            staff_records = table.all(formula="{{Employment_Status}} = 'Active'")
            
            for record in staff_records:
                fields = record['fields']
                
                # Map Airtable staff data to AMT user management format
                user_data = {
                    'user_id': fields.get('Employee_ID'),
                    'email': fields.get('Contact_Email'),
                    'name': fields.get('Position_Title'),
                    'department': fields.get('Department'),
                    'access_level': self._map_access_level(fields.get('Access_Level')),
                    'staff_tier': fields.get('Staff_Tier'),
                    'security_clearance': fields.get('Security_Clearance'),
                    'company_assignment': fields.get('Company_Assignment', []),
                    'expertise_areas': fields.get('Primary_Expertise', []),
                    'reports_to': fields.get('Reports_To'),
                    'performance_rating': fields.get('Performance_Rating'),
                    'years_experience': fields.get('Years_Experience', 0)
                }
                
                # Sync with enterprise user management
                await self.user_management.sync_user_from_airtable(user_data)
            
            return True
            
        except Exception as e:
            self.logger.error(f"Staff directory sync failed: {str(e)}")
            return False

    # Private helper methods
    
    async def _validate_airtable_connection(self) -> bool:
        """Validate connection to Airtable base."""
        try:
            # Test connection by fetching base metadata
            base_metadata = self.base.schema()
            
            if not base_metadata or 'tables' not in base_metadata:
                raise Exception("Invalid base metadata received")
            
            # Verify critical tables exist
            table_names = [table['name'] for table in base_metadata['tables']]
            critical_tables = ['Triangle Influence Analysis', 'Formation_Breakdown', 'MEL_Integration_Hub']
            
            for critical_table in critical_tables:
                if critical_table not in table_names:
                    self.logger.warning(f"Critical table '{critical_table}' not found in base")
            
            self.logger.info(f"Airtable connection validated - {len(table_names)} tables discovered")
            return True
            
        except Exception as e:
            self.logger.error(f"Airtable connection validation failed: {str(e)}")
            return False

    async def _trigger_mel_coaching_analysis(self, analysis_data: FormationAnalysisSync) -> None:
        """Trigger M.E.L. AI coaching analysis for formation data."""
        try:
            # Prepare coaching analysis request
            coaching_request = {
                'analysis_type': 'formation_coaching_insights',
                'formation_data': {
                    'formation_type': analysis_data.formation_type.value[0],
                    'hash_position': analysis_data.hash_position,
                    'field_zone': analysis_data.field_zone,
                    'effectiveness_score': analysis_data.effectiveness_score,
                    'pattern_status': analysis_data.pattern_status,
                    'run_pass_tendencies': {
                        'expected_run': analysis_data.expected_run_percentage,
                        'actual_run': analysis_data.actual_run_percentage
                    }
                },
                'coaching_context': 'triangle_defense_optimization',
                'urgency': 'high' if analysis_data.effectiveness_score < 70 else 'normal'
            }
            
            # Request M.E.L. AI analysis
            coaching_insights = await self.mel_engine.generate_coaching_insights(coaching_request)
            
            if coaching_insights:
                # Sync insights back to Airtable
                await self.sync_mel_ai_insights({
                    'integration_id': f"mel_coaching_{analysis_data.analysis_id}",
                    'analysis_type': 'Formation Coaching Analysis',
                    'mel_score': coaching_insights.get('confidence_score', 0.0),
                    'insights_summary': coaching_insights.get('coaching_summary', ''),
                    'mel_integration_insights': coaching_insights.get('detailed_analysis', ''),
                    'complexity_level': 'Advanced'
                })
            
        except Exception as e:
            self.logger.error(f"M.E.L. coaching analysis trigger failed: {str(e)}")

    async def _process_critical_formation_change(self, event: WebhookEvent) -> None:
        """Process critical Triangle Defense formation changes immediately."""
        try:
            # Fetch the updated record
            table = self.base.table_by_id(event.table_id)
            record = table.get(event.record_id)
            
            if not record:
                return
            
            fields = record['fields']
            
            # Check if this is a formation analysis update
            if 'Formation_Type' in fields and 'Field_Zone' in fields:
                # Trigger immediate ML optimization
                formation_data = {
                    'formation_type': fields.get('Formation_Type'),
                    'field_zone': fields.get('Field_Zone'),
                    'hash_position': fields.get('Hash_Position'),
                    'down_situation': fields.get('Down_Situation'),
                    'distance_yards': fields.get('Distance_Yards', 10),
                    'personnel_group': fields.get('Personnel_Group')
                }
                
                # Request ML optimization
                optimization_result = await self.ml_optimizer.optimize_formation_for_situation(formation_data)
                
                if optimization_result:
                    # Send real-time notification to coaches
                    await self.notifications.send_formation_optimization_alert(
                        formation_data,
                        optimization_result,
                        priority='critical'
                    )
                    
                    # Update Airtable with optimization results
                    if optimization_result.get('recommendations'):
                        table.update(event.record_id, {
                            'Triangle_Defense_Call': optimization_result['recommendations'].get('defensive_call'),
                            'Success_Rate': optimization_result.get('predicted_success_rate', 0.0) / 100.0
                        })
            
        except Exception as e:
            self.logger.error(f"Critical formation change processing failed: {str(e)}")

    def _map_access_level(self, airtable_access_level: str) -> int:
        """Map Airtable access level to AMT user management access level."""
        access_mapping = {
            'Level 1 (Full Administrative Access)': 1,
            'Level 2 (Executive Access)': 2,
            'Level 3 (Department Head Access)': 3,
            'Level 4 (Manager Access)': 4,
            'Level 5 (Standard Access)': 5,
            'Level 6 (Limited Access)': 6,
            'Level 7 (Read Only)': 7
        }
        
        return access_mapping.get(airtable_access_level, 5)  # Default to standard access

    async def get_airtable_sync_status(self) -> Dict[str, Any]:
        """Get comprehensive Airtable integration status."""
        return {
            "service_initialized": bool(self.table_configs),
            "tables_configured": len(self.table_configs),
            "base_id": self.base_id,
            "webhook_handlers_active": len(self.webhook_handlers),
            "sync_queue_size": self.sync_queue.qsize(),
            "webhook_queue_size": self.webhook_queue.qsize(),
            "sync_metrics": self.sync_metrics.copy(),
            "triangle_defense_formations": len(self.triangle_defense_config['formation_mappings']),
            "ai_fields_enabled": sum(1 for config in self.table_configs.values() if config.ai_fields_enabled),
            "critical_sync_tables": [
                name for name, config in self.table_configs.items() 
                if config.sync_priority == SyncPriority.CRITICAL
            ],
            "background_processors_active": {
                "sync_processor": self.sync_processor_task is not None and not self.sync_processor_task.done(),
                "webhook_processor": self.webhook_processor_task is not None and not self.webhook_processor_task.done(),
                "health_monitor": self.health_monitor_task is not None and not self.health_monitor_task.done()
            }
        }


# Export main class
__all__ = [
    'AirtableConnectorService',
    'AirtableTableConfig',
    'SyncOperation',
    'WebhookEvent',
    'FormationAnalysisSync',
    'SyncDirection',
    'SyncPriority',
    'TriangleDefenseFormation'
]
