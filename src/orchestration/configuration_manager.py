"""
AMT Configuration Manager
Comprehensive configuration management for orchestration system
"""

import os
import json
import yaml
import logging
from typing import Dict, List, Optional, Any, Union, Type
from dataclasses import dataclass, asdict, field
from enum import Enum
from pathlib import Path
import asyncio
from datetime import datetime

logger = logging.getLogger(__name__)

class Environment(str, Enum):
    """Deployment environments"""
    DEVELOPMENT = "development"
    STAGING = "staging" 
    PRODUCTION = "production"
    TESTING = "testing"

class ConfigurationSource(str, Enum):
    """Configuration sources in priority order (highest to lowest)"""
    ENVIRONMENT_VARIABLES = "environment_variables"
    RUNTIME_OVERRIDE = "runtime_override"
    CONFIG_FILE = "config_file"
    DEFAULTS = "defaults"

@dataclass
class BotEndpointConfig:
    """Bot endpoint configuration"""
    url: str
    timeout_seconds: int = 300
    max_retries: int = 3
    health_check_path: str = "/health"
    api_key: Optional[str] = None
    rate_limit_per_minute: int = 60
    circuit_breaker_threshold: int = 5
    enabled: bool = True

@dataclass
class DatabaseConfig:
    """Database configuration"""
    host: str
    port: int
    database: str
    username: str
    password: str
    pool_size: int = 10
    max_overflow: int = 20
    pool_timeout: int = 30
    ssl_required: bool = True
    connection_timeout: int = 10

@dataclass
class NuclinoConfig:
    """Nuclino integration configuration"""
    api_key: str
    workspace_id: Optional[str] = None
    team_id: Optional[str] = None
    base_url: str = "https://api.nuclino.com"
    timeout_seconds: int = 30
    cache_ttl_seconds: int = 300
    enabled: bool = True

@dataclass
class StaffNotificationConfig:
    """Staff notification configuration"""
    enabled: bool = True
    channels: List[str] = field(default_factory=lambda: ["email", "webhook"])
    email_smtp_host: str = "smtp.gmail.com"
    email_smtp_port: int = 587
    email_username: str = ""
    email_password: str = ""
    webhook_url: Optional[str] = None
    notification_timeout: int = 10
    retry_attempts: int = 3

@dataclass
class SecurityConfig:
    """Security configuration"""
    jwt_secret: str
    jwt_expiration_hours: int = 24
    api_key_header: str = "X-API-Key"
    allowed_origins: List[str] = field(default_factory=lambda: ["http://localhost:3000"])
    rate_limiting_enabled: bool = True
    rate_limit_per_minute: int = 100
    encryption_key: Optional[str] = None
    ssl_verification: bool = True

@dataclass
class MonitoringConfig:
    """Monitoring and observability configuration"""
    enabled: bool = True
    metrics_port: int = 9090
    health_check_port: int = 8080
    log_level: str = "INFO"
    structured_logging: bool = True
    error_tracking_dsn: Optional[str] = None
    performance_sampling_rate: float = 0.1
    custom_metrics_enabled: bool = True

@dataclass
class ResourceLimitsConfig:
    """Resource limits configuration"""
    max_concurrent_sessions: int = 10
    max_session_duration_minutes: int = 120
    max_tasks_per_session: int = 50
    memory_limit_mb: int = 2048
    cpu_limit_cores: float = 2.0
    disk_limit_mb: int = 5120
    network_timeout_seconds: int = 60

@dataclass
class KnowledgeBaseConfig:
    """Knowledge base configuration"""
    provider: str = "griptape"  # griptape, openai, custom
    api_key: str = ""
    model_name: str = "gpt-4"
    max_context_length: int = 8192
    similarity_threshold: float = 0.7
    max_similar_projects: int = 5
    cache_enabled: bool = True
    cache_ttl_hours: int = 24
    learning_enabled: bool = True

@dataclass
class TriangleDefenseConfig:
    """Triangle Defense methodology configuration"""
    integration_required: bool = True
    formations: List[str] = field(default_factory=lambda: ["LARRY", "LINDA", "RICKY", "RITA", "RANDY", "PAT"])
    analysis_timeout_seconds: int = 30
    confidence_threshold: float = 0.8
    real_time_analysis: bool = True
    methodology_compliance: str = "mandatory"

