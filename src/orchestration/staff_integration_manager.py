"""
AMT Staff Integration Manager
Manages 25 championship professionals oversight and coordination
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Set
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum

from ..shared.orchestration_protocol import (
    BotType, TaskStatus, OrchestrationContext, KnowledgeUpdate
)

logger = logging.getLogger(__name__)

class StaffTier(str, Enum):
    """AMT organizational tiers"""
    FOUNDER = "founder"
    AI_CORE = "ai_core"  
    EXECUTIVE = "executive"
    STRATEGIC = "strategic"
    ADVISORY = "advisory"
    INNOVATION = "innovation"
    FOOTBALL = "football"

class OversightRole(str, Enum):
    """Types of staff oversight roles"""
    STRATEGIC_OVERSIGHT = "strategic_oversight"
    PROJECT_MANAGEMENT = "project_management"
    TECHNICAL_REVIEW = "technical_review"
    DESIGN_OVERSIGHT = "design_oversight"
    INFRASTRUCTURE_OVERSIGHT = "infrastructure_oversight"
    AI_COORDINATION = "ai_coordination"
    INNOVATION_OVERSIGHT = "innovation_oversight"
    SECURITY_REVIEW = "security_review"
    LEGAL_REVIEW = "legal_review"

@dataclass
class StaffMember:
    """AMT Staff member definition"""
    staff_id: str
    full_name: str
    nickname: str
    role_title: str
    department: str
    tier_level: StaffTier
    emergency_priority: int
    expertise_areas: List[str]
    authority_level: str
    succession_role: str
    background_education: str
    crisis_function: str
    status: str = "active"
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "staff_id": self.staff_id,
            "full_name": self.full_name,
            "nickname": self.nickname,
            "role_title": self.role_title,
            "department": self.department,
            "tier_level": self.tier_level,
            "emergency_priority": self.emergency_priority,
            "expertise_areas": self.expertise_areas,
            "authority_level": self.authority_level,
            "succession_role": self.succession_role,
            "crisis_function": self.crisis_function,
            "status": self.status
        }

class StaffIntegrationManager:
    """Manages AMT staff integration and oversight coordination"""
    
    def __init__(self):
        self.staff_registry = self._initialize_staff_registry()
        self.active_assignments: Dict[str, Dict[str, str]] = {}  # session_id -> oversight_assignments
        self.staff_availability: Dict[str, bool] = {}
        self.notification_channels: Dict[str, List[str]] = {}  # staff_id -> communication channels
        
        # Initialize staff availability
        for staff_id in self.staff_registry:
            self.staff_availability[staff_id] = True
    
    def _initialize_staff_registry(self) -> Dict[str, StaffMember]:
        """Initialize the 25 championship professionals registry"""
        
        staff_members = {
            # Tier 1: Founder Authority
            "denauld-brown": StaffMember(
                staff_id="denauld-brown",
                full_name="Denauld Brown",
                nickname="The Mastermind",
                role_title="Founder, CEO & Defensive Coordinator",
                department="Executive Leadership",
                tier_level=StaffTier.FOUNDER,
                emergency_priority=1,
                expertise_areas=["Triangle Defense Innovation", "Strategic Vision", "Leadership Excellence"],
                authority_level="Maximum (System Creator)",
                succession_role="Cannot be replaced (Founder status permanent)",
                background_education="All-American at Kutztown → NFL/NFL Europe → Division I DC → AI Innovation Pioneer",
                crisis_function="Ultimate authority and strategic guidance"
            ),
            
            # Tier 2: AI Core
            "mel-ai": StaffMember(
                staff_id="mel-ai",
                full_name="M.E.L.",
                nickname="The Digital Twin", 
                role_title="Master Intelligence Engine",
                department="AI Core",
                tier_level=StaffTier.AI_CORE,
                emergency_priority=2,
                expertise_areas=["Triangle Defense Mastery", "Coaching Intelligence", "System Coordination"],
                authority_level="Intelligence Distribution and Coordination",
                succession_role="Intelligence Operations Continuity",
                background_education="AI system embodying Denauld Brown's complete methodology",
                crisis_function="Maintains intelligence operations and coaching continuity"
            ),
            
            # Tier 3: Executive Command
            "courtney-sellars": StaffMember(
                staff_id="courtney-sellars",
                full_name="Courtney Sellars",
                nickname="The Shield",
                role_title="CEO / Acting Chief Legal Officer",
                department="Legal Strategy",
                tier_level=StaffTier.EXECUTIVE,
                emergency_priority=3,
                expertise_areas=["IP Protection", "Sports Law", "Business Contracts", "Compliance Excellence"],
                authority_level="Full Legal Autonomy with Override Power",
                succession_role="Emergency Operational Command (Alexandra unavailable)",
                background_education="Case Western (JD), Wake Forest (Psychology, Former Pharmaceutical Executive)",
                crisis_function="Legal protection and strategic legal intelligence"
            ),
            
            "alexandra-martinez": StaffMember(
                staff_id="alexandra-martinez",
                full_name="Alexandra Martinez",
                nickname="The Coordinator",
                role_title="Chief Administrative Officer",
                department="Mission Control",
                tier_level=StaffTier.EXECUTIVE,
                emergency_priority=4,
                expertise_areas=["Project Management", "Operations Excellence", "Innovation Coordination"],
                authority_level="Full Operational Autonomy with Emergency Command",
                succession_role="Emergency Operational Leadership (Victoria unavailable)",
                background_education="Harvard MBA + Stanford Engineering Management",
                crisis_function="Emergency operational leadership and mission control"
            ),
            
            # Tier 6: Innovation & Technical Operations (Key Technical Staff)
            "maya-patel": StaffMember(
                staff_id="maya-patel",
                full_name="Maya Patel",
                nickname="The Interface",
                role_title="Senior UX/UI Designer",
                department="Design Strategy",
                tier_level=StaffTier.INNOVATION,
                emergency_priority=16,
                expertise_areas=["UX/UI Design", "Design Systems", "Figma Integration", "Interface Optimization"],
                authority_level="User Experience and Interface Design",
                succession_role="User Experience Continuity Director",
                background_education="Stanford d.school (MS Design Innovation), Carnegie Mellon MHCI, RISD (MFA)",
                crisis_function="User experience and platform usability continuity"
            ),
            
            "rachel-foster": StaffMember(
                staff_id="rachel-foster",
                full_name="Dr. Rachel Foster",
                nickname="The Algorithm (AI)",
                role_title="Senior AI Research Scientist", 
                department="AI Research",
                tier_level=StaffTier.INNOVATION,
                emergency_priority=14,
                expertise_areas=["AI Development", "Neural Networks", "Algorithm Optimization", "ML Systems"],
                authority_level="AI Development and Machine Learning",
                succession_role="Acting Chief Technology Officer (Technical Crisis)",
                background_education="MIT PhD Computer Science (AI), Stanford MS (ML), Carnegie Mellon MS Robotics",
                crisis_function="AI system continuity and technical innovation"
            ),
            
            "jake-morrison": StaffMember(
                staff_id="jake-morrison",
                full_name="Jake Morrison",
                nickname="The Pipeline",
                role_title="Senior DevOps Engineer",
                department="Infrastructure Operations",
                tier_level=StaffTier.INNOVATION,
                emergency_priority=15,
                expertise_areas=["DevOps Excellence", "Infrastructure Management", "System Reliability", "CI/CD"],
                authority_level="Infrastructure Automation and System Reliability",
                succession_role="Infrastructure Continuity Director",
                background_education="Stanford MS Computer Science, UC Berkeley MEng, Georgia Tech BS Computer Engineering",
                crisis_function="Infrastructure continuity and system reliability"
            ),
            
            "david-kim": StaffMember(
                staff_id="david-kim", 
                full_name="Professor David Kim",
                nickname="The Architect (Innovation)",
                role_title="Chief Innovation Officer",
                department="Innovation Strategy",
                tier_level=StaffTier.INNOVATION,
                emergency_priority=13,
                expertise_areas=["R&D Strategy", "Competitive Intelligence", "Future Technology", "Innovation Management"],
                authority_level="R&D Strategy and Future Technology",
                succession_role="Innovation Continuity Director",
                background_education="MIT PhD Mechanical Engineering, Stanford MS Design Engineering, Carnegie Mellon MS",
                crisis_function="Innovation pipeline and competitive advantage maintenance"
            )
        }
        
        # Add remaining staff members (abbreviated for space)
        additional_staff = self._get_additional_staff_members()
        staff_members.update(additional_staff)
        
        return staff_members
    
    def _get_additional_staff_members(self) -> Dict[str, StaffMember]:
        """Get remaining AMT staff members (abbreviated definitions)"""
        
        return {
            # Tier 4: Strategic Leadership
            "marcus-sterling": StaffMember(
                "marcus-sterling", "Marcus Sterling", "The Architect", "General Manager",
                "Strategic Operations", StaffTier.STRATEGIC, 5,
                ["Strategic Planning", "Personnel Management", "Organizational Architecture"],
                "Strategic Operations and Personnel Decisions", "Emergency CEO (Tier 3 unavailable)",
                "Stanford MBA + MIT Systems Engineering, Former NFL linebacker",
                "Business continuity leadership and emergency CEO authority"
            ),
            
            "darius-washington": StaffMember(
                "darius-washington", "Darius Washington", "The Virtuoso", "Head Coach",
                "Football Operations", StaffTier.STRATEGIC, 6,
                ["Tactical Innovation", "Player Development", "Creative Leadership"],
                "Football Operations and Player Development", "Chief Operating Officer (Nuclear Protocol)",
                "Harvard Psychology + Northwestern Kellogg, Former college quarterback",
                "Operational execution leadership and football continuity"
            ),
            
            # Add more staff as needed - keeping abbreviated for space
            "dr-james-wright": StaffMember(
                "dr-james-wright", "Dr. James Wright", "The Algorithm", "Chief Data Officer",
                "Technology Strategy", StaffTier.STRATEGIC, 7,
                ["Statistical Intelligence", "Predictive Analytics", "AI Integration"],
                "Technology Strategy and Data Analytics", "Chief Technology Officer (Nuclear Protocol)",
                "MIT PhD Data Science + Stanford Statistics Masters",
                "Technology operations continuity and data protection"
            ),
            
            "dr-sarah-chen": StaffMember(
                "dr-sarah-chen", "Dr. Sarah Chen", "The Healer", "Chief Medical Officer", 
                "Health Operations", StaffTier.STRATEGIC, 8,
                ["Sports Medicine", "Player Health", "Safety Protocols", "Medical Excellence"],
                "Medical Operations and Safety Protocols", "Chief Health & Safety Officer (Nuclear Protocol)",
                "Stanford Medical School + Sports Medicine Fellowship",
                "Health and safety continuity and medical emergency response"
            ),
            
            "captain-michael-rodriguez": StaffMember(
                "captain-michael-rodriguez", "Captain Michael Rodriguez", "The Fortress", "Chief Security Officer",
                "Security Operations", StaffTier.STRATEGIC, 9,
                ["Physical Security", "Data Protection", "Risk Management", "Facility Operations"],
                "Security and Risk Management", "Chief Risk Management Officer (Nuclear Protocol)",
                "Military Leadership Academy + Cybersecurity Certification",
                "Security and risk management continuity"
            )
        }
    
    async def assign_session_oversight(
        self, 
        context: OrchestrationContext,
        complexity_assessment: Dict[str, Any]
    ) -> Dict[str, str]:
        """Assign appropriate staff oversight for orchestration session"""
        
        assignments = {}
        
        # Core leadership always assigned
        assignments[OversightRole.STRATEGIC_OVERSIGHT] = "denauld-brown"
        assignments[OversightRole.AI_COORDINATION] = "mel-ai" 
        assignments[OversightRole.PROJECT_MANAGEMENT] = "alexandra-martinez"
        
        # Analyze request for domain-specific assignments
        domain_assignments = await self._analyze_domain_requirements(
            context.development_request, 
            context.requirements
        )
        assignments.update(domain_assignments)
        
        # Add senior oversight for complex projects
        if complexity_assessment.get("complexity_score", 0) > 0.7:
            assignments.update(await self._assign_senior_oversight(complexity_assessment))
        
        # Store assignments
        self.active_assignments[context.session_id] = assignments
        
        # Send notifications to assigned staff
        await self._notify_staff_of_assignment(context, assignments)
        
        logger.info(f"Assigned oversight for session {context.session_id}: {assignments}")
        
        return assignments
    
    async def _analyze_domain_requirements(
        self, 
        development_request: str, 
        requirements: List[str]
    ) -> Dict[str, str]:
        """Analyze request to determine domain-specific staff assignments"""
        
        assignments = {}
        combined_text = f"{development_request} {' '.join(requirements)}".lower()
        
        # Design and UI requirements
        if any(keyword in combined_text for keyword in ["design", "ui", "ux", "interface", "user experience"]):
            assignments[OversightRole.DESIGN_OVERSIGHT] = "maya-patel"
        
        # Infrastructure and DevOps requirements  
        if any(keyword in combined_text for keyword in ["infrastructure", "devops", "deployment", "scalability"]):
            assignments[OversightRole.INFRASTRUCTURE_OVERSIGHT] = "jake-morrison"
        
        # AI and machine learning requirements
        if any(keyword in combined_text for keyword in ["ai", "ml", "machine learning", "neural", "algorithm"]):
            # Rachel Foster handles AI oversight
            assignments["ai_research_oversight"] = "rachel-foster"
        
        # Innovation and competitive analysis
        if any(keyword in combined_text for keyword in ["innovation", "competitive", "patent", "research"]):
            assignments[OversightRole.INNOVATION_OVERSIGHT] = "david-kim"
        
        # Technical complexity requiring data science
        if any(keyword in combined_text for keyword in ["analytics", "data", "statistics", "modeling"]):
            assignments[OversightRole.TECHNICAL_REVIEW] = "dr-james-wright"
        
        return assignments
    
    async def _assign_senior_oversight(self, complexity_assessment: Dict[str, Any]) -> Dict[str, str]:
        """Assign senior oversight for high-complexity projects"""
        
        assignments = {}
        
        # Always add technical review for complex projects
        assignments[OversightRole.TECHNICAL_REVIEW] = "dr-james-wright"
        
        # Security review for external-facing or data-intensive projects
        if complexity_assessment.get("security_requirements", False):
            assignments[OversightRole.SECURITY_REVIEW] = "captain-michael-rodriguez"
        
        # Legal review for IP-sensitive or compliance-heavy projects  
        if complexity_assessment.get("legal_considerations", False):
            assignments[OversightRole.LEGAL_REVIEW] = "courtney-sellars"
        
        return assignments
    
    async def _notify_staff_of_assignment(
        self, 
        context: OrchestrationContext, 
        assignments: Dict[str, str]
    ):
        """Send notifications to assigned staff members"""
        
        for role, staff_id in assignments.items():
            if staff_id in self.staff_registry:
                staff_member = self.staff_registry[staff_id]
                
                notification = {
                    "type": "oversight_assignment",
                    "session_id": context.session_id,
                    "project_name": context.project_name,
                    "assigned_role": role,
                    "project_description": context.development_request,
                    "requirements": context.requirements,
                    "priority": self._determine_notification_priority(staff_member.tier_level),
                    "assigned_at": datetime.now().isoformat()
                }
                
                await self._send_staff_notification(staff_id, notification)
    
    async def _send_staff_notification(self, staff_id: str, notification: Dict[str, Any]):
        """Send notification to specific staff member"""
        
        # This would integrate with actual notification systems
        # For now, log the notification
        staff_member = self.staff_registry.get(staff_id)
        if staff_member:
            logger.info(f"Notification to {staff_member.full_name} ({staff_member.nickname}): {notification['type']}")
            
            # Store notification for tracking
            if staff_id not in self.notification_channels:
                self.notification_channels[staff_id] = []
            
            self.notification_channels[staff_id].append({
                "timestamp": datetime.now().isoformat(),
                "notification": notification
            })
    
    def _determine_notification_priority(self, tier_level: StaffTier) -> int:
        """Determine notification priority based on staff tier"""
        
        priority_map = {
            StaffTier.FOUNDER: 5,      # Highest priority
            StaffTier.AI_CORE: 5,      # Highest priority  
            StaffTier.EXECUTIVE: 4,    # High priority
            StaffTier.STRATEGIC: 3,    # Normal priority
            StaffTier.ADVISORY: 2,     # Low priority
            StaffTier.INNOVATION: 3,   # Normal priority
            StaffTier.FOOTBALL: 2      # Low priority
        }
        
        return priority_map.get(tier_level, 1)
    
    async def notify_milestone_completion(
        self, 
        session_id: str, 
        milestone: str, 
        results: Dict[str, Any]
    ):
        """Notify assigned staff of project milestones"""
        
        if session_id not in self.active_assignments:
            return
        
        assignments = self.active_assignments[session_id]
        
        for role, staff_id in assignments.items():
            milestone_notification = {
                "type": "milestone_completion",
                "session_id": session_id,
                "milestone": milestone,
                "role": role,
                "results_summary": self._create_results_summary(results),
                "completed_at": datetime.now().isoformat()
            }
            
            await self._send_staff_notification(staff_id, milestone_notification)
    
    def _create_results_summary(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Create executive summary of results for staff notifications"""
        
        return {
            "success_rate": results.get("success_rate", 0),
            "completed_tasks": results.get("completed_tasks", 0),
            "total_execution_time": results.get("total_execution_time", 0),
            "key_achievements": results.get("key_achievements", []),
            "issues_encountered": results.get("issues_encountered", [])
        }
    
    async def escalate_to_emergency_succession(
        self, 
        unavailable_staff_id: str, 
        session_id: str
    ) -> Optional[str]:
        """Handle emergency succession when staff member becomes unavailable"""
        
        if unavailable_staff_id not in self.staff_registry:
            return None
        
        unavailable_staff = self.staff_registry[unavailable_staff_id]
        succession_role = unavailable_staff.succession_role
        
        # Find appropriate successor based on succession role and availability
        successor_id = await self._find_available_successor(succession_role, unavailable_staff.tier_level)
        
        if successor_id:
            # Update assignments
            if session_id in self.active_assignments:
                # Find and replace the unavailable staff in assignments
                for role, assigned_staff_id in self.active_assignments[session_id].items():
                    if assigned_staff_id == unavailable_staff_id:
                        self.active_assignments[session_id][role] = successor_id
                        break
            
            # Notify successor of emergency assignment
            succession_notification = {
                "type": "emergency_succession",
                "session_id": session_id,
                "replacing_staff": unavailable_staff.full_name,
                "succession_role": succession_role,
                "crisis_function": unavailable_staff.crisis_function,
                "escalated_at": datetime.now().isoformat()
            }
            
            await self._send_staff_notification(successor_id, succession_notification)
            
            logger.warning(f"Emergency succession: {successor_id} replacing {unavailable_staff_id}")
            
        return successor_id
    
    async def _find_available_successor(
        self, 
        succession_role: str, 
        original_tier: StaffTier
    ) -> Optional[str]:
        """Find available staff member for succession"""
        
        # Implementation would check availability and find best match
        # For now, return a simple tier-based fallback
        
        tier_fallbacks = {
            StaffTier.FOUNDER: None,  # Founder cannot be replaced
            StaffTier.AI_CORE: "denauld-brown",  # Fallback to founder
            StaffTier.EXECUTIVE: "denauld-brown",
            StaffTier.STRATEGIC: "alexandra-martinez",
            StaffTier.INNOVATION: "dr-james-wright",
            StaffTier.ADVISORY: "marcus-sterling",
            StaffTier.FOOTBALL: "darius-washington"
        }
        
        fallback_id = tier_fallbacks.get(original_tier)
        
        # Check if fallback is available
        if fallback_id and self.staff_availability.get(fallback_id, True):
            return fallback_id
        
        return None
    
    def get_staff_member(self, staff_id: str) -> Optional[StaffMember]:
        """Get staff member by ID"""
        return self.staff_registry.get(staff_id)
    
    def get_staff_by_expertise(self, expertise_area: str) -> List[StaffMember]:
        """Find staff members with specific expertise"""
        
        matching_staff = []
        
        for staff_member in self.staff_registry.values():
            if any(expertise_area.lower() in area.lower() for area in staff_member.expertise_areas):
                matching_staff.append(staff_member)
        
        # Sort by emergency priority (lower number = higher priority)
        matching_staff.sort(key=lambda s: s.emergency_priority)
        
        return matching_staff
    
    def get_session_assignments(self, session_id: str) -> Optional[Dict[str, str]]:
        """Get staff assignments for session"""
        return self.active_assignments.get(session_id)
    
    def get_staff_workload(self, staff_id: str) -> Dict[str, Any]:
        """Get current workload for staff member"""
        
        # Count active assignments
        active_sessions = []
        for session_id, assignments in self.active_assignments.items():
            if staff_id in assignments.values():
                active_sessions.append(session_id)
        
        # Get recent notifications
        recent_notifications = []
        if staff_id in self.notification_channels:
            cutoff_time = datetime.now() - timedelta(hours=24)
            recent_notifications = [
                notif for notif in self.notification_channels[staff_id]
                if datetime.fromisoformat(notif["timestamp"]) > cutoff_time
            ]
        
        staff_member = self.staff_registry.get(staff_id)
        
        return {
            "staff_id": staff_id,
            "full_name": staff_member.full_name if staff_member else "Unknown",
            "active_sessions": len(active_sessions),
            "session_ids": active_sessions,
            "recent_notifications": len(recent_notifications),
            "availability": self.staff_availability.get(staff_id, True),
            "tier_level": staff_member.tier_level if staff_member else None,
            "emergency_priority": staff_member.emergency_priority if staff_member else None
        }
    
    def update_staff_availability(self, staff_id: str, available: bool):
        """Update staff member availability"""
        self.staff_availability[staff_id] = available
        logger.info(f"Updated availability for {staff_id}: {'available' if available else 'unavailable'}")
    
    def get_staff_directory(self) -> Dict[str, Dict[str, Any]]:
        """Get complete staff directory"""
        
        return {
            staff_id: staff_member.to_dict()
            for staff_id, staff_member in self.staff_registry.items()
        }
    
    def get_tier_members(self, tier: StaffTier) -> List[StaffMember]:
        """Get all staff members in specific tier"""
        
        return [
            staff_member for staff_member in self.staff_registry.values()
            if staff_member.tier_level == tier
        ]
    
    async def create_oversight_report(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Create oversight report for session"""
        
        if session_id not in self.active_assignments:
            return None
        
        assignments = self.active_assignments[session_id]
        
        report = {
            "session_id": session_id,
            "oversight_assignments": {},
            "staff_engagement": {},
            "communication_summary": {},
            "report_generated_at": datetime.now().isoformat()
        }
        
        for role, staff_id in assignments.items():
            staff_member = self.staff_registry.get(staff_id)
            if staff_member:
                report["oversight_assignments"][role] = {
                    "staff_id": staff_id,
                    "full_name": staff_member.full_name,
                    "nickname": staff_member.nickname,
                    "tier_level": staff_member.tier_level,
                    "authority_level": staff_member.authority_level
                }
                
                # Get staff engagement metrics
                workload = self.get_staff_workload(staff_id)
                report["staff_engagement"][staff_id] = workload
                
                # Get communication summary
                notifications = self.notification_channels.get(staff_id, [])
                recent_notifications = [
                    n for n in notifications 
                    if datetime.fromisoformat(n["timestamp"]) > datetime.now() - timedelta(hours=24)
                ]
                report["communication_summary"][staff_id] = len(recent_notifications)
        
        return report
