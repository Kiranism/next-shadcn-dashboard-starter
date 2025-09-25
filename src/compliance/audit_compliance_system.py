"""
AMT Orchestration Platform - Audit and Compliance System
File 39 of 47

Comprehensive audit and compliance system providing regulatory adherence, complete
audit trail management, data privacy controls, FERPA/GDPR compliance, sports
industry regulation compliance, ML model decision auditing, and automated
compliance reporting for the AMT Platform ecosystem.

Author: AMT Development Team
Created: 2025-09-25
"""

import asyncio
import logging
import json
import hashlib
import hmac
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union, Set, Tuple
from dataclasses import dataclass, field
from enum import Enum
import uuid
import re

# Compliance and encryption
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64

# Database and storage
import asyncpg
import aiofiles
from sqlalchemy.ext.asyncio import AsyncSession

# Platform imports
from ..shared.orchestration_protocol import FormationType, TaskStatus, BotType
from ..orchestration.orchestration_service import OrchestrationService
from ..ml.triangle_defense_optimizer import TriangleDefenseOptimizer
from ..user_management.enterprise_user_management import EnterpriseUserManagement, UserRole
from ..security.security_manager import SecurityManager
from ..monitoring.metrics_collector import MetricsCollector
from ..integrations.mel_engine_integration import MELEngineIntegration
from ..content.content_management_system import ContentManagementSystem
from ..search.advanced_search_system import AdvancedSearchSystem
from ..reporting.advanced_reporting_system import AdvancedReportingSystem


class AuditEventType(Enum):
    """Types of auditable events in the AMT system."""
    USER_LOGIN = "user_login"
    USER_LOGOUT = "user_logout"
    USER_CREATED = "user_created"
    USER_UPDATED = "user_updated"
    USER_DELETED = "user_deleted"
    PERMISSION_GRANTED = "permission_granted"
    PERMISSION_REVOKED = "permission_revoked"
    FORMATION_OPTIMIZED = "formation_optimized"
    MEL_INTERACTION = "mel_interaction"
    CONTENT_CREATED = "content_created"
    CONTENT_UPDATED = "content_updated"
    CONTENT_DELETED = "content_deleted"
    CONTENT_SHARED = "content_shared"
    DATA_EXPORTED = "data_exported"
    DATA_IMPORTED = "data_imported"
    SYSTEM_CONFIGURATION_CHANGED = "system_configuration_changed"
    BACKUP_CREATED = "backup_created"
    BACKUP_RESTORED = "backup_restored"
    API_ACCESS = "api_access"
    SEARCH_PERFORMED = "search_performed"
    REPORT_GENERATED = "report_generated"
    WORKFLOW_EXECUTED = "workflow_executed"
    SECURITY_EVENT = "security_event"
    DATA_RETENTION_ACTION = "data_retention_action"
    COMPLIANCE_CHECK = "compliance_check"


class ComplianceFramework(Enum):
    """Supported compliance frameworks."""
    FERPA = "ferpa"  # Family Educational Rights and Privacy Act
    GDPR = "gdpr"  # General Data Protection Regulation
    CCPA = "ccpa"  # California Consumer Privacy Act
    HIPAA = "hipaa"  # Health Insurance Portability and Accountability Act
    SOX = "sox"  # Sarbanes-Oxley Act
    NCAA = "ncaa"  # NCAA compliance
    NFHS = "nfhs"  # National Federation of State High School Associations
    ISO27001 = "iso27001"  # Information Security Management
    SOC2 = "soc2"  # Service Organization Control 2


class DataClassification(Enum):
    """Data classification levels for compliance."""
    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    RESTRICTED = "restricted"
    PII = "personally_identifiable_information"
    EDUCATIONAL_RECORD = "educational_record"
    FINANCIAL = "financial"
    HEALTH = "health_information"