@dataclass
class AMTConfiguration:
    """Main AMT orchestration configuration"""
    environment: Environment
    debug: bool = False
    
    # Core service configurations
    bot_endpoints: Dict[str, BotEndpointConfig] = field(default_factory=dict)
    database: DatabaseConfig = field(default_factory=lambda: DatabaseConfig(
        host="localhost", port=5432, database="amt", username="amt", password=""
    ))
    nuclino: NuclinoConfig = field(default_factory=lambda: NuclinoConfig(api_key=""))
    staff_notifications: StaffNotificationConfig = field(default_factory=StaffNotificationConfig)
    security: SecurityConfig = field(default_factory=lambda: SecurityConfig(jwt_secret=""))
    monitoring: MonitoringConfig = field(default_factory=MonitoringConfig)
    resource_limits: ResourceLimitsConfig = field(default_factory=ResourceLimitsConfig)
    knowledge_base: KnowledgeBaseConfig = field(default_factory=KnowledgeBaseConfig)
    triangle_defense: TriangleDefenseConfig = field(default_factory=TriangleDefenseConfig)
    
    # Advanced configurations
    feature_flags: Dict[str, bool] = field(default_factory=lambda: {
        "real_time_coordination": True,
        "knowledge_base_integration": True,
        "staff_oversight": True,
        "error_recovery": True,
        "circuit_breakers": True,
        "advanced_analytics": True
    })
    
    experimental_features: Dict[str, bool] = field(default_factory=lambda: {
        "ai_model_fine_tuning": False,
        "predictive_error_detection": False,
        "automated_code_generation": True,
        "voice_orchestration": False
    })

