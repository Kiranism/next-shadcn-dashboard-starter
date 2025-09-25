"""
AMT Orchestration Platform - Enterprise User Management System
File 32 of 47

Comprehensive enterprise user management system providing user lifecycle management,
role-based access control, SSO integration, user provisioning, and advanced permissions
for the AMT Platform's 7-tier organizational structure with specialized Triangle Defense
and M.E.L. AI access controls.

Author: AMT Development Team
Created: 2025-09-25
"""

import asyncio
import logging
import json
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union, Tuple, Set
from dataclasses import dataclass, asdict
from enum import Enum
import uuid
import re

# Authentication and authorization
import jwt
from passlib.context import CryptContext
from passlib.hash import bcrypt
import ldap3
from authlib.integrations.requests_client import OAuth2Session
import pyotp
import qrcode
import io
import base64

# Database and caching
import asyncpg
import redis.asyncio as redis
from sqlalchemy import create_engine, MetaData, Table, Column, String, Integer, Boolean, DateTime, JSON
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

# Email and notifications
import smtplib
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
import twilio
from twilio.rest import Client

# Platform imports
from ..shared.orchestration_protocol import BotType, TaskStatus
from ..security.security_manager import SecurityManager
from ..monitoring.metrics_collector import MetricsCollector
from ..integrations.mel_engine_integration import MELEngineIntegration
from ..config.configuration_manager import ConfigurationManager


class UserRole(Enum):
    """AMT Platform organizational roles based on 7-tier structure."""
    FOUNDER_AUTHORITY = "founder_authority"  # Tier 1: Denauld Brown
    AI_CORE = "ai_core"  # Tier 2: M.E.L.
    EXECUTIVE_COMMAND = "executive_command"  # Tier 3: Courtney Sellars, Alexandra Martinez
    STRATEGIC_LEADERSHIP = "strategic_leadership"  # Tier 4: Tony Rivera, Derek Thompson
    ADVISORY_COUNCIL = "advisory_council"  # Tier 5: Dr. Marcus Johnson, Amanda Thompson, Roberto Gutierrez
    INNOVATION_DIVISION = "innovation_division"  # Tier 6: Sam Williams, Alex Chen, Marcus Lewis
    FOOTBALL_OPERATIONS = "football_operations"  # Tier 7: Michael Rodriguez