class AuditSeverity(Enum):
    """Audit event severity levels."""
    INFO = "info"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class AuditEvent:
    """Comprehensive audit event record."""
    event_id: str
    event_type: AuditEventType
    severity: AuditSeverity
    timestamp: datetime
    user_id: Optional[str]
    session_id: Optional[str]
    ip_address: Optional[str]
    user_agent: Optional[str]
    resource_type: str
    resource_id: Optional[str]
    action_performed: str
    result: str  # success, failure, partial
    details: Dict[str, Any]
    data_before: Optional[Dict[str, Any]]
    data_after: Optional[Dict[str, Any]]
    compliance_frameworks: List[ComplianceFramework] = field(default_factory=list)
    data_classification: Optional[DataClassification] = None
    retention_date: Optional[datetime] = None
    encrypted_data: Optional[str] = None
    checksum: str = ""


@dataclass
class ComplianceRule:
    """Compliance rule definition."""
    rule_id: str
    name: str
    description: str
    framework: ComplianceFramework
    rule_type: str  # access_control, data_retention, audit_requirement, etc.
    conditions: List[Dict[str, Any]]
    actions: List[Dict[str, Any]]
    is_active: bool = True
    severity: AuditSeverity = AuditSeverity.MEDIUM
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class DataRetentionPolicy:
    """Data retention policy configuration."""
    policy_id: str
    name: str
    description: str
    data_types: List[str]
    retention_period_days: int
    deletion_method: str  # secure_delete, anonymize, archive
    compliance_frameworks: List[ComplianceFramework]
    is_active: bool = True
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_applied: Optional[datetime] = None


@dataclass
class ComplianceReport:
    """Compliance assessment report."""
    report_id: str
    framework: ComplianceFramework
    assessment_date: datetime
    compliance_score: float  # 0.0 to 1.0
    compliant_controls: int
    total_controls: int
    violations: List[Dict[str, Any]]
    recommendations: List[str]
    risk_level: str
    next_assessment_due: datetime
    assessor: str


@dataclass
class PrivacyRequest:
    """Data privacy request (GDPR Article 17, CCPA, etc.)."""
    request_id: str
    request_type: str  # access, delete, portability, correction
    user_id: str
    requested_by: str
    request_date: datetime
    status: str  # pending, processing, completed, rejected
    completion_date: Optional[datetime] = None
    verification_method: str = ""
    data_exported: Optional[str] = None
    deletion_confirmation: Optional[str] = None
    rejection_reason: Optional[str] = None


