"""
AMT Session Manager
Comprehensive orchestration session lifecycle management
"""

import asyncio
import uuid
import logging
from typing import Dict, List, Optional, Any, Set, Callable
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import json

from ..shared.orchestration_protocol import (
    BotType, TaskStatus, BotRequest, BotResponse, OrchestrationContext,
    OrchestrationPlan, KnowledgeUpdate, OrchestrationError
)

logger = logging.getLogger(__name__)

class SessionState(str, Enum):
    """Orchestration session states"""
    INITIALIZING = "initializing"
    PLANNING = "planning"
    EXECUTING = "executing"
    SYNTHESIZING = "synthesizing"
    COMPLETING = "completing"
    COMPLETED = "completed"
    FAILED = "failed"
    ABORTED = "aborted"
    SUSPENDED = "suspended"

class SessionPriority(str, Enum):
    """Session priority levels"""
    LOW = "low"
    NORMAL = "normal" 
    HIGH = "high"
    URGENT = "urgent"
    CRITICAL = "critical"

@dataclass
class SessionMetrics:
    """Session performance and execution metrics"""
    total_tasks: int = 0
    completed_tasks: int = 0
    failed_tasks: int = 0
    execution_time_seconds: float = 0.0
    bot_response_times: Dict[BotType, float] = field(default_factory=dict)
    knowledge_contributions: int = 0
    staff_notifications_sent: int = 0
    errors_encountered: int = 0
    errors_recovered: int = 0
    
    @property
    def success_rate(self) -> float:
        """Calculate success rate of completed tasks"""
        if self.total_tasks == 0:
            return 0.0
        return self.completed_tasks / self.total_tasks
    
    @property
    def completion_rate(self) -> float:
        """Calculate completion rate (completed + failed / total)"""
        if self.total_tasks == 0:
            return 0.0
        return (self.completed_tasks + self.failed_tasks) / self.total_tasks

@dataclass
class SessionSnapshot:
    """Immutable snapshot of session state"""
    session_id: str
    state: SessionState
    priority: SessionPriority
    progress_percentage: float
    current_phase: str
    active_tasks: int
    completed_tasks: int
    failed_tasks: int
    execution_time: float
    estimated_completion: Optional[datetime]
    staff_assigned: List[str]
    error_count: int
    last_activity: datetime
    created_at: datetime

