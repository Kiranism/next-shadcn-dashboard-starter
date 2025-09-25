"""
AMT Orchestration Platform - External Integration Management System
File 40 of 47

Comprehensive external integration management system providing seamless connectivity
with third-party coaching tools, video analysis platforms, player management systems,
sports software, webhook management, real-time synchronization, integration marketplace,
and custom integration builder for the AMT Platform ecosystem.

Author: AMT Development Team
Created: 2025-09-25
"""

import asyncio
import logging
import json
import hmac
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union, Callable, Awaitable
from dataclasses import dataclass, field
from enum import Enum
import uuid
import re
import base64

# HTTP and API clients
import aiohttp
import httpx
from fastapi import FastAPI, Request, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
import requests
from urllib.parse import urlencode, parse_qs

# Data transformation
import pandas as pd
import xmltodict
from jsonschema import validate, ValidationError

# Platform imports
from ..shared.orchestration_protocol import FormationType, TaskStatus, BotType
from ..orchestration.orchestration_service import OrchestrationService
from ..ml.triangle_defense_optimizer import TriangleDefenseOptimizer
from ..user_management.enterprise_user_management import EnterpriseUserManagement, UserRole
from ..security.security_manager import SecurityManager
from ..monitoring.metrics_collector import MetricsCollector
from ..integrations.mel_engine_integration import MELEngineIntegration
from ..integrations.triangle_defense_integration import TriangleDefenseIntegration
from ..notifications.realtime_notification_system import RealTimeNotificationSystem
from ..content.content_management_system import ContentManagementSystem
from ..workflow_automation.workflow_automation_system import WorkflowAutomationSystem


class IntegrationType(Enum):
    """Types of external integrations."""
    VIDEO_ANALYSIS = "video_analysis"
    PLAYER_MANAGEMENT = "player_management"
    SCHEDULING = "scheduling"
    STATISTICS = "statistics"
    RECRUITING = "recruiting"
    STRENGTH_CONDITIONING = "strength_conditioning"
    MEDICAL = "medical"
    ACADEMIC = "academic"
    COMMUNICATION = "communication"
    LIVE_STREAMING = "live_streaming"
    SPORTS_INFORMATION = "sports_information"
    EQUIPMENT_MANAGEMENT = "equipment_management"
    FACILITY_MANAGEMENT = "facility_management"
    CUSTOM = "custom"