class AuditComplianceSystem:
    """
    Comprehensive Audit and Compliance System for AMT Platform.
    
    Provides enterprise-grade compliance management including:
    - Complete audit trail for all system activities
    - FERPA compliance for educational institutions
    - GDPR/CCPA data privacy controls and reporting
    - Sports industry regulation compliance (NCAA, NFHS)
    - ML model decision auditing and explainability
    - Data retention policy enforcement
    - Automated compliance monitoring and alerting
    - Privacy request handling and fulfillment
    - Compliance reporting and dashboard
    - Data classification and handling controls
    - Encryption and secure data storage
    - Audit log integrity verification
    - Regulatory change management
    """

    def __init__(
        self,
        orchestration_service: OrchestrationService,
        ml_optimizer: TriangleDefenseOptimizer,
        user_management: EnterpriseUserManagement,
        mel_engine: MELEngineIntegration,
        content_management: ContentManagementSystem,
        search_system: AdvancedSearchSystem,
        reporting_system: AdvancedReportingSystem,
        security_manager: SecurityManager,
        metrics_collector: MetricsCollector
    ):
        self.orchestration = orchestration_service
        self.ml_optimizer = ml_optimizer
        self.user_management = user_management
        self.mel_engine = mel_engine
        self.content_management = content_management
        self.search_system = search_system
        self.reporting = reporting_system
        self.security = security_manager
        self.metrics = metrics_collector
        
        self.logger = logging.getLogger(__name__)
        
        # Audit storage
        self.audit_events: List[AuditEvent] = []
        self.compliance_rules: Dict[str, ComplianceRule] = {}
        self.retention_policies: Dict[str, DataRetentionPolicy] = {}
        self.compliance_reports: Dict[str, ComplianceReport] = {}
        self.privacy_requests: Dict[str, PrivacyRequest] = {}
        
        # Encryption for sensitive audit data
        self.encryption_key: Optional[bytes] = None
        self.audit_cipher: Optional[Fernet] = None
        
        # AMT-specific compliance configuration
        self.amt_config = {
            'applicable_frameworks': [
                ComplianceFramework.FERPA,  # Educational institutions
                ComplianceFramework.GDPR,   # Global privacy
                ComplianceFramework.CCPA,   # California privacy
                ComplianceFramework.NCAA,   # College athletics
                ComplianceFramework.SOC2    # Service organization
            ],
            'data_classifications': {
                'user_profiles': DataClassification.PII,
                'educational_records': DataClassification.EDUCATIONAL_RECORD,
                'coaching_content': DataClassification.CONFIDENTIAL,
                'formation_data': DataClassification.INTERNAL,
                'mel_interactions': DataClassification.CONFIDENTIAL,
                'performance_analytics': DataClassification.INTERNAL,
                'system_logs': DataClassification.INTERNAL
            },
            'retention_periods': {
                DataClassification.PII: 2555,  # 7 years in days
                DataClassification.EDUCATIONAL_RECORD: 1825,  # 5 years
                DataClassification.CONFIDENTIAL: 1095,  # 3 years
                DataClassification.INTERNAL: 365,  # 1 year
                DataClassification.PUBLIC: 0  # No retention limit
            },
            'high_risk_events': [
                AuditEventType.USER_DELETED,
                AuditEventType.DATA_EXPORTED,
                AuditEventType.PERMISSION_GRANTED,
                AuditEventType.SYSTEM_CONFIGURATION_CHANGED,
                AuditEventType.BACKUP_RESTORED
            ]
        }
        
        # System configuration
        self.config = {
            'audit_storage_path': './audit_logs',
            'encrypted_storage_enabled': True,
            'real_time_monitoring': True,
            'compliance_check_interval_hours': 24,
            'audit_log_rotation_days': 90,
            'privacy_request_sla_days': 30,
            'compliance_assessment_frequency_days': 90,
            'data_retention_check_frequency_hours': 168  # Weekly
        }

    async def initialize(self) -> bool:
        """Initialize the audit and compliance system."""
        try:
            self.logger.info("Initializing Audit and Compliance System...")
            
            # Setup encryption for sensitive data
            await self._setup_audit_encryption()
            
            # Create audit storage directories
            await self._setup_audit_storage()
            
            # Load compliance rules
            await self._setup_compliance_rules()
            
            # Setup data retention policies
            await self._setup_retention_policies()
            
            # Start compliance monitoring
            await self._start_compliance_monitoring()
            
            # Perform initial compliance assessment
            await self._perform_initial_compliance_assessment()
            
            self.logger.info("Audit and Compliance System initialized successfully")
            await self.metrics.record_event("audit_compliance_system_initialized", {
                "applicable_frameworks": [f.value for f in self.amt_config['applicable_frameworks']],
                "compliance_rules": len(self.compliance_rules),
                "retention_policies": len(self.retention_policies)
            })
            
            return True
            
        except Exception as e:
            self.logger.error(f"Audit and Compliance System initialization failed: {str(e)}")
            return False

    async def log_audit_event(
        self,
        event_type: AuditEventType,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        resource_type: str = "",
        resource_id: Optional[str] = None,
        action_performed: str = "",
        result: str = "success",
        details: Optional[Dict[str, Any]] = None,
        data_before: Optional[Dict[str, Any]] = None,
        data_after: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> str:
        """Log comprehensive audit event."""
        try:
            event_id = str(uuid.uuid4())
            
            # Determine compliance frameworks applicable
            applicable_frameworks = await self._determine_applicable_frameworks(
                event_type, resource_type, details
            )
            
            # Classify data sensitivity
            data_classification = self._classify_data_sensitivity(resource_type, details)
            
            # Determine event severity
            severity = self._determine_event_severity(event_type, result, details)
            
            # Calculate retention date
            retention_date = await self._calculate_retention_date(data_classification, event_type)
            
            # Create audit event
            audit_event = AuditEvent(
                event_id=event_id,
                event_type=event_type,
                severity=severity,
                timestamp=datetime.utcnow(),
                user_id=user_id,
                session_id=session_id,
                ip_address=ip_address,
                user_agent=user_agent,
                resource_type=resource_type,
                resource_id=resource_id,
                action_performed=action_performed,
                result=result,
                details=details or {},
                data_before=data_before,
                data_after=data_after,
                compliance_frameworks=applicable_frameworks,
                data_classification=data_classification,
                retention_date=retention_date
            )
            
            # Encrypt sensitive data if required
            if self._requires_encryption(data_classification, severity):
                audit_event = await self._encrypt_audit_event(audit_event)
            
            # Generate integrity checksum
            audit_event.checksum = await self._generate_audit_checksum(audit_event)
            
            # Store audit event
            self.audit_events.append(audit_event)
            
            # Persist to storage
            await self._persist_audit_event(audit_event)
            
            # Real-time compliance monitoring
            if self.config['real_time_monitoring']:
                await self._check_compliance_violations(audit_event)
            
            # Alert on high-severity events
            if severity in [AuditSeverity.HIGH, AuditSeverity.CRITICAL]:
                await self._send_compliance_alert(audit_event)
            
            return event_id
            
        except Exception as e:
            self.logger.error(f"Audit event logging failed: {str(e)}")
            return ""

    async def track_ml_decision(
        self,
        model_name: str,
        input_data: Dict[str, Any],
        prediction: Any,
        confidence: float,
        user_id: Optional[str] = None,
        formation_context: Optional[FormationType] = None
    ) -> str:
        """Track ML model decisions for compliance and explainability."""
        try:
            # Create ML-specific audit details
            ml_details = {
                'model_name': model_name,
                'input_features': input_data,
                'prediction': str(prediction),
                'confidence_score': confidence,
                'formation_context': formation_context.value if formation_context else None,
                'model_version': await self._get_model_version(model_name),
                'training_data_version': await self._get_training_data_version(model_name),
                'decision_timestamp': datetime.utcnow().isoformat(),
                'explainability_data': await self._generate_decision_explanation(
                    model_name, input_data, prediction
                )
            }
            
            return await self.log_audit_event(
                event_type=AuditEventType.FORMATION_OPTIMIZED,
                user_id=user_id,
                resource_type="ml_model",
                resource_id=model_name,
                action_performed="prediction",
                result="success",
                details=ml_details
            )
            
        except Exception as e:
            self.logger.error(f"ML decision tracking failed: {str(e)}")
            return ""

    async def handle_privacy_request(
        self,
        request_type: str,
        user_id: str,
        requested_by: str,
        verification_method: str = "email"
    ) -> str:
        """Handle data privacy request (GDPR Article 17, CCPA, etc.)."""
        try:
            request_id = str(uuid.uuid4())
            
            # Create privacy request record
            privacy_request = PrivacyRequest(
                request_id=request_id,
                request_type=request_type,
                user_id=user_id,
                requested_by=requested_by,
                request_date=datetime.utcnow(),
                status="pending",
                verification_method=verification_method
            )
            
            self.privacy_requests[request_id] = privacy_request
            
            # Log audit event
            await self.log_audit_event(
                event_type=AuditEventType.DATA_EXPORTED if request_type == "access" else AuditEventType.DATA_RETENTION_ACTION,
                user_id=requested_by,
                resource_type="privacy_request",
                resource_id=request_id,
                action_performed=f"privacy_request_{request_type}",
                details={
                    'request_type': request_type,
                    'target_user_id': user_id,
                    'verification_method': verification_method
                }
            )
            
            # Process request based on type
            if request_type == "access":
                await self._process_data_access_request(request_id)
            elif request_type == "delete":
                await self._process_data_deletion_request(request_id)
            elif request_type == "portability":
                await self._process_data_portability_request(request_id)
            elif request_type == "correction":
                await self._process_data_correction_request(request_id)
            
            await self.metrics.record_event("privacy_request_created", {
                "request_id": request_id,
                "request_type": request_type,
                "user_id": user_id
            })
            
            return request_id
            
        except Exception as e:
            self.logger.error(f"Privacy request handling failed: {str(e)}")
            raise

    async def generate_compliance_report(
        self,
        framework: ComplianceFramework,
        report_period: Tuple[datetime, datetime],
        requested_by: str
    ) -> str:
        """Generate comprehensive compliance report."""
        try:
            report_id = str(uuid.uuid4())
            start_date, end_date = report_period
            
            # Collect compliance data
            compliance_data = await self._collect_compliance_data(framework, start_date, end_date)
            
            # Assess compliance score
            compliance_score = await self._calculate_compliance_score(framework, compliance_data)
            
            # Identify violations
            violations = await self._identify_compliance_violations(framework, compliance_data)
            
            # Generate recommendations
            recommendations = await self._generate_compliance_recommendations(framework, violations)
            
            # Calculate risk level
            risk_level = await self._assess_compliance_risk(compliance_score, violations)
            
            # Create compliance report
            report = ComplianceReport(
                report_id=report_id,
                framework=framework,
                assessment_date=datetime.utcnow(),
                compliance_score=compliance_score,
                compliant_controls=compliance_data.get('compliant_controls', 0),
                total_controls=compliance_data.get('total_controls', 0),
                violations=violations,
                recommendations=recommendations,
                risk_level=risk_level,
                next_assessment_due=datetime.utcnow() + timedelta(days=self.config['compliance_assessment_frequency_days']),
                assessor=requested_by
            )
            
            self.compliance_reports[report_id] = report
            
            # Log audit event
            await self.log_audit_event(
                event_type=AuditEventType.COMPLIANCE_CHECK,
                user_id=requested_by,
                resource_type="compliance_report",
                resource_id=report_id,
                action_performed="generate_compliance_report",
                details={
                    'framework': framework.value,
                    'compliance_score': compliance_score,
                    'violations_count': len(violations),
                    'risk_level': risk_level
                }
            )
            
            await self.metrics.record_event("compliance_report_generated", {
                "report_id": report_id,
                "framework": framework.value,
                "compliance_score": compliance_score,
                "violations_count": len(violations)
            })
            
            return report_id
            
        except Exception as e:
            self.logger.error(f"Compliance report generation failed: {str(e)}")
            raise

    async def enforce_data_retention(self) -> Dict[str, Any]:
        """Enforce data retention policies across the platform."""
        try:
            self.logger.info("Starting data retention enforcement...")
            
            enforcement_results = {
                'policies_evaluated': 0,
                'records_processed': 0,
                'records_deleted': 0,
                'records_anonymized': 0,
                'records_archived': 0,
                'errors': []
            }
            
            current_time = datetime.utcnow()
            
            # Process each retention policy
            for policy_id, policy in self.retention_policies.items():
                if not policy.is_active:
                    continue
                
                enforcement_results['policies_evaluated'] += 1
                
                try:
                    # Find records subject to this policy
                    eligible_records = await self._find_records_for_retention(policy, current_time)
                    enforcement_results['records_processed'] += len(eligible_records)
                    
                    # Apply retention actions
                    for record in eligible_records:
                        if policy.deletion_method == "secure_delete":
                            await self._secure_delete_record(record)
                            enforcement_results['records_deleted'] += 1
                        elif policy.deletion_method == "anonymize":
                            await self._anonymize_record(record)
                            enforcement_results['records_anonymized'] += 1
                        elif policy.deletion_method == "archive":
                            await self._archive_record(record)
                            enforcement_results['records_archived'] += 1
                        
                        # Log retention action
                        await self.log_audit_event(
                            event_type=AuditEventType.DATA_RETENTION_ACTION,
                            resource_type=record.get('type', 'unknown'),
                            resource_id=record.get('id'),
                            action_performed=policy.deletion_method,
                            details={
                                'policy_id': policy_id,
                                'retention_period_days': policy.retention_period_days,
                                'frameworks': [f.value for f in policy.compliance_frameworks]
                            }
                        )
                    
                    # Update policy last applied timestamp
                    policy.last_applied = current_time
                    
                except Exception as e:
                    error_msg = f"Policy {policy_id} enforcement failed: {str(e)}"
                    enforcement_results['errors'].append(error_msg)
                    self.logger.error(error_msg)
            
            # Log overall retention enforcement
            await self.log_audit_event(
                event_type=AuditEventType.DATA_RETENTION_ACTION,
                resource_type="data_retention_system",
                action_performed="enforce_retention_policies",
                details=enforcement_results
            )
            
            await self.metrics.record_event("data_retention_enforced", enforcement_results)
            
            self.logger.info(f"Data retention enforcement completed: {enforcement_results}")
            return enforcement_results
            
        except Exception as e:
            self.logger.error(f"Data retention enforcement failed: {str(e)}")
            return {"error": str(e)}

    # Private helper methods

    async def _setup_audit_encryption(self) -> None:
        """Setup encryption for sensitive audit data."""
        try:
            # Generate encryption key for audit data
            password = b"AMT_AUDIT_ENCRYPTION_KEY"  # In production, use secure key management
            salt = b'salt_for_amt_audit_system_2025'
            
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
            )
            
            self.encryption_key = base64.urlsafe_b64encode(kdf.derive(password))
            self.audit_cipher = Fernet(self.encryption_key)
            
            self.logger.info("Audit encryption initialized")
            
        except Exception as e:
            self.logger.error(f"Audit encryption setup failed: {str(e)}")

    async def _setup_compliance_rules(self) -> None:
        """Setup compliance rules for different frameworks."""
        
        # FERPA rules
        ferpa_rules = [
            ComplianceRule(
                rule_id="ferpa_01",
                name="Educational Record Access Control",
                description="Only authorized users can access educational records",
                framework=ComplianceFramework.FERPA,
                rule_type="access_control",
                conditions=[{"resource_type": "educational_record"}],
                actions=[{"require_explicit_consent": True, "log_access": True}],
                severity=AuditSeverity.HIGH
            ),
            ComplianceRule(
                rule_id="ferpa_02", 
                name="Directory Information Disclosure",
                description="Directory information can only be disclosed with proper authorization",
                framework=ComplianceFramework.FERPA,
                rule_type="data_disclosure",
                conditions=[{"data_type": "directory_information"}],
                actions=[{"require_authorization": True, "audit_disclosure": True}],
                severity=AuditSeverity.MEDIUM
            )
        ]
        
        # GDPR rules
        gdpr_rules = [
            ComplianceRule(
                rule_id="gdpr_01",
                name="Data Processing Lawful Basis",
                description="All personal data processing must have lawful basis",
                framework=ComplianceFramework.GDPR,
                rule_type="data_processing",
                conditions=[{"data_classification": "PII"}],
                actions=[{"verify_lawful_basis": True, "document_purpose": True}],
                severity=AuditSeverity.CRITICAL
            ),
            ComplianceRule(
                rule_id="gdpr_02",
                name="Right to be Forgotten",
                description="Individuals have right to request data deletion",
                framework=ComplianceFramework.GDPR,
                rule_type="data_deletion",
                conditions=[{"request_type": "delete"}],
                actions=[{"process_within_30_days": True, "confirm_deletion": True}],
                severity=AuditSeverity.HIGH
            )
        ]
        
        # NCAA rules
        ncaa_rules = [
            ComplianceRule(
                rule_id="ncaa_01",
                name="Student-Athlete Privacy",
                description="Student-athlete information must be protected",
                framework=ComplianceFramework.NCAA,
                rule_type="privacy_protection",
                conditions=[{"user_type": "student_athlete"}],
                actions=[{"restrict_access": True, "audit_all_access": True}],
                severity=AuditSeverity.HIGH
            )
        ]
        
        # Store all rules
        all_rules = ferpa_rules + gdpr_rules + ncaa_rules
        for rule in all_rules:
            self.compliance_rules[rule.rule_id] = rule

    async def _setup_retention_policies(self) -> None:
        """Setup data retention policies based on compliance requirements."""
        
        retention_policies = [
            DataRetentionPolicy(
                policy_id="retention_pii",
                name="Personal Information Retention",
                description="Retention policy for personally identifiable information",
                data_types=["user_profile", "contact_information"],
                retention_period_days=self.amt_config['retention_periods'][DataClassification.PII],
                deletion_method="secure_delete",
                compliance_frameworks=[ComplianceFramework.GDPR, ComplianceFramework.CCPA]
            ),
            DataRetentionPolicy(
                policy_id="retention_educational",
                name="Educational Records Retention",
                description="Retention policy for educational records per FERPA",
                data_types=["educational_record", "academic_performance"],
                retention_period_days=self.amt_config['retention_periods'][DataClassification.EDUCATIONAL_RECORD],
                deletion_method="archive",
                compliance_frameworks=[ComplianceFramework.FERPA]
            ),
            DataRetentionPolicy(
                policy_id="retention_coaching",
                name="Coaching Content Retention",
                description="Retention policy for coaching and training materials",
                data_types=["coaching_content", "formation_data", "playbooks"],
                retention_period_days=self.amt_config['retention_periods'][DataClassification.CONFIDENTIAL],
                deletion_method="archive",
                compliance_frameworks=[ComplianceFramework.SOC2]
            ),
            DataRetentionPolicy(
                policy_id="retention_audit",
                name="Audit Log Retention",
                description="Retention policy for audit and security logs",
                data_types=["audit_event", "security_log"],
                retention_period_days=2555,  # 7 years for audit logs
                deletion_method="secure_delete",
                compliance_frameworks=[ComplianceFramework.SOX, ComplianceFramework.SOC2]
            )
        ]
        
        for policy in retention_policies:
            self.retention_policies[policy.policy_id] = policy

    async def _determine_applicable_frameworks(
        self,
        event_type: AuditEventType,
        resource_type: str,
        details: Optional[Dict[str, Any]]
    ) -> List[ComplianceFramework]:
        """Determine which compliance frameworks apply to an event."""
        try:
            applicable = []
            
            # Always include SOC2 for security and availability
            applicable.append(ComplianceFramework.SOC2)
            
            # FERPA for educational content
            if resource_type in ['educational_record', 'student_data', 'academic_performance']:
                applicable.append(ComplianceFramework.FERPA)
            
            # GDPR/CCPA for personal data
            if resource_type in ['user_profile', 'personal_information'] or \
               (details and 'user_id' in details):
                applicable.extend([ComplianceFramework.GDPR, ComplianceFramework.CCPA])
            
            # NCAA for student-athlete data
            if details and details.get('user_type') == 'student_athlete':
                applicable.append(ComplianceFramework.NCAA)
            
            # SOX for financial and system configuration
            if resource_type in ['financial_data', 'system_configuration']:
                applicable.append(ComplianceFramework.SOX)
            
            return list(set(applicable))  # Remove duplicates
            
        except Exception as e:
            self.logger.error(f"Framework determination failed: {str(e)}")
            return [ComplianceFramework.SOC2]  # Fallback

    def _classify_data_sensitivity(
        self,
        resource_type: str,
        details: Optional[Dict[str, Any]]
    ) -> DataClassification:
        """Classify data sensitivity level for compliance."""
        
        # Check AMT-specific classifications
        classification = self.amt_config['data_classifications'].get(resource_type)
        if classification:
            return classification
        
        # Fallback classification logic
        if resource_type in ['user_profile', 'contact_information']:
            return DataClassification.PII
        elif resource_type in ['educational_record', 'academic_performance']:
            return DataClassification.EDUCATIONAL_RECORD
        elif resource_type in ['financial_data', 'payment_information']:
            return DataClassification.FINANCIAL
        elif resource_type in ['coaching_content', 'formation_data']:
            return DataClassification.CONFIDENTIAL
        else:
            return DataClassification.INTERNAL

    def _determine_event_severity(
        self,
        event_type: AuditEventType,
        result: str,
        details: Optional[Dict[str, Any]]
    ) -> AuditSeverity:
        """Determine audit event severity."""
        
        # Critical events
        if event_type in [AuditEventType.USER_DELETED, AuditEventType.DATA_EXPORTED]:
            return AuditSeverity.CRITICAL
        
        # High-risk events
        if event_type in self.amt_config['high_risk_events']:
            return AuditSeverity.HIGH
        
        # Failed operations
        if result == "failure":
            return AuditSeverity.MEDIUM
        
        # Security events
        if event_type == AuditEventType.SECURITY_EVENT:
            return details.get('severity', AuditSeverity.MEDIUM) if details else AuditSeverity.MEDIUM
        
        # Default to info for routine operations
        return AuditSeverity.INFO

    async def get_audit_trail(
        self,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        user_id: Optional[str] = None,
        event_types: Optional[List[AuditEventType]] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Retrieve audit trail with filtering options."""
        try:
            filtered_events = []
            
            for event in self.audit_events:
                # Apply filters
                if resource_type and event.resource_type != resource_type:
                    continue
                
                if resource_id and event.resource_id != resource_id:
                    continue
                
                if user_id and event.user_id != user_id:
                    continue
                
                if event_types and event.event_type not in event_types:
                    continue
                
                if start_date and event.timestamp < start_date:
                    continue
                
                if end_date and event.timestamp > end_date:
                    continue
                
                # Decrypt if necessary (for authorized access)
                event_data = {
                    'event_id': event.event_id,
                    'event_type': event.event_type.value,
                    'severity': event.severity.value,
                    'timestamp': event.timestamp.isoformat(),
                    'user_id': event.user_id,
                    'resource_type': event.resource_type,
                    'resource_id': event.resource_id,
                    'action_performed': event.action_performed,
                    'result': event.result,
                    'details': event.details,
                    'compliance_frameworks': [f.value for f in event.compliance_frameworks],
                    'data_classification': event.data_classification.value if event.data_classification else None
                }
                
                filtered_events.append(event_data)
            
            # Sort by timestamp (most recent first) and apply limit
            filtered_events.sort(key=lambda x: x['timestamp'], reverse=True)
            return filtered_events[:limit]
            
        except Exception as e:
            self.logger.error(f"Audit trail retrieval failed: {str(e)}")
            return []

    async def get_compliance_status(self) -> Dict[str, Any]:
        """Get current audit and compliance system status."""
        try:
            # Calculate compliance scores for each framework
            framework_scores = {}
            for framework in self.amt_config['applicable_frameworks']:
                score = await self._calculate_current_compliance_score(framework)
                framework_scores[framework.value] = score
            
            # Get privacy request statistics
            privacy_stats = {
                'total_requests': len(self.privacy_requests),
                'pending_requests': len([r for r in self.privacy_requests.values() if r.status == 'pending']),
                'completed_requests': len([r for r in self.privacy_requests.values() if r.status == 'completed'])
            }
            
            # Get audit event statistics
            total_events = len(self.audit_events)
            recent_events = len([e for e in self.audit_events if e.timestamp > datetime.utcnow() - timedelta(days=7)])
            
            return {
                "system_initialized": bool(self.compliance_rules),
                "applicable_frameworks": [f.value for f in self.amt_config['applicable_frameworks']],
                "compliance_scores": framework_scores,
                "audit_events_total": total_events,
                "audit_events_recent_7_days": recent_events,
                "compliance_rules_active": len([r for r in self.compliance_rules.values() if r.is_active]),
                "retention_policies_active": len([p for p in self.retention_policies.values() if p.is_active]),
                "privacy_request_stats": privacy_stats,
                "compliance_reports_generated": len(self.compliance_reports),
                "encryption_enabled": self.config['encrypted_storage_enabled'],
                "real_time_monitoring": self.config['real_time_monitoring']
            }
            
        except Exception as e:
            self.logger.error(f"Compliance status retrieval failed: {str(e)}")
            return {"error": str(e)}


# Export main class
__all__ = [
    'AuditComplianceSystem',
    'AuditEvent',
    'ComplianceRule',
    'DataRetentionPolicy',
    'ComplianceReport',
    'PrivacyRequest',
    'AuditEventType',
    'ComplianceFramework',
    'DataClassification',
    'AuditSeverity'
]
