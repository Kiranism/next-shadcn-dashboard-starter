"""
AMT Configuration Manager
Centralized configuration management with environment-aware settings, feature flags, and secrets management
"""

import asyncio
import logging
import json
import os
from typing import Dict, List, Optional, Any, Union, Callable, Type
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict, field
from enum import Enum
from pathlib import Path
import yaml
import hashlib
import base64
from contextlib import asynccontextmanager
import threading
from concurrent.futures import ThreadPoolExecutor

# Configuration file formats
try:
    import toml
    TOML_AVAILABLE = True
except ImportError:
    logging.warning("TOML not available - .toml config files will not be supported")
    TOML_AVAILABLE = False

try:
    from cryptography.fernet import Fernet
    ENCRYPTION_AVAILABLE = True
except ImportError:
    logging.warning("Cryptography not available - config encryption will be disabled")
    ENCRYPTION_AVAILABLE = False

from ..monitoring.observability_stack import get_observability_stack
from ..security.security_manager import get_security_manager

logger = logging.getLogger(__name__)

class ConfigurationSource(str, Enum):
    """Configuration sources in order of priority"""
    ENVIRONMENT_VARIABLES = "environment"
    COMMAND_LINE_ARGS = "command_line"
    CONFIG_FILES = "config_files"
    REMOTE_CONFIG = "remote_config"
    DEFAULT_VALUES = "defaults"

class ConfigurationType(str, Enum):
    """Types of configuration values"""
    STRING = "string"
    INTEGER = "integer"
    FLOAT = "float"
    BOOLEAN = "boolean"
    LIST = "list"
    DICT = "dict"
    JSON = "json"
    SECRET = "secret"

class Environment(str, Enum):
    """Application environments"""
    DEVELOPMENT = "development"
    TESTING = "testing"
    STAGING = "staging"
    PRODUCTION = "production"

@dataclass
class ConfigurationItem:
    """Individual configuration item"""
    key: str
    value: Any
    config_type: ConfigurationType
    source: ConfigurationSource
    environment: Environment
    description: Optional[str] = None
    default_value: Any = None
    required: bool = False
    encrypted: bool = False
    validation_rules: Dict[str, Any] = field(default_factory=dict)
    last_updated: datetime = field(default_factory=datetime.now)
    update_count: int = 0

@dataclass
class FeatureFlag:
    """Feature flag configuration"""
    flag_name: str
    enabled: bool
    environments: List[Environment]
    rollout_percentage: float = 100.0
    user_groups: List[str] = field(default_factory=list)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    description: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class ConfigurationSchema:
    """Schema definition for configuration validation"""
    key: str
    config_type: ConfigurationType
    required: bool = False
    default_value: Any = None
    validation_rules: Dict[str, Any] = field(default_factory=dict)
    description: Optional[str] = None
    sensitive: bool = False
    environment_specific: bool = False