class IntegrationStatus(Enum):
    """Integration connection status."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    CONNECTING = "connecting"
    ERROR = "error"
    SUSPENDED = "suspended"
    RATE_LIMITED = "rate_limited"
    AUTHENTICATION_REQUIRED = "authentication_required"


class AuthenticationType(Enum):
    """Supported authentication methods."""
    API_KEY = "api_key"
    OAUTH2 = "oauth2"
    JWT = "jwt"
    BASIC_AUTH = "basic_auth"
    CUSTOM_HEADER = "custom_header"
    WEBHOOK_SIGNATURE = "webhook_signature"
    NONE = "none"


class DataFormat(Enum):
    """Supported data formats for integration."""
    JSON = "json"
    XML = "xml"
    CSV = "csv"
    PLAIN_TEXT = "plain_text"
    FORM_DATA = "form_data"
    BINARY = "binary"
    CUSTOM = "custom"


@dataclass
class IntegrationEndpoint:
    """External API endpoint configuration."""
    endpoint_id: str
    name: str
    url: str
    method: str  # GET, POST, PUT, DELETE, etc.
    authentication: AuthenticationType
    headers: Dict[str, str] = field(default_factory=dict)
    query_params: Dict[str, Any] = field(default_factory=dict)
    request_format: DataFormat = DataFormat.JSON
    response_format: DataFormat = DataFormat.JSON
    timeout_seconds: int = 30
    retry_count: int = 3
    rate_limit: Optional[Dict[str, int]] = None


@dataclass
class WebhookConfiguration:
    """Webhook configuration for external services."""
    webhook_id: str
    name: str
    url: str
    events: List[str]
    secret: str
    signature_header: str = "X-Hub-Signature-256"
    content_type: str = "application/json"
    is_active: bool = True
    retry_attempts: int = 3
    timeout_seconds: int = 15
    custom_headers: Dict[str, str] = field(default_factory=dict)


@dataclass
class DataMapping:
    """Data transformation mapping configuration."""
    mapping_id: str
    name: str
    source_format: DataFormat
    target_format: DataFormat
    field_mappings: Dict[str, str]  # source_field -> target_field
    transformation_rules: List[Dict[str, Any]] = field(default_factory=list)
    validation_schema: Optional[Dict[str, Any]] = None


@dataclass
class ExternalIntegration:
    """Complete external integration configuration."""
    integration_id: str
    name: str
    description: str
    integration_type: IntegrationType
    provider: str
    version: str
    status: IntegrationStatus
    created_at: datetime
    created_by: str
    last_sync: Optional[datetime] = None
    endpoints: List[IntegrationEndpoint] = field(default_factory=list)
    webhooks: List[WebhookConfiguration] = field(default_factory=list)
    data_mappings: List[DataMapping] = field(default_factory=list)
    authentication_config: Dict[str, Any] = field(default_factory=dict)
    sync_frequency_minutes: int = 60
    error_threshold: int = 5
    is_bidirectional: bool = False
    custom_config: Dict[str, Any] = field(default_factory=dict)


@dataclass
class IntegrationEvent:
    """Integration event tracking."""
    event_id: str
    integration_id: str
    event_type: str
    timestamp: datetime
    status: str
    data: Dict[str, Any]
    error_message: Optional[str] = None
    processing_time_ms: float = 0.0
    retry_count: int = 0


@dataclass
class IntegrationMarketplaceItem:
    """Marketplace integration template."""
    item_id: str
    name: str
    description: str
    category: IntegrationType
    provider: str
    version: str
    logo_url: str
    documentation_url: str
    setup_instructions: List[str]
    required_credentials: List[str]
    supported_features: List[str]
    pricing_info: Optional[str] = None
    rating: float = 0.0
    installation_count: int = 0


class ExternalIntegrationManager:
    """
    External Integration Management System for AMT Platform.
    
    Provides comprehensive third-party integration capabilities including:
    - Video analysis platform integration (Hudl, GameFilm, etc.)
    - Player management system connectivity
    - Scheduling and calendar system integration
    - Sports statistics and analytics platform connections
    - Recruiting platform integration
    - Strength & conditioning tool connectivity
    - Medical and health platform integration
    - Academic system connections
    - Communication platform integration
    - Live streaming service connectivity
    - Webhook management and real-time event processing
    - Data synchronization and transformation
    - Integration marketplace and template library
    - Custom integration builder
    - API rate limiting and health monitoring
    - Authentication and security management
    """

    def __init__(
        self,
        orchestration_service: OrchestrationService,
        ml_optimizer: TriangleDefenseOptimizer,
        user_management: EnterpriseUserManagement,
        mel_engine: MELEngineIntegration,
        triangle_defense: TriangleDefenseIntegration,
        notification_system: RealTimeNotificationSystem,
        content_management: ContentManagementSystem,
        workflow_system: WorkflowAutomationSystem,
        security_manager: SecurityManager,
        metrics_collector: MetricsCollector
    ):
        self.orchestration = orchestration_service
        self.ml_optimizer = ml_optimizer
        self.user_management = user_management
        self.mel_engine = mel_engine
        self.triangle_defense = triangle_defense
        self.notifications = notification_system
        self.content_management = content_management
        self.workflows = workflow_system
        self.security = security_manager
        self.metrics = metrics_collector
        
        self.logger = logging.getLogger(__name__)
        
        # Integration storage
        self.integrations: Dict[str, ExternalIntegration] = {}
        self.integration_events: List[IntegrationEvent] = []
        self.marketplace_items: Dict[str, IntegrationMarketplaceItem] = {}
        self.active_webhooks: Dict[str, WebhookConfiguration] = {}
        
        # HTTP clients and session management
        self.http_sessions: Dict[str, aiohttp.ClientSession] = {}
        self.rate_limiters: Dict[str, Dict[str, Any]] = {}
        
        # Webhook server
        self.webhook_app = FastAPI(title="AMT Integration Webhooks")
        
        # AMT-specific integration configurations
        self.amt_config = {
            'popular_integrations': {
                'hudl': {
                    'name': 'Hudl Video Analysis',
                    'type': IntegrationType.VIDEO_ANALYSIS,
                    'endpoints': ['upload_video', 'get_analysis', 'create_breakdown'],
                    'webhook_events': ['video_processed', 'analysis_complete'],
                    'data_sync': 'formation_analysis'
                },
                'maxpreps': {
                    'name': 'MaxPreps Statistics',
                    'type': IntegrationType.STATISTICS,
                    'endpoints': ['get_team_stats', 'get_player_stats', 'get_schedule'],
                    'webhook_events': ['game_complete', 'stats_updated'],
                    'data_sync': 'game_performance'
                },
                'teamsnap': {
                    'name': 'TeamSnap Management',
                    'type': IntegrationType.PLAYER_MANAGEMENT,
                    'endpoints': ['get_roster', 'get_attendance', 'send_message'],
                    'webhook_events': ['roster_updated', 'attendance_marked'],
                    'data_sync': 'player_info'
                },
                'stack_sports': {
                    'name': 'Stack Sports Recruiting',
                    'type': IntegrationType.RECRUITING,
                    'endpoints': ['search_prospects', 'get_recruit_profile', 'track_interest'],
                    'webhook_events': ['new_prospect', 'interest_updated'],
                    'data_sync': 'recruiting_data'
                },
                'zoom': {
                    'name': 'Zoom Communications',
                    'type': IntegrationType.COMMUNICATION,
                    'endpoints': ['create_meeting', 'get_recording', 'send_invite'],
                    'webhook_events': ['meeting_started', 'recording_ready'],
                    'data_sync': 'team_meetings'
                }
            },
            'formation_sync_mappings': {
                FormationType.LARRY: {
                    'hudl_tags': ['short_yardage', 'goal_line', 'mo_left'],
                    'maxpreps_categories': ['red_zone_defense', 'short_yardage']
                },
                FormationType.LINDA: {
                    'hudl_tags': ['balanced_defense', 'mo_left'],
                    'maxpreps_categories': ['standard_defense']
                },
                FormationType.RICKY: {
                    'hudl_tags': ['power_defense', 'mo_right'],
                    'maxpreps_categories': ['run_defense', 'strong_side']
                }
                # Additional formation mappings...
            },
            'default_sync_intervals': {
                IntegrationType.VIDEO_ANALYSIS: 30,  # minutes
                IntegrationType.STATISTICS: 60,
                IntegrationType.PLAYER_MANAGEMENT: 120,
                IntegrationType.RECRUITING: 240,
                IntegrationType.SCHEDULING: 60
            }
        }
        
        # System configuration
        self.config = {
            'webhook_base_url': 'https://api.analyzemyteam.com/webhooks',
            'max_concurrent_integrations': 50,
            'default_timeout_seconds': 30,
            'max_retry_attempts': 3,
            'rate_limit_window_seconds': 3600,
            'integration_health_check_minutes': 15,
            'event_retention_days': 30,
            'marketplace_cache_hours': 24
        }

    async def initialize(self) -> bool:
        """Initialize the external integration management system."""
        try:
            self.logger.info("Initializing External Integration Management System...")
            
            # Setup HTTP sessions
            await self._setup_http_sessions()
            
            # Initialize webhook server
            await self._setup_webhook_server()
            
            # Load marketplace integrations
            await self._load_marketplace_integrations()
            
            # Setup popular AMT integrations
            await self._setup_popular_integrations()
            
            # Start background tasks
            asyncio.create_task(self._integration_health_monitor())
            asyncio.create_task(self._sync_scheduler())
            asyncio.create_task(self._cleanup_old_events())
            
            self.logger.info("External Integration Management System initialized successfully")
            await self.metrics.record_event("integration_manager_initialized", {
                "marketplace_items": len(self.marketplace_items),
                "popular_integrations": len(self.amt_config['popular_integrations'])
            })
            
            return True
            
        except Exception as e:
            self.logger.error(f"Integration Management System initialization failed: {str(e)}")
            return False

    async def create_integration(
        self,
        name: str,
        integration_type: IntegrationType,
        provider: str,
        created_by: str,
        endpoints: List[IntegrationEndpoint],
        authentication_config: Dict[str, Any],
        custom_config: Optional[Dict[str, Any]] = None
    ) -> str:
        """Create a new external integration."""
        try:
            integration_id = str(uuid.uuid4())
            
            integration = ExternalIntegration(
                integration_id=integration_id,
                name=name,
                description=f"{provider} integration for {integration_type.value}",
                integration_type=integration_type,
                provider=provider,
                version="1.0.0",
                status=IntegrationStatus.INACTIVE,
                created_at=datetime.utcnow(),
                created_by=created_by,
                endpoints=endpoints,
                authentication_config=authentication_config,
                custom_config=custom_config or {},
                sync_frequency_minutes=self.amt_config['default_sync_intervals'].get(
                    integration_type, 60
                )
            )
            
            # Store integration
            self.integrations[integration_id] = integration
            
            # Initialize HTTP session for this integration
            await self._create_integration_session(integration_id)
            
            # Test connection
            connection_test = await self._test_integration_connection(integration_id)
            if connection_test['success']:
                integration.status = IntegrationStatus.ACTIVE
                self.logger.info(f"Integration {name} connected successfully")
            else:
                integration.status = IntegrationStatus.ERROR
                self.logger.warning(f"Integration {name} connection failed: {connection_test.get('error')}")
            
            await self.metrics.record_event("integration_created", {
                "integration_id": integration_id,
                "provider": provider,
                "type": integration_type.value,
                "created_by": created_by,
                "connection_status": integration.status.value
            })
            
            return integration_id
            
        except Exception as e:
            self.logger.error(f"Integration creation failed: {str(e)}")
            raise

    async def install_marketplace_integration(
        self,
        marketplace_item_id: str,
        user_id: str,
        configuration: Dict[str, Any]
    ) -> str:
        """Install integration from marketplace."""
        try:
            marketplace_item = self.marketplace_items.get(marketplace_item_id)
            if not marketplace_item:
                raise ValueError("Marketplace item not found")
            
            # Validate required credentials
            for required_cred in marketplace_item.required_credentials:
                if required_cred not in configuration:
                    raise ValueError(f"Missing required credential: {required_cred}")
            
            # Create endpoints based on marketplace template
            endpoints = await self._create_endpoints_from_template(marketplace_item, configuration)
            
            # Setup authentication
            auth_config = await self._setup_marketplace_authentication(marketplace_item, configuration)
            
            # Create integration
            integration_id = await self.create_integration(
                name=marketplace_item.name,
                integration_type=marketplace_item.category,
                provider=marketplace_item.provider,
                created_by=user_id,
                endpoints=endpoints,
                authentication_config=auth_config,
                custom_config=configuration
            )
            
            # Setup default webhooks if supported
            if marketplace_item.item_id in self.amt_config['popular_integrations']:
                config = self.amt_config['popular_integrations'][marketplace_item.item_id]
                await self._setup_default_webhooks(integration_id, config.get('webhook_events', []))
            
            # Update installation count
            marketplace_item.installation_count += 1
            
            await self.metrics.record_event("marketplace_integration_installed", {
                "marketplace_item_id": marketplace_item_id,
                "integration_id": integration_id,
                "provider": marketplace_item.provider,
                "user_id": user_id
            })
            
            return integration_id
            
        except Exception as e:
            self.logger.error(f"Marketplace integration installation failed: {str(e)}")
            raise

    async def sync_integration_data(
        self,
        integration_id: str,
        endpoint_name: Optional[str] = None,
        force_sync: bool = False
    ) -> Dict[str, Any]:
        """Synchronize data with external integration."""
        try:
            integration = self.integrations.get(integration_id)
            if not integration:
                raise ValueError("Integration not found")
            
            if integration.status != IntegrationStatus.ACTIVE and not force_sync:
                raise ValueError("Integration is not active")
            
            sync_results = {
                'integration_id': integration_id,
                'sync_timestamp': datetime.utcnow().isoformat(),
                'endpoints_synced': 0,
                'records_processed': 0,
                'errors': []
            }
            
            # Determine which endpoints to sync
            endpoints_to_sync = integration.endpoints
            if endpoint_name:
                endpoints_to_sync = [ep for ep in integration.endpoints if ep.name == endpoint_name]
            
            for endpoint in endpoints_to_sync:
                try:
                    # Execute API call
                    response_data = await self._execute_api_call(integration_id, endpoint)
                    
                    # Transform data if mapping exists
                    transformed_data = await self._transform_integration_data(
                        integration_id, response_data, endpoint.name
                    )
                    
                    # Process data based on integration type
                    processing_result = await self._process_integration_data(
                        integration, endpoint.name, transformed_data
                    )
                    
                    sync_results['endpoints_synced'] += 1
                    sync_results['records_processed'] += processing_result.get('records_processed', 0)
                    
                    # Log successful sync
                    await self._log_integration_event(
                        integration_id, 'data_sync', 'success', {
                            'endpoint': endpoint.name,
                            'records_processed': processing_result.get('records_processed', 0)
                        }
                    )
                    
                except Exception as e:
                    error_msg = f"Endpoint {endpoint.name} sync failed: {str(e)}"
                    sync_results['errors'].append(error_msg)
                    
                    await self._log_integration_event(
                        integration_id, 'data_sync', 'error', {
                            'endpoint': endpoint.name,
                            'error': str(e)
                        }
                    )
            
            # Update last sync time
            integration.last_sync = datetime.utcnow()
            
            await self.metrics.record_event("integration_data_synced", sync_results)
            
            return sync_results
            
        except Exception as e:
            self.logger.error(f"Integration data sync failed: {str(e)}")
            raise

    async def setup_webhook(
        self,
        integration_id: str,
        webhook_config: WebhookConfiguration
    ) -> str:
        """Setup webhook for external integration."""
        try:
            integration = self.integrations.get(integration_id)
            if not integration:
                raise ValueError("Integration not found")
            
            # Generate webhook URL
            webhook_url = f"{self.config['webhook_base_url']}/{webhook_config.webhook_id}"
            webhook_config.url = webhook_url
            
            # Store webhook configuration
            integration.webhooks.append(webhook_config)
            self.active_webhooks[webhook_config.webhook_id] = webhook_config
            
            # Register webhook endpoint
            await self._register_webhook_endpoint(webhook_config)
            
            # Notify external service about webhook URL
            await self._register_webhook_with_service(integration_id, webhook_config)
            
            await self.metrics.record_event("webhook_setup", {
                "integration_id": integration_id,
                "webhook_id": webhook_config.webhook_id,
                "events": webhook_config.events
            })
            
            return webhook_config.webhook_id
            
        except Exception as e:
            self.logger.error(f"Webhook setup failed: {str(e)}")
            raise

    async def process_webhook_event(
        self,
        webhook_id: str,
        payload: Dict[str, Any],
        headers: Dict[str, str]
    ) -> Dict[str, Any]:
        """Process incoming webhook event."""
        try:
            webhook_config = self.active_webhooks.get(webhook_id)
            if not webhook_config:
                raise ValueError("Webhook not found")
            
            # Verify webhook signature
            if not await self._verify_webhook_signature(webhook_config, payload, headers):
                raise ValueError("Invalid webhook signature")
            
            # Find associated integration
            integration = None
            for integration_obj in self.integrations.values():
                if any(wh.webhook_id == webhook_id for wh in integration_obj.webhooks):
                    integration = integration_obj
                    break
            
            if not integration:
                raise ValueError("Associated integration not found")
            
            # Process event based on type and integration
            processing_result = await self._process_webhook_payload(
                integration, webhook_config, payload
            )
            
            # Log webhook event
            await self._log_integration_event(
                integration.integration_id, 'webhook_received', 'success', {
                    'webhook_id': webhook_id,
                    'event_type': payload.get('event_type', 'unknown'),
                    'processing_result': processing_result
                }
            )
            
            # Trigger workflows if configured
            if processing_result.get('trigger_workflows'):
                await self._trigger_webhook_workflows(integration, payload, processing_result)
            
            return {
                'status': 'processed',
                'webhook_id': webhook_id,
                'integration_id': integration.integration_id,
                'processing_result': processing_result
            }
            
        except Exception as e:
            self.logger.error(f"Webhook event processing failed: {str(e)}")
            await self._log_integration_event(
                "", 'webhook_received', 'error', {
                    'webhook_id': webhook_id,
                    'error': str(e)
                }
            )
            raise

    # Private helper methods

    async def _setup_popular_integrations(self) -> None:
        """Setup popular AMT integrations as marketplace items."""
        try:
            for integration_key, config in self.amt_config['popular_integrations'].items():
                marketplace_item = IntegrationMarketplaceItem(
                    item_id=integration_key,
                    name=config['name'],
                    description=f"Official {config['name']} integration for AMT Platform",
                    category=config['type'],
                    provider=config['name'].split()[0],
                    version="1.0.0",
                    logo_url=f"/images/integrations/{integration_key}.png",
                    documentation_url=f"/docs/integrations/{integration_key}",
                    setup_instructions=[
                        f"Obtain API credentials from {config['name']}",
                        "Configure authentication in AMT platform",
                        "Test connection and enable data sync",
                        "Configure webhooks for real-time updates"
                    ],
                    required_credentials=["api_key", "api_secret"],
                    supported_features=config.get('endpoints', []) + config.get('webhook_events', []),
                    rating=4.5,
                    installation_count=0
                )
                
                self.marketplace_items[integration_key] = marketplace_item
                
        except Exception as e:
            self.logger.error(f"Popular integrations setup failed: {str(e)}")

    async def _execute_api_call(
        self,
        integration_id: str,
        endpoint: IntegrationEndpoint
    ) -> Dict[str, Any]:
        """Execute API call to external service."""
        try:
            session = self.http_sessions.get(integration_id)
            if not session:
                raise ValueError("HTTP session not found for integration")
            
            # Prepare request parameters
            url = endpoint.url
            headers = endpoint.headers.copy()
            params = endpoint.query_params.copy()
            
            # Add authentication
            integration = self.integrations[integration_id]
            await self._add_authentication_to_request(integration, headers, params)
            
            # Execute request
            async with session.request(
                method=endpoint.method,
                url=url,
                headers=headers,
                params=params,
                timeout=aiohttp.ClientTimeout(total=endpoint.timeout_seconds)
            ) as response:
                
                # Handle rate limiting
                if response.status == 429:
                    await self._handle_rate_limit(integration_id, response)
                    raise Exception("Rate limited")
                
                # Parse response based on format
                if endpoint.response_format == DataFormat.JSON:
                    return await response.json()
                elif endpoint.response_format == DataFormat.XML:
                    text_content = await response.text()
                    return xmltodict.parse(text_content)
                else:
                    return {"content": await response.text()}
                    
        except Exception as e:
            self.logger.error(f"API call execution failed: {str(e)}")
            raise

    async def _process_integration_data(
        self,
        integration: ExternalIntegration,
        endpoint_name: str,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Process integration data based on type and endpoint."""
        try:
            processing_result = {'records_processed': 0, 'actions_taken': []}
            
            if integration.integration_type == IntegrationType.VIDEO_ANALYSIS:
                # Process video analysis data
                if endpoint_name == 'get_analysis':
                    # Sync with Triangle Defense formations
                    formations_found = await self._sync_video_formations(data)
                    processing_result['records_processed'] = len(formations_found)
                    processing_result['actions_taken'].append('formation_sync')
                    
            elif integration.integration_type == IntegrationType.PLAYER_MANAGEMENT:
                # Process player data
                if endpoint_name == 'get_roster':
                    # Update user profiles
                    players_updated = await self._sync_player_data(data)
                    processing_result['records_processed'] = len(players_updated)
                    processing_result['actions_taken'].append('player_sync')
                    
            elif integration.integration_type == IntegrationType.STATISTICS:
                # Process statistics data
                if endpoint_name == 'get_team_stats':
                    # Update performance analytics
                    stats_updated = await self._sync_team_statistics(data)
                    processing_result['records_processed'] = len(stats_updated)
                    processing_result['actions_taken'].append('stats_sync')
            
            return processing_result
            
        except Exception as e:
            self.logger.error(f"Integration data processing failed: {str(e)}")
            return {'records_processed': 0, 'actions_taken': [], 'error': str(e)}

    async def _sync_video_formations(self, video_data: Dict[str, Any]) -> List[str]:
        """Sync video analysis data with Triangle Defense formations."""
        try:
            formations_found = []
            
            # Extract formation-related tags or analysis
            video_tags = video_data.get('tags', [])
            analysis_results = video_data.get('analysis', {})
            
            # Map video tags to Triangle Defense formations
            for formation_type, mapping in self.amt_config['formation_sync_mappings'].items():
                hudl_tags = mapping.get('hudl_tags', [])
                
                if any(tag in video_tags for tag in hudl_tags):
                    formations_found.append(formation_type.value)
                    
                    # Update formation usage statistics
                    await self._update_formation_usage_stats(formation_type, video_data)
            
            return formations_found
            
        except Exception as e:
            self.logger.error(f"Video formation sync failed: {str(e)}")
            return []

    async def _verify_webhook_signature(
        self,
        webhook_config: WebhookConfiguration,
        payload: Dict[str, Any],
        headers: Dict[str, str]
    ) -> bool:
        """Verify webhook signature for security."""
        try:
            signature_header = webhook_config.signature_header
            received_signature = headers.get(signature_header, '').replace('sha256=', '')
            
            # Generate expected signature
            payload_bytes = json.dumps(payload, sort_keys=True).encode('utf-8')
            expected_signature = hmac.new(
                webhook_config.secret.encode('utf-8'),
                payload_bytes,
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(received_signature, expected_signature)
            
        except Exception as e:
            self.logger.error(f"Webhook signature verification failed: {str(e)}")
            return False

    async def _setup_webhook_server(self) -> None:
        """Setup FastAPI webhook server."""
        
        @self.webhook_app.post("/webhooks/{webhook_id}")
        async def handle_webhook(webhook_id: str, request: Request, background_tasks: BackgroundTasks):
            """Handle incoming webhook."""
            try:
                payload = await request.json()
                headers = dict(request.headers)
                
                # Process webhook in background
                background_tasks.add_task(
                    self.process_webhook_event,
                    webhook_id,
                    payload,
                    headers
                )
                
                return JSONResponse({"status": "received"})
                
            except Exception as e:
                self.logger.error(f"Webhook handling failed: {str(e)}")
                raise HTTPException(status_code=400, detail=str(e))

    async def get_integration_marketplace(
        self,
        category: Optional[IntegrationType] = None,
        search_query: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get available integrations from marketplace."""
        try:
            marketplace_items = list(self.marketplace_items.values())
            
            # Filter by category
            if category:
                marketplace_items = [item for item in marketplace_items if item.category == category]
            
            # Filter by search query
            if search_query:
                query_lower = search_query.lower()
                marketplace_items = [
                    item for item in marketplace_items
                    if query_lower in item.name.lower() or query_lower in item.description.lower()
                ]
            
            # Convert to response format
            return [
                {
                    'item_id': item.item_id,
                    'name': item.name,
                    'description': item.description,
                    'category': item.category.value,
                    'provider': item.provider,
                    'version': item.version,
                    'logo_url': item.logo_url,
                    'rating': item.rating,
                    'installation_count': item.installation_count,
                    'supported_features': item.supported_features,
                    'required_credentials': item.required_credentials
                }
                for item in marketplace_items
            ]
            
        except Exception as e:
            self.logger.error(f"Marketplace retrieval failed: {str(e)}")
            return []

    async def get_integration_status(self, integration_id: str) -> Dict[str, Any]:
        """Get detailed status of a specific integration."""
        try:
            integration = self.integrations.get(integration_id)
            if not integration:
                return {"error": "Integration not found"}
            
            # Get recent events
            recent_events = [
                {
                    'event_type': event.event_type,
                    'status': event.status,
                    'timestamp': event.timestamp.isoformat(),
                    'processing_time_ms': event.processing_time_ms
                }
                for event in self.integration_events[-10:]
                if event.integration_id == integration_id
            ]
            
            # Calculate success rate
            total_events = len([e for e in self.integration_events if e.integration_id == integration_id])
            successful_events = len([e for e in self.integration_events 
                                   if e.integration_id == integration_id and e.status == 'success'])
            success_rate = (successful_events / total_events * 100) if total_events > 0 else 0
            
            return {
                'integration_id': integration_id,
                'name': integration.name,
                'provider': integration.provider,
                'type': integration.integration_type.value,
                'status': integration.status.value,
                'last_sync': integration.last_sync.isoformat() if integration.last_sync else None,
                'success_rate': round(success_rate, 2),
                'total_events': total_events,
                'endpoints_count': len(integration.endpoints),
                'webhooks_count': len(integration.webhooks),
                'recent_events': recent_events,
                'next_sync': self._calculate_next_sync_time(integration).isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Integration status retrieval failed: {str(e)}")
            return {"error": str(e)}

    async def get_integration_manager_status(self) -> Dict[str, Any]:
        """Get overall integration manager status."""
        return {
            "system_initialized": bool(self.integrations),
            "total_integrations": len(self.integrations),
            "active_integrations": len([i for i in self.integrations.values() if i.status == IntegrationStatus.ACTIVE]),
            "marketplace_items": len(self.marketplace_items),
            "active_webhooks": len(self.active_webhooks),
            "integration_events_count": len(self.integration_events),
            "http_sessions": len(self.http_sessions),
            "popular_integrations": len(self.amt_config['popular_integrations']),
            "integration_types_supported": len(IntegrationType),
            "webhook_server_running": bool(self.webhook_app),
            "background_tasks_active": True
        }


# Export main class
__all__ = [
    'ExternalIntegrationManager',
    'ExternalIntegration',
    'IntegrationEndpoint',
    'WebhookConfiguration',
    'DataMapping',
    'IntegrationEvent',
    'IntegrationMarketplaceItem',
    'IntegrationType',
    'IntegrationStatus',
    'AuthenticationType',
    'DataFormat'
]
