"""
AMT Orchestration Platform - Dynamic Configuration Management Service
File 44 of 47

Enterprise-grade dynamic configuration management service providing real-time
configuration updates, feature flags, A/B testing for coaching strategies,
Triangle Defense parameter tuning, M.E.L. AI model configuration, environment
management, and zero-downtime configuration deployment across distributed services.

Author: AMT Development Team
Created: 2025-09-25
"""

import asyncio
import logging
import json
import hashlib
import hmac
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union, Tuple, Callable, Type
from dataclasses import dataclass, field
from enum import Enum
import uuid
import yaml
import toml
from pathlib import Path
import aioredis
import asyncpg
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field, validator
import jsonschema
from cryptography.fernet import Fernet
import consul.aio
import etcd3

# Configuration management
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import asyncio_mqtt

# Platform imports
from ..shared.orchestration_protocol import FormationType, TaskStatus, BotType
from ..orchestration.orchestration_service import OrchestrationService
from ..ml.triangle_defense_optimizer import TriangleDefenseOptimizer
from ..integrations.mel_engine_integration import MELEngineIntegration
from ..integrations.triangle_defense_integration import TriangleDefenseIntegration
from ..integrations.airtable_connector_service import AirtableConnectorService
from ..streaming.realtime_data_streaming_service import RealTimeDataStreamingService
from ..user_management.enterprise_user_management import EnterpriseUserManagement
from ..security.security_manager import SecurityManager
from ..monitoring.metrics_collector import MetricsCollector
from ..notifications.realtime_notification_system import RealTimeNotificationSystem
from ..compliance.audit_compliance_system import AuditComplianceSystem


class ConfigurationType(Enum):
    """Types of configuration data."""
    APPLICATION = "application"
    FEATURE_FLAG = "feature_flag"
    ML_MODEL = "ml_model"
    TRIANGLE_DEFENSE = "triangle_defense"
    MEL_AI = "mel_ai"
    SECURITY = "security"
    INTEGRATION = "integration"
    STREAMING = "streaming"
    USER_INTERFACE = "user_interface"
    ENVIRONMENT = "environment"


class ConfigurationEnvironment(Enum):
    """Configuration environments."""
    DEVELOPMENT = "development"
    TESTING = "testing"
    STAGING = "staging"
    PRODUCTION = "production"
    SANDBOX = "sandbox"


class ConfigurationScope(Enum):
    """Configuration scope levels."""
    GLOBAL = "global"           # Affects entire platform
    SERVICE = "service"         # Affects specific service
    USER = "user"              # User-specific configuration
    TEAM = "team"              # Team/department specific
    FORMATION = "formation"     # Triangle Defense formation specific
    GAME = "game"              # Game-specific configuration


class FeatureFlagStatus(Enum):
    """Feature flag status values."""
    ENABLED = "enabled"
    DISABLED = "disabled"
    ROLLOUT = "rollout"        # Gradual rollout
    A_B_TEST = "a_b_test"      # A/B testing
    BETA = "beta"              # Beta testing
    DEPRECATED = "deprecated"   # Scheduled for removal


@dataclass
class ConfigurationValue:
    """Individual configuration value with metadata."""
    key: str
    value: Any
    config_type: ConfigurationType
    environment: ConfigurationEnvironment
    scope: ConfigurationScope
    version: str
    created_at: datetime
    updated_at: datetime
    created_by: str
    description: str
    schema: Optional[Dict[str, Any]] = None
    encrypted: bool = False
    sensitive: bool = False
    validation_rules: List[str] = field(default_factory=list)
    dependencies: List[str] = field(default_factory=list)
    rollback_value: Optional[Any] = None