class OrchestrationSession:
    """Represents a single orchestration session"""
    
    def __init__(
        self,
        session_id: str,
        context: OrchestrationContext,
        priority: SessionPriority = SessionPriority.NORMAL
    ):
        self.session_id = session_id
        self.context = context
        self.priority = priority
        self.state = SessionState.INITIALIZING
        
        # Execution tracking
        self.plan: Optional[OrchestrationPlan] = None
        self.current_phase = 0
        self.active_tasks: Dict[str, BotRequest] = {}
        self.completed_tasks: Dict[str, BotResponse] = {}
        self.failed_tasks: Dict[str, BotResponse] = {}
        self.pending_tasks: List[BotRequest] = []
        
        # Progress tracking
        self.metrics = SessionMetrics()
        self.progress_checkpoints: List[Dict[str, Any]] = []
        self.knowledge_updates: List[KnowledgeUpdate] = []
        self.error_events: List[Dict[str, Any]] = []
        
        # Timing
        self.created_at = datetime.now()
        self.started_at: Optional[datetime] = None
        self.completed_at: Optional[datetime] = None
        self.last_activity = datetime.now()
        self.estimated_completion: Optional[datetime] = None
        
        # Staff and oversight
        self.assigned_staff: Set[str] = set()
        self.oversight_assignments: Dict[str, str] = {}
        
        # Session callbacks
        self.state_change_callbacks: List[Callable] = []
        self.progress_callbacks: List[Callable] = []
        
        # Resource tracking
        self.resource_usage: Dict[str, Any] = {}
        self.workspace_id: Optional[str] = context.nuclino_workspace_id
        
        # Suspension/Resume support
        self.suspension_reason: Optional[str] = None
        self.suspended_at: Optional[datetime] = None
        self.resume_conditions: Dict[str, Any] = {}
    
    def update_state(self, new_state: SessionState, reason: str = ""):
        """Update session state with notifications"""
        
        old_state = self.state
        self.state = new_state
        self.last_activity = datetime.now()
        
        logger.info(f"Session {self.session_id} state changed: {old_state} -> {new_state}")
        
        # Record state change
        self.progress_checkpoints.append({
            "timestamp": datetime.now().isoformat(),
            "event": "state_change",
            "old_state": old_state,
            "new_state": new_state,
            "reason": reason,
            "progress": self.get_progress_percentage()
        })
        
        # Notify callbacks
        for callback in self.state_change_callbacks:
            try:
                asyncio.create_task(callback(self, old_state, new_state))
            except Exception as e:
                logger.error(f"State change callback failed: {str(e)}")
    
    def get_progress_percentage(self) -> float:
        """Calculate overall progress percentage"""
        
        if not self.plan or self.plan.total_tasks == 0:
            return 0.0
        
        completed_weight = 0.8  # Completed tasks get full weight
        failed_weight = 0.5     # Failed tasks get partial weight (recovery possible)
        
        weighted_completed = (
            self.metrics.completed_tasks * completed_weight +
            self.metrics.failed_tasks * failed_weight
        )
        
        return min(weighted_completed / self.plan.total_tasks * 100, 100.0)
    
    def estimate_completion_time(self) -> Optional[datetime]:
        """Estimate session completion time based on current progress"""
        
        if not self.started_at or self.metrics.total_tasks == 0:
            return None
        
        elapsed_time = (datetime.now() - self.started_at).total_seconds()
        progress = self.get_progress_percentage() / 100.0
        
        if progress == 0:
            return None
        
        estimated_total_time = elapsed_time / progress
        remaining_time = estimated_total_time - elapsed_time
        
        self.estimated_completion = datetime.now() + timedelta(seconds=remaining_time)
        return self.estimated_completion
    
    def add_task(self, task: BotRequest):
        """Add task to session"""
        
        self.pending_tasks.append(task)
        self.metrics.total_tasks += 1
        self.last_activity = datetime.now()
    
    def start_task(self, task: BotRequest):
        """Mark task as started"""
        
        self.active_tasks[task.request_id] = task
        if task in self.pending_tasks:
            self.pending_tasks.remove(task)
        self.last_activity = datetime.now()
    
    def complete_task(self, response: BotResponse):
        """Mark task as completed"""
        
        if response.request_id in self.active_tasks:
            del self.active_tasks[response.request_id]
        
        if response.status == TaskStatus.COMPLETED:
            self.completed_tasks[response.request_id] = response
            self.metrics.completed_tasks += 1
        else:
            self.failed_tasks[response.request_id] = response
            self.metrics.failed_tasks += 1
        
        # Update bot response times
        if response.bot_type not in self.metrics.bot_response_times:
            self.metrics.bot_response_times[response.bot_type] = 0.0
        
        current_avg = self.metrics.bot_response_times[response.bot_type]
        task_count = len([r for r in list(self.completed_tasks.values()) + list(self.failed_tasks.values()) 
                         if r.bot_type == response.bot_type])
        
        # Running average
        self.metrics.bot_response_times[response.bot_type] = (
            (current_avg * (task_count - 1) + response.execution_time_seconds) / task_count
        )
        
        self.last_activity = datetime.now()
        
        # Notify progress callbacks
        for callback in self.progress_callbacks:
            try:
                asyncio.create_task(callback(self, response))
            except Exception as e:
                logger.error(f"Progress callback failed: {str(e)}")
    
    def add_knowledge_update(self, update: KnowledgeUpdate):
        """Add knowledge update to session"""
        
        self.knowledge_updates.append(update)
        self.metrics.knowledge_contributions += 1
        self.last_activity = datetime.now()
    
    def record_error(self, error_event: Dict[str, Any]):
        """Record error event in session"""
        
        self.error_events.append(error_event)
        self.metrics.errors_encountered += 1
        
        if error_event.get("recovery_successful", False):
            self.metrics.errors_recovered += 1
        
        self.last_activity = datetime.now()
    
    def assign_staff_oversight(self, assignments: Dict[str, str]):
        """Assign staff oversight to session"""
        
        self.oversight_assignments = assignments.copy()
        self.assigned_staff = set(assignments.values())
        self.metrics.staff_notifications_sent += len(assignments)
        self.last_activity = datetime.now()
    
    def suspend(self, reason: str, resume_conditions: Dict[str, Any] = None):
        """Suspend session execution"""
        
        self.update_state(SessionState.SUSPENDED, f"Suspended: {reason}")
        self.suspension_reason = reason
        self.suspended_at = datetime.now()
        self.resume_conditions = resume_conditions or {}
        
        logger.warning(f"Session {self.session_id} suspended: {reason}")
    
    def can_resume(self) -> bool:
        """Check if session can be resumed"""
        
        if self.state != SessionState.SUSPENDED:
            return False
        
        # Check resume conditions if any
        if not self.resume_conditions:
            return True
        
        # Implement condition checking logic here
        # For now, assume conditions are met
        return True
    
    def resume(self):
        """Resume suspended session"""
        
        if not self.can_resume():
            raise OrchestrationError("Session cannot be resumed at this time")
        
        previous_state = SessionState.EXECUTING if self.active_tasks else SessionState.PLANNING
        self.update_state(previous_state, "Resumed from suspension")
        
        self.suspension_reason = None
        self.suspended_at = None
        self.resume_conditions = {}
        
        logger.info(f"Session {self.session_id} resumed")
    
    def get_snapshot(self) -> SessionSnapshot:
        """Get immutable snapshot of current session state"""
        
        return SessionSnapshot(
            session_id=self.session_id,
            state=self.state,
            priority=self.priority,
            progress_percentage=self.get_progress_percentage(),
            current_phase=f"Phase {self.current_phase}" if self.current_phase > 0 else "Planning",
            active_tasks=len(self.active_tasks),
            completed_tasks=self.metrics.completed_tasks,
            failed_tasks=self.metrics.failed_tasks,
            execution_time=(datetime.now() - self.started_at).total_seconds() if self.started_at else 0.0,
            estimated_completion=self.estimate_completion_time(),
            staff_assigned=list(self.assigned_staff),
            error_count=self.metrics.errors_encountered,
            last_activity=self.last_activity,
            created_at=self.created_at
        )

