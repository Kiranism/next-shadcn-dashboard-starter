"""
AMT Orchestration Platform - User Onboarding and Account Provisioning System
File 34 of 47

Comprehensive user onboarding system serving as the master template for AnalyzeMyTeam
end user registration, account provisioning, Triangle Defense methodology introduction,
M.E.L. AI setup, and complete platform orientation with 5 predefined test accounts
for development and demonstration purposes.

Author: AMT Development Team
Created: 2025-09-25
"""

import asyncio
import logging
import json
import secrets
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import uuid
import re

# Email and templating
import aiosmtplib
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
from jinja2 import Environment, Template
import qrcode
import io
import base64

# Platform imports
from ..shared.orchestration_protocol import FormationType, BotType
from ..user_management.enterprise_user_management import (
    EnterpriseUserManagement, User, UserRole, UserStatus, PermissionScope
)
from ..security.security_manager import SecurityManager
from ..monitoring.metrics_collector import MetricsCollector
from ..integrations.mel_engine_integration import MELEngineIntegration
from ..integrations.triangle_defense_integration import TriangleDefenseIntegration
from ..notifications.realtime_notification_system import RealTimeNotificationSystem
from ..documentation.developer_guide_system import DeveloperGuideSystem


class OnboardingStage(Enum):
    """Onboarding process stages."""
    REGISTRATION = "registration"
    EMAIL_VERIFICATION = "email_verification"
    PROFILE_SETUP = "profile_setup"
    TRIANGLE_DEFENSE_INTRO = "triangle_defense_intro"
    MEL_AI_SETUP = "mel_ai_setup"
    PORTAL_TOUR = "portal_tour"
    FIRST_FORMATION = "first_formation"
    ONBOARDING_COMPLETE = "onboarding_complete"


class UserType(Enum):
    """Types of users signing up for AMT."""
    HEAD_COACH = "head_coach"
    ASSISTANT_COACH = "assistant_coach"
    DEFENSIVE_COORDINATOR = "defensive_coordinator"
    ANALYST = "analyst"
    ATHLETIC_DIRECTOR = "athletic_director"
    PLAYER_DEVELOPMENT = "player_development"
    RECRUITER = "recruiter"
    ADMINISTRATOR = "administrator"
    DEVELOPER = "developer"
    TRIAL_USER = "trial_user"


class SubscriptionTier(Enum):
    """AMT subscription tiers."""
    TRIAL = "trial"  # 14-day free trial
    BASIC = "basic"  # Basic Triangle Defense access
    PROFESSIONAL = "professional"  # Full coaching suite
    ENTERPRISE = "enterprise"  # Multi-team, advanced analytics
    DEVELOPER = "developer"  # API access, custom integrations


@dataclass
class OnboardingProfile:
    """User onboarding profile and progress tracking."""
    user_id: str
    email: str
    user_type: UserType
    subscription_tier: SubscriptionTier
    current_stage: OnboardingStage
    completed_stages: List[OnboardingStage]
    started_at: datetime
    completed_at: Optional[datetime]
    profile_data: Dict[str, Any]
    preferences: Dict[str, Any]
    progress_percentage: float
    onboarding_token: str
    verification_code: Optional[str]
    triangle_defense_specialization: List[FormationType]
    mel_ai_interaction_level: str


@dataclass
class TestAccount:
    """Predefined test account configuration."""
    account_id: str
    email: str
    username: str
    password: str
    user_type: UserType
    subscription_tier: SubscriptionTier
    profile_data: Dict[str, Any]
    specializations: List[FormationType]
    demo_data_enabled: bool
    description: str