@dataclass
class FeatureFlag:
    """Feature flag configuration with targeting rules."""
    flag_id: str
    name: str
    description: str
    status: FeatureFlagStatus
    enabled_percentage: float
    target_users: List[str] = field(default_factory=list)
    target_teams: List[str] = field(default_factory=list)
    target_formations: List[str] = field(default_factory=list)
    environment_overrides: Dict[str, bool] = field(default_factory=dict)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    a_b_variants: Dict[str, Any] = field(default_factory=dict)
    metrics_tracking: List[str] = field(default_factory=list)
    created_by: str = ""
    updated_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class ConfigurationChange:
    """Configuration change audit record."""
    change_id: str
    configuration_key: str
    old_value: Any
    new_value: Any
    changed_by: str
    change_type: str  # create, update, delete, rollback
    change_reason: str
    environment: ConfigurationEnvironment
    timestamp: datetime
    approved_by: Optional[str] = None
    rolled_back: bool = False
    rollback_reason: Optional[str] = None


@dataclass
class TriangleDefenseConfiguration:
    """Triangle Defense specific configuration."""
    formation_type: str
    effectiveness_thresholds: Dict[str, float]
    optimization_parameters: Dict[str, Any]
    coaching_rules: List[str]
    pattern_recognition_sensitivity: float
    break_point_thresholds: Dict[str, float]
    mo_position_weights: Dict[str, float]
    situation_multipliers: Dict[str, float]
    color_scheme: Dict[str, str]
    analysis_depth: str = "comprehensive"


