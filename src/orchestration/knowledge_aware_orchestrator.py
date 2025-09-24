"""
AMT Knowledge-Aware Orchestrator
Enhanced orchestrator with Nuclino integration for persistent context and learning
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import json

from .central_orchestrator import CentralOrchestrator
from ..shared.orchestration_protocol import (
    BotType, TaskStatus, BotRequest, BotResponse, OrchestrationContext,
    KnowledgeUpdate, OrchestrationError
)

# Importing Nuclino integration modules from analyzemyteam-integrations
try:
    from src.nuclino.client import NuclinoClient
    from src.nuclino.bot_integration import BotIntegration  
    from src.nuclino.staff_profiles import StaffProfiles
    from src.nuclino.griptape_integration import GriptapeKnowledgeBase
    from src.nuclino.sync_service import SyncService
except ImportError:
    # Fallback for development without full integration
    logging.warning("Nuclino integration modules not available - using mock implementations")
    from unittest.mock import Mock
    NuclinoClient = Mock
    BotIntegration = Mock
    StaffProfiles = Mock
    GriptapeKnowledgeBase = Mock
    SyncService = Mock

logger = logging.getLogger(__name__)

class KnowledgeAwareOrchestrator(CentralOrchestrator):
    """Enhanced orchestrator with knowledge base integration and learning"""
    
    def __init__(self, bot_endpoints: Dict[BotType, str], nuclino_config: Dict = None):
        super().__init__(bot_endpoints)
        
        # Initialize Nuclino integration
        self.nuclino_client = NuclinoClient(config=nuclino_config)
        self.bot_integration = BotIntegration(self.nuclino_client)
        self.staff_profiles = StaffProfiles(self.nuclino_client)
        self.knowledge_base = GriptapeKnowledgeBase(self.nuclino_client)
        self.sync_service = SyncService(self.nuclino_client)
        
        # Knowledge management
        self.session_workspaces: Dict[str, str] = {}  # session_id -> workspace_id
        self.knowledge_cache: Dict[str, Any] = {}
        self.learning_enabled = True
        
    async def orchestrate_development_request(
        self, 
        user_request: str, 
        requirements: List[str],
        user_id: str,
        constraints: Optional[Dict] = None
    ) -> str:
        """Enhanced orchestration with knowledge base integration"""
        
        try:
            # Create Nuclino workspace for project collaboration
            workspace = await self._create_project_workspace(user_request, user_id)
            
            # Initialize knowledge-enhanced context
            context = await self._initialize_knowledge_context(
                user_request, requirements, user_id, workspace["id"], constraints
            )
            
            # Share context with all bots via knowledge base
            await self._share_context_with_bots(context, workspace["id"])
            
            # Assign AMT staff oversight
            staff_assignments = await self._assign_staff_oversight(context)
            context.staff_assignments = staff_assignments
            
            # Execute orchestration with knowledge awareness
            session_id = await self._execute_knowledge_aware_orchestration(context)
            
            # Store session workspace mapping
            self.session_workspaces[session_id] = workspace["id"]
            
            return session_id
            
        except Exception as e:
            logger.error(f"Knowledge-aware orchestration failed: {str(e)}")
            raise OrchestrationError(f"Knowledge orchestration failed: {str(e)}")
    
    async def _create_project_workspace(self, user_request: str, user_id: str) -> Dict[str, Any]:
        """Create dedicated Nuclino workspace for orchestration session"""
        
        project_name = self._extract_project_name(user_request)
        workspace_name = f"AMT Dev: {project_name}"
        
        try:
            workspace = await self.nuclino_client.create_workspace(
                name=workspace_name,
                description=f"AI-orchestrated development session\nRequest: {user_request[:200]}...",
                team_members=await self._get_relevant_team_members(user_request),
                tags=["amt-development", "ai-orchestrated", "championship-level"]
            )
            
            logger.info(f"Created workspace {workspace['id']} for project {project_name}")
            return workspace
            
        except Exception as e:
            logger.error(f"Failed to create workspace: {str(e)}")
            # Return mock workspace for fallback
            return {
                "id": f"mock_workspace_{datetime.now().isoformat()}",
                "name": workspace_name,
                "url": "mock://workspace"
            }
    
    async def _initialize_knowledge_context(
        self, 
        user_request: str, 
        requirements: List[str],
        user_id: str,
        workspace_id: str,
        constraints: Optional[Dict] = None
    ) -> OrchestrationContext:
        """Create rich context enhanced with historical knowledge"""
        
        # Search for similar past projects
        similar_projects = await self._find_similar_projects(user_request, requirements)
        
        # Extract successful architectural patterns
        architectural_patterns = await self._get_successful_patterns(similar_projects)
        
        # Get relevant staff expertise and insights
        staff_expertise = await self._get_relevant_staff_expertise(user_request, requirements)
        
        # Analyze technical requirements with knowledge base
        technical_insights = await self._analyze_technical_requirements(user_request, requirements)
        
        # Create enhanced orchestration context
        context = OrchestrationContext(
            user_id=user_id,
            project_name=self._extract_project_name(user_request),
            development_request=user_request,
            requirements=requirements,
            constraints=constraints or {},
            nuclino_workspace_id=workspace_id,
            shared_artifacts={
                "similar_projects": similar_projects,
                "architectural_patterns": architectural_patterns,
                "staff_expertise": staff_expertise,
                "technical_insights": technical_insights,
                "knowledge_base_version": await self.knowledge_base.get_version(),
                "triangle_defense_integration": True  # Always required for AMT
            }
        )
        
        # Store context in knowledge base
        await self._store_session_context(context)
        
        return context
    
    async def _find_similar_projects(
        self, 
        user_request: str, 
        requirements: List[str]
    ) -> List[Dict[str, Any]]:
        """Find historically similar projects for guidance"""
        
        try:
            # Search knowledge base for similar development requests
            search_query = f"{user_request} {' '.join(requirements)}"
            similar_sessions = await self.knowledge_base.search_similar_sessions(
                query=search_query,
                threshold=0.7,
                max_results=5
            )
            
            # Enrich with success metrics and lessons learned
            enriched_projects = []
            for session in similar_sessions:
                project_data = await self.knowledge_base.get_session_complete_data(session["id"])
                if project_data and project_data.get("success_rate", 0) > 0.8:
                    enriched_projects.append({
                        "session_id": session["id"],
                        "project_name": project_data.get("project_name", "Unknown"),
                        "success_rate": project_data.get("success_rate", 0),
                        "key_insights": project_data.get("lessons_learned", []),
                        "architectural_decisions": project_data.get("architecture", {}),
                        "similarity_score": session.get("similarity", 0)
                    })
            
            logger.info(f"Found {len(enriched_projects)} similar successful projects")
            return enriched_projects
            
        except Exception as e:
            logger.warning(f"Could not retrieve similar projects: {str(e)}")
            return []
    
    async def _get_successful_patterns(
        self, 
        similar_projects: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Extract proven architectural patterns from successful projects"""
        
        patterns = []
        
        for project in similar_projects:
            if project.get("success_rate", 0) > 0.9:  # Only from highly successful projects
                arch_decisions = project.get("architectural_decisions", {})
                if arch_decisions:
                    patterns.append({
                        "pattern_type": arch_decisions.get("pattern_type", "unknown"),
                        "technologies": arch_decisions.get("tech_stack", []),
                        "design_principles": arch_decisions.get("design_principles", []),
                        "success_factors": arch_decisions.get("success_factors", []),
                        "source_project": project["project_name"],
                        "confidence": project["success_rate"]
                    })
        
        # Deduplicate and rank patterns
        unique_patterns = self._deduplicate_patterns(patterns)
        
        return sorted(unique_patterns, key=lambda p: p.get("confidence", 0), reverse=True)[:5]
    
    async def _get_relevant_staff_expertise(
        self, 
        user_request: str, 
        requirements: List[str]
    ) -> Dict[str, Any]:
        """Get relevant AMT staff expertise and past contributions"""
        
        try:
            # Identify relevant staff based on request content
            relevant_staff = await self.staff_profiles.find_relevant_expertise(
                user_request, requirements
            )
            
            staff_insights = {}
            for staff_member in relevant_staff:
                profile = await self.staff_profiles.get_complete_profile(staff_member["id"])
                if profile:
                    staff_insights[staff_member["id"]] = {
                        "name": profile["name"],
                        "expertise": profile["expertise_areas"],
                        "past_contributions": await self._get_staff_past_contributions(staff_member["id"]),
                        "success_rate": profile.get("success_metrics", {}).get("project_success_rate", 0),
                        "specializations": profile.get("specializations", [])
                    }
            
            return staff_insights
            
        except Exception as e:
            logger.warning(f"Could not retrieve staff expertise: {str(e)}")
            return {}
    
    async def _analyze_technical_requirements(
        self, 
        user_request: str, 
        requirements: List[str]
    ) -> Dict[str, Any]:
        """Analyze technical requirements using knowledge base insights"""
        
        analysis = {
            "complexity_score": self._calculate_complexity_score(user_request, requirements),
            "required_technologies": self._extract_required_technologies(user_request, requirements),
            "estimated_duration_hours": self._estimate_project_duration(user_request, requirements),
            "risk_factors": await self._identify_risk_factors(user_request, requirements),
            "success_predictors": await self._identify_success_predictors(user_request, requirements),
            "triangle_defense_integration_points": self._identify_triangle_defense_points(user_request)
        }
        
        return analysis
    
    async def _share_context_with_bots(
        self, 
        context: OrchestrationContext, 
        workspace_id: str
    ):
        """Share orchestration context with all bots via knowledge base"""
        
        try:
            # Create context document in Nuclino
            context_doc = await self.nuclino_client.create_item(
                workspace_id=workspace_id,
                title="🤖 AI Orchestration Context",
                content=self._format_context_for_bots(context),
                item_type="orchestration_context",
                tags=["context", "ai-agents", "shared"]
            )
            
            # Notify all bots of new context availability
            for bot_type in self.bot_endpoints.keys():
                await self.bot_integration.notify_context_update(
                    bot_type=bot_type,
                    context_doc_id=context_doc["id"],
                    session_id=context.session_id,
                    workspace_id=workspace_id
                )
                
            logger.info(f"Shared context with all bots for session {context.session_id}")
            
        except Exception as e:
            logger.error(f"Failed to share context with bots: {str(e)}")
            # Continue without context sharing - bots will work with limited context
    
    async def _assign_staff_oversight(self, context: OrchestrationContext) -> Dict[str, str]:
        """Assign appropriate AMT staff oversight based on project complexity"""
        
        assignments = {
            "strategic_oversight": "denauld-brown",  # Always Denauld for strategic vision
            "ai_coordination": "mel-ai",             # Always M.E.L. for AI coordination
            "project_management": "alexandra-martinez"  # Always Alexandra for coordination
        }
        
        # Analyze request complexity and domain
        request_lower = context.development_request.lower()
        requirements_text = " ".join(context.requirements).lower()
        combined_text = f"{request_lower} {requirements_text}"
        
        # Assign domain specialists
        if any(keyword in combined_text for keyword in ["design", "ui", "ux", "interface"]):
            assignments["design_oversight"] = "maya-patel"
            
        if any(keyword in combined_text for keyword in ["infrastructure", "devops", "deployment"]):
            assignments["infrastructure_oversight"] = "jake-morrison"
            
        if any(keyword in combined_text for keyword in ["ai", "ml", "algorithm", "neural"]):
            assignments["ai_research_oversight"] = "rachel-foster"
            
        if any(keyword in combined_text for keyword in ["innovation", "competitive", "patent"]):
            assignments["innovation_oversight"] = "david-kim"
            
        # Add senior oversight for complex projects
        complexity_score = self._calculate_complexity_score(context.development_request, context.requirements)
        if complexity_score > 0.7:
            assignments.update({
                "technical_review": "dr-james-wright",
                "security_review": "captain-michael-rodriguez",
                "legal_review": "courtney-sellars"
            })
        
        # Create oversight tracking document
        await self._create_oversight_document(context, assignments)
        
        return assignments
    
    async def _execute_knowledge_aware_orchestration(
        self, 
        context: OrchestrationContext
    ) -> str:
        """Execute orchestration with knowledge enhancement"""
        
        # Store active session with enhanced context
        self.active_sessions[context.session_id] = context
        
        try:
            # Execute standard orchestration with knowledge context
            results = await super().orchestrate_development_request(
                user_request=context.development_request,
                requirements=context.requirements,
                user_id=context.user_id,
                constraints=context.constraints
            )
            
            # Capture learning from orchestration
            if self.learning_enabled:
                await self._capture_orchestration_learning(context, results)
            
            # Update knowledge base with new insights
            await self._update_knowledge_base(context, results)
            
            return results
            
        except Exception as e:
            # Capture failure learning
            if self.learning_enabled:
                await self._capture_failure_learning(context, str(e))
            raise
    
    async def _capture_orchestration_learning(
        self, 
        context: OrchestrationContext, 
        session_id: str
    ):
        """Capture learning from successful orchestration"""
        
        try:
            # Get session results
            session_status = self.get_session_status(session_id)
            if not session_status:
                return
                
            learning_data = KnowledgeUpdate(
                session_id=context.session_id,
                bot_type=BotType.COORDINATION,
                update_type="successful_orchestration",
                content={
                    "project_type": context.project_name,
                    "requirements_pattern": context.requirements,
                    "success_rate": session_status.get("success_rate", 0),
                    "execution_time": session_status.get("total_execution_time", 0),
                    "staff_assignments": context.staff_assignments,
                    "architectural_decisions": context.shared_artifacts.get("architectural_patterns", []),
                    "lessons_learned": []  # Will be populated by bot contributions
                },
                confidence_level=session_status.get("success_rate", 0),
                applicable_contexts=self._extract_applicable_contexts(context)
            )
            
            await self.knowledge_base.add_learning_update(learning_data)
            logger.info(f"Captured learning from session {context.session_id}")
            
        except Exception as e:
            logger.error(f"Failed to capture learning: {str(e)}")
    
    def _format_context_for_bots(self, context: OrchestrationContext) -> str:
        """Format orchestration context for bot consumption"""
        
        context_data = {
            "session_id": context.session_id,
            "project_overview": {
                "name": context.project_name,
                "request": context.development_request,
                "requirements": context.requirements,
                "constraints": context.constraints
            },
            "knowledge_insights": {
                "similar_projects": context.shared_artifacts.get("similar_projects", []),
                "proven_patterns": context.shared_artifacts.get("architectural_patterns", []),
                "staff_expertise": context.shared_artifacts.get("staff_expertise", {}),
                "technical_analysis": context.shared_artifacts.get("technical_insights", {})
            },
            "triangle_defense_requirements": {
                "integration_required": True,
                "analysis_points": context.shared_artifacts.get("triangle_defense_integration_points", []),
                "methodology_compliance": "mandatory"
            },
            "collaboration_guidelines": {
                "workspace_id": context.nuclino_workspace_id,
                "staff_oversight": context.staff_assignments,
                "knowledge_sharing": "encouraged",
                "learning_capture": "enabled"
            }
        }
        
        return json.dumps(context_data, indent=2, default=str)
    
    def _get_relevant_team_members(self, user_request: str) -> List[str]:
        """Identify relevant AMT team members for workspace access"""
        
        # Core team always included
        core_team = [
            "denauld-brown", "mel-ai", "alexandra-martinez", 
            "maya-patel", "jake-morrison", "rachel-foster", "david-kim"
        ]
        
        # Add additional members based on request complexity
        request_lower = user_request.lower()
        
        if any(keyword in request_lower for keyword in ["security", "compliance", "legal"]):
            core_team.extend(["courtney-sellars", "captain-michael-rodriguez"])
            
        if any(keyword in request_lower for keyword in ["data", "analytics", "algorithm"]):
            core_team.append("dr-james-wright")
            
        return core_team
    
    def _calculate_complexity_score(self, user_request: str, requirements: List[str]) -> float:
        """Calculate project complexity score (0-1)"""
        
        complexity_indicators = [
            "real-time", "machine learning", "ai", "distributed", "scalable",
            "microservices", "kubernetes", "video processing", "neural network",
            "enterprise", "multi-tenant", "international", "compliance"
        ]
        
        combined_text = f"{user_request} {' '.join(requirements)}".lower()
        matches = sum(1 for indicator in complexity_indicators if indicator in combined_text)
        
        # Normalize to 0-1 scale
        max_indicators = len(complexity_indicators)
        complexity_score = min(matches / (max_indicators * 0.5), 1.0)  # Scale so 50% of indicators = 1.0
        
        return complexity_score
    
    def _extract_required_technologies(self, user_request: str, requirements: List[str]) -> List[str]:
        """Extract required technologies from request"""
        
        tech_keywords = {
            "react", "nextjs", "typescript", "python", "nodejs", "kubernetes",
            "docker", "postgresql", "redis", "graphql", "websocket", "ml",
            "ai", "opencv", "konva", "tailwind", "fastapi"
        }
        
        combined_text = f"{user_request} {' '.join(requirements)}".lower()
        found_tech = [tech for tech in tech_keywords if tech in combined_text]
        
        # Add AMT standard stack
        amt_stack = ["nextjs", "typescript", "tailwindcss", "shadcn-ui", "postgresql", "graphql"]
        
        return list(set(found_tech + amt_stack))
    
    def _estimate_project_duration(self, user_request: str, requirements: List[str]) -> int:
        """Estimate project duration in hours"""
        
        base_hours = 40  # Base development time
        complexity_multiplier = self._calculate_complexity_score(user_request, requirements)
        requirement_hours = len(requirements) * 8  # 8 hours per requirement
        
        total_hours = int(base_hours + (base_hours * complexity_multiplier) + requirement_hours)
        
        return min(total_hours, 400)  # Cap at 400 hours (10 weeks)
    
    async def get_session_knowledge_insights(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get knowledge insights for a specific session"""
        
        if session_id not in self.active_sessions:
            return None
            
        context = self.active_sessions[session_id]
        workspace_id = self.session_workspaces.get(session_id)
        
        if not workspace_id:
            return None
            
        try:
            # Get all knowledge items from workspace
            knowledge_items = await self.nuclino_client.get_workspace_items(
                workspace_id, item_types=["context", "insight", "learning"]
            )
            
            return {
                "session_id": session_id,
                "workspace_url": f"https://app.nuclino.com/workspaces/{workspace_id}",
                "knowledge_items_count": len(knowledge_items),
                "similar_projects": context.shared_artifacts.get("similar_projects", []),
                "staff_expertise": context.shared_artifacts.get("staff_expertise", {}),
                "learning_updates": await self.knowledge_base.get_session_learning(session_id)
            }
            
        except Exception as e:
            logger.error(f"Failed to get knowledge insights: {str(e)}")
            return None
    
    async def _create_oversight_document(
        self, 
        context: OrchestrationContext, 
        assignments: Dict[str, str]
    ):
        """Create staff oversight tracking document"""
        
        oversight_content = {
            "project": context.project_name,
            "session_id": context.session_id,
            "assignments": assignments,
            "responsibilities": {
                "strategic_oversight": "Vision alignment and strategic direction",
                "ai_coordination": "AI agent coordination and M.E.L. integration",
                "project_management": "Timeline, resources, and deliverable coordination"
            },
            "milestone_tracking": {
                "phase_1_completion": "pending",
                "phase_2_synthesis": "pending", 
                "phase_3_delivery": "pending"
            }
        }
        
        try:
            if context.nuclino_workspace_id:
                await self.nuclino_client.create_item(
                    workspace_id=context.nuclino_workspace_id,
                    title="👥 Staff Oversight & Accountability",
                    content=json.dumps(oversight_content, indent=2),
                    item_type="oversight_tracking",
                    assignees=list(assignments.values())
                )
        except Exception as e:
            logger.error(f"Failed to create oversight document: {str(e)}")