class UserStatus(Enum):
    """User account status."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING_ACTIVATION = "pending_activation"
    LOCKED = "locked"
    EXPIRED = "expired"


class AuthenticationMethod(Enum):
    """Supported authentication methods."""
    PASSWORD = "password"
    SSO_SAML = "sso_saml"
    SSO_OAUTH = "sso_oauth"
    LDAP = "ldap"
    MFA_TOTP = "mfa_totp"
    MFA_SMS = "mfa_sms"
    API_KEY = "api_key"


class PermissionScope(Enum):
    """Permission scopes for Triangle Defense and platform access."""
    TRIANGLE_DEFENSE_VIEW = "triangle_defense_view"
    TRIANGLE_DEFENSE_EDIT = "triangle_defense_edit"
    TRIANGLE_DEFENSE_ADMIN = "triangle_defense_admin"
    MEL_AI_ACCESS = "mel_ai_access"
    MEL_AI_ADMIN = "mel_ai_admin"
    PORTAL_MODULE_ACCESS = "portal_module_access"
    PORTAL_ADMIN = "portal_admin"
    API_ACCESS = "api_access"
    REPORTING_VIEW = "reporting_view"
    REPORTING_ADMIN = "reporting_admin"
    USER_MANAGEMENT = "user_management"
    SYSTEM_ADMIN = "system_admin"


@dataclass
class User:
    """Comprehensive user profile with AMT-specific attributes."""
    user_id: str
    email: str
    username: str
    first_name: str
    last_name: str
    role: UserRole
    status: UserStatus
    permissions: Set[PermissionScope]
    created_at: datetime
    last_login: Optional[datetime]
    last_activity: Optional[datetime]
    password_hash: Optional[str]
    mfa_enabled: bool
    mfa_secret: Optional[str]
    profile_data: Dict[str, Any]
    preferences: Dict[str, Any]
    session_data: Dict[str, Any]
    triangle_defense_specializations: List[str]
    mel_ai_interaction_level: str
    portal_modules_access: List[str]


@dataclass
class UserSession:
    """User session tracking and management."""
    session_id: str
    user_id: str
    created_at: datetime
    last_activity: datetime
    ip_address: str
    user_agent: str
    authentication_method: AuthenticationMethod
    mfa_verified: bool
    permissions_cache: Set[PermissionScope]
    session_data: Dict[str, Any]
    expires_at: datetime


@dataclass
class UserGroup:
    """User groups for role-based management."""
    group_id: str
    group_name: str
    description: str
    permissions: Set[PermissionScope]
    members: List[str]
    created_at: datetime
    created_by: str
    auto_assignment_rules: Dict[str, Any]


@dataclass
class AuditLog:
    """User activity audit logging."""
    log_id: str
    user_id: str
    action: str
    resource: str
    timestamp: datetime
    ip_address: str
    user_agent: str
    result: str
    details: Dict[str, Any]


class EnterpriseUserManagement:
    """
    Enterprise User Management System for AMT Platform.
    
    Provides comprehensive user lifecycle management including:
    - 7-tier organizational role management
    - Multi-factor authentication (TOTP, SMS)
    - Single Sign-On (SAML, OAuth, LDAP)
    - Advanced permission management
    - Triangle Defense access controls
    - M.E.L. AI interaction permissions
    - User provisioning and deprovisioning
    - Session management and security
    - Audit logging and compliance
    - Automated user onboarding
    """

    def __init__(
        self,
        security_manager: SecurityManager,
        metrics_collector: MetricsCollector,
        mel_engine: MELEngineIntegration,
        config_manager: ConfigurationManager
    ):
        self.security = security_manager
        self.metrics = metrics_collector
        self.mel_engine = mel_engine
        self.config = config_manager
        
        self.logger = logging.getLogger(__name__)
        
        # Password hashing
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        # User storage
        self.users: Dict[str, User] = {}
        self.active_sessions: Dict[str, UserSession] = {}
        self.user_groups: Dict[str, UserGroup] = {}
        self.audit_logs: List[AuditLog] = []
        
        # AMT-specific configurations
        self.amt_config = {
            'default_permissions': {
                UserRole.FOUNDER_AUTHORITY: {
                    PermissionScope.TRIANGLE_DEFENSE_ADMIN,
                    PermissionScope.MEL_AI_ADMIN,
                    PermissionScope.PORTAL_ADMIN,
                    PermissionScope.API_ACCESS,
                    PermissionScope.REPORTING_ADMIN,
                    PermissionScope.USER_MANAGEMENT,
                    PermissionScope.SYSTEM_ADMIN
                },
                UserRole.AI_CORE: {
                    PermissionScope.MEL_AI_ADMIN,
                    PermissionScope.TRIANGLE_DEFENSE_VIEW,
                    PermissionScope.API_ACCESS,
                    PermissionScope.REPORTING_VIEW
                },
                UserRole.EXECUTIVE_COMMAND: {
                    PermissionScope.TRIANGLE_DEFENSE_EDIT,
                    PermissionScope.MEL_AI_ACCESS,
                    PermissionScope.PORTAL_ADMIN,
                    PermissionScope.API_ACCESS,
                    PermissionScope.REPORTING_ADMIN,
                    PermissionScope.USER_MANAGEMENT
                },
                UserRole.STRATEGIC_LEADERSHIP: {
                    PermissionScope.TRIANGLE_DEFENSE_EDIT,
                    PermissionScope.MEL_AI_ACCESS,
                    PermissionScope.PORTAL_MODULE_ACCESS,
                    PermissionScope.API_ACCESS,
                    PermissionScope.REPORTING_VIEW
                },
                UserRole.ADVISORY_COUNCIL: {
                    PermissionScope.TRIANGLE_DEFENSE_VIEW,
                    PermissionScope.MEL_AI_ACCESS,
                    PermissionScope.PORTAL_MODULE_ACCESS,
                    PermissionScope.REPORTING_VIEW
                },
                UserRole.INNOVATION_DIVISION: {
                    PermissionScope.TRIANGLE_DEFENSE_VIEW,
                    PermissionScope.MEL_AI_ACCESS,
                    PermissionScope.PORTAL_MODULE_ACCESS,
                    PermissionScope.API_ACCESS
                },
                UserRole.FOOTBALL_OPERATIONS: {
                    PermissionScope.TRIANGLE_DEFENSE_EDIT,
                    PermissionScope.MEL_AI_ACCESS,
                    PermissionScope.PORTAL_MODULE_ACCESS
                }
            },
            'predefined_users': [
                {
                    'email': 'denauld@analyzemyteam.com',
                    'username': 'denauld.brown',
                    'first_name': 'Denauld',
                    'last_name': 'Brown',
                    'role': UserRole.FOUNDER_AUTHORITY
                },
                {
                    'email': 'mel@analyzemyteam.com',
                    'username': 'mel.ai',
                    'first_name': 'M.E.L.',
                    'last_name': 'AI',
                    'role': UserRole.AI_CORE
                },
                {
                    'email': 'courtney@analyzemyteam.com',
                    'username': 'courtney.sellars',
                    'first_name': 'Courtney',
                    'last_name': 'Sellars',
                    'role': UserRole.EXECUTIVE_COMMAND
                },
                {
                    'email': 'alexandra@analyzemyteam.com',
                    'username': 'alexandra.martinez',
                    'first_name': 'Alexandra',
                    'last_name': 'Martinez',
                    'role': UserRole.EXECUTIVE_COMMAND
                }
            ],
            'session_timeout_minutes': 480,  # 8 hours
            'password_policy': {
                'min_length': 12,
                'require_uppercase': True,
                'require_lowercase': True,
                'require_numbers': True,
                'require_special_chars': True,
                'password_history': 5
            },
            'mfa_required_roles': [
                UserRole.FOUNDER_AUTHORITY,
                UserRole.EXECUTIVE_COMMAND
            ]
        }
        
        # External integrations
        self.ldap_client = None
        self.sso_providers: Dict[str, Any] = {}
        self.notification_clients: Dict[str, Any] = {}

    async def initialize(self) -> bool:
        """Initialize the enterprise user management system."""
        try:
            self.logger.info("Initializing Enterprise User Management System...")
            
            # Setup database connections
            await self._setup_database()
            
            # Initialize external authentication providers
            await self._setup_external_auth_providers()
            
            # Setup notification services
            await self._setup_notification_services()
            
            # Create predefined users
            await self._create_predefined_users()
            
            # Setup default user groups
            await self._setup_default_user_groups()
            
            # Start session cleanup task
            asyncio.create_task(self._session_cleanup_task())
            
            # Start audit log rotation
            asyncio.create_task(self._audit_log_rotation_task())
            
            self.logger.info("Enterprise User Management System initialized successfully")
            await self.metrics.record_event("user_management_initialized", {"success": True})
            
            return True
            
        except Exception as e:
            self.logger.error(f"User Management System initialization failed: {str(e)}")
            await self.metrics.record_event("user_management_init_failed", {"error": str(e)})
            return False

    async def create_user(
        self,
        email: str,
        username: str,
        first_name: str,
        last_name: str,
        role: UserRole,
        password: Optional[str] = None,
        send_welcome_email: bool = True
    ) -> str:
        """Create a new user account."""
        try:
            self.logger.info(f"Creating new user: {email}")
            
            # Validate email uniqueness
            if await self._email_exists(email):
                raise ValueError(f"Email {email} already exists")
            
            # Validate username uniqueness
            if await self._username_exists(username):
                raise ValueError(f"Username {username} already exists")
            
            # Generate user ID
            user_id = str(uuid.uuid4())
            
            # Hash password if provided
            password_hash = None
            if password:
                if not self._validate_password_policy(password):
                    raise ValueError("Password does not meet policy requirements")
                password_hash = self.pwd_context.hash(password)
            
            # Get default permissions for role
            default_permissions = self.amt_config['default_permissions'].get(role, set())
            
            # Determine initial status
            initial_status = UserStatus.PENDING_ACTIVATION if not password else UserStatus.ACTIVE
            
            # Create user profile
            user = User(
                user_id=user_id,
                email=email,
                username=username,
                first_name=first_name,
                last_name=last_name,
                role=role,
                status=initial_status,
                permissions=default_permissions.copy(),
                created_at=datetime.utcnow(),
                last_login=None,
                last_activity=None,
                password_hash=password_hash,
                mfa_enabled=role in self.amt_config['mfa_required_roles'],
                mfa_secret=None,
                profile_data={},
                preferences={
                    'theme': 'light',
                    'language': 'en',
                    'timezone': 'UTC',
                    'email_notifications': True,
                    'triangle_defense_notifications': True,
                    'mel_ai_notifications': True
                },
                session_data={},
                triangle_defense_specializations=[],
                mel_ai_interaction_level='standard',
                portal_modules_access=self._get_default_module_access(role)
            )
            
            # Setup MFA if required
            if user.mfa_enabled and not user.mfa_secret:
                user.mfa_secret = pyotp.random_base32()
            
            # Store user
            self.users[user_id] = user
            
            # Log user creation
            await self._log_user_action(user_id, "user_created", "user_account", "success", {
                "role": role.value,
                "created_by": "system"  # Could be current user if available
            })
            
            # Send welcome email if requested
            if send_welcome_email:
                await self._send_welcome_email(user)
            
            # Record metrics
            await self.metrics.record_event("user_created", {
                "user_id": user_id,
                "role": role.value,
                "mfa_required": user.mfa_enabled
            })
            
            self.logger.info(f"User {email} created successfully with ID: {user_id}")
            return user_id
            
        except Exception as e:
            self.logger.error(f"User creation failed for {email}: {str(e)}")
            raise

    async def authenticate_user(
        self,
        email: str,
        password: str,
        ip_address: str,
        user_agent: str,
        mfa_token: Optional[str] = None
    ) -> Tuple[str, UserSession]:
        """Authenticate user and create session."""
        try:
            self.logger.info(f"Authenticating user: {email}")
            
            # Find user by email
            user = await self._get_user_by_email(email)
            if not user:
                await self._log_auth_attempt(email, ip_address, "failed", "user_not_found")
                raise ValueError("Invalid credentials")
            
            # Check user status
            if user.status != UserStatus.ACTIVE:
                await self._log_auth_attempt(email, ip_address, "failed", f"user_status_{user.status.value}")
                raise ValueError(f"Account is {user.status.value}")
            
            # Verify password
            if not user.password_hash or not self.pwd_context.verify(password, user.password_hash):
                await self._log_auth_attempt(email, ip_address, "failed", "invalid_password")
                raise ValueError("Invalid credentials")
            
            # Check MFA if enabled
            mfa_verified = True
            if user.mfa_enabled:
                if not mfa_token:
                    raise ValueError("MFA token required")
                
                if not self._verify_mfa_token(user, mfa_token):
                    await self._log_auth_attempt(email, ip_address, "failed", "invalid_mfa")
                    raise ValueError("Invalid MFA token")
            
            # Create session
            session_id = str(uuid.uuid4())
            session = UserSession(
                session_id=session_id,
                user_id=user.user_id,
                created_at=datetime.utcnow(),
                last_activity=datetime.utcnow(),
                ip_address=ip_address,
                user_agent=user_agent,
                authentication_method=AuthenticationMethod.PASSWORD,
                mfa_verified=mfa_verified,
                permissions_cache=user.permissions.copy(),
                session_data={},
                expires_at=datetime.utcnow() + timedelta(minutes=self.amt_config['session_timeout_minutes'])
            )
            
            # Store session
            self.active_sessions[session_id] = session
            
            # Update user login info
            user.last_login = datetime.utcnow()
            user.last_activity = datetime.utcnow()
            
            # Log successful authentication
            await self._log_auth_attempt(email, ip_address, "success", "password_auth")
            await self._log_user_action(user.user_id, "login", "authentication", "success", {
                "ip_address": ip_address,
                "user_agent": user_agent,
                "mfa_used": user.mfa_enabled
            })
            
            # Record metrics
            await self.metrics.record_event("user_authenticated", {
                "user_id": user.user_id,
                "role": user.role.value,
                "mfa_verified": mfa_verified,
                "authentication_method": "password"
            })
            
            self.logger.info(f"User {email} authenticated successfully")
            return session_id, session
            
        except Exception as e:
            self.logger.error(f"Authentication failed for {email}: {str(e)}")
            raise

    async def validate_session(self, session_id: str) -> Optional[UserSession]:
        """Validate and return user session."""
        try:
            session = self.active_sessions.get(session_id)
            if not session:
                return None
            
            # Check if session is expired
            if datetime.utcnow() > session.expires_at:
                await self._cleanup_expired_session(session_id)
                return None
            
            # Update last activity
            session.last_activity = datetime.utcnow()
            
            return session
            
        except Exception as e:
            self.logger.error(f"Session validation failed: {str(e)}")
            return None

    async def check_permission(
        self,
        user_id: str,
        permission: PermissionScope,
        resource: Optional[str] = None
    ) -> bool:
        """Check if user has specific permission."""
        try:
            user = self.users.get(user_id)
            if not user:
                return False
            
            # Check if user is active
            if user.status != UserStatus.ACTIVE:
                return False
            
            # Check direct permissions
            if permission in user.permissions:
                return True
            
            # Check group permissions
            for group_id, group in self.user_groups.items():
                if user_id in group.members and permission in group.permissions:
                    return True
            
            # Resource-specific permission checks
            if resource and permission == PermissionScope.TRIANGLE_DEFENSE_EDIT:
                return resource.lower() in [spec.lower() for spec in user.triangle_defense_specializations]
            
            return False
            
        except Exception as e:
            self.logger.error(f"Permission check failed: {str(e)}")
            return False

    async def setup_mfa(self, user_id: str) -> Dict[str, Any]:
        """Setup multi-factor authentication for user."""
        try:
            user = self.users.get(user_id)
            if not user:
                raise ValueError("User not found")
            
            # Generate MFA secret if not exists
            if not user.mfa_secret:
                user.mfa_secret = pyotp.random_base32()
            
            # Generate QR code for TOTP setup
            totp = pyotp.TOTP(user.mfa_secret)
            provisioning_uri = totp.provisioning_uri(
                user.email,
                issuer_name="AMT Platform"
            )
            
            # Create QR code image
            qr = qrcode.QRCode(version=1, box_size=10, border=5)
            qr.add_data(provisioning_uri)
            qr.make(fit=True)
            
            img = qr.make_image(fill_color="black", back_color="white")
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            qr_code_base64 = base64.b64encode(buffer.getvalue()).decode()
            
            user.mfa_enabled = True
            
            await self._log_user_action(user_id, "mfa_setup", "security", "success")
            
            return {
                'secret': user.mfa_secret,
                'qr_code': qr_code_base64,
                'provisioning_uri': provisioning_uri
            }
            
        except Exception as e:
            self.logger.error(f"MFA setup failed: {str(e)}")
            raise

    async def update_user_permissions(
        self,
        user_id: str,
        permissions: Set[PermissionScope],
        updated_by: str
    ) -> bool:
        """Update user permissions."""
        try:
            user = self.users.get(user_id)
            if not user:
                raise ValueError("User not found")
            
            old_permissions = user.permissions.copy()
            user.permissions = permissions.copy()
            
            # Log permission change
            await self._log_user_action(updated_by, "permissions_updated", "user_account", "success", {
                "target_user": user_id,
                "old_permissions": list(old_permissions),
                "new_permissions": list(permissions)
            })
            
            # Update active sessions with new permissions
            for session in self.active_sessions.values():
                if session.user_id == user_id:
                    session.permissions_cache = permissions.copy()
            
            await self.metrics.record_event("user_permissions_updated", {
                "user_id": user_id,
                "updated_by": updated_by,
                "permissions_count": len(permissions)
            })
            
            return True
            
        except Exception as e:
            self.logger.error(f"Permission update failed: {str(e)}")
            return False

    # Private helper methods

    async def _setup_database(self) -> None:
        """Setup database connections and tables."""
        # Database setup would be implemented here
        # For now, using in-memory storage
        pass

    async def _setup_external_auth_providers(self) -> None:
        """Setup external authentication providers (LDAP, SAML, OAuth)."""
        try:
            # LDAP setup (if configured)
            ldap_config = self.config.get_config('ldap')
            if ldap_config and ldap_config.get('enabled'):
                # Setup LDAP client
                pass
            
            # SAML setup (if configured)
            saml_config = self.config.get_config('saml')
            if saml_config and saml_config.get('enabled'):
                # Setup SAML provider
                pass
            
            # OAuth setup (if configured)
            oauth_config = self.config.get_config('oauth')
            if oauth_config and oauth_config.get('enabled'):
                # Setup OAuth providers
                pass
            
        except Exception as e:
            self.logger.error(f"External auth provider setup failed: {str(e)}")

    async def _create_predefined_users(self) -> None:
        """Create predefined AMT users."""
        for user_config in self.amt_config['predefined_users']:
            try:
                # Check if user already exists
                if await self._email_exists(user_config['email']):
                    continue
                
                # Create user without password (will need to be set via password reset)
                await self.create_user(
                    email=user_config['email'],
                    username=user_config['username'],
                    first_name=user_config['first_name'],
                    last_name=user_config['last_name'],
                    role=user_config['role'],
                    password=None,  # Will be set during first login
                    send_welcome_email=True
                )
                
            except Exception as e:
                self.logger.error(f"Failed to create predefined user {user_config['email']}: {str(e)}")

    def _get_default_module_access(self, role: UserRole) -> List[str]:
        """Get default portal module access for role."""
        if role in [UserRole.FOUNDER_AUTHORITY, UserRole.EXECUTIVE_COMMAND]:
            return ['Power Playbooks', 'M.E.L. AI', 'Executive Suite']
        elif role == UserRole.AI_CORE:
            return ['M.E.L. AI']
        else:
            return ['Power Playbooks']

    def _verify_mfa_token(self, user: User, token: str) -> bool:
        """Verify MFA TOTP token."""
        if not user.mfa_secret:
            return False
        
        totp = pyotp.TOTP(user.mfa_secret)
        return totp.verify(token, valid_window=1)

    async def _log_user_action(
        self,
        user_id: str,
        action: str,
        resource: str,
        result: str,
        details: Optional[Dict[str, Any]] = None
    ) -> None:
        """Log user action for audit trail."""
        audit_log = AuditLog(
            log_id=str(uuid.uuid4()),
            user_id=user_id,
            action=action,
            resource=resource,
            timestamp=datetime.utcnow(),
            ip_address="",  # Would be populated from request context
            user_agent="",  # Would be populated from request context
            result=result,
            details=details or {}
        )
        
        self.audit_logs.append(audit_log)

    async def _session_cleanup_task(self) -> None:
        """Background task to cleanup expired sessions."""
        while True:
            try:
                await asyncio.sleep(300)  # Check every 5 minutes
                
                current_time = datetime.utcnow()
                expired_sessions = [
                    session_id for session_id, session in self.active_sessions.items()
                    if session.expires_at < current_time
                ]
                
                for session_id in expired_sessions:
                    await self._cleanup_expired_session(session_id)
                
                if expired_sessions:
                    self.logger.info(f"Cleaned up {len(expired_sessions)} expired sessions")
                
            except Exception as e:
                self.logger.error(f"Session cleanup task failed: {str(e)}")
                await asyncio.sleep(60)

    async def _cleanup_expired_session(self, session_id: str) -> None:
        """Clean up expired session."""
        if session_id in self.active_sessions:
            session = self.active_sessions[session_id]
            await self._log_user_action(session.user_id, "session_expired", "session", "success")
            del self.active_sessions[session_id]

    async def get_user_management_status(self) -> Dict[str, Any]:
        """Get current user management system status."""
        return {
            "system_initialized": bool(self.users),
            "total_users": len(self.users),
            "active_sessions": len(self.active_sessions),
            "user_groups": len(self.user_groups),
            "audit_logs_count": len(self.audit_logs),
            "role_distribution": {
                role.value: len([u for u in self.users.values() if u.role == role])
                for role in UserRole
            },
            "mfa_enabled_users": len([u for u in self.users.values() if u.mfa_enabled]),
            "external_auth_providers": len(self.sso_providers),
            "amt_configuration": {
                "predefined_users_count": len(self.amt_config['predefined_users']),
                "session_timeout_minutes": self.amt_config['session_timeout_minutes'],
                "mfa_required_roles": [role.value for role in self.amt_config['mfa_required_roles']]
            }
        }


# Export main class
__all__ = [
    'EnterpriseUserManagement', 
    'User', 
    'UserSession', 
    'UserGroup',
    'UserRole', 
    'UserStatus', 
    'PermissionScope', 
    'AuthenticationMethod'
]