class SessionManager:
    """Manages orchestration session lifecycle and coordination"""
    
    def __init__(
        self, 
        orchestrator=None,
        staff_manager=None,
        error_manager=None,
        realtime_coordinator=None,
        config_manager=None
    ):
        self.orchestrator = orchestrator
        self.staff_manager = staff_manager
        self.error_manager = error_manager
        self.realtime_coordinator = realtime_coordinator
        self.config_manager = config_manager
        
        # Session tracking
        self.active_sessions: Dict[str, OrchestrationSession] = {}
        self.session_history: Dict[str, OrchestrationSession] = {}
        self.session_queue: List[str] = []  # Queue for session execution
        
        # Resource management
        self.max_concurrent_sessions = 10  # Will be overridden by config
        self.resource_allocation: Dict[str, Dict[str, Any]] = {}
        
        # Monitoring
        self.session_metrics: Dict[str, Any] = {
            "total_sessions_created": 0,
            "total_sessions_completed": 0,
            "total_sessions_failed": 0,
            "average_execution_time": 0.0,
            "average_success_rate": 0.0
        }
        
        # Background tasks
        self._background_tasks: List[asyncio.Task] = []
        self._cleanup_task: Optional[asyncio.Task] = None
        self._monitoring_task: Optional[asyncio.Task] = None
        
        # Session callbacks
        self.global_session_callbacks: List[Callable] = []
        
    async def initialize(self):
        """Initialize session manager"""
        
        if self.config_manager and self.config_manager.config:
            self.max_concurrent_sessions = self.config_manager.config.resource_limits.max_concurrent_sessions
        
        # Start background services
        self._cleanup_task = asyncio.create_task(self._cleanup_service())
        self._monitoring_task = asyncio.create_task(self._monitoring_service())
        
        self._background_tasks.extend([self._cleanup_task, self._monitoring_task])
        
        logger.info("Session manager initialized")
    
    async def create_session(
        self,
        user_request: str,
        requirements: List[str],
        user_id: str,
        constraints: Optional[Dict] = None,
        priority: SessionPriority = SessionPriority.NORMAL
    ) -> str:
        """Create new orchestration session"""
        
        # Check session limits
        if len(self.active_sessions) >= self.max_concurrent_sessions:
            raise OrchestrationError(f"Maximum concurrent sessions ({self.max_concurrent_sessions}) reached")
        
        # Create session ID
        session_id = str(uuid.uuid4())
        
        # Create orchestration context
        context = OrchestrationContext(
            session_id=session_id,
            user_id=user_id,
            project_name=self._extract_project_name(user_request),
            development_request=user_request,
            requirements=requirements,
            constraints=constraints or {}
        )
        
        # Create session
        session = OrchestrationSession(session_id, context, priority)
        
        # Register callbacks
        session.state_change_callbacks.append(self._on_session_state_change)
        session.progress_callbacks.append(self._on_session_progress)
        
        # Store session
        self.active_sessions[session_id] = session
        self.session_metrics["total_sessions_created"] += 1
        
        logger.info(f"Created orchestration session {session_id} for user {user_id}")
        
        # Notify real-time coordinator
        if self.realtime_coordinator:
            await self.realtime_coordinator.notify_orchestration_progress(
                session_id,
                {
                    "event": "session_created",
                    "session_id": session_id,
                    "user_id": user_id,
                    "project_name": context.project_name,
                    "priority": priority,
                    "state": session.state
                }
            )
        
        return session_id
    
    async def start_session(self, session_id: str) -> bool:
        """Start orchestration session execution"""
        
        if session_id not in self.active_sessions:
            raise OrchestrationError(f"Session {session_id} not found")
        
        session = self.active_sessions[session_id]
        
        if session.state != SessionState.INITIALIZING:
            raise OrchestrationError(f"Session {session_id} cannot be started from state {session.state}")
        
        try:
            # Update session state
            session.update_state(SessionState.PLANNING, "Starting orchestration")
            session.started_at = datetime.now()
            
            # Assign staff oversight
            if self.staff_manager:
                complexity_assessment = self._assess_session_complexity(session)
                staff_assignments = await self.staff_manager.assign_session_oversight(
                    session.context, complexity_assessment
                )
                session.assign_staff_oversight(staff_assignments)
            
            # Begin orchestration
            if self.orchestrator:
                # Start orchestration in background
                orchestration_task = asyncio.create_task(
                    self._execute_session_orchestration(session)
                )
                self._background_tasks.append(orchestration_task)
            
            logger.info(f"Started orchestration session {session_id}")
            return True
            
        except Exception as e:
            session.update_state(SessionState.FAILED, f"Failed to start: {str(e)}")
            await self._handle_session_error(session, e)
            return False
    
    async def _execute_session_orchestration(self, session: OrchestrationSession):
        """Execute orchestration for session"""
        
        try:
            session.update_state(SessionState.EXECUTING, "Beginning orchestration")
            
            # Execute orchestration through knowledge-aware orchestrator
            result = await self.orchestrator.orchestrate_development_request(
                user_request=session.context.development_request,
                requirements=session.context.requirements,
                user_id=session.context.user_id,
                constraints=session.context.constraints
            )
            
            # Update session with results
            session.metrics.execution_time_seconds = (
                (datetime.now() - session.started_at).total_seconds() 
                if session.started_at else 0.0
            )
            
            # Complete session
            await self._complete_session(session, result)
            
        except Exception as e:
            logger.error(f"Session {session.session_id} orchestration failed: {str(e)}")
            session.update_state(SessionState.FAILED, f"Orchestration failed: {str(e)}")
            await self._handle_session_error(session, e)
    
    async def _complete_session(self, session: OrchestrationSession, result: Any):
        """Complete orchestration session"""
        
        session.update_state(SessionState.COMPLETING, "Finalizing results")
        
        # Calculate final metrics
        session.metrics.execution_time_seconds = (
            (datetime.now() - session.started_at).total_seconds() 
            if session.started_at else 0.0
        )
        
        # Move to completed state
        session.completed_at = datetime.now()
        session.update_state(SessionState.COMPLETED, "Session completed successfully")
        
        # Update global metrics
        self.session_metrics["total_sessions_completed"] += 1
        self._update_global_metrics()
        
        # Notify staff of completion
        if self.staff_manager:
            await self.staff_manager.notify_milestone_completion(
                session.session_id, "session_completion", {
                    "success_rate": session.metrics.success_rate,
                    "execution_time": session.metrics.execution_time_seconds,
                    "tasks_completed": session.metrics.completed_tasks,
                    "knowledge_contributions": session.metrics.knowledge_contributions
                }
            )
        
        # Archive session
        await self._archive_session(session)
        
        logger.info(f"Session {session.session_id} completed successfully")
    
    async def _handle_session_error(self, session: OrchestrationSession, error: Exception):
        """Handle session error"""
        
        # Record error in session
        error_event = {
            "timestamp": datetime.now().isoformat(),
            "error_type": type(error).__name__,
            "error_message": str(error),
            "session_state": session.state,
            "recovery_attempted": False
        }
        session.record_error(error_event)
        
        # Try error recovery if available
        if self.error_manager:
            try:
                recovery_result = await self.error_manager.handle_error(
                    error, session.session_id, {"session": session}
                )
                
                error_event["recovery_attempted"] = True
                error_event["recovery_successful"] = recovery_result is not None
                
                if recovery_result:
                    logger.info(f"Session {session.session_id} error recovered")
                    return
                    
            except Exception as recovery_error:
                logger.error(f"Error recovery failed: {str(recovery_error)}")
        
        # Update global metrics
        self.session_metrics["total_sessions_failed"] += 1
        
        # Archive failed session
        await self._archive_session(session)
        
        logger.error(f"Session {session.session_id} failed: {str(error)}")
    
    async def suspend_session(
        self, 
        session_id: str, 
        reason: str,
        resume_conditions: Dict[str, Any] = None
    ) -> bool:
        """Suspend active session"""
        
        if session_id not in self.active_sessions:
            return False
        
        session = self.active_sessions[session_id]
        
        if session.state not in [SessionState.EXECUTING, SessionState.PLANNING]:
            return False
        
        session.suspend(reason, resume_conditions)
        
        # Notify real-time coordinator
        if self.realtime_coordinator:
            await self.realtime_coordinator.notify_orchestration_progress(
                session_id,
                {
                    "event": "session_suspended",
                    "reason": reason,
                    "resume_conditions": resume_conditions
                }
            )
        
        return True
    
    async def resume_session(self, session_id: str) -> bool:
        """Resume suspended session"""
        
        if session_id not in self.active_sessions:
            return False
        
        session = self.active_sessions[session_id]
        
        if not session.can_resume():
            return False
        
        session.resume()
        
        # Restart orchestration if needed
        if session.state == SessionState.EXECUTING and self.orchestrator:
            orchestration_task = asyncio.create_task(
                self._execute_session_orchestration(session)
            )
            self._background_tasks.append(orchestration_task)
        
        # Notify real-time coordinator
        if self.realtime_coordinator:
            await self.realtime_coordinator.notify_orchestration_progress(
                session_id,
                {"event": "session_resumed"}
            )
        
        return True
    
    async def abort_session(self, session_id: str, reason: str) -> bool:
        """Abort active session"""
        
        if session_id not in self.active_sessions:
            return False
        
        session = self.active_sessions[session_id]
        session.update_state(SessionState.ABORTED, f"Aborted: {reason}")
        
        # Cancel any active tasks
        for task_id in list(session.active_tasks.keys()):
            # Task cancellation logic would go here
            pass
        
        # Archive session
        await self._archive_session(session)
        
        logger.warning(f"Session {session_id} aborted: {reason}")
        
        return True
    
    def get_session(self, session_id: str) -> Optional[OrchestrationSession]:
        """Get session by ID"""
        
        session = self.active_sessions.get(session_id)
        if not session:
            session = self.session_history.get(session_id)
        
        return session
    
    def get_session_snapshot(self, session_id: str) -> Optional[SessionSnapshot]:
        """Get session snapshot"""
        
        session = self.get_session(session_id)
        if not session:
            return None
        
        return session.get_snapshot()
    
    def list_active_sessions(self) -> List[SessionSnapshot]:
        """List all active sessions"""
        
        return [session.get_snapshot() for session in self.active_sessions.values()]
    
    def list_sessions_by_user(self, user_id: str) -> List[SessionSnapshot]:
        """List sessions for specific user"""
        
        sessions = []
        
        # Check active sessions
        for session in self.active_sessions.values():
            if session.context.user_id == user_id:
                sessions.append(session.get_snapshot())
        
        # Check session history
        for session in self.session_history.values():
            if session.context.user_id == user_id:
                sessions.append(session.get_snapshot())
        
        return sessions
    
    async def _archive_session(self, session: OrchestrationSession):
        """Archive completed/failed session"""
        
        # Move to history
        if session.session_id in self.active_sessions:
            del self.active_sessions[session.session_id]
        
        self.session_history[session.session_id] = session
        
        # Remove from resource allocation
        if session.session_id in self.resource_allocation:
            del self.resource_allocation[session.session_id]
        
        # Notify callbacks
        for callback in self.global_session_callbacks:
            try:
                await callback("session_archived", session)
            except Exception as e:
                logger.error(f"Session callback failed: {str(e)}")
    
    async def _on_session_state_change(
        self, 
        session: OrchestrationSession, 
        old_state: SessionState, 
        new_state: SessionState
    ):
        """Handle session state changes"""
        
        # Notify real-time coordinator
        if self.realtime_coordinator:
            await self.realtime_coordinator.notify_orchestration_progress(
                session.session_id,
                {
                    "event": "state_change",
                    "old_state": old_state,
                    "new_state": new_state,
                    "progress": session.get_progress_percentage(),
                    "active_tasks": len(session.active_tasks)
                }
            )
        
        # Handle specific state transitions
        if new_state == SessionState.COMPLETED:
            self.session_metrics["total_sessions_completed"] += 1
        elif new_state == SessionState.FAILED:
            self.session_metrics["total_sessions_failed"] += 1
    
    async def _on_session_progress(
        self, 
        session: OrchestrationSession, 
        task_response: BotResponse
    ):
        """Handle session progress updates"""
        
        # Notify real-time coordinator
        if self.realtime_coordinator:
            await self.realtime_coordinator.notify_task_completion(
                session.session_id, task_response
            )
    
    def _assess_session_complexity(self, session: OrchestrationSession) -> Dict[str, Any]:
        """Assess session complexity for staff assignment"""
        
        request = session.context.development_request.lower()
        requirements = " ".join(session.context.requirements).lower()
        combined_text = f"{request} {requirements}"
        
        complexity_indicators = [
            "real-time", "machine learning", "ai", "distributed", "scalable",
            "microservices", "kubernetes", "video processing", "neural network",
            "enterprise", "multi-tenant", "international", "compliance"
        ]
        
        complexity_score = sum(1 for indicator in complexity_indicators if indicator in combined_text)
        normalized_score = min(complexity_score / len(complexity_indicators) * 2, 1.0)
        
        return {
            "complexity_score": normalized_score,
            "security_requirements": any(word in combined_text for word in ["security", "auth", "compliance"]),
            "legal_considerations": any(word in combined_text for word in ["patent", "legal", "ip", "trademark"]),
            "estimated_duration_hours": len(session.context.requirements) * 8 + (40 if normalized_score > 0.5 else 20)
        }
    
    def _extract_project_name(self, development_request: str) -> str:
        """Extract project name from development request"""
        
        words = development_request.split()[:5]
        return " ".join(words).title()
    
    def _update_global_metrics(self):
        """Update global session metrics"""
        
        total_sessions = (
            self.session_metrics["total_sessions_completed"] + 
            self.session_metrics["total_sessions_failed"]
        )
        
        if total_sessions == 0:
            return
        
        # Calculate averages from archived sessions
        total_execution_time = 0.0
        total_success_rate = 0.0
        
        for session in self.session_history.values():
            total_execution_time += session.metrics.execution_time_seconds
            total_success_rate += session.metrics.success_rate
        
        self.session_metrics["average_execution_time"] = total_execution_time / total_sessions
        self.session_metrics["average_success_rate"] = total_success_rate / total_sessions
    
    async def _cleanup_service(self):
        """Background service for session cleanup"""
        
        while True:
            try:
                await asyncio.sleep(300)  # Run every 5 minutes
                
                # Clean up old session history (keep last 1000 sessions)
                if len(self.session_history) > 1000:
                    # Sort by completion time and keep most recent
                    sorted_sessions = sorted(
                        self.session_history.values(),
                        key=lambda s: s.completed_at or s.created_at,
                        reverse=True
                    )
                    
                    sessions_to_keep = {s.session_id: s for s in sorted_sessions[:1000]}
                    self.session_history = sessions_to_keep
                    
                    logger.info(f"Cleaned up old session history, kept {len(sessions_to_keep)} sessions")
                
                # Clean up stale active sessions (over 24 hours old)
                stale_cutoff = datetime.now() - timedelta(hours=24)
                stale_sessions = [
                    session_id for session_id, session in self.active_sessions.items()
                    if session.last_activity < stale_cutoff
                ]
                
                for session_id in stale_sessions:
                    await self.abort_session(session_id, "Session timeout - no activity")
                    logger.warning(f"Aborted stale session: {session_id}")
                
            except Exception as e:
                logger.error(f"Session cleanup service error: {str(e)}")
    
    async def _monitoring_service(self):
        """Background service for session monitoring"""
        
        while True:
            try:
                await asyncio.sleep(60)  # Run every minute
                
                # Update session estimates
                for session in self.active_sessions.values():
                    if session.state == SessionState.EXECUTING:
                        session.estimate_completion_time()
                
                # Log session statistics
                if len(self.active_sessions) > 0:
                    states = [s.state for s in self.active_sessions.values()]
                    state_counts = {state: states.count(state) for state in set(states)}
                    
                    logger.debug(f"Active sessions by state: {state_counts}")
                
            except Exception as e:
                logger.error(f"Session monitoring service error: {str(e)}")
    
    def add_global_session_callback(self, callback: Callable):
        """Add global session callback"""
        self.global_session_callbacks.append(callback)
    
    def remove_global_session_callback(self, callback: Callable):
        """Remove global session callback"""
        if callback in self.global_session_callbacks:
            self.global_session_callbacks.remove(callback)
    
    def get_session_metrics(self) -> Dict[str, Any]:
        """Get comprehensive session metrics"""
        
        return {
            "global_metrics": self.session_metrics.copy(),
            "active_sessions_count": len(self.active_sessions),
            "session_history_count": len(self.session_history),
            "max_concurrent_sessions": self.max_concurrent_sessions,
            "current_state_distribution": {
                state: sum(1 for s in self.active_sessions.values() if s.state == state)
                for state in SessionState
            }
        }
    
    async def shutdown(self):
        """Shutdown session manager"""
        
        logger.info("Shutting down session manager...")
        
        # Cancel background tasks
        for task in self._background_tasks:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
        
        # Suspend all active sessions
        for session_id in list(self.active_sessions.keys()):
            await self.suspend_session(session_id, "System shutdown")
        
        self._background_tasks.clear()
        self.global_session_callbacks.clear()
        
        logger.info("Session manager shutdown complete")