class DynamicConfigurationService:
    """
    Enterprise Dynamic Configuration Management Service for AMT Platform.
    
    Provides comprehensive configuration management including:
    - Real-time configuration updates without service restarts
    - Feature flags with granular targeting and A/B testing capabilities
    - Triangle Defense formation parameter management
    - M.E.L. AI model configuration and hyperparameter tuning
    - Environment-specific configuration management
    - Configuration validation, versioning, and rollback capabilities
    - Encrypted sensitive configuration storage
    - Configuration change auditing and approval workflows
    - Distributed configuration synchronization
    - Configuration templates and inheritance
    - Hot-reload capabilities for all AMT platform services
    - Coaching strategy A/B testing framework
    - Formation effectiveness parameter optimization
    - Dynamic ML model parameter adjustment
    - User and team-specific configuration overrides
    - Compliance and security configuration enforcement
    """

    def __init__(
        self,
        redis_url: str,
        database_url: str,
        consul_host: str,
        consul_port: int,
        encryption_key: str,
        orchestration_service: OrchestrationService,
        ml_optimizer: TriangleDefenseOptimizer,
        mel_engine: MELEngineIntegration,
        triangle_defense: TriangleDefenseIntegration,
        airtable_connector: AirtableConnectorService,
        streaming_service: RealTimeDataStreamingService,
        user_management: EnterpriseUserManagement,
        notification_system: RealTimeNotificationSystem,
        compliance_system: AuditComplianceSystem,
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
        self.user_management = user_management
        self.notifications = notification_system
        self.compliance = compliance_system
        self.security = security_manager
        self.metrics = metrics_collector
        
        self.logger = logging.getLogger(__name__)
        
        # Configuration storage backends
        self.redis_url = redis_url
        self.database_url = database_url
        self.consul_host = consul_host
        self.consul_port = consul_port
        
        # Encryption for sensitive configurations
        self.fernet = Fernet(encryption_key.encode() if isinstance(encryption_key, str) else encryption_key)
        
        # Storage backends
        self.redis_client = None
        self.database_pool = None
        self.consul_client = None
        
        # Configuration cache
        self.configuration_cache: Dict[str, ConfigurationValue] = {}
        self.feature_flags: Dict[str, FeatureFlag] = {}
        self.triangle_defense_configs: Dict[str, TriangleDefenseConfiguration] = {}
        
        # Change tracking
        self.configuration_changes: List[ConfigurationChange] = []
        self.pending_approvals: Dict[str, ConfigurationChange] = {}
        
        # Watchers and subscribers
        self.configuration_subscribers: Dict[str, List[Callable]] = {}
        self.file_observers: List[Observer] = []
        
        # Performance metrics
        self.config_metrics = {
            'configurations_managed': 0,
            'feature_flags_active': 0,
            'configuration_updates': 0,
            'cache_hits': 0,
            'cache_misses': 0,
            'hot_reloads_performed': 0,
            'rollbacks_executed': 0,
            'a_b_tests_running': 0
        }
        
        # Triangle Defense configuration templates
        self.triangle_defense_templates = {
            'Larry (Male)': TriangleDefenseConfiguration(
                formation_type='Larry (Male)',
                effectiveness_thresholds={
                    'critical': 60.0,
                    'warning': 70.0,
                    'optimal': 80.0
                },
                optimization_parameters={
                    'mo_left_weight': 0.85,
                    'male_formation_bonus': 0.15,
                    'short_yardage_multiplier': 1.25,
                    'goal_line_effectiveness': 0.90
                },
                coaching_rules=[
                    'Emphasize left side strength',
                    'Utilize male formation advantages',
                    'Optimize for short yardage situations',
                    'Strong goal line presence'
                ],
                pattern_recognition_sensitivity=0.82,
                break_point_thresholds={
                    'tendency_violation': 0.75,
                    'pattern_break_alert': 0.65
                },
                mo_position_weights={
                    'left': 0.90,
                    'center': 0.70,
                    'right': 0.60
                },
                situation_multipliers={
                    'red_zone': 1.20,
                    'goal_line': 1.35,
                    'short_yardage': 1.30,
                    'normal_down': 1.00
                },
                color_scheme={
                    'primary': '#4ECDC4',
                    'secondary': '#45B7D1',
                    'accent': '#96CEB4'
                }
            ),
            'Linda (Female)': TriangleDefenseConfiguration(
                formation_type='Linda (Female)',
                effectiveness_thresholds={
                    'critical': 55.0,
                    'warning': 68.0,
                    'optimal': 78.0
                },
                optimization_parameters={
                    'female_formation_bonus': 0.18,
                    'balanced_attack_weight': 0.80,
                    'pass_defense_multiplier': 1.15,
                    'coverage_effectiveness': 0.85
                },
                coaching_rules=[
                    'Focus on balanced attack coverage',
                    'Optimize pass defense capabilities',
                    'Maintain formation flexibility',
                    'Strong coverage zones'
                ],
                pattern_recognition_sensitivity=0.78,
                break_point_thresholds={
                    'tendency_violation': 0.70,
                    'pattern_break_alert': 0.60
                },
                mo_position_weights={
                    'left': 0.85,
                    'center': 0.75,
                    'right': 0.65
                },
                situation_multipliers={
                    'passing_downs': 1.25,
                    'third_long': 1.30,
                    'two_minute_drill': 1.20,
                    'normal_down': 1.00
                },
                color_scheme={
                    'primary': '#FF6B6B',
                    'secondary': '#FF8E8E',
                    'accent': '#FFB3B3'
                }
            )
        }
        
        # Default AMT platform configuration
        self.default_configurations = {
            'amt.platform.version': '1.0.0',
            'amt.triangle_defense.enabled': True,
            'amt.mel_ai.max_concurrent_requests': 50,
            'amt.streaming.buffer_size': 10000,
            'amt.ml_optimizer.training_enabled': True,
            'amt.airtable.sync_interval_seconds': 300,
            'amt.notifications.real_time_enabled': True,
            'amt.security.mfa_required': True,
            'amt.performance.auto_scaling_enabled': True,
            'amt.compliance.audit_logging': True
        }
        
        # Background tasks
        self.config_sync_task = None
        self.flag_evaluation_task = None
        self.file_watcher_task = None
        self.metrics_collector_task = None

    async def initialize(self) -> bool:
        """Initialize the dynamic configuration service."""
        try:
            self.logger.info("Initializing Dynamic Configuration Service...")
            
            # Initialize storage backends
            await self._initialize_storage_backends()
            
            # Load default configurations
            await self._load_default_configurations()
            
            # Initialize Triangle Defense configurations
            await self._initialize_triangle_defense_configs()
            
            # Setup feature flags
            await self._initialize_feature_flags()
            
            # Start configuration watchers
            await self._start_configuration_watchers()
            
            # Start background processors
            await self._start_background_processors()
            
            # Perform initial configuration validation
            await self._validate_all_configurations()
            
            self.logger.info("Dynamic Configuration Service initialized successfully")
            await self.metrics.record_event("configuration_service_initialized", {
                "configurations_loaded": len(self.configuration_cache),
                "feature_flags_loaded": len(self.feature_flags),
                "triangle_defense_configs": len(self.triangle_defense_configs)
            })
            
            return True
            
        except Exception as e:
            self.logger.error(f"Dynamic Configuration Service initialization failed: {str(e)}")
            return False

    async def get_configuration(
        self,
        key: str,
        environment: ConfigurationEnvironment = ConfigurationEnvironment.PRODUCTION,
        user_id: Optional[str] = None,
        default_value: Any = None
    ) -> Any:
        """Get configuration value with environment and user context."""
        try:
            # Check cache first
            cache_key = f"{environment.value}:{key}"
            if user_id:
                user_cache_key = f"{environment.value}:{user_id}:{key}"
                if user_cache_key in self.configuration_cache:
                    self.config_metrics['cache_hits'] += 1
                    return self.configuration_cache[user_cache_key].value
            
            if cache_key in self.configuration_cache:
                config_value = self.configuration_cache[cache_key]
                
                # Decrypt if encrypted
                if config_value.encrypted:
                    decrypted_value = self.fernet.decrypt(config_value.value.encode()).decode()
                    return json.loads(decrypted_value) if decrypted_value.startswith('{') else decrypted_value
                
                self.config_metrics['cache_hits'] += 1
                return config_value.value
            
            # Cache miss - load from storage
            self.config_metrics['cache_misses'] += 1
            
            # Try Redis first
            if self.redis_client:
                redis_value = await self.redis_client.get(cache_key)
                if redis_value:
                    parsed_value = json.loads(redis_value)
                    await self._cache_configuration_value(key, parsed_value, environment)
                    return parsed_value
            
            # Try database
            if self.database_pool:
                async with self.database_pool.acquire() as conn:
                    result = await conn.fetchrow(
                        "SELECT * FROM configurations WHERE key = $1 AND environment = $2 ORDER BY updated_at DESC LIMIT 1",
                        key, environment.value
                    )
                    if result:
                        config_value = dict(result)
                        await self._cache_configuration_value(key, config_value['value'], environment)
                        return config_value['value']
            
            # Return default value if not found
            return default_value
            
        except Exception as e:
            self.logger.error(f"Configuration retrieval failed for {key}: {str(e)}")
            return default_value

    async def set_configuration(
        self,
        key: str,
        value: Any,
        config_type: ConfigurationType,
        environment: ConfigurationEnvironment,
        changed_by: str,
        description: str = "",
        requires_approval: bool = False,
        sensitive: bool = False
    ) -> bool:
        """Set configuration value with validation and change tracking."""
        try:
            # Get old value for change tracking
            old_value = await self.get_configuration(key, environment)
            
            # Validate new value
            if not await self._validate_configuration_value(key, value, config_type):
                raise ValueError(f"Configuration validation failed for {key}")
            
            # Encrypt sensitive values
            stored_value = value
            encrypted = False
            if sensitive:
                encrypted_data = self.fernet.encrypt(json.dumps(value).encode()).decode()
                stored_value = encrypted_data
                encrypted = True
            
            # Create configuration value
            config_value = ConfigurationValue(
                key=key,
                value=stored_value,
                config_type=config_type,
                environment=environment,
                scope=ConfigurationScope.GLOBAL,
                version=str(uuid.uuid4()),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
                created_by=changed_by,
                description=description,
                encrypted=encrypted,
                sensitive=sensitive,
                rollback_value=old_value
            )
            
            # Create change record
            change_record = ConfigurationChange(
                change_id=str(uuid.uuid4()),
                configuration_key=key,
                old_value=old_value,
                new_value=value,
                changed_by=changed_by,
                change_type='update' if old_value is not None else 'create',
                change_reason=description,
                environment=environment,
                timestamp=datetime.utcnow()
            )
            
            if requires_approval:
                # Queue for approval
                self.pending_approvals[change_record.change_id] = change_record
                await self._notify_configuration_approvers(change_record)
                return True
            
            # Apply configuration change
            await self._apply_configuration_change(config_value, change_record)
            
            return True
            
        except Exception as e:
            self.logger.error(f"Configuration setting failed for {key}: {str(e)}")
            return False

    async def create_feature_flag(
        self,
        name: str,
        description: str,
        enabled_percentage: float = 0.0,
        target_users: Optional[List[str]] = None,
        target_teams: Optional[List[str]] = None,
        created_by: str = "system"
    ) -> str:
        """Create new feature flag with targeting rules."""
        try:
            flag_id = str(uuid.uuid4())
            
            feature_flag = FeatureFlag(
                flag_id=flag_id,
                name=name,
                description=description,
                status=FeatureFlagStatus.DISABLED,
                enabled_percentage=enabled_percentage,
                target_users=target_users or [],
                target_teams=target_teams or [],
                created_by=created_by
            )
            
            # Store feature flag
            self.feature_flags[flag_id] = feature_flag
            
            # Persist to storage
            await self._persist_feature_flag(feature_flag)
            
            # Notify subscribers
            await self._notify_feature_flag_change(feature_flag, 'created')
            
            self.config_metrics['feature_flags_active'] += 1
            
            await self.metrics.record_event("feature_flag_created", {
                "flag_id": flag_id,
                "name": name,
                "created_by": created_by,
                "enabled_percentage": enabled_percentage
            })
            
            return flag_id
            
        except Exception as e:
            self.logger.error(f"Feature flag creation failed: {str(e)}")
            raise

    async def evaluate_feature_flag(
        self,
        flag_name: str,
        user_id: Optional[str] = None,
        team: Optional[str] = None,
        formation_type: Optional[str] = None,
        environment: ConfigurationEnvironment = ConfigurationEnvironment.PRODUCTION
    ) -> bool:
        """Evaluate feature flag for specific context."""
        try:
            # Find feature flag
            feature_flag = None
            for flag in self.feature_flags.values():
                if flag.name == flag_name:
                    feature_flag = flag
                    break
            
            if not feature_flag:
                return False
            
            # Check if flag is disabled
            if feature_flag.status == FeatureFlagStatus.DISABLED:
                return False
            
            # Check environment overrides
            if environment.value in feature_flag.environment_overrides:
                return feature_flag.environment_overrides[environment.value]
            
            # Check if flag is fully enabled
            if feature_flag.status == FeatureFlagStatus.ENABLED:
                return True
            
            # Check specific targeting rules
            if user_id and user_id in feature_flag.target_users:
                return True
            
            if team and team in feature_flag.target_teams:
                return True
            
            if formation_type and formation_type in feature_flag.target_formations:
                return True
            
            # Check percentage rollout
            if feature_flag.enabled_percentage > 0:
                # Deterministic hash-based evaluation
                hash_input = f"{flag_name}:{user_id or 'anonymous'}"
                hash_value = int(hashlib.md5(hash_input.encode()).hexdigest(), 16)
                percentage = (hash_value % 100) + 1
                
                return percentage <= feature_flag.enabled_percentage
            
            return False
            
        except Exception as e:
            self.logger.error(f"Feature flag evaluation failed for {flag_name}: {str(e)}")
            return False

    async def update_triangle_defense_configuration(
        self,
        formation_type: str,
        configuration_updates: Dict[str, Any],
        updated_by: str
    ) -> bool:
        """Update Triangle Defense formation configuration."""
        try:
            if formation_type not in self.triangle_defense_configs:
                # Create from template
                if formation_type in self.triangle_defense_templates:
                    self.triangle_defense_configs[formation_type] = self.triangle_defense_templates[formation_type]
                else:
                    raise ValueError(f"Unknown formation type: {formation_type}")
            
            config = self.triangle_defense_configs[formation_type]
            
            # Update configuration values
            for key, value in configuration_updates.items():
                if hasattr(config, key):
                    setattr(config, key, value)
            
            # Validate updated configuration
            if not await self._validate_triangle_defense_config(config):
                raise ValueError("Triangle Defense configuration validation failed")
            
            # Store updated configuration
            await self.set_configuration(
                f"triangle_defense.{formation_type.lower().replace(' ', '_')}",
                config.__dict__,
                ConfigurationType.TRIANGLE_DEFENSE,
                ConfigurationEnvironment.PRODUCTION,
                updated_by,
                f"Updated Triangle Defense configuration for {formation_type}"
            )
            
            # Notify ML optimizer of configuration change
            await self.ml_optimizer.update_formation_parameters(formation_type, config.__dict__)
            
            # Update Airtable with new configuration
            await self._sync_triangle_defense_config_to_airtable(formation_type, config)
            
            await self.metrics.record_event("triangle_defense_config_updated", {
                "formation_type": formation_type,
                "updated_by": updated_by,
                "configuration_keys": list(configuration_updates.keys())
            })
            
            return True
            
        except Exception as e:
            self.logger.error(f"Triangle Defense configuration update failed: {str(e)}")
            return False

    async def hot_reload_service_configuration(
        self,
        service_name: str,
        configuration_keys: Optional[List[str]] = None
    ) -> bool:
        """Trigger hot reload of configuration for specific service."""
        try:
            # Get current configuration for service
            service_config = {}
            
            if configuration_keys:
                for key in configuration_keys:
                    value = await self.get_configuration(key)
                    if value is not None:
                        service_config[key] = value
            else:
                # Get all configurations for service
                for key, config_value in self.configuration_cache.items():
                    if key.startswith(f"{service_name}.") or config_value.scope == ConfigurationScope.SERVICE:
                        service_config[key] = config_value.value
            
            if not service_config:
                return False
            
            # Notify service of configuration update
            await self._notify_service_configuration_update(service_name, service_config)
            
            # Update hot reload metrics
            self.config_metrics['hot_reloads_performed'] += 1
            
            await self.metrics.record_event("configuration_hot_reloaded", {
                "service_name": service_name,
                "configuration_count": len(service_config),
                "configuration_keys": list(service_config.keys())[:10]  # Limit for logging
            })
            
            return True
            
        except Exception as e:
            self.logger.error(f"Hot reload failed for service {service_name}: {str(e)}")
            return False

    # Private helper methods
    
    async def _initialize_storage_backends(self) -> None:
        """Initialize Redis, PostgreSQL, and Consul storage backends."""
        try:
            # Initialize Redis
            self.redis_client = await aioredis.from_url(
                self.redis_url,
                decode_responses=True,
                max_connections=20
            )
            await self.redis_client.ping()
            
            # Initialize PostgreSQL
            self.database_pool = await asyncpg.create_pool(
                self.database_url,
                min_size=5,
                max_size=20
            )
            
            # Create configurations table if not exists
            async with self.database_pool.acquire() as conn:
                await conn.execute("""
                    CREATE TABLE IF NOT EXISTS configurations (
                        id SERIAL PRIMARY KEY,
                        key VARCHAR(255) NOT NULL,
                        value JSONB NOT NULL,
                        config_type VARCHAR(50) NOT NULL,
                        environment VARCHAR(50) NOT NULL,
                        scope VARCHAR(50) NOT NULL,
                        version VARCHAR(50) NOT NULL,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        created_by VARCHAR(100) NOT NULL,
                        description TEXT,
                        encrypted BOOLEAN DEFAULT FALSE,
                        sensitive BOOLEAN DEFAULT FALSE,
                        UNIQUE(key, environment)
                    )
                """)
            
            # Initialize Consul (optional)
            try:
                self.consul_client = consul.aio.Consul(
                    host=self.consul_host,
                    port=self.consul_port
                )
                # Test connection
                await self.consul_client.agent.self()
            except Exception as e:
                self.logger.warning(f"Consul initialization failed (optional): {str(e)}")
                self.consul_client = None
            
            self.logger.info("Storage backends initialized successfully")
            
        except Exception as e:
            self.logger.error(f"Storage backend initialization failed: {str(e)}")
            raise

    async def _load_default_configurations(self) -> None:
        """Load default AMT platform configurations."""
        try:
            for key, value in self.default_configurations.items():
                await self._cache_configuration_value(
                    key,
                    value,
                    ConfigurationEnvironment.PRODUCTION,
                    ConfigurationType.APPLICATION,
                    "system"
                )
            
            self.logger.info(f"Loaded {len(self.default_configurations)} default configurations")
            
        except Exception as e:
            self.logger.error(f"Default configuration loading failed: {str(e)}")

    async def _initialize_triangle_defense_configs(self) -> None:
        """Initialize Triangle Defense formation configurations."""
        try:
            for formation_type, config_template in self.triangle_defense_templates.items():
                self.triangle_defense_configs[formation_type] = config_template
                
                # Store in configuration cache
                config_key = f"triangle_defense.{formation_type.lower().replace(' ', '_')}"
                await self._cache_configuration_value(
                    config_key,
                    config_template.__dict__,
                    ConfigurationEnvironment.PRODUCTION,
                    ConfigurationType.TRIANGLE_DEFENSE,
                    "system"
                )
            
            self.logger.info(f"Initialized {len(self.triangle_defense_configs)} Triangle Defense configurations")
            
        except Exception as e:
            self.logger.error(f"Triangle Defense configuration initialization failed: {str(e)}")

    async def _cache_configuration_value(
        self,
        key: str,
        value: Any,
        environment: ConfigurationEnvironment,
        config_type: ConfigurationType = ConfigurationType.APPLICATION,
        created_by: str = "system"
    ) -> None:
        """Cache configuration value in memory."""
        cache_key = f"{environment.value}:{key}"
        
        config_value = ConfigurationValue(
            key=key,
            value=value,
            config_type=config_type,
            environment=environment,
            scope=ConfigurationScope.GLOBAL,
            version="1.0",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            created_by=created_by,
            description=f"Configuration for {key}"
        )
        
        self.configuration_cache[cache_key] = config_value
        self.config_metrics['configurations_managed'] += 1

    async def _notify_service_configuration_update(
        self,
        service_name: str,
        configuration: Dict[str, Any]
    ) -> None:
        """Notify service of configuration update."""
        try:
            # Use Redis pub/sub to notify services
            if self.redis_client:
                notification_data = {
                    'service': service_name,
                    'configuration': configuration,
                    'timestamp': datetime.utcnow().isoformat(),
                    'action': 'hot_reload'
                }
                
                await self.redis_client.publish(
                    f"amt_config_update:{service_name}",
                    json.dumps(notification_data)
                )
            
            # Also notify via notification system
            await self.notifications.send_configuration_update_notification(
                service_name,
                configuration,
                priority='high'
            )
            
        except Exception as e:
            self.logger.error(f"Service configuration update notification failed: {str(e)}")

    async def get_configuration_service_status(self) -> Dict[str, Any]:
        """Get comprehensive configuration service status."""
        return {
            "service_initialized": self.redis_client is not None and self.database_pool is not None,
            "configurations_cached": len(self.configuration_cache),
            "feature_flags_active": len(self.feature_flags),
            "triangle_defense_configs": len(self.triangle_defense_configs),
            "pending_approvals": len(self.pending_approvals),
            "configuration_changes": len(self.configuration_changes),
            "config_metrics": self.config_metrics.copy(),
            "storage_backends": {
                "redis_connected": self.redis_client is not None,
                "database_connected": self.database_pool is not None,
                "consul_connected": self.consul_client is not None
            },
            "background_tasks": {
                "config_sync": self.config_sync_task is not None and not self.config_sync_task.done(),
                "flag_evaluation": self.flag_evaluation_task is not None and not self.flag_evaluation_task.done(),
                "file_watcher": self.file_watcher_task is not None and not self.file_watcher_task.done(),
                "metrics_collector": self.metrics_collector_task is not None and not self.metrics_collector_task.done()
            },
            "triangle_defense_formations": list(self.triangle_defense_configs.keys()),
            "feature_flag_status": {
                flag.name: {
                    "status": flag.status.value,
                    "enabled_percentage": flag.enabled_percentage,
                    "target_users_count": len(flag.target_users),
                    "target_teams_count": len(flag.target_teams)
                }
                for flag in list(self.feature_flags.values())[:10]  # Limit for status display
            }
        }


# Export main class
__all__ = [
    'DynamicConfigurationService',
    'ConfigurationValue',
    'FeatureFlag',
    'ConfigurationChange',
    'TriangleDefenseConfiguration',
    'ConfigurationType',
    'ConfigurationEnvironment',
    'ConfigurationScope',
    'FeatureFlagStatus'
]