class UserOnboardingSystem:
    """
    User Onboarding and Account Provisioning System for AMT Platform.
    
    Serves as the master template for AnalyzeMyTeam end user registration including:
    - Multi-step registration and verification process
    - User type-specific onboarding flows
    - Triangle Defense methodology introduction
    - M.E.L. AI coaching assistant setup
    - Portal tour and feature introduction
    - Subscription tier management
    - 5 comprehensive test accounts for development/demo
    - Progress tracking and analytics
    - Automated welcome sequences
    - Integration with all AMT platform components
    """

    def __init__(
        self,
        user_management: EnterpriseUserManagement,
        security_manager: SecurityManager,
        metrics_collector: MetricsCollector,
        mel_engine: MELEngineIntegration,
        triangle_defense: TriangleDefenseIntegration,
        notification_system: RealTimeNotificationSystem,
        developer_guide: DeveloperGuideSystem
    ):
        self.user_management = user_management
        self.security = security_manager
        self.metrics = metrics_collector
        self.mel_engine = mel_engine
        self.triangle_defense = triangle_defense
        self.notifications = notification_system
        self.developer_guide = developer_guide
        
        self.logger = logging.getLogger(__name__)
        
        # Onboarding tracking
        self.active_onboardings: Dict[str, OnboardingProfile] = {}
        self.completed_onboardings: Dict[str, OnboardingProfile] = {}
        self.verification_codes: Dict[str, str] = {}  # email -> code
        
        # Test accounts for development and demo
        self.test_accounts: Dict[str, TestAccount] = {}
        
        # Email templates
        self.email_templates: Dict[str, str] = {}
        
        # AMT-specific onboarding configuration
        self.amt_config = {
            'subscription_features': {
                SubscriptionTier.TRIAL: {
                    'formations_access': [FormationType.LARRY, FormationType.LINDA],
                    'mel_ai_interactions': 50,
                    'portal_modules': ['Power Playbooks'],
                    'api_calls': 0,
                    'team_members': 1,
                    'duration_days': 14
                },
                SubscriptionTier.BASIC: {
                    'formations_access': [FormationType.LARRY, FormationType.LINDA, FormationType.RICKY],
                    'mel_ai_interactions': 200,
                    'portal_modules': ['Power Playbooks', 'M.E.L. AI'],
                    'api_calls': 100,
                    'team_members': 3,
                    'duration_days': 0  # Unlimited
                },
                SubscriptionTier.PROFESSIONAL: {
                    'formations_access': list(FormationType),
                    'mel_ai_interactions': 1000,
                    'portal_modules': ['Power Playbooks', 'M.E.L. AI', 'Executive Suite'],
                    'api_calls': 1000,
                    'team_members': 10,
                    'duration_days': 0
                },
                SubscriptionTier.ENTERPRISE: {
                    'formations_access': list(FormationType),
                    'mel_ai_interactions': -1,  # Unlimited
                    'portal_modules': ['Power Playbooks', 'M.E.L. AI', 'Executive Suite', 'Dynamic Fabricator'],
                    'api_calls': -1,
                    'team_members': -1,
                    'duration_days': 0
                },
                SubscriptionTier.DEVELOPER: {
                    'formations_access': list(FormationType),
                    'mel_ai_interactions': 500,
                    'portal_modules': ['Power Playbooks', 'M.E.L. AI', 'Developer Console'],
                    'api_calls': -1,
                    'team_members': 5,
                    'duration_days': 0
                }
            },
            'user_type_defaults': {
                UserType.HEAD_COACH: {
                    'subscription_tier': SubscriptionTier.PROFESSIONAL,
                    'specializations': [FormationType.LARRY, FormationType.LINDA, FormationType.RICKY],
                    'mel_ai_level': 'advanced',
                    'portal_modules': ['Power Playbooks', 'M.E.L. AI', 'Executive Suite']
                },
                UserType.DEFENSIVE_COORDINATOR: {
                    'subscription_tier': SubscriptionTier.PROFESSIONAL,
                    'specializations': list(FormationType),
                    'mel_ai_level': 'expert',
                    'portal_modules': ['Power Playbooks', 'M.E.L. AI']
                },
                UserType.ANALYST: {
                    'subscription_tier': SubscriptionTier.BASIC,
                    'specializations': [FormationType.LARRY, FormationType.LINDA],
                    'mel_ai_level': 'standard',
                    'portal_modules': ['Power Playbooks']
                },
                UserType.DEVELOPER: {
                    'subscription_tier': SubscriptionTier.DEVELOPER,
                    'specializations': [],
                    'mel_ai_level': 'standard',
                    'portal_modules': ['Developer Console', 'M.E.L. AI']
                }
            },
            'formation_intro_order': [
                FormationType.LARRY,  # Start with most fundamental
                FormationType.LINDA,
                FormationType.RICKY,
                FormationType.RITA,
                FormationType.MALE_MID,
                FormationType.FEMALE_MID
            ],
            'onboarding_rewards': {
                'email_verified': 'Triangle Defense Basic Guide PDF',
                'profile_completed': 'M.E.L. AI Welcome Session',
                'first_formation': '25% discount on Professional upgrade',
                'onboarding_completed': 'Exclusive Denauld Brown coaching video'
            }
        }
        
        # System configuration
        self.config = {
            'verification_code_expiry_minutes': 15,
            'onboarding_timeout_days': 7,
            'email_verification_required': True,
            'auto_provision_trial': True,
            'demo_data_enabled': True,
            'welcome_email_delay_seconds': 30,
            'analytics_tracking': True
        }

    async def initialize(self) -> bool:
        """Initialize the user onboarding system."""
        try:
            self.logger.info("Initializing User Onboarding System...")
            
            # Setup email templates
            await self._setup_email_templates()
            
            # Create predefined test accounts
            await self._create_test_accounts()
            
            # Setup onboarding workflows
            await self._setup_onboarding_workflows()
            
            # Start background tasks
            asyncio.create_task(self._cleanup_expired_onboardings())
            
            self.logger.info("User Onboarding System initialized successfully")
            await self.metrics.record_event("onboarding_system_initialized", {
                "test_accounts_created": len(self.test_accounts)
            })
            
            return True
            
        except Exception as e:
            self.logger.error(f"Onboarding System initialization failed: {str(e)}")
            return False

    async def start_registration(
        self,
        email: str,
        user_type: UserType,
        subscription_tier: Optional[SubscriptionTier] = None,
        referral_code: Optional[str] = None
    ) -> str:
        """Start user registration process."""
        try:
            self.logger.info(f"Starting registration for {email} as {user_type.value}")
            
            # Validate email format
            if not self._validate_email(email):
                raise ValueError("Invalid email format")
            
            # Check if email already exists
            if await self._email_already_registered(email):
                raise ValueError("Email already registered")
            
            # Determine subscription tier
            if not subscription_tier:
                subscription_tier = self.amt_config['user_type_defaults'].get(
                    user_type, {}
                ).get('subscription_tier', SubscriptionTier.TRIAL)
            
            # Generate onboarding token
            onboarding_token = secrets.token_urlsafe(32)
            
            # Create onboarding profile
            profile = OnboardingProfile(
                user_id=str(uuid.uuid4()),
                email=email,
                user_type=user_type,
                subscription_tier=subscription_tier,
                current_stage=OnboardingStage.REGISTRATION,
                completed_stages=[],
                started_at=datetime.utcnow(),
                completed_at=None,
                profile_data={
                    'referral_code': referral_code,
                    'registration_ip': '',  # Would be populated from request
                    'user_agent': ''  # Would be populated from request
                },
                preferences=self._get_default_preferences(user_type),
                progress_percentage=0.0,
                onboarding_token=onboarding_token,
                verification_code=None,
                triangle_defense_specialization=[],
                mel_ai_interaction_level='standard'
            )
            
            # Store onboarding profile
            self.active_onboardings[onboarding_token] = profile
            
            # Move to email verification stage
            await self._proceed_to_email_verification(profile)
            
            await self.metrics.record_event("registration_started", {
                "user_type": user_type.value,
                "subscription_tier": subscription_tier.value,
                "has_referral": referral_code is not None
            })
            
            return onboarding_token
            
        except Exception as e:
            self.logger.error(f"Registration start failed for {email}: {str(e)}")
            raise

    async def verify_email(self, onboarding_token: str, verification_code: str) -> bool:
        """Verify user email with verification code."""
        try:
            profile = self.active_onboardings.get(onboarding_token)
            if not profile:
                raise ValueError("Invalid onboarding token")
            
            # Check verification code
            stored_code = self.verification_codes.get(profile.email)
            if not stored_code or stored_code != verification_code:
                raise ValueError("Invalid verification code")
            
            # Mark email as verified
            profile.completed_stages.append(OnboardingStage.EMAIL_VERIFICATION)
            profile.current_stage = OnboardingStage.PROFILE_SETUP
            profile.progress_percentage = 25.0
            
            # Clean up verification code
            del self.verification_codes[profile.email]
            
            # Send welcome email with onboarding rewards
            await self._send_welcome_email(profile)
            
            # Proceed to profile setup
            await self._proceed_to_profile_setup(profile)
            
            await self.metrics.record_event("email_verified", {
                "user_id": profile.user_id,
                "user_type": profile.user_type.value
            })
            
            return True
            
        except Exception as e:
            self.logger.error(f"Email verification failed: {str(e)}")
            return False

    async def complete_profile_setup(
        self,
        onboarding_token: str,
        profile_data: Dict[str, Any]
    ) -> bool:
        """Complete user profile setup."""
        try:
            profile = self.active_onboardings.get(onboarding_token)
            if not profile:
                raise ValueError("Invalid onboarding token")
            
            # Validate required fields
            required_fields = ['first_name', 'last_name', 'organization']
            for field in required_fields:
                if field not in profile_data:
                    raise ValueError(f"Missing required field: {field}")
            
            # Update profile data
            profile.profile_data.update(profile_data)
            profile.completed_stages.append(OnboardingStage.PROFILE_SETUP)
            profile.current_stage = OnboardingStage.TRIANGLE_DEFENSE_INTRO
            profile.progress_percentage = 40.0
            
            # Create actual user account in the system
            await self._create_user_account(profile)
            
            # Proceed to Triangle Defense introduction
            await self._proceed_to_triangle_defense_intro(profile)
            
            await self.metrics.record_event("profile_completed", {
                "user_id": profile.user_id,
                "organization": profile_data.get('organization', ''),
                "experience_level": profile_data.get('experience_level', '')
            })
            
            return True
            
        except Exception as e:
            self.logger.error(f"Profile setup failed: {str(e)}")
            return False

    async def complete_triangle_defense_intro(
        self,
        onboarding_token: str,
        selected_specializations: List[FormationType]
    ) -> Dict[str, Any]:
        """Complete Triangle Defense methodology introduction."""
        try:
            profile = self.active_onboardings.get(onboarding_token)
            if not profile:
                raise ValueError("Invalid onboarding token")
            
            # Validate specializations based on subscription tier
            available_formations = self.amt_config['subscription_features'][profile.subscription_tier]['formations_access']
            
            valid_specializations = [f for f in selected_specializations if f in available_formations]
            profile.triangle_defense_specialization = valid_specializations
            
            # Update progress
            profile.completed_stages.append(OnboardingStage.TRIANGLE_DEFENSE_INTRO)
            profile.current_stage = OnboardingStage.MEL_AI_SETUP
            profile.progress_percentage = 60.0
            
            # Generate personalized formation guide
            formation_guide = await self._generate_personalized_formation_guide(profile)
            
            # Proceed to M.E.L. AI setup
            await self._proceed_to_mel_ai_setup(profile)
            
            await self.metrics.record_event("triangle_defense_intro_completed", {
                "user_id": profile.user_id,
                "specializations": [f.value for f in valid_specializations],
                "formations_count": len(valid_specializations)
            })
            
            return {
                'specializations_set': [f.value for f in valid_specializations],
                'formation_guide': formation_guide,
                'next_stage': 'mel_ai_setup'
            }
            
        except Exception as e:
            self.logger.error(f"Triangle Defense intro failed: {str(e)}")
            raise

    async def setup_mel_ai_integration(
        self,
        onboarding_token: str,
        interaction_preferences: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Setup M.E.L. AI coaching assistant integration."""
        try:
            profile = self.active_onboardings.get(onboarding_token)
            if not profile:
                raise ValueError("Invalid onboarding token")
            
            # Configure M.E.L. AI interaction level
            mel_level = interaction_preferences.get('interaction_level', 'standard')
            profile.mel_ai_interaction_level = mel_level
            
            # Setup M.E.L. AI user profile
            mel_profile = await self.mel_engine.create_user_profile(
                user_id=profile.user_id,
                interaction_level=mel_level,
                specializations=profile.triangle_defense_specialization,
                preferences=interaction_preferences
            )
            
            # Generate welcome M.E.L. message
            welcome_message = await self._generate_mel_welcome_message(profile)
            
            # Update progress
            profile.completed_stages.append(OnboardingStage.MEL_AI_SETUP)
            profile.current_stage = OnboardingStage.PORTAL_TOUR
            profile.progress_percentage = 80.0
            
            # Proceed to portal tour
            await self._proceed_to_portal_tour(profile)
            
            await self.metrics.record_event("mel_ai_setup_completed", {
                "user_id": profile.user_id,
                "interaction_level": mel_level,
                "preferences_set": len(interaction_preferences)
            })
            
            return {
                'mel_profile_created': True,
                'welcome_message': welcome_message,
                'interaction_level': mel_level,
                'next_stage': 'portal_tour'
            }
            
        except Exception as e:
            self.logger.error(f"M.E.L. AI setup failed: {str(e)}")
            raise

    async def complete_onboarding(self, onboarding_token: str) -> Dict[str, Any]:
        """Complete the onboarding process."""
        try:
            profile = self.active_onboardings.get(onboarding_token)
            if not profile:
                raise ValueError("Invalid onboarding token")
            
            # Mark onboarding as complete
            profile.completed_stages.append(OnboardingStage.ONBOARDING_COMPLETE)
            profile.current_stage = OnboardingStage.ONBOARDING_COMPLETE
            profile.progress_percentage = 100.0
            profile.completed_at = datetime.utcnow()
            
            # Move to completed onboardings
            self.completed_onboardings[profile.user_id] = profile
            del self.active_onboardings[onboarding_token]
            
            # Send completion notification and rewards
            await self._send_onboarding_completion_rewards(profile)
            
            # Setup user's dashboard with personalized content
            dashboard_setup = await self._setup_personalized_dashboard(profile)
            
            # Create user session for immediate login
            session_token = await self._create_onboarding_session(profile)
            
            await self.metrics.record_event("onboarding_completed", {
                "user_id": profile.user_id,
                "user_type": profile.user_type.value,
                "subscription_tier": profile.subscription_tier.value,
                "duration_minutes": (profile.completed_at - profile.started_at).total_seconds() / 60,
                "specializations_count": len(profile.triangle_defense_specialization)
            })
            
            return {
                'onboarding_completed': True,
                'user_id': profile.user_id,
                'session_token': session_token,
                'dashboard_config': dashboard_setup,
                'subscription_tier': profile.subscription_tier.value,
                'specializations': [f.value for f in profile.triangle_defense_specialization],
                'welcome_rewards': self._get_completion_rewards(profile)
            }
            
        except Exception as e:
            self.logger.error(f"Onboarding completion failed: {str(e)}")
            raise

    async def _create_test_accounts(self) -> None:
        """Create 5 comprehensive test accounts for development and demo."""
        test_account_configs = [
            {
                'account_id': 'test_head_coach',
                'email': 'test.headcoach@analyzemyteam.dev',
                'username': 'test.headcoach',
                'password': 'TestCoach2025!',
                'user_type': UserType.HEAD_COACH,
                'subscription_tier': SubscriptionTier.PROFESSIONAL,
                'profile_data': {
                    'first_name': 'Mike',
                    'last_name': 'Johnson',
                    'organization': 'State University Tigers',
                    'experience_level': 'advanced',
                    'coaching_years': 15,
                    'team_level': 'college'
                },
                'specializations': [FormationType.LARRY, FormationType.LINDA, FormationType.RICKY],
                'demo_data_enabled': True,
                'description': 'Head coach with professional subscription, advanced Triangle Defense knowledge'
            },
            {
                'account_id': 'test_defensive_coord',
                'email': 'test.defcoord@analyzemyteam.dev', 
                'username': 'test.defcoord',
                'password': 'DefCoord2025!',
                'user_type': UserType.DEFENSIVE_COORDINATOR,
                'subscription_tier': SubscriptionTier.PROFESSIONAL,
                'profile_data': {
                    'first_name': 'Sarah',
                    'last_name': 'Williams',
                    'organization': 'Metro High School Eagles',
                    'experience_level': 'expert',
                    'coaching_years': 12,
                    'team_level': 'high_school'
                },
                'specializations': list(FormationType),  # All formations
                'demo_data_enabled': True,
                'description': 'Defensive coordinator expert with full Triangle Defense access'
            },
            {
                'account_id': 'test_analyst',
                'email': 'test.analyst@analyzemyteam.dev',
                'username': 'test.analyst', 
                'password': 'Analyst2025!',
                'user_type': UserType.ANALYST,
                'subscription_tier': SubscriptionTier.BASIC,
                'profile_data': {
                    'first_name': 'David',
                    'last_name': 'Chen',
                    'organization': 'Sports Analytics Pro',
                    'experience_level': 'intermediate',
                    'analytics_focus': 'defensive_performance',
                    'tools_experience': ['excel', 'python', 'tableau']
                },
                'specializations': [FormationType.LARRY, FormationType.LINDA],
                'demo_data_enabled': True,
                'description': 'Sports analyst with basic subscription, focused on defensive analytics'
            },
            {
                'account_id': 'test_developer',
                'email': 'test.developer@analyzemyteam.dev',
                'username': 'test.developer',
                'password': 'DevTest2025!',
                'user_type': UserType.DEVELOPER,
                'subscription_tier': SubscriptionTier.DEVELOPER,
                'profile_data': {
                    'first_name': 'Alex',
                    'last_name': 'Rodriguez',
                    'organization': 'TechSport Solutions',
                    'experience_level': 'advanced',
                    'programming_languages': ['python', 'javascript', 'react'],
                    'integration_focus': 'api_development'
                },
                'specializations': [],  # Developers focus on technical integration
                'demo_data_enabled': True,
                'description': 'Developer account with full API access and technical documentation'
            },
            {
                'account_id': 'test_trial_user',
                'email': 'test.trial@analyzemyteam.dev',
                'username': 'test.trial',
                'password': 'Trial2025!',
                'user_type': UserType.TRIAL_USER,
                'subscription_tier': SubscriptionTier.TRIAL,
                'profile_data': {
                    'first_name': 'Jordan',
                    'last_name': 'Smith',
                    'organization': 'Local Youth League',
                    'experience_level': 'beginner',
                    'coaching_years': 2,
                    'team_level': 'youth'
                },
                'specializations': [FormationType.LARRY],  # Limited trial access
                'demo_data_enabled': True,
                'description': 'Trial user with limited access, perfect for onboarding demos'
            }
        ]
        
        for config in test_account_configs:
            try:
                test_account = TestAccount(**config)
                self.test_accounts[config['account_id']] = test_account
                
                # Actually create the user in the system
                user_id = await self.user_management.create_user(
                    email=config['email'],
                    username=config['username'],
                    first_name=config['profile_data']['first_name'],
                    last_name=config['profile_data']['last_name'],
                    role=self._map_user_type_to_role(config['user_type']),
                    password=config['password'],
                    send_welcome_email=False
                )
                
                # Update user with additional profile data
                user = self.user_management.users[user_id]
                user.profile_data.update(config['profile_data'])
                user.triangle_defense_specializations = [f.value for f in config['specializations']]
                user.preferences['subscription_tier'] = config['subscription_tier'].value
                user.preferences['demo_data_enabled'] = config['demo_data_enabled']
                
                self.logger.info(f"Created test account: {config['email']}")
                
            except Exception as e:
                self.logger.error(f"Failed to create test account {config['account_id']}: {str(e)}")

    def _map_user_type_to_role(self, user_type: UserType) -> UserRole:
        """Map onboarding user type to system user role."""
        mapping = {
            UserType.HEAD_COACH: UserRole.FOOTBALL_OPERATIONS,
            UserType.ASSISTANT_COACH: UserRole.FOOTBALL_OPERATIONS,
            UserType.DEFENSIVE_COORDINATOR: UserRole.FOOTBALL_OPERATIONS,
            UserType.ANALYST: UserRole.INNOVATION_DIVISION,
            UserType.ATHLETIC_DIRECTOR: UserRole.STRATEGIC_LEADERSHIP,
            UserType.PLAYER_DEVELOPMENT: UserRole.FOOTBALL_OPERATIONS,
            UserType.RECRUITER: UserRole.FOOTBALL_OPERATIONS,
            UserType.ADMINISTRATOR: UserRole.ADVISORY_COUNCIL,
            UserType.DEVELOPER: UserRole.INNOVATION_DIVISION,
            UserType.TRIAL_USER: UserRole.FOOTBALL_OPERATIONS
        }
        return mapping.get(user_type, UserRole.FOOTBALL_OPERATIONS)

    async def _proceed_to_email_verification(self, profile: OnboardingProfile) -> None:
        """Send email verification code."""
        try:
            # Generate 6-digit verification code
            verification_code = f"{secrets.randbelow(900000) + 100000:06d}"
            self.verification_codes[profile.email] = verification_code
            
            # Send verification email
            await self._send_verification_email(profile.email, verification_code)
            
        except Exception as e:
            self.logger.error(f"Email verification setup failed: {str(e)}")

    async def _create_user_account(self, profile: OnboardingProfile) -> None:
        """Create the actual user account in the system."""
        try:
            # Generate temporary password (user will set their own)
            temp_password = secrets.token_urlsafe(12)
            
            user_id = await self.user_management.create_user(
                email=profile.email,
                username=profile.email.split('@')[0],  # Use email prefix as username
                first_name=profile.profile_data.get('first_name', ''),
                last_name=profile.profile_data.get('last_name', ''),
                role=self._map_user_type_to_role(profile.user_type),
                password=temp_password,
                send_welcome_email=False
            )
            
            # Update user with onboarding-specific data
            user = self.user_management.users[user_id]
            user.profile_data.update(profile.profile_data)
            user.preferences.update(profile.preferences)
            user.triangle_defense_specializations = [f.value for f in profile.triangle_defense_specialization]
            user.mel_ai_interaction_level = profile.mel_ai_interaction_level
            
            # Store user ID in profile
            profile.user_id = user_id
            
        except Exception as e:
            self.logger.error(f"User account creation failed: {str(e)}")
            raise

    async def get_test_accounts(self) -> Dict[str, Dict[str, Any]]:
        """Get all test accounts for development use."""
        return {
            account_id: {
                'email': account.email,
                'username': account.username,
                'password': account.password,
                'user_type': account.user_type.value,
                'subscription_tier': account.subscription_tier.value,
                'profile_data': account.profile_data,
                'specializations': [f.value for f in account.specializations],
                'description': account.description
            }
            for account_id, account in self.test_accounts.items()
        }

    async def get_onboarding_status(self) -> Dict[str, Any]:
        """Get current onboarding system status."""
        return {
            "system_initialized": bool(self.test_accounts),
            "active_onboardings": len(self.active_onboardings),
            "completed_onboardings": len(self.completed_onboardings),
            "test_accounts_created": len(self.test_accounts),
            "email_templates": len(self.email_templates),
            "subscription_tiers": [tier.value for tier in SubscriptionTier],
            "user_types": [user_type.value for user_type in UserType],
            "onboarding_stages": [stage.value for stage in OnboardingStage],
            "test_accounts": await self.get_test_accounts()
        }


# Export main class
__all__ = [
    'UserOnboardingSystem',
    'OnboardingProfile',
    'TestAccount', 
    'OnboardingStage',
    'UserType',
    'SubscriptionTier'
]