class ConfigurationManager:
    """Manages configuration loading, validation, and runtime updates"""
    
    def __init__(self, config_file_path: Optional[str] = None):
        self.config_file_path = config_file_path or self._find_config_file()
        self.config: Optional[AMTConfiguration] = None
        self.config_watchers: List[asyncio.Task] = []
        self.change_callbacks: List[callable] = []
        self._config_cache: Dict[str, Any] = {}
        
    def _find_config_file(self) -> str:
        """Find configuration file in standard locations"""
        
        search_paths = [
            "config/amt_config.yaml",
            "config/amt_config.yml", 
            "amt_config.yaml",
            "amt_config.yml",
            os.path.expanduser("~/.amt/config.yaml"),
            "/etc/amt/config.yaml"
        ]
        
        for path in search_paths:
            if os.path.exists(path):
                return path
        
        # Default path for creation
        return "config/amt_config.yaml"
    
    async def load_configuration(self) -> AMTConfiguration:
        """Load configuration from all sources with priority"""
        
        logger.info(f"Loading configuration from {self.config_file_path}")
        
        # Start with defaults
        config_data = self._get_default_configuration()
        
        # Load from config file if exists
        file_config = self._load_from_file()
        if file_config:
            config_data = self._deep_merge_configs(config_data, file_config)
            
        # Override with environment variables
        env_config = self._load_from_environment()
        if env_config:
            config_data = self._deep_merge_configs(config_data, env_config)
        
        # Create configuration object
        try:
            self.config = self._create_configuration_object(config_data)
            await self._validate_configuration()
            await self._post_load_setup()
            
            logger.info(f"Configuration loaded successfully for environment: {self.config.environment}")
            return self.config
            
        except Exception as e:
            logger.error(f"Configuration loading failed: {str(e)}")
            raise ConfigurationError(f"Failed to load configuration: {str(e)}")
    
    def _get_default_configuration(self) -> Dict[str, Any]:
        """Get default configuration values"""
        
        return {
            "environment": Environment.DEVELOPMENT,
            "debug": True,
            "bot_endpoints": {
                "maya-patel": {
                    "url": "http://localhost:8001",
                    "timeout_seconds": 300,
                    "enabled": True
                },
                "rachel-foster": {
                    "url": "http://localhost:8002", 
                    "timeout_seconds": 360,
                    "enabled": True
                },
                "jake-morrison": {
                    "url": "http://localhost:8003",
                    "timeout_seconds": 300,
                    "enabled": True
                },
                "david-kim": {
                    "url": "http://localhost:8004",
                    "timeout_seconds": 420,
                    "enabled": True
                }
            },
            "database": {
                "host": "localhost",
                "port": 5432,
                "database": "amt_orchestration",
                "username": "amt_user",
                "password": "amt_password",
                "pool_size": 10
            },
            "nuclino": {
                "api_key": "",
                "enabled": False  # Disabled by default until API key provided
            },
            "staff_notifications": {
                "enabled": True,
                "channels": ["email", "webhook"]
            },
            "security": {
                "jwt_secret": "your-jwt-secret-key-here",
                "jwt_expiration_hours": 24,
                "allowed_origins": ["http://localhost:3000", "https://app.analyzemyteam.com"]
            },
            "monitoring": {
                "enabled": True,
                "log_level": "INFO",
                "metrics_port": 9090
            },
            "resource_limits": {
                "max_concurrent_sessions": 10,
                "max_session_duration_minutes": 120
            },
            "knowledge_base": {
                "provider": "griptape",
                "cache_enabled": True,
                "learning_enabled": True
            },
            "triangle_defense": {
                "integration_required": True,
                "methodology_compliance": "mandatory"
            },
            "feature_flags": {
                "real_time_coordination": True,
                "knowledge_base_integration": True,
                "staff_oversight": True,
                "error_recovery": True
            }
        }
    
    def _load_from_file(self) -> Optional[Dict[str, Any]]:
        """Load configuration from YAML file"""
        
        if not os.path.exists(self.config_file_path):
            logger.warning(f"Configuration file not found: {self.config_file_path}")
            return None
        
        try:
            with open(self.config_file_path, 'r') as file:
                if self.config_file_path.endswith(('.yaml', '.yml')):
                    return yaml.safe_load(file)
                else:
                    return json.load(file)
                    
        except Exception as e:
            logger.error(f"Failed to load configuration file: {str(e)}")
            return None
    
    def _load_from_environment(self) -> Dict[str, Any]:
        """Load configuration overrides from environment variables"""
        
        env_config = {}
        
        # Environment detection
        if os.getenv("AMT_ENVIRONMENT"):
            env_config["environment"] = os.getenv("AMT_ENVIRONMENT")
        
        if os.getenv("AMT_DEBUG"):
            env_config["debug"] = os.getenv("AMT_DEBUG").lower() == "true"
        
        # Bot endpoint overrides
        bot_endpoints = {}
        for bot_type in ["maya-patel", "rachel-foster", "jake-morrison", "david-kim"]:
            env_key = f"AMT_BOT_{bot_type.upper().replace('-', '_')}_URL"
            if os.getenv(env_key):
                bot_endpoints[bot_type] = {"url": os.getenv(env_key)}
        
        if bot_endpoints:
            env_config["bot_endpoints"] = bot_endpoints
        
        # Database configuration
        db_config = {}
        if os.getenv("AMT_DB_HOST"):
            db_config["host"] = os.getenv("AMT_DB_HOST")
        if os.getenv("AMT_DB_PORT"):
            db_config["port"] = int(os.getenv("AMT_DB_PORT"))
        if os.getenv("AMT_DB_NAME"):
            db_config["database"] = os.getenv("AMT_DB_NAME")
        if os.getenv("AMT_DB_USERNAME"):
            db_config["username"] = os.getenv("AMT_DB_USERNAME")
        if os.getenv("AMT_DB_PASSWORD"):
            db_config["password"] = os.getenv("AMT_DB_PASSWORD")
        
        if db_config:
            env_config["database"] = db_config
        
        # Nuclino configuration
        nuclino_config = {}
        if os.getenv("AMT_NUCLINO_API_KEY"):
            nuclino_config["api_key"] = os.getenv("AMT_NUCLINO_API_KEY")
            nuclino_config["enabled"] = True  # Auto-enable if API key provided
        if os.getenv("AMT_NUCLINO_WORKSPACE_ID"):
            nuclino_config["workspace_id"] = os.getenv("AMT_NUCLINO_WORKSPACE_ID")
        
        if nuclino_config:
            env_config["nuclino"] = nuclino_config
        
        # Security configuration
        security_config = {}
        if os.getenv("AMT_JWT_SECRET"):
            security_config["jwt_secret"] = os.getenv("AMT_JWT_SECRET")
        if os.getenv("AMT_API_ALLOWED_ORIGINS"):
            origins = os.getenv("AMT_API_ALLOWED_ORIGINS").split(",")
            security_config["allowed_origins"] = [origin.strip() for origin in origins]
        
        if security_config:
            env_config["security"] = security_config
        
        # Knowledge base configuration
        kb_config = {}
        if os.getenv("AMT_KNOWLEDGE_BASE_API_KEY"):
            kb_config["api_key"] = os.getenv("AMT_KNOWLEDGE_BASE_API_KEY")
        if os.getenv("AMT_KNOWLEDGE_BASE_PROVIDER"):
            kb_config["provider"] = os.getenv("AMT_KNOWLEDGE_BASE_PROVIDER")
        
        if kb_config:
            env_config["knowledge_base"] = kb_config
        
        return env_config
    
    def _deep_merge_configs(self, base: Dict[str, Any], override: Dict[str, Any]) -> Dict[str, Any]:
        """Deep merge configuration dictionaries"""
        
        result = base.copy()
        
        for key, value in override.items():
            if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                result[key] = self._deep_merge_configs(result[key], value)
            else:
                result[key] = value
        
        return result
    
    def _create_configuration_object(self, config_data: Dict[str, Any]) -> AMTConfiguration:
        """Create typed configuration object from dictionary"""
        
        # Convert bot endpoints
        bot_endpoints = {}
        for bot_id, endpoint_data in config_data.get("bot_endpoints", {}).items():
            bot_endpoints[bot_id] = BotEndpointConfig(**endpoint_data)
        
        # Create configuration object
        config = AMTConfiguration(
            environment=Environment(config_data.get("environment", Environment.DEVELOPMENT)),
            debug=config_data.get("debug", False),
            bot_endpoints=bot_endpoints,
            database=DatabaseConfig(**config_data.get("database", {})),
            nuclino=NuclinoConfig(**config_data.get("nuclino", {"api_key": ""})),
            staff_notifications=StaffNotificationConfig(**config_data.get("staff_notifications", {})),
            security=SecurityConfig(**config_data.get("security", {"jwt_secret": ""})),
            monitoring=MonitoringConfig(**config_data.get("monitoring", {})),
            resource_limits=ResourceLimitsConfig(**config_data.get("resource_limits", {})),
            knowledge_base=KnowledgeBaseConfig(**config_data.get("knowledge_base", {"api_key": ""})),
            triangle_defense=TriangleDefenseConfig(**config_data.get("triangle_defense", {})),
            feature_flags=config_data.get("feature_flags", {}),
            experimental_features=config_data.get("experimental_features", {})
        )
        
        return config
    
    async def _validate_configuration(self):
        """Validate configuration completeness and correctness"""
        
        validation_errors = []
        
        # Validate required fields
        if not self.config.security.jwt_secret or self.config.security.jwt_secret == "your-jwt-secret-key-here":
            validation_errors.append("JWT secret key must be configured")
        
        if not self.config.database.password:
            validation_errors.append("Database password must be configured")
        
        # Validate bot endpoints
        for bot_id, endpoint in self.config.bot_endpoints.items():
            if endpoint.enabled and not endpoint.url:
                validation_errors.append(f"Bot endpoint URL required for {bot_id}")
        
        # Validate Nuclino if enabled
        if self.config.nuclino.enabled and not self.config.nuclino.api_key:
            validation_errors.append("Nuclino API key required when Nuclino is enabled")
        
        # Validate knowledge base
        if self.config.knowledge_base.learning_enabled and not self.config.knowledge_base.api_key:
            validation_errors.append("Knowledge base API key required when learning is enabled")
        
        # Environment-specific validations
        if self.config.environment == Environment.PRODUCTION:
            if self.config.debug:
                validation_errors.append("Debug mode should be disabled in production")
            
            if not self.config.security.ssl_verification:
                validation_errors.append("SSL verification should be enabled in production")
            
            if self.config.monitoring.log_level == "DEBUG":
                validation_errors.append("Log level should not be DEBUG in production")
        
        # Resource limit validations
        if self.config.resource_limits.max_concurrent_sessions < 1:
            validation_errors.append("Max concurrent sessions must be at least 1")
        
        if validation_errors:
            error_msg = "Configuration validation failed:\n" + "\n".join(f"- {error}" for error in validation_errors)
            raise ConfigurationError(error_msg)
        
        logger.info("Configuration validation passed")
    
    async def _post_load_setup(self):
        """Perform post-load configuration setup"""
        
        # Set up logging level
        logging.getLogger().setLevel(self.config.monitoring.log_level)
        
        # Cache frequently accessed values
        self._config_cache = {
            "environment": self.config.environment,
            "debug": self.config.debug,
            "feature_flags": self.config.feature_flags.copy(),
            "bot_endpoints": {k: v.url for k, v in self.config.bot_endpoints.items() if v.enabled}
        }
        
        # Start configuration file watcher if not in testing
        if self.config.environment != Environment.TESTING:
            await self._start_config_watcher()
    
    async def _start_config_watcher(self):
        """Start watching configuration file for changes"""
        
        if not os.path.exists(self.config_file_path):
            return
        
        watcher_task = asyncio.create_task(self._watch_config_file())
        self.config_watchers.append(watcher_task)
        
        logger.info(f"Started configuration file watcher for {self.config_file_path}")
    
    async def _watch_config_file(self):
        """Watch configuration file for changes and reload"""
        
        last_modified = os.path.getmtime(self.config_file_path)
        
        while True:
            try:
                await asyncio.sleep(5)  # Check every 5 seconds
                
                if not os.path.exists(self.config_file_path):
                    continue
                
                current_modified = os.path.getmtime(self.config_file_path)
                
                if current_modified > last_modified:
                    logger.info("Configuration file changed, reloading...")
                    
                    try:
                        old_config = self.config
                        await self.load_configuration()
                        
                        # Notify change callbacks
                        for callback in self.change_callbacks:
                            try:
                                await callback(old_config, self.config)
                            except Exception as e:
                                logger.error(f"Configuration change callback failed: {str(e)}")
                        
                        last_modified = current_modified
                        logger.info("Configuration reloaded successfully")
                        
                    except Exception as e:
                        logger.error(f"Configuration reload failed: {str(e)}")
                
            except Exception as e:
                logger.error(f"Configuration watcher error: {str(e)}")
                await asyncio.sleep(30)  # Wait longer on error
    
    def add_change_callback(self, callback: callable):
        """Add callback for configuration changes"""
        self.change_callbacks.append(callback)
    
    def remove_change_callback(self, callback: callable):
        """Remove configuration change callback"""
        if callback in self.change_callbacks:
            self.change_callbacks.remove(callback)
    
    async def update_runtime_configuration(self, updates: Dict[str, Any]):
        """Update configuration at runtime"""
        
        logger.info(f"Updating runtime configuration: {list(updates.keys())}")
        
        # Apply updates to current configuration
        for key, value in updates.items():
            if hasattr(self.config, key):
                setattr(self.config, key, value)
                logger.info(f"Updated configuration: {key}")
            else:
                logger.warning(f"Unknown configuration key: {key}")
        
        # Update cache
        await self._update_config_cache()
        
        # Validate updated configuration
        await self._validate_configuration()
    
    async def _update_config_cache(self):
        """Update configuration cache"""
        
        self._config_cache.update({
            "environment": self.config.environment,
            "debug": self.config.debug,
            "feature_flags": self.config.feature_flags.copy(),
            "bot_endpoints": {k: v.url for k, v in self.config.bot_endpoints.items() if v.enabled}
        })
    
    def get_bot_endpoint_config(self, bot_id: str) -> Optional[BotEndpointConfig]:
        """Get bot endpoint configuration"""
        return self.config.bot_endpoints.get(bot_id) if self.config else None
    
    def is_feature_enabled(self, feature_name: str) -> bool:
        """Check if feature flag is enabled"""
        if not self.config:
            return False
        
        return self.config.feature_flags.get(feature_name, False)
    
    def is_experimental_feature_enabled(self, feature_name: str) -> bool:
        """Check if experimental feature is enabled"""
        if not self.config:
            return False
            
        return self.config.experimental_features.get(feature_name, False)
    
    def get_database_url(self) -> str:
        """Get database connection URL"""
        if not self.config:
            raise ConfigurationError("Configuration not loaded")
        
        db = self.config.database
        return f"postgresql://{db.username}:{db.password}@{db.host}:{db.port}/{db.database}"
    
    def get_bot_endpoints_dict(self) -> Dict[str, str]:
        """Get enabled bot endpoints as dictionary"""
        if not self.config:
            return {}
        
        return {k: v.url for k, v in self.config.bot_endpoints.items() if v.enabled}
    
    async def save_configuration_to_file(self, file_path: Optional[str] = None):
        """Save current configuration to file"""
        
        if not self.config:
            raise ConfigurationError("No configuration to save")
        
        save_path = file_path or self.config_file_path
        
        # Convert configuration to dictionary
        config_dict = asdict(self.config)
        
        # Remove sensitive information before saving
        sensitive_keys = ["password", "api_key", "jwt_secret", "encryption_key"]
        self._redact_sensitive_data(config_dict, sensitive_keys)
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        
        try:
            with open(save_path, 'w') as file:
                yaml.dump(config_dict, file, default_flow_style=False, sort_keys=True)
            
            logger.info(f"Configuration saved to {save_path}")
            
        except Exception as e:
            logger.error(f"Failed to save configuration: {str(e)}")
            raise ConfigurationError(f"Failed to save configuration: {str(e)}")
    
    def _redact_sensitive_data(self, data: Any, sensitive_keys: List[str]):
        """Redact sensitive data from configuration dictionary"""
        
        if isinstance(data, dict):
            for key, value in data.items():
                if any(sensitive_key in key.lower() for sensitive_key in sensitive_keys):
                    data[key] = "[REDACTED]"
                else:
                    self._redact_sensitive_data(value, sensitive_keys)
        elif isinstance(data, list):
            for item in data:
                self._redact_sensitive_data(item, sensitive_keys)
    
    def get_configuration_summary(self) -> Dict[str, Any]:
        """Get configuration summary for diagnostics"""
        
        if not self.config:
            return {"status": "not_loaded"}
        
        return {
            "status": "loaded",
            "environment": self.config.environment,
            "debug_mode": self.config.debug,
            "enabled_bots": [k for k, v in self.config.bot_endpoints.items() if v.enabled],
            "feature_flags": self.config.feature_flags,
            "experimental_features": self.config.experimental_features,
            "nuclino_enabled": self.config.nuclino.enabled,
            "knowledge_base_enabled": self.config.knowledge_base.learning_enabled,
            "triangle_defense_required": self.config.triangle_defense.integration_required,
            "max_concurrent_sessions": self.config.resource_limits.max_concurrent_sessions,
            "configuration_file": self.config_file_path,
            "last_loaded": datetime.now().isoformat()
        }
    
    async def shutdown(self):
        """Shutdown configuration manager and cleanup resources"""
        
        logger.info("Shutting down configuration manager")
        
        # Cancel config watchers
        for watcher in self.config_watchers:
            watcher.cancel()
            try:
                await watcher
            except asyncio.CancelledError:
                pass
        
        self.config_watchers.clear()
        self.change_callbacks.clear()
        self._config_cache.clear()
        
        logger.info("Configuration manager shutdown complete")

class ConfigurationError(Exception):
    """Configuration-related errors"""
    pass

# Global configuration manager instance
_config_manager: Optional[ConfigurationManager] = None

def get_config_manager() -> ConfigurationManager:
    """Get global configuration manager instance"""
    global _config_manager
    
    if _config_manager is None:
        _config_manager = ConfigurationManager()
    
    return _config_manager

async def initialize_configuration(config_file_path: Optional[str] = None) -> AMTConfiguration:
    """Initialize global configuration"""
    
    config_manager = get_config_manager()
    if config_file_path:
        config_manager.config_file_path = config_file_path
    
    return await config_manager.load_configuration()

def get_current_config() -> Optional[AMTConfiguration]:
    """Get current loaded configuration"""
    
    config_manager = get_config_manager()
    return config_manager.config

def is_feature_enabled(feature_name: str) -> bool:
    """Check if feature is enabled (convenience function)"""
    
    config_manager = get_config_manager()
    return config_manager.is_feature_enabled(feature_name)

async def shutdown_configuration():
    """Shutdown global configuration manager"""
    
    global _config_manager
    
    if _config_manager:
        await _config_manager.shutdown()
        _config_manager = None