class ConfigurationManager:
    """Centralized configuration management system"""
    
    def __init__(
        self, 
        config_dir: Optional[Path] = None,
        environment: Optional[Environment] = None,
        enable_encryption: bool = True
    ):
        self.config_dir = config_dir or Path("config")
        self.config_dir.mkdir(parents=True, exist_ok=True)
        
        # Environment detection
        self.environment = environment or self._detect_environment()
        
        # Configuration storage
        self.configurations: Dict[str, ConfigurationItem] = {}
        self.feature_flags: Dict[str, FeatureFlag] = {}
        self.schemas: Dict[str, ConfigurationSchema] = {}
        
        # Encryption setup
        self.encryption_enabled = enable_encryption and ENCRYPTION_AVAILABLE
        self.encryption_key: Optional[bytes] = None
        self.fernet: Optional[Fernet] = None
        
        if self.encryption_enabled:
            self._setup_encryption()
        
        # Configuration watchers and callbacks
        self.config_watchers: Dict[str, List[Callable]] = {}
        self.change_callbacks: List[Callable[[str, Any, Any], None]] = []
        
        # Async update handling
        self._update_queue: asyncio.Queue = asyncio.Queue()
        self._update_task: Optional[asyncio.Task] = None
        
        # Thread pool for file operations
        self._executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix="config-")
        
        # Configuration cache
        self._config_cache: Dict[str, Any] = {}
        self._cache_lock = threading.RLock()
        
        # Initialize built-in schemas
        self._initialize_built_in_schemas()
    
    def _detect_environment(self) -> Environment:
        """Detect current environment from various sources"""
        
        # Check environment variables
        env_var = os.getenv("AMT_ENVIRONMENT", os.getenv("ENVIRONMENT", "")).lower()
        
        if env_var in ["prod", "production"]:
            return Environment.PRODUCTION
        elif env_var in ["stage", "staging"]:
            return Environment.STAGING
        elif env_var in ["test", "testing"]:
            return Environment.TESTING
        elif env_var in ["dev", "development"]:
            return Environment.DEVELOPMENT
        
        # Check for common production indicators
        if os.getenv("KUBERNETES_SERVICE_HOST") or os.getenv("AWS_REGION"):
            return Environment.PRODUCTION
        
        # Default to development
        return Environment.DEVELOPMENT
    
    def _setup_encryption(self):
        """Setup configuration encryption"""
        
        # Try to load existing key
        key_file = self.config_dir / ".encryption_key"
        
        if key_file.exists():
            try:
                self.encryption_key = key_file.read_bytes()
                self.fernet = Fernet(self.encryption_key)
                logger.info("Loaded existing encryption key")
            except Exception as e:
                logger.warning(f"Failed to load encryption key: {str(e)}")
                self._generate_new_encryption_key()
        else:
            self._generate_new_encryption_key()
    
    def _generate_new_encryption_key(self):
        """Generate new encryption key"""
        
        try:
            self.encryption_key = Fernet.generate_key()
            self.fernet = Fernet(self.encryption_key)
            
            key_file = self.config_dir / ".encryption_key"
            key_file.write_bytes(self.encryption_key)
            key_file.chmod(0o600)  # Restrict permissions
            
            logger.info("Generated new encryption key")
            
        except Exception as e:
            logger.error(f"Failed to generate encryption key: {str(e)}")
            self.encryption_enabled = False
    
    def _initialize_built_in_schemas(self):
        """Initialize built-in configuration schemas"""
        
        # Core system configurations
        system_schemas = [
            # Database configuration
            ConfigurationSchema(
                key="database.host",
                config_type=ConfigurationType.STRING,
                required=True,
                default_value="localhost",
                description="Database host address"
            ),
            ConfigurationSchema(
                key="database.port",
                config_type=ConfigurationType.INTEGER,
                required=True,
                default_value=5432,
                validation_rules={"min": 1, "max": 65535},
                description="Database port number"
            ),
            ConfigurationSchema(
                key="database.name",
                config_type=ConfigurationType.STRING,
                required=True,
                default_value="amt_platform",
                description="Database name"
            ),
            ConfigurationSchema(
                key="database.username",
                config_type=ConfigurationType.STRING,
                required=True,
                description="Database username"
            ),
            ConfigurationSchema(
                key="database.password",
                config_type=ConfigurationType.SECRET,
                required=True,
                sensitive=True,
                description="Database password"
            ),
            
            # Redis configuration
            ConfigurationSchema(
                key="redis.host",
                config_type=ConfigurationType.STRING,
                default_value="localhost",
                description="Redis host address"
            ),
            ConfigurationSchema(
                key="redis.port",
                config_type=ConfigurationType.INTEGER,
                default_value=6379,
                validation_rules={"min": 1, "max": 65535},
                description="Redis port number"
            ),
            
            # API configuration
            ConfigurationSchema(
                key="api.host",
                config_type=ConfigurationType.STRING,
                default_value="0.0.0.0",
                description="API server host"
            ),
            ConfigurationSchema(
                key="api.port",
                config_type=ConfigurationType.INTEGER,
                default_value=8000,
                validation_rules={"min": 1024, "max": 65535},
                description="API server port"
            ),
            ConfigurationSchema(
                key="api.cors_origins",
                config_type=ConfigurationType.LIST,
                default_value=["http://localhost:3000"],
                description="CORS allowed origins"
            ),
            
            # Security configuration
            ConfigurationSchema(
                key="security.jwt_secret",
                config_type=ConfigurationType.SECRET,
                required=True,
                sensitive=True,
                description="JWT signing secret"
            ),
            ConfigurationSchema(
                key="security.session_timeout",
                config_type=ConfigurationType.INTEGER,
                default_value=3600,
                validation_rules={"min": 300, "max": 86400},
                description="Session timeout in seconds"
            ),
            ConfigurationSchema(
                key="security.rate_limit_requests",
                config_type=ConfigurationType.INTEGER,
                default_value=1000,
                validation_rules={"min": 1},
                description="Rate limit requests per minute"
            ),
            
            # Anthropic API configuration
            ConfigurationSchema(
                key="anthropic.api_key",
                config_type=ConfigurationType.SECRET,
                required=True,
                sensitive=True,
                description="Anthropic API key"
            ),
            ConfigurationSchema(
                key="anthropic.model",
                config_type=ConfigurationType.STRING,
                default_value="claude-3-sonnet-20240229",
                description="Anthropic model to use"
            ),
            ConfigurationSchema(
                key="anthropic.max_tokens",
                config_type=ConfigurationType.INTEGER,
                default_value=4000,
                validation_rules={"min": 100, "max": 100000},
                description="Maximum tokens per request"
            ),
            
            # Triangle Defense configuration
            ConfigurationSchema(
                key="triangle_defense.enable_analytics",
                config_type=ConfigurationType.BOOLEAN,
                default_value=True,
                description="Enable Triangle Defense analytics"
            ),
            ConfigurationSchema(
                key="triangle_defense.formations_config",
                config_type=ConfigurationType.DICT,
                default_value={
                    "larry": {"color": "#4ECDC4", "strength": 0.85},
                    "linda": {"color": "#FF6B6B", "strength": 0.80},
                    "ricky": {"color": "#FFD93D", "strength": 0.88},
                    "rita": {"color": "#9B59B6", "strength": 0.82}
                },
                description="Triangle Defense formations configuration"
            ),
            
            # Monitoring configuration
            ConfigurationSchema(
                key="monitoring.enable_metrics",
                config_type=ConfigurationType.BOOLEAN,
                default_value=True,
                description="Enable metrics collection"
            ),
            ConfigurationSchema(
                key="monitoring.metrics_retention_days",
                config_type=ConfigurationType.INTEGER,
                default_value=30,
                validation_rules={"min": 1, "max": 365},
                description="Metrics retention period in days"
            ),
            ConfigurationSchema(
                key="monitoring.log_level",
                config_type=ConfigurationType.STRING,
                default_value="INFO",
                validation_rules={"enum": ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]},
                description="Logging level"
            ),
            
            # Data pipeline configuration
            ConfigurationSchema(
                key="data_pipeline.enable_processing",
                config_type=ConfigurationType.BOOLEAN,
                default_value=True,
                description="Enable data pipeline processing"
            ),
            ConfigurationSchema(
                key="data_pipeline.batch_size",
                config_type=ConfigurationType.INTEGER,
                default_value=1000,
                validation_rules={"min": 1, "max": 10000},
                description="Data pipeline batch size"
            ),
            ConfigurationSchema(
                key="data_pipeline.parallel_workers",
                config_type=ConfigurationType.INTEGER,
                default_value=4,
                validation_rules={"min": 1, "max": 16},
                description="Number of parallel pipeline workers"
            )
        ]
        
        # Register schemas
        for schema in system_schemas:
            self.schemas[schema.key] = schema
        
        # Environment-specific overrides
        if self.environment == Environment.PRODUCTION:
            self.schemas["monitoring.log_level"].default_value = "WARNING"
            self.schemas["api.cors_origins"].default_value = ["https://portal.analyzemyteam.com"]
        elif self.environment == Environment.DEVELOPMENT:
            self.schemas["monitoring.log_level"].default_value = "DEBUG"
            self.schemas["security.session_timeout"].default_value = 7200  # 2 hours for dev
    
    async def initialize(self) -> bool:
        """Initialize configuration manager"""
        
        try:
            # Load configurations from all sources
            await self._load_configurations()
            
            # Initialize feature flags
            await self._load_feature_flags()
            
            # Start configuration update handler
            self._update_task = asyncio.create_task(self._handle_config_updates())
            
            logger.info(f"Configuration manager initialized for {self.environment.value} environment")
            logger.info(f"Loaded {len(self.configurations)} configurations and {len(self.feature_flags)} feature flags")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize configuration manager: {str(e)}")
            return False
    
    async def _load_configurations(self):
        """Load configurations from all sources"""
        
        # Load in priority order (lowest to highest priority)
        await self._load_default_configurations()
        await self._load_file_configurations()
        await self._load_environment_configurations()
        await self._load_remote_configurations()
        
        # Validate all configurations
        await self._validate_configurations()
    
    async def _load_default_configurations(self):
        """Load default configurations from schemas"""
        
        for key, schema in self.schemas.items():
            if schema.default_value is not None:
                config_item = ConfigurationItem(
                    key=key,
                    value=schema.default_value,
                    config_type=schema.config_type,
                    source=ConfigurationSource.DEFAULT_VALUES,
                    environment=self.environment,
                    description=schema.description,
                    default_value=schema.default_value,
                    required=schema.required,
                    encrypted=schema.sensitive and self.encryption_enabled,
                    validation_rules=schema.validation_rules
                )
                
                self.configurations[key] = config_item
    
    async def _load_file_configurations(self):
        """Load configurations from config files"""
        
        # Load environment-specific config file
        config_file = self.config_dir / f"{self.environment.value}.yaml"
        if config_file.exists():
            await self._load_config_file(config_file, self.environment)
        
        # Load general config file
        general_config = self.config_dir / "config.yaml"
        if general_config.exists():
            await self._load_config_file(general_config, self.environment)
        
        # Load TOML files if available
        if TOML_AVAILABLE:
            toml_config = self.config_dir / f"{self.environment.value}.toml"
            if toml_config.exists():
                await self._load_toml_file(toml_config, self.environment)
    
    async def _load_config_file(self, config_file: Path, environment: Environment):
        """Load YAML configuration file"""
        
        try:
            content = await asyncio.get_event_loop().run_in_executor(
                self._executor, config_file.read_text
            )
            
            config_data = yaml.safe_load(content)
            
            if config_data:
                self._process_config_dict(config_data, ConfigurationSource.CONFIG_FILES, environment)
                
            logger.info(f"Loaded configuration from {config_file}")
            
        except Exception as e:
            logger.error(f"Failed to load config file {config_file}: {str(e)}")
    
    async def _load_toml_file(self, config_file: Path, environment: Environment):
        """Load TOML configuration file"""
        
        try:
            content = await asyncio.get_event_loop().run_in_executor(
                self._executor, config_file.read_text
            )
            
            config_data = toml.loads(content)
            
            if config_data:
                self._process_config_dict(config_data, ConfigurationSource.CONFIG_FILES, environment)
                
            logger.info(f"Loaded TOML configuration from {config_file}")
            
        except Exception as e:
            logger.error(f"Failed to load TOML file {config_file}: {str(e)}")
    
    def _process_config_dict(self, config_data: Dict[str, Any], source: ConfigurationSource, environment: Environment):
        """Process nested configuration dictionary"""
        
        def flatten_dict(d: Dict[str, Any], prefix: str = "") -> Dict[str, Any]:
            """Flatten nested dictionary with dot notation"""
            items = []
            for k, v in d.items():
                new_key = f"{prefix}.{k}" if prefix else k
                if isinstance(v, dict):
                    items.extend(flatten_dict(v, new_key).items())
                else:
                    items.append((new_key, v))
            return dict(items)
        
        flattened = flatten_dict(config_data)
        
        for key, value in flattened.items():
            # Determine configuration type
            config_type = self._infer_config_type(value)
            
            # Check if we have schema for this key
            schema = self.schemas.get(key)
            if schema:
                config_type = schema.config_type
            
            # Create or update configuration item
            config_item = ConfigurationItem(
                key=key,
                value=value,
                config_type=config_type,
                source=source,
                environment=environment,
                description=schema.description if schema else None,
                required=schema.required if schema else False,
                encrypted=schema.sensitive and self.encryption_enabled if schema else False,
                validation_rules=schema.validation_rules if schema else {}
            )
            
            # Encrypt if needed
            if config_item.encrypted and self.fernet:
                config_item.value = self._encrypt_value(str(value))
            
            self.configurations[key] = config_item
    
    def _infer_config_type(self, value: Any) -> ConfigurationType:
        """Infer configuration type from value"""
        
        if isinstance(value, bool):
            return ConfigurationType.BOOLEAN
        elif isinstance(value, int):
            return ConfigurationType.INTEGER
        elif isinstance(value, float):
            return ConfigurationType.FLOAT
        elif isinstance(value, list):
            return ConfigurationType.LIST
        elif isinstance(value, dict):
            return ConfigurationType.DICT
        else:
            return ConfigurationType.STRING
    
    async def _load_environment_configurations(self):
        """Load configurations from environment variables"""
        
        # Look for AMT_ prefixed environment variables
        for key, value in os.environ.items():
            if key.startswith("AMT_"):
                config_key = key[4:].lower().replace("_", ".")
                
                # Skip if already loaded from higher priority source
                existing_config = self.configurations.get(config_key)
                if existing_config and existing_config.source in [ConfigurationSource.COMMAND_LINE_ARGS]:
                    continue
                
                # Determine type
                schema = self.schemas.get(config_key)
                config_type = schema.config_type if schema else self._infer_config_type_from_string(value)
                
                # Parse value according to type
                parsed_value = self._parse_config_value(value, config_type)
                
                config_item = ConfigurationItem(
                    key=config_key,
                    value=parsed_value,
                    config_type=config_type,
                    source=ConfigurationSource.ENVIRONMENT_VARIABLES,
                    environment=self.environment,
                    description=schema.description if schema else f"Environment variable {key}",
                    required=schema.required if schema else False,
                    encrypted=schema.sensitive and self.encryption_enabled if schema else False,
                    validation_rules=schema.validation_rules if schema else {}
                )
                
                # Encrypt if needed
                if config_item.encrypted and self.fernet:
                    config_item.value = self._encrypt_value(str(parsed_value))
                
                self.configurations[config_key] = config_item
    
    def _infer_config_type_from_string(self, value: str) -> ConfigurationType:
        """Infer configuration type from string value"""
        
        # Try boolean
        if value.lower() in ["true", "false", "yes", "no", "on", "off"]:
            return ConfigurationType.BOOLEAN
        
        # Try integer
        try:
            int(value)
            return ConfigurationType.INTEGER
        except ValueError:
            pass
        
        # Try float
        try:
            float(value)
            return ConfigurationType.FLOAT
        except ValueError:
            pass
        
        # Try JSON
        if value.startswith(("{", "[")):
            try:
                json.loads(value)
                return ConfigurationType.JSON
            except json.JSONDecodeError:
                pass
        
        # Default to string
        return ConfigurationType.STRING
    
    def _parse_config_value(self, value: str, config_type: ConfigurationType) -> Any:
        """Parse configuration value according to type"""
        
        if config_type == ConfigurationType.BOOLEAN:
            return value.lower() in ["true", "yes", "on", "1"]
        elif config_type == ConfigurationType.INTEGER:
            return int(value)
        elif config_type == ConfigurationType.FLOAT:
            return float(value)
        elif config_type == ConfigurationType.LIST:
            return [item.strip() for item in value.split(",") if item.strip()]
        elif config_type == ConfigurationType.JSON:
            return json.loads(value)
        else:
            return value
    
    async def _load_remote_configurations(self):
        """Load configurations from remote sources"""
        
        # This would integrate with remote config services like:
        # - AWS Parameter Store
        # - Azure Key Vault
        # - HashiCorp Vault
        # - Consul
        # - etcd
        
        # For now, this is a placeholder for future implementation
        pass
    
    async def _validate_configurations(self):
        """Validate all loaded configurations"""
        
        validation_errors = []
        
        for key, config in self.configurations.items():
            try:
                self._validate_config_item(config)
            except ValueError as e:
                validation_errors.append(f"{key}: {str(e)}")
        
        # Check for missing required configurations
        for key, schema in self.schemas.items():
            if schema.required and key not in self.configurations:
                validation_errors.append(f"{key}: Required configuration is missing")
        
        if validation_errors:
            error_message = "Configuration validation errors:\n" + "\n".join(validation_errors)
            logger.error(error_message)
            raise ValueError(error_message)
    
    def _validate_config_item(self, config: ConfigurationItem):
        """Validate individual configuration item"""
        
        value = config.value
        rules = config.validation_rules
        
        # Type validation is implicit through parsing
        
        # Range validation
        if "min" in rules and isinstance(value, (int, float)):
            if value < rules["min"]:
                raise ValueError(f"Value {value} is below minimum {rules['min']}")
        
        if "max" in rules and isinstance(value, (int, float)):
            if value > rules["max"]:
                raise ValueError(f"Value {value} is above maximum {rules['max']}")
        
        # Enum validation
        if "enum" in rules:
            if value not in rules["enum"]:
                raise ValueError(f"Value {value} is not in allowed values: {rules['enum']}")
        
        # Pattern validation
        if "pattern" in rules and isinstance(value, str):
            import re
            if not re.match(rules["pattern"], value):
                raise ValueError(f"Value {value} does not match pattern {rules['pattern']}")
        
        # Length validation
        if "min_length" in rules and isinstance(value, (str, list)):
            if len(value) < rules["min_length"]:
                raise ValueError(f"Value length {len(value)} is below minimum {rules['min_length']}")
        
        if "max_length" in rules and isinstance(value, (str, list)):
            if len(value) > rules["max_length"]:
                raise ValueError(f"Value length {len(value)} is above maximum {rules['max_length']}")
    
    async def _load_feature_flags(self):
        """Load feature flags configuration"""
        
        # Load from feature flags file
        flags_file = self.config_dir / f"feature_flags_{self.environment.value}.yaml"
        if not flags_file.exists():
            flags_file = self.config_dir / "feature_flags.yaml"
        
        if flags_file.exists():
            try:
                content = await asyncio.get_event_loop().run_in_executor(
                    self._executor, flags_file.read_text
                )
                
                flags_data = yaml.safe_load(content)
                
                if flags_data and "feature_flags" in flags_data:
                    for flag_name, flag_config in flags_data["feature_flags"].items():
                        feature_flag = FeatureFlag(
                            flag_name=flag_name,
                            enabled=flag_config.get("enabled", False),
                            environments=[Environment(env) for env in flag_config.get("environments", [self.environment.value])],
                            rollout_percentage=flag_config.get("rollout_percentage", 100.0),
                            user_groups=flag_config.get("user_groups", []),
                            start_date=datetime.fromisoformat(flag_config["start_date"]) if flag_config.get("start_date") else None,
                            end_date=datetime.fromisoformat(flag_config["end_date"]) if flag_config.get("end_date") else None,
                            description=flag_config.get("description"),
                            metadata=flag_config.get("metadata", {})
                        )
                        
                        self.feature_flags[flag_name] = feature_flag
                
                logger.info(f"Loaded {len(self.feature_flags)} feature flags")
                
            except Exception as e:
                logger.error(f"Failed to load feature flags: {str(e)}")
        
        # Initialize default feature flags
        await self._initialize_default_feature_flags()
    
    async def _initialize_default_feature_flags(self):
        """Initialize default feature flags"""
        
        default_flags = [
            FeatureFlag(
                flag_name="triangle_defense_analytics",
                enabled=True,
                environments=[Environment.DEVELOPMENT, Environment.STAGING, Environment.PRODUCTION],
                description="Enable Triangle Defense analytics and insights"
            ),
            FeatureFlag(
                flag_name="mel_ai_advanced_features",
                enabled=self.environment != Environment.PRODUCTION,
                environments=[Environment.DEVELOPMENT, Environment.STAGING],
                description="Enable M.E.L. AI advanced experimental features"
            ),
            FeatureFlag(
                flag_name="performance_analytics",
                enabled=True,
                environments=[Environment.STAGING, Environment.PRODUCTION],
                description="Enable advanced performance analytics"
            ),
            FeatureFlag(
                flag_name="data_pipeline_automation",
                enabled=self.environment in [Environment.STAGING, Environment.PRODUCTION],
                environments=[Environment.STAGING, Environment.PRODUCTION],
                description="Enable automated data pipeline processing"
            ),
            FeatureFlag(
                flag_name="creative_tools_beta",
                enabled=False,
                environments=[Environment.DEVELOPMENT],
                rollout_percentage=50.0,
                description="Beta creative tools features"
            ),
            FeatureFlag(
                flag_name="dashboard_real_time_updates",
                enabled=True,
                environments=[Environment.DEVELOPMENT, Environment.STAGING, Environment.PRODUCTION],
                description="Enable real-time dashboard updates via WebSocket"
            )
        ]
        
        for flag in default_flags:
            if flag.flag_name not in self.feature_flags:
                self.feature_flags[flag.flag_name] = flag
    
    async def _handle_config_updates(self):
        """Handle configuration updates from queue"""
        
        while True:
            try:
                # Get update from queue
                update = await self._update_queue.get()
                
                if update is None:  # Shutdown signal
                    break
                
                key, new_value, source = update
                
                # Update configuration
                if key in self.configurations:
                    old_value = self.configurations[key].value
                    self.configurations[key].value = new_value
                    self.configurations[key].last_updated = datetime.now()
                    self.configurations[key].update_count += 1
                    
                    # Clear cache
                    with self._cache_lock:
                        if key in self._config_cache:
                            del self._config_cache[key]
                    
                    # Notify watchers
                    await self._notify_watchers(key, new_value, old_value)
                    
                    # Execute change callbacks
                    for callback in self.change_callbacks:
                        try:
                            callback(key, old_value, new_value)
                        except Exception as e:
                            logger.error(f"Config change callback failed: {str(e)}")
                
                self._update_queue.task_done()
                
            except Exception as e:
                logger.error(f"Config update handler error: {str(e)}")
    
    async def _notify_watchers(self, key: str, new_value: Any, old_value: Any):
        """Notify configuration watchers of changes"""
        
        if key in self.config_watchers:
            for watcher in self.config_watchers[key]:
                try:
                    if asyncio.iscoroutinefunction(watcher):
                        await watcher(key, old_value, new_value)
                    else:
                        watcher(key, old_value, new_value)
                except Exception as e:
                    logger.error(f"Config watcher failed for {key}: {str(e)}")
    
    def _encrypt_value(self, value: str) -> str:
        """Encrypt configuration value"""
        
        if not self.fernet:
            return value
        
        try:
            encrypted = self.fernet.encrypt(value.encode())
            return base64.urlsafe_b64encode(encrypted).decode()
        except Exception as e:
            logger.error(f"Failed to encrypt config value: {str(e)}")
            return value
    
    def _decrypt_value(self, encrypted_value: str) -> str:
        """Decrypt configuration value"""
        
        if not self.fernet:
            return encrypted_value
        
        try:
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_value.encode())
            decrypted = self.fernet.decrypt(encrypted_bytes)
            return decrypted.decode()
        except Exception as e:
            logger.error(f"Failed to decrypt config value: {str(e)}")
            return encrypted_value
    
    # Public API methods
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value"""
        
        # Check cache first
        with self._cache_lock:
            if key in self._config_cache:
                return self._config_cache[key]
        
        if key not in self.configurations:
            return default
        
        config = self.configurations[key]
        value = config.value
        
        # Decrypt if needed
        if config.encrypted and self.fernet:
            value = self._decrypt_value(value)
            
            # Parse back to original type
            if config.config_type == ConfigurationType.INTEGER:
                value = int(value)
            elif config.config_type == ConfigurationType.FLOAT:
                value = float(value)
            elif config.config_type == ConfigurationType.BOOLEAN:
                value = value.lower() in ["true", "yes", "on", "1"]
            elif config.config_type == ConfigurationType.JSON:
                value = json.loads(value)
        
        # Cache the decrypted value
        with self._cache_lock:
            self._config_cache[key] = value
        
        return value
    
    def get_int(self, key: str, default: int = 0) -> int:
        """Get configuration value as integer"""
        
        value = self.get(key, default)
        try:
            return int(value)
        except (ValueError, TypeError):
            return default
    
    def get_float(self, key: str, default: float = 0.0) -> float:
        """Get configuration value as float"""
        
        value = self.get(key, default)
        try:
            return float(value)
        except (ValueError, TypeError):
            return default
    
    def get_bool(self, key: str, default: bool = False) -> bool:
        """Get configuration value as boolean"""
        
        value = self.get(key, default)
        if isinstance(value, bool):
            return value
        elif isinstance(value, str):
            return value.lower() in ["true", "yes", "on", "1"]
        else:
            return bool(value)
    
    def get_list(self, key: str, default: List[Any] = None) -> List[Any]:
        """Get configuration value as list"""
        
        value = self.get(key, default or [])
        if isinstance(value, list):
            return value
        elif isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        else:
            return [value]
    
    def get_dict(self, key: str, default: Dict[str, Any] = None) -> Dict[str, Any]:
        """Get configuration value as dictionary"""
        
        value = self.get(key, default or {})
        if isinstance(value, dict):
            return value
        elif isinstance(value, str):
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return default or {}
        else:
            return default or {}
    
    async def set(self, key: str, value: Any, source: ConfigurationSource = ConfigurationSource.COMMAND_LINE_ARGS):
        """Set configuration value"""
        
        # Add to update queue
        await self._update_queue.put((key, value, source))
    
    def has(self, key: str) -> bool:
        """Check if configuration key exists"""
        
        return key in self.configurations
    
    def is_feature_enabled(self, flag_name: str, user_id: Optional[str] = None, user_groups: List[str] = None) -> bool:
        """Check if feature flag is enabled"""
        
        if flag_name not in self.feature_flags:
            return False
        
        flag = self.feature_flags[flag_name]
        
        # Check if flag is enabled for current environment
        if self.environment not in flag.environments:
            return False
        
        # Check if flag is globally enabled
        if not flag.enabled:
            return False
        
        # Check date range
        now = datetime.now()
        if flag.start_date and now < flag.start_date:
            return False
        if flag.end_date and now > flag.end_date:
            return False
        
        # Check user groups
        if flag.user_groups and user_groups:
            if not any(group in flag.user_groups for group in user_groups):
                return False
        
        # Check rollout percentage
        if flag.rollout_percentage < 100.0:
            # Use deterministic hash for consistent user experience
            if user_id:
                hash_input = f"{flag_name}_{user_id}"
                hash_value = int(hashlib.md5(hash_input.encode()).hexdigest(), 16)
                percentage = (hash_value % 100) + 1
                return percentage <= flag.rollout_percentage
            else:
                # Random rollout for anonymous users
                import random
                return random.random() * 100 <= flag.rollout_percentage
        
        return True
    
    def watch(self, key: str, callback: Callable[[str, Any, Any], None]):
        """Watch configuration key for changes"""
        
        if key not in self.config_watchers:
            self.config_watchers[key] = []
        
        self.config_watchers[key].append(callback)
    
    def unwatch(self, key: str, callback: Callable[[str, Any, Any], None]):
        """Stop watching configuration key"""
        
        if key in self.config_watchers:
            try:
                self.config_watchers[key].remove(callback)
            except ValueError:
                pass
    
    def add_change_callback(self, callback: Callable[[str, Any, Any], None]):
        """Add global configuration change callback"""
        
        self.change_callbacks.append(callback)
    
    def remove_change_callback(self, callback: Callable[[str, Any, Any], None]):
        """Remove global configuration change callback"""
        
        try:
            self.change_callbacks.remove(callback)
        except ValueError:
            pass
    
    def get_all_configurations(self) -> Dict[str, Dict[str, Any]]:
        """Get all configurations (excluding sensitive data)"""
        
        result = {}
        
        for key, config in self.configurations.items():
            config_dict = asdict(config)
            
            # Mask sensitive values
            if config.encrypted or (config.config_type == ConfigurationType.SECRET):
                config_dict["value"] = "***MASKED***"
            
            result[key] = config_dict
        
        return result
    
    def get_feature_flags(self) -> Dict[str, Dict[str, Any]]:
        """Get all feature flags"""
        
        return {
            name: asdict(flag) for name, flag in self.feature_flags.items()
        }
    
    def get_environment_info(self) -> Dict[str, Any]:
        """Get environment information"""
        
        return {
            "environment": self.environment.value,
            "config_dir": str(self.config_dir),
            "encryption_enabled": self.encryption_enabled,
            "total_configurations": len(self.configurations),
            "total_feature_flags": len(self.feature_flags),
            "configuration_sources": list(set(config.source.value for config in self.configurations.values())),
            "last_loaded": max((config.last_updated for config in self.configurations.values()), default=datetime.now()).isoformat()
        }
    
    async def reload_configurations(self):
        """Reload configurations from all sources"""
        
        logger.info("Reloading configurations...")
        
        # Clear existing configurations (except command line args)
        configs_to_keep = {
            key: config for key, config in self.configurations.items()
            if config.source == ConfigurationSource.COMMAND_LINE_ARGS
        }
        
        self.configurations = configs_to_keep
        
        # Clear cache
        with self._cache_lock:
            self._config_cache.clear()
        
        # Reload from all sources
        await self._load_configurations()
        
        logger.info(f"Reloaded {len(self.configurations)} configurations")
    
    async def export_configuration(self, output_file: Path, include_sensitive: bool = False):
        """Export configuration to file"""
        
        export_data = {
            "metadata": {
                "environment": self.environment.value,
                "exported_at": datetime.now().isoformat(),
                "total_configurations": len(self.configurations)
            },
            "configurations": {},
            "feature_flags": {name: asdict(flag) for name, flag in self.feature_flags.items()}
        }
        
        for key, config in self.configurations.items():
            config_data = asdict(config)
            
            # Handle sensitive data
            if not include_sensitive and (config.encrypted or config.config_type == ConfigurationType.SECRET):
                config_data["value"] = "***MASKED***"
            
            export_data["configurations"][key] = config_data
        
        # Write to file
        await asyncio.get_event_loop().run_in_executor(
            self._executor,
            lambda: output_file.write_text(yaml.dump(export_data, indent=2))
        )
        
        logger.info(f"Configuration exported to {output_file}")
    
    async def shutdown(self):
        """Shutdown configuration manager"""
        
        logger.info("Shutting down configuration manager...")
        
        # Stop update handler
        if self._update_task:
            await self._update_queue.put(None)  # Shutdown signal
            try:
                await self._update_task
            except asyncio.CancelledError:
                pass
        
        # Shutdown executor
        self._executor.shutdown(wait=True)
        
        logger.info("Configuration manager shutdown complete")

# Global configuration manager instance
_config_manager: Optional[ConfigurationManager] = None

def get_config_manager() -> ConfigurationManager:
    """Get global configuration manager instance"""
    global _config_manager
    
    if _config_manager is None:
        _config_manager = ConfigurationManager()
    
    return _config_manager

async def initialize_config_manager(
    config_dir: Optional[Path] = None,
    environment: Optional[Environment] = None,
    enable_encryption: bool = True
) -> bool:
    """Initialize global configuration manager"""
    global _config_manager
    
    _config_manager = ConfigurationManager(config_dir, environment, enable_encryption)
    return await _config_manager.initialize()

# Convenience functions
def get_config(key: str, default: Any = None) -> Any:
    """Get configuration value (convenience function)"""
    return get_config_manager().get(key, default)

def get_config_int(key: str, default: int = 0) -> int:
    """Get configuration value as integer (convenience function)"""
    return get_config_manager().get_int(key, default)

def get_config_bool(key: str, default: bool = False) -> bool:
    """Get configuration value as boolean (convenience function)"""
    return get_config_manager().get_bool(key, default)

def get_config_list(key: str, default: List[Any] = None) -> List[Any]:
    """Get configuration value as list (convenience function)"""
    return get_config_manager().get_list(key, default)

def is_feature_enabled(flag_name: str, user_id: Optional[str] = None, user_groups: List[str] = None) -> bool:
    """Check if feature flag is enabled (convenience function)"""
    return get_config_manager().is_feature_enabled(flag_name, user_id, user_groups)

# Context manager for temporary configuration changes
@asynccontextmanager
async def temp_config(key: str, value: Any):
    """Temporarily change configuration value"""
    
    config_manager = get_config_manager()
    original_value = config_manager.get(key)
    
    try:
        await config_manager.set(key, value)
        yield
    finally:
        await config_manager.set(key, original_value)

# CLI interface
async def main():
    """CLI interface for configuration management"""
    
    import argparse
    
    parser = argparse.ArgumentParser(description="AMT Configuration Manager")
    parser.add_argument("--action", choices=["get", "set", "list", "export", "reload"], default="list")
    parser.add_argument("--key", help="Configuration key")
    parser.add_argument("--value", help="Configuration value")
    parser.add_argument("--config-dir", type=Path, help="Configuration directory")
    parser.add_argument("--environment", choices=[e.value for e in Environment], help="Environment")
    parser.add_argument("--output", type=Path, help="Output file for export")
    
    args = parser.parse_args()
    
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    
    try:
        # Initialize configuration manager
        success = await initialize_config_manager(
            config_dir=args.config_dir,
            environment=Environment(args.environment) if args.environment else None
        )
        
        if not success:
            print("Failed to initialize configuration manager")
            return
        
        config_manager = get_config_manager()
        
        if args.action == "get":
            if not args.key:
                print("Key required for get action")
                return
            
            value = config_manager.get(args.key)
            print(f"{args.key} = {value}")
        
        elif args.action == "set":
            if not args.key or not args.value:
                print("Key and value required for set action")
                return
            
            await config_manager.set(args.key, args.value)
            print(f"Set {args.key} = {args.value}")
        
        elif args.action == "list":
            configurations = config_manager.get_all_configurations()
            
            print(f"\nEnvironment: {config_manager.environment.value}")
            print(f"Total configurations: {len(configurations)}")
            print("\nConfigurations:")
            
            for key, config in sorted(configurations.items()):
                source = config["source"]
                value = config["value"]
                print(f"  {key}: {value} ({source})")
            
            feature_flags = config_manager.get_feature_flags()
            print(f"\nFeature flags ({len(feature_flags)}):")
            
            for flag_name, flag in feature_flags.items():
                enabled = flag["enabled"]
                status = "✓" if enabled else "✗"
                print(f"  {status} {flag_name}: {flag.get('description', 'No description')}")
        
        elif args.action == "export":
            output_file = args.output or Path(f"config_export_{config_manager.environment.value}.yaml")
            await config_manager.export_configuration(output_file)
            print(f"Configuration exported to {output_file}")
        
        elif args.action == "reload":
            await config_manager.reload_configurations()
            print("Configuration reloaded successfully")
        
    except Exception as e:
        logger.error(f"Configuration manager error: {str(e)}")
        raise

if __name__ == "__main__":
    asyncio.run(main())
