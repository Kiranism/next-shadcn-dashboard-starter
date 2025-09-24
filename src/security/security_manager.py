"""
AMT Security Manager
Comprehensive security, authentication, authorization, and threat protection for orchestration system
"""

import asyncio
import logging
import json
import hashlib
import secrets
from typing import Dict, List, Optional, Any, Union, Callable, Set
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import jwt
import bcrypt
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
import base64
import ipaddress
from urllib.parse import urlparse
import re

from ..shared.orchestration_protocol import BotType
from ..monitoring.observability_stack import get_observability_stack

logger = logging.getLogger(__name__)

class SecurityLevel(str, Enum):
    """Security clearance levels"""
    RESTRICTED = "restricted"      # Limited bot access
    CONFIDENTIAL = "confidential"  # Standard bot operations
    SECRET = "secret"              # Advanced orchestration features
    TOP_SECRET = "top_secret"      # Full system access

class ThreatLevel(str, Enum):
    """Threat assessment levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AuthenticationMethod(str, Enum):
    """Authentication methods supported"""
    API_KEY = "api_key"
    JWT_TOKEN = "jwt_token"
    OAUTH2 = "oauth2"
    MUTUAL_TLS = "mutual_tls"
    SERVICE_ACCOUNT = "service_account"

@dataclass
class SecurityContext:
    """Security context for operations"""
    user_id: str
    session_id: Optional[str] = None
    security_level: SecurityLevel = SecurityLevel.RESTRICTED
    permissions: Set[str] = None
    authentication_method: AuthenticationMethod = AuthenticationMethod.API_KEY
    client_ip: Optional[str] = None
    user_agent: Optional[str] = None
    authenticated_at: datetime = None
    expires_at: Optional[datetime] = None
    bot_permissions: Set[BotType] = None

@dataclass
class ThreatDetection:
    """Threat detection result"""
    threat_id: str
    threat_type: str
    threat_level: ThreatLevel
    description: str
    source_ip: str
    user_id: Optional[str] = None
    detected_at: datetime = None
    evidence: Dict[str, Any] = None
    mitigated: bool = False
    mitigation_actions: List[str] = None

@dataclass
class SecurityAuditLog:
    """Security audit log entry"""
    audit_id: str
    event_type: str
    user_id: str
    session_id: Optional[str] = None
    resource: str
    action: str
    result: str  # SUCCESS, FAILURE, DENIED
    timestamp: datetime = None
    client_ip: Optional[str] = None
    user_agent: Optional[str] = None
    additional_data: Dict[str, Any] = None

class SecurityManager:
    """Comprehensive security management for AMT orchestration"""
    
    def __init__(self, secret_key: Optional[str] = None, encryption_key: Optional[str] = None):
        # Cryptographic keys
        self.secret_key = secret_key or self._generate_secret_key()
        self.encryption_key = encryption_key or self._generate_encryption_key()
        self.fernet = Fernet(self.encryption_key.encode() if isinstance(self.encryption_key, str) else self.encryption_key)
        
        # Authentication and session management
        self.active_sessions: Dict[str, SecurityContext] = {}
        self.api_keys: Dict[str, Dict[str, Any]] = {}
        self.rate_limits: Dict[str, List[datetime]] = {}
        
        # Security policies
        self.security_policies = self._initialize_security_policies()
        
        # Threat detection
        self.threat_detectors: List[Callable] = []
        self.active_threats: Dict[str, ThreatDetection] = {}
        self.blocked_ips: Set[str] = set()
        self.suspicious_patterns: Dict[str, int] = {}
        
        # Audit logging
        self.audit_logs: List[SecurityAuditLog] = []
        self.max_audit_logs = 100000
        
        # Permission definitions
        self.permissions = self._initialize_permissions()
        self.role_permissions = self._initialize_role_permissions()
        
        # Background security tasks
        self.security_tasks: List[asyncio.Task] = []
    
    def _generate_secret_key(self) -> str:
        """Generate secure secret key"""
        return base64.urlsafe_b64encode(secrets.token_bytes(32)).decode()
    
    def _generate_encryption_key(self) -> bytes:
        """Generate encryption key for sensitive data"""
        password = secrets.token_bytes(32)
        salt = secrets.token_bytes(16)
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
            backend=default_backend()
        )
        key = base64.urlsafe_b64encode(kdf.derive(password))
        return key
    
    def _initialize_security_policies(self) -> Dict[str, Any]:
        """Initialize security policies"""
        
        return {
            "authentication": {
                "require_2fa": False,
                "session_timeout_minutes": 60,
                "max_concurrent_sessions": 5,
                "password_min_length": 12,
                "password_require_special": True
            },
            "rate_limiting": {
                "api_requests_per_minute": 1000,
                "bot_requests_per_minute": 500,
                "failed_auth_attempts": 5,
                "lockout_duration_minutes": 15
            },
            "data_protection": {
                "encrypt_sensitive_data": True,
                "log_retention_days": 90,
                "audit_log_encryption": True,
                "data_anonymization": True
            },
            "network_security": {
                "allowed_ip_ranges": [],
                "blocked_countries": [],
                "require_tls": True,
                "min_tls_version": "1.2"
            }
        }
    
    def _initialize_permissions(self) -> Set[str]:
        """Initialize system permissions"""
        
        return {
            # Session management
            "session.create",
            "session.read",
            "session.update", 
            "session.delete",
            "session.suspend",
            "session.resume",
            
            # Bot operations
            "bot.invoke",
            "bot.configure",
            "bot.monitor",
            "bot.debug",
            
            # Knowledge base
            "knowledge.read",
            "knowledge.write",
            "knowledge.delete",
            "knowledge.export",
            
            # System administration
            "system.configure",
            "system.monitor",
            "system.backup",
            "system.restore",
            
            # Security operations
            "security.audit",
            "security.configure",
            "security.investigate",
            "security.admin",
            
            # Creative tools
            "creative.use",
            "creative.configure",
            "creative.export",
            
            # External integrations
            "external.triangle_defense",
            "external.mva_analytics", 
            "external.mel_engine",
            "external.graphql_api"
        }
    
    def _initialize_role_permissions(self) -> Dict[str, Set[str]]:
        """Initialize role-based permission mappings"""
        
        return {
            "user": {
                "session.create", "session.read", 
                "bot.invoke", "knowledge.read",
                "creative.use"
            },
            "coach": {
                "session.create", "session.read", "session.update",
                "bot.invoke", "bot.monitor",
                "knowledge.read", "knowledge.write",
                "creative.use", "creative.export",
                "external.triangle_defense", "external.mva_analytics"
            },
            "admin": {
                "session.create", "session.read", "session.update", "session.delete",
                "session.suspend", "session.resume",
                "bot.invoke", "bot.configure", "bot.monitor",
                "knowledge.read", "knowledge.write", "knowledge.export",
                "system.configure", "system.monitor",
                "creative.use", "creative.configure", "creative.export",
                "external.triangle_defense", "external.mva_analytics", 
                "external.mel_engine", "external.graphql_api"
            },
            "security_admin": {
                "security.audit", "security.configure", 
                "security.investigate", "security.admin",
                "system.configure", "system.monitor",
                "system.backup", "system.restore"
            },
            "service_account": {
                "bot.invoke", "knowledge.read", "knowledge.write",
                "external.triangle_defense", "external.mva_analytics",
                "external.mel_engine"
            }
        }
    
    async def initialize(self) -> bool:
        """Initialize security manager"""
        
        try:
            # Initialize threat detectors
            self._register_threat_detectors()
            
            # Start background security tasks
            await self._start_security_tasks()
            
            # Load existing API keys and sessions
            await self._load_security_state()
            
            logger.info("Security manager initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize security manager: {str(e)}")
            return False
    
    def _register_threat_detectors(self):
        """Register threat detection functions"""
        
        self.threat_detectors = [
            self._detect_brute_force_attacks,
            self._detect_suspicious_patterns,
            self._detect_rate_limit_violations,
            self._detect_malicious_payloads,
            self._detect_session_hijacking
        ]
    
    async def _start_security_tasks(self):
        """Start background security tasks"""
        
        # Threat monitoring task
        threat_task = asyncio.create_task(self._monitor_threats())
        self.security_tasks.append(threat_task)
        
        # Session cleanup task
        cleanup_task = asyncio.create_task(self._cleanup_expired_sessions())
        self.security_tasks.append(cleanup_task)
        
        # Audit log rotation task
        audit_task = asyncio.create_task(self._rotate_audit_logs())
        self.security_tasks.append(audit_task)
    
    async def _load_security_state(self):
        """Load existing security state"""
        
        # This would load from persistent storage in production
        # For now, initialize with empty state
        pass
    
    async def authenticate_user(
        self,
        credentials: Dict[str, str],
        client_ip: str,
        user_agent: str,
        authentication_method: AuthenticationMethod = AuthenticationMethod.API_KEY
    ) -> Optional[SecurityContext]:
        """Authenticate user and create security context"""
        
        try:
            # Check for IP blocks
            if self._is_blocked_ip(client_ip):
                await self._log_security_event(
                    "authentication_blocked",
                    "unknown",
                    "authentication",
                    "blocked_ip",
                    "DENIED",
                    client_ip,
                    user_agent,
                    {"reason": "blocked_ip"}
                )
                return None
            
            # Rate limiting check
            if not self._check_rate_limit(client_ip, "authentication"):
                await self._log_security_event(
                    "authentication_rate_limited",
                    "unknown", 
                    "authentication",
                    "rate_limit",
                    "DENIED",
                    client_ip,
                    user_agent,
                    {"reason": "rate_limit_exceeded"}
                )
                return None
            
            # Authenticate based on method
            user_info = None
            
            if authentication_method == AuthenticationMethod.API_KEY:
                user_info = await self._authenticate_api_key(credentials.get("api_key"))
            elif authentication_method == AuthenticationMethod.JWT_TOKEN:
                user_info = await self._authenticate_jwt_token(credentials.get("token"))
            elif authentication_method == AuthenticationMethod.SERVICE_ACCOUNT:
                user_info = await self._authenticate_service_account(credentials)
            
            if not user_info:
                await self._log_security_event(
                    "authentication_failed",
                    credentials.get("user_id", "unknown"),
                    "authentication",
                    "login",
                    "FAILURE",
                    client_ip,
                    user_agent,
                    {"method": authentication_method.value}
                )
                return None
            
            # Create security context
            context = SecurityContext(
                user_id=user_info["user_id"],
                security_level=SecurityLevel(user_info.get("security_level", "restricted")),
                permissions=set(user_info.get("permissions", [])),
                authentication_method=authentication_method,
                client_ip=client_ip,
                user_agent=user_agent,
                authenticated_at=datetime.now(),
                expires_at=datetime.now() + timedelta(
                    minutes=self.security_policies["authentication"]["session_timeout_minutes"]
                ),
                bot_permissions=set(BotType(bot) for bot in user_info.get("bot_permissions", []))
            )
            
            # Store active session
            session_id = self._generate_session_id()
            context.session_id = session_id
            self.active_sessions[session_id] = context
            
            # Log successful authentication
            await self._log_security_event(
                "authentication_success",
                user_info["user_id"],
                "authentication",
                "login",
                "SUCCESS",
                client_ip,
                user_agent,
                {
                    "method": authentication_method.value,
                    "session_id": session_id,
                    "security_level": context.security_level.value
                }
            )
            
            return context
            
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            await self._log_security_event(
                "authentication_error",
                "unknown",
                "authentication",
                "login",
                "FAILURE",
                client_ip,
                user_agent,
                {"error": str(e)}
            )
            return None
    
    async def _authenticate_api_key(self, api_key: str) -> Optional[Dict[str, Any]]:
        """Authenticate using API key"""
        
        if not api_key or api_key not in self.api_keys:
            return None
        
        key_info = self.api_keys[api_key]
        
        # Check if key is active
        if not key_info.get("active", True):
            return None
        
        # Check expiration
        if key_info.get("expires_at") and datetime.now() > key_info["expires_at"]:
            return None
        
        return key_info
    
    async def _authenticate_jwt_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Authenticate using JWT token"""
        
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=["HS256"])
            
            # Validate token claims
            if payload.get("exp") and datetime.now().timestamp() > payload["exp"]:
                return None
            
            return {
                "user_id": payload.get("user_id"),
                "security_level": payload.get("security_level", "restricted"),
                "permissions": payload.get("permissions", []),
                "bot_permissions": payload.get("bot_permissions", [])
            }
            
        except jwt.InvalidTokenError:
            return None
    
    async def _authenticate_service_account(self, credentials: Dict[str, str]) -> Optional[Dict[str, Any]]:
        """Authenticate service account"""
        
        service_id = credentials.get("service_id")
        service_secret = credentials.get("service_secret")
        
        if not service_id or not service_secret:
            return None
        
        # Verify service account (simplified implementation)
        expected_secret = self._get_service_account_secret(service_id)
        if not expected_secret or service_secret != expected_secret:
            return None
        
        return {
            "user_id": f"service:{service_id}",
            "security_level": "confidential",
            "permissions": list(self.role_permissions.get("service_account", set())),
            "bot_permissions": list(BotType)
        }
    
    def _get_service_account_secret(self, service_id: str) -> Optional[str]:
        """Get service account secret (mock implementation)"""
        
        # In production, this would query a secure service account store
        service_accounts = {
            "amt_orchestrator": "secure_secret_123",
            "triangle_defense": "td_secret_456", 
            "mva_analytics": "mva_secret_789"
        }
        
        return service_accounts.get(service_id)
    
    def _generate_session_id(self) -> str:
        """Generate secure session ID"""
        return secrets.token_urlsafe(32)
    
    def _is_blocked_ip(self, ip: str) -> bool:
        """Check if IP address is blocked"""
        
        if ip in self.blocked_ips:
            return True
        
        # Check IP ranges (simplified)
        try:
            ip_addr = ipaddress.ip_address(ip)
            for blocked_range in self.security_policies["network_security"].get("blocked_ranges", []):
                if ip_addr in ipaddress.ip_network(blocked_range):
                    return True
        except ValueError:
            return True  # Block invalid IPs
        
        return False
    
    def _check_rate_limit(self, identifier: str, action: str) -> bool:
        """Check rate limiting for identifier and action"""
        
        rate_key = f"{identifier}:{action}"
        now = datetime.now()
        
        # Get rate limit policy
        if action == "authentication":
            limit = self.security_policies["rate_limiting"]["failed_auth_attempts"]
            window_minutes = 5
        elif action == "api_request":
            limit = self.security_policies["rate_limiting"]["api_requests_per_minute"]
            window_minutes = 1
        else:
            limit = 100  # Default
            window_minutes = 1
        
        # Clean old entries
        cutoff_time = now - timedelta(minutes=window_minutes)
        
        if rate_key not in self.rate_limits:
            self.rate_limits[rate_key] = []
        
        self.rate_limits[rate_key] = [
            timestamp for timestamp in self.rate_limits[rate_key]
            if timestamp > cutoff_time
        ]
        
        # Check if limit exceeded
        if len(self.rate_limits[rate_key]) >= limit:
            return False
        
        # Record current request
        self.rate_limits[rate_key].append(now)
        return True
    
    async def authorize_operation(
        self,
        context: SecurityContext,
        resource: str,
        action: str,
        additional_checks: Dict[str, Any] = None
    ) -> bool:
        """Authorize operation based on security context"""
        
        try:
            # Check session validity
            if not self._is_session_valid(context):
                await self._log_security_event(
                    "authorization_denied",
                    context.user_id,
                    resource,
                    action,
                    "DENIED",
                    context.client_ip,
                    context.user_agent,
                    {"reason": "invalid_session"}
                )
                return False
            
            # Check required permission
            required_permission = f"{resource}.{action}"
            if required_permission not in context.permissions:
                await self._log_security_event(
                    "authorization_denied",
                    context.user_id,
                    resource,
                    action,
                    "DENIED",
                    context.client_ip,
                    context.user_agent,
                    {"reason": "insufficient_permissions", "required": required_permission}
                )
                return False
            
            # Additional security checks
            if additional_checks:
                if not await self._perform_additional_security_checks(context, additional_checks):
                    return False
            
            # Log successful authorization
            await self._log_security_event(
                "authorization_granted",
                context.user_id,
                resource,
                action,
                "SUCCESS",
                context.client_ip,
                context.user_agent,
                {"permission": required_permission}
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Authorization error: {str(e)}")
            return False
    
    def _is_session_valid(self, context: SecurityContext) -> bool:
        """Check if security context session is valid"""
        
        # Check if session exists
        if context.session_id not in self.active_sessions:
            return False
        
        # Check expiration
        if context.expires_at and datetime.now() > context.expires_at:
            return False
        
        return True
    
    async def _perform_additional_security_checks(
        self,
        context: SecurityContext,
        checks: Dict[str, Any]
    ) -> bool:
        """Perform additional security checks"""
        
        # Bot-specific permission checks
        if "bot_type" in checks:
            required_bot = BotType(checks["bot_type"])
            if required_bot not in context.bot_permissions:
                await self._log_security_event(
                    "authorization_denied",
                    context.user_id,
                    "bot",
                    "access",
                    "DENIED",
                    context.client_ip,
                    context.user_agent,
                    {"reason": "bot_access_denied", "bot_type": required_bot.value}
                )
                return False
        
        # Security level checks
        if "min_security_level" in checks:
            required_level = SecurityLevel(checks["min_security_level"])
            security_level_order = {
                SecurityLevel.RESTRICTED: 1,
                SecurityLevel.CONFIDENTIAL: 2,
                SecurityLevel.SECRET: 3,
                SecurityLevel.TOP_SECRET: 4
            }
            
            if security_level_order[context.security_level] < security_level_order[required_level]:
                await self._log_security_event(
                    "authorization_denied",
                    context.user_id,
                    "security",
                    "level_check",
                    "DENIED",
                    context.client_ip,
                    context.user_agent,
                    {
                        "reason": "insufficient_security_level",
                        "user_level": context.security_level.value,
                        "required_level": required_level.value
                    }
                )
                return False
        
        return True
    
    def encrypt_sensitive_data(self, data: str) -> str:
        """Encrypt sensitive data"""
        return self.fernet.encrypt(data.encode()).decode()
    
    def decrypt_sensitive_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive data"""
        return self.fernet.decrypt(encrypted_data.encode()).decode()
    
    def create_api_key(
        self,
        user_id: str,
        permissions: Set[str],
        security_level: SecurityLevel = SecurityLevel.RESTRICTED,
        expires_at: Optional[datetime] = None,
        bot_permissions: Set[BotType] = None
    ) -> str:
        """Create new API key"""
        
        api_key = secrets.token_urlsafe(32)
        
        key_info = {
            "user_id": user_id,
            "permissions": list(permissions),
            "security_level": security_level.value,
            "bot_permissions": list(bot_permissions) if bot_permissions else [],
            "created_at": datetime.now(),
            "expires_at": expires_at,
            "active": True
        }
        
        self.api_keys[api_key] = key_info
        
        return api_key
    
    def revoke_api_key(self, api_key: str) -> bool:
        """Revoke API key"""
        
        if api_key in self.api_keys:
            self.api_keys[api_key]["active"] = False
            return True
        
        return False
    
    def create_jwt_token(
        self,
        user_id: str,
        permissions: Set[str],
        security_level: SecurityLevel = SecurityLevel.RESTRICTED,
        expires_minutes: int = 60,
        bot_permissions: Set[BotType] = None
    ) -> str:
        """Create JWT token"""
        
        payload = {
            "user_id": user_id,
            "permissions": list(permissions),
            "security_level": security_level.value,
            "bot_permissions": list(bot_permissions) if bot_permissions else [],
            "iat": datetime.now().timestamp(),
            "exp": (datetime.now() + timedelta(minutes=expires_minutes)).timestamp()
        }
        
        return jwt.encode(payload, self.secret_key, algorithm="HS256")
    
    async def logout_session(self, session_id: str) -> bool:
        """Logout and invalidate session"""
        
        if session_id in self.active_sessions:
            context = self.active_sessions[session_id]
            
            await self._log_security_event(
                "session_logout",
                context.user_id,
                "session",
                "logout",
                "SUCCESS",
                context.client_ip,
                context.user_agent,
                {"session_id": session_id}
            )
            
            del self.active_sessions[session_id]
            return True
        
        return False
    
    async def _monitor_threats(self):
        """Background task for threat monitoring"""
        
        while True:
            try:
                await asyncio.sleep(60)  # Check every minute
                
                # Run all threat detectors
                for detector in self.threat_detectors:
                    threats = await detector()
                    
                    for threat in threats:
                        await self._handle_threat(threat)
                
            except Exception as e:
                logger.error(f"Threat monitoring error: {str(e)}")
    
    async def _detect_brute_force_attacks(self) -> List[ThreatDetection]:
        """Detect brute force authentication attacks"""
        
        threats = []
        
        # Check for excessive failed authentication attempts
        for rate_key, timestamps in self.rate_limits.items():
            if ":authentication" in rate_key:
                ip = rate_key.split(":")[0]
                
                # Check for high rate of failed attempts
                recent_attempts = [
                    t for t in timestamps 
                    if t > datetime.now() - timedelta(minutes=15)
                ]
                
                if len(recent_attempts) > 20:  # More than 20 attempts in 15 minutes
                    threat = ThreatDetection(
                        threat_id=f"brute_force_{ip}_{int(datetime.now().timestamp())}",
                        threat_type="brute_force_attack",
                        threat_level=ThreatLevel.HIGH,
                        description=f"Brute force attack detected from IP {ip}",
                        source_ip=ip,
                        detected_at=datetime.now(),
                        evidence={"failed_attempts": len(recent_attempts)}
                    )
                    threats.append(threat)
        
        return threats
    
    async def _detect_suspicious_patterns(self) -> List[ThreatDetection]:
        """Detect suspicious behavioral patterns"""
        
        threats = []
        
        # Check for unusual access patterns
        for session_id, context in self.active_sessions.items():
            # Check for session from multiple IPs (possible hijacking)
            # This is simplified - would need more sophisticated tracking
            
            # Check for privilege escalation attempts
            if hasattr(context, 'recent_denials'):
                recent_denials = getattr(context, 'recent_denials', 0)
                if recent_denials > 5:
                    threat = ThreatDetection(
                        threat_id=f"privilege_escalation_{context.user_id}_{int(datetime.now().timestamp())}",
                        threat_type="privilege_escalation",
                        threat_level=ThreatLevel.MEDIUM,
                        description=f"Multiple authorization denials for user {context.user_id}",
                        source_ip=context.client_ip,
                        user_id=context.user_id,
                        detected_at=datetime.now(),
                        evidence={"denial_count": recent_denials}
                    )
                    threats.append(threat)
        
        return threats
    
    async def _detect_rate_limit_violations(self) -> List[ThreatDetection]:
        """Detect rate limit violations"""
        
        threats = []
        
        # Check for persistent rate limit violations
        violation_threshold = 10
        
        for rate_key, timestamps in self.rate_limits.items():
            if len(timestamps) >= violation_threshold:
                ip = rate_key.split(":")[0]
                action = rate_key.split(":")[1]
                
                threat = ThreatDetection(
                    threat_id=f"rate_limit_violation_{ip}_{action}_{int(datetime.now().timestamp())}",
                    threat_type="rate_limit_violation",
                    threat_level=ThreatLevel.MEDIUM,
                    description=f"Persistent rate limit violations from IP {ip} for action {action}",
                    source_ip=ip,
                    detected_at=datetime.now(),
                    evidence={"violation_count": len(timestamps), "action": action}
                )
                threats.append(threat)
        
        return threats
    
    async def _detect_malicious_payloads(self) -> List[ThreatDetection]:
        """Detect potentially malicious payloads"""
        
        threats = []
        
        # This would analyze request payloads for malicious content
        # Implementation depends on integration with request processing
        
        return threats
    
    async def _detect_session_hijacking(self) -> List[ThreatDetection]:
        """Detect potential session hijacking"""
        
        threats = []
        
        # Check for sessions with suspicious characteristics
        for session_id, context in self.active_sessions.items():
            # Check for user agent changes (simplified)
            # In production, would track and analyze user agent consistency
            
            # Check for geolocation inconsistencies
            # Would integrate with IP geolocation service
            
            pass
        
        return threats
    
    async def _handle_threat(self, threat: ThreatDetection):
        """Handle detected threat"""
        
        self.active_threats[threat.threat_id] = threat
        
        # Log threat
        logger.warning(f"Threat detected: {threat.threat_type} from {threat.source_ip}")
        
        # Apply automatic mitigations based on threat level
        mitigation_actions = []
        
        if threat.threat_level in [ThreatLevel.HIGH, ThreatLevel.CRITICAL]:
            # Block IP address
            self.blocked_ips.add(threat.source_ip)
            mitigation_actions.append(f"blocked_ip_{threat.source_ip}")
            
            # Terminate sessions from that IP
            sessions_to_terminate = [
                session_id for session_id, context in self.active_sessions.items()
                if context.client_ip == threat.source_ip
            ]
            
            for session_id in sessions_to_terminate:
                await self.logout_session(session_id)
                mitigation_actions.append(f"terminated_session_{session_id}")
        
        threat.mitigated = len(mitigation_actions) > 0
        threat.mitigation_actions = mitigation_actions
        
        # Record threat metrics
        obs_stack = get_observability_stack()
        obs_stack.record_counter(
            "security_threats_detected",
            labels={
                "threat_type": threat.threat_type,
                "threat_level": threat.threat_level.value,
                "mitigated": str(threat.mitigated)
            }
        )
        
        # Send alert for high-severity threats
        if threat.threat_level == ThreatLevel.CRITICAL:
            await self._send_security_alert(threat)
    
    async def _send_security_alert(self, threat: ThreatDetection):
        """Send security alert for critical threats"""
        
        # This would integrate with alerting system
        alert_message = {
            "type": "security_threat",
            "severity": "critical",
            "threat": asdict(threat),
            "timestamp": datetime.now().isoformat()
        }
        
        logger.critical(f"SECURITY ALERT: {json.dumps(alert_message)}")
    
    async def _cleanup_expired_sessions(self):
        """Background task to cleanup expired sessions"""
        
        while True:
            try:
                await asyncio.sleep(300)  # Check every 5 minutes
                
                now = datetime.now()
                expired_sessions = [
                    session_id for session_id, context in self.active_sessions.items()
                    if context.expires_at and context.expires_at < now
                ]
                
                for session_id in expired_sessions:
                    context = self.active_sessions[session_id]
                    await self._log_security_event(
                        "session_expired",
                        context.user_id,
                        "session",
                        "expire",
                        "SUCCESS",
                        context.client_ip,
                        context.user_agent,
                        {"session_id": session_id}
                    )
                    del self.active_sessions[session_id]
                
                if expired_sessions:
                    logger.info(f"Cleaned up {len(expired_sessions)} expired sessions")
                
            except Exception as e:
                logger.error(f"Session cleanup error: {str(e)}")
    
    async def _rotate_audit_logs(self):
        """Background task to rotate audit logs"""
        
        while True:
            try:
                await asyncio.sleep(3600)  # Check every hour
                
                # Keep only recent audit logs in memory
                if len(self.audit_logs) > self.max_audit_logs:
                    # Archive old logs (would write to persistent storage)
                    archived_logs = self.audit_logs[:-self.max_audit_logs//2]
                    self.audit_logs = self.audit_logs[-self.max_audit_logs//2:]
                    
                    logger.info(f"Archived {len(archived_logs)} audit log entries")
                
            except Exception as e:
                logger.error(f"Audit log rotation error: {str(e)}")
    
    async def _log_security_event(
        self,
        event_type: str,
        user_id: str,
        resource: str,
        action: str,
        result: str,
        client_ip: str = None,
        user_agent: str = None,
        additional_data: Dict[str, Any] = None,
        session_id: str = None
    ):
        """Log security audit event"""
        
        audit_log = SecurityAuditLog(
            audit_id=f"audit_{int(datetime.now().timestamp())}_{secrets.token_hex(8)}",
            event_type=event_type,
            user_id=user_id,
            session_id=session_id,
            resource=resource,
            action=action,
            result=result,
            timestamp=datetime.now(),
            client_ip=client_ip,
            user_agent=user_agent,
            additional_data=additional_data or {}
        )
        
        self.audit_logs.append(audit_log)
        
        # Log to structured logger
        obs_stack = get_observability_stack()
        obs_stack.log_structured(
            obs_stack.LogLevel.INFO,
            f"Security event: {event_type}",
            event_type=event_type,
            user_id=user_id,
            resource=resource,
            action=action,
            result=result,
            client_ip=client_ip,
            **additional_data
        )
    
    def get_security_metrics(self) -> Dict[str, Any]:
        """Get security metrics summary"""
        
        return {
            "active_sessions": len(self.active_sessions),
            "active_threats": len(self.active_threats),
            "blocked_ips": len(self.blocked_ips),
            "api_keys": len([k for k in self.api_keys.values() if k.get("active", True)]),
            "audit_logs_count": len(self.audit_logs),
            "threat_levels": {
                level.value: len([t for t in self.active_threats.values() if t.threat_level == level])
                for level in ThreatLevel
            }
        }
    
    def get_audit_logs(self, limit: int = 100, filter_params: Dict[str, Any] = None) -> List[SecurityAuditLog]:
        """Get audit logs with optional filtering"""
        
        logs = self.audit_logs[-limit:]
        
        if filter_params:
            filtered_logs = []
            for log in logs:
                match = True
                
                if "user_id" in filter_params and log.user_id != filter_params["user_id"]:
                    match = False
                if "event_type" in filter_params and log.event_type != filter_params["event_type"]:
                    match = False
                if "result" in filter_params and log.result != filter_params["result"]:
                    match = False
                
                if match:
                    filtered_logs.append(log)
            
            return filtered_logs
        
        return logs
    
    async def investigate_threat(self, threat_id: str) -> Dict[str, Any]:
        """Investigate specific threat"""
        
        if threat_id not in self.active_threats:
            return {"error": "Threat not found"}
        
        threat = self.active_threats[threat_id]
        
        # Gather additional investigation data
        investigation_data = {
            "threat": asdict(threat),
            "related_sessions": [],
            "related_audit_logs": [],
            "ip_analysis": {}
        }
        
        # Find related sessions
        if threat.user_id:
            investigation_data["related_sessions"] = [
                {"session_id": sid, "user_id": ctx.user_id, "client_ip": ctx.client_ip}
                for sid, ctx in self.active_sessions.items()
                if ctx.user_id == threat.user_id
            ]
        
        # Find related audit logs
        investigation_data["related_audit_logs"] = [
            asdict(log) for log in self.audit_logs[-100:]
            if (log.client_ip == threat.source_ip or 
                (threat.user_id and log.user_id == threat.user_id))
        ]
        
        # IP analysis
        investigation_data["ip_analysis"] = {
            "is_blocked": threat.source_ip in self.blocked_ips,
            "rate_limit_violations": len([
                key for key in self.rate_limits.keys() 
                if key.startswith(threat.source_ip)
            ])
        }
        
        return investigation_data
    
    async def shutdown(self):
        """Shutdown security manager"""
        
        logger.info("Shutting down security manager...")
        
        # Cancel security tasks
        for task in self.security_tasks:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
        
        # Log final security metrics
        metrics = self.get_security_metrics()
        logger.info(f"Final security metrics: {metrics}")
        
        logger.info("Security manager shutdown complete")

# Global security manager instance
_security_manager: Optional[SecurityManager] = None

def get_security_manager() -> SecurityManager:
    """Get global security manager instance"""
    global _security_manager
    
    if _security_manager is None:
        _security_manager = SecurityManager()
    
    return _security_manager

async def initialize_security_manager(
    secret_key: Optional[str] = None,
    encryption_key: Optional[str] = None
) -> bool:
    """Initialize global security manager"""
    global _security_manager
    
    _security_manager = SecurityManager(secret_key, encryption_key)
    return await _security_manager.initialize()

# Security decorators
def require_authentication(func):
    """Decorator to require authentication for function"""
    
    async def async_wrapper(*args, **kwargs):
        # Extract security context from arguments
        context = None
        for arg in args:
            if isinstance(arg, SecurityContext):
                context = arg
                break
        
        if not context:
            raise SecurityError("Authentication required")
        
        security_manager = get_security_manager()
        if not security_manager._is_session_valid(context):
            raise SecurityError("Invalid or expired session")
        
        return await func(*args, **kwargs)
    
    def sync_wrapper(*args, **kwargs):
        # Extract security context from arguments
        context = None
        for arg in args:
            if isinstance(arg, SecurityContext):
                context = arg
                break
        
        if not context:
            raise SecurityError("Authentication required")
        
        security_manager = get_security_manager()
        if not security_manager._is_session_valid(context):
            raise SecurityError("Invalid or expired session")
        
        return func(*args, **kwargs)
    
    return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper

def require_permission(permission: str):
    """Decorator to require specific permission"""
    
    def decorator(func):
        async def async_wrapper(*args, **kwargs):
            # Extract security context from arguments
            context = None
            for arg in args:
                if isinstance(arg, SecurityContext):
                    context = arg
                    break
            
            if not context:
                raise SecurityError("Authentication required")
            
            if permission not in context.permissions:
                raise SecurityError(f"Permission required: {permission}")
            
            return await func(*args, **kwargs)
        
        def sync_wrapper(*args, **kwargs):
            # Extract security context from arguments
            context = None
            for arg in args:
                if isinstance(arg, SecurityContext):
                    context = arg
                    break
            
            if not context:
                raise SecurityError("Authentication required")
            
            if permission not in context.permissions:
                raise SecurityError(f"Permission required: {permission}")
            
            return func(*args, **kwargs)
        
        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper
    
    return decorator

class SecurityError(Exception):
    """Security-related exception"""
    pass

# Example usage
"""
# Initialize security manager
await initialize_security_manager()

# Authenticate user
security_manager = get_security_manager()
context = await security_manager.authenticate_user(
    {"api_key": "user_api_key"},
    "192.168.1.100",
    "Mozilla/5.0...",
    AuthenticationMethod.API_KEY
)

# Use decorators
@require_authentication
@require_permission("session.create")
async def create_session(context: SecurityContext, user_request: str):
    # Function implementation
    pass
"""
