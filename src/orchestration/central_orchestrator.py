"""
AMT Central Orchestrator
Core orchestration service for coordinating specialized AI agents
"""

import asyncio
import httpx
import logging
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import json
from contextlib import asynccontextmanager

from ..shared.orchestration_protocol import (
    BotType, TaskStatus, BotRequest, BotResponse, OrchestrationContext,
    TaskDefinition, OrchestrationPlan, OrchestrationError, 
    BotCommunicationError, TaskTimeoutError, DependencyError,
    AMT_TASK_TYPES, TRIANGLE_DEFENSE_INTEGRATION
)

logger = logging.getLogger(__name__)

class CentralOrchestrator:
    """Central coordination service for AMT AI agent orchestration"""
    
    def __init__(self, bot_endpoints: Dict[BotType, str], timeout: int = 300):
        self.bot_endpoints = bot_endpoints
        self.default_timeout = timeout
        self.active_sessions: Dict[str, OrchestrationContext] = {}
        self.active_tasks: Dict[str, BotRequest] = {}
        self.completed_tasks: Dict[str, BotResponse] = {}
        self.session_plans: Dict[str, OrchestrationPlan] = {}
        
        # AMT-specific configuration
        self.triangle_defense_required = TRIANGLE_DEFENSE_INTEGRATION["analysis_required"]
        self.staff_notification_enabled = True
        
    async def orchestrate_development_request(
        self, 
        user_request: str, 
        requirements: List[str],
        user_id: str,
        constraints: Optional[Dict] = None
    ) -> str:
        """
        Main orchestration entry point for development requests
        Returns session_id for tracking
        """
        
        # Create orchestration context
        context = OrchestrationContext(
            user_id=user_id,
            project_name=self._extract_project_name(user_request),
            development_request=user_request,
            requirements=requirements,
            constraints=constraints or {}
        )
        
        self.active_sessions[context.session_id] = context
        
        try:
            # Phase 1: Create orchestration plan
            plan = await self._create_orchestration_plan(context)
            self.session_plans[context.session_id] = plan
            
            # Phase 2: Execute orchestration plan
            results = await self._execute_orchestration_plan(context, plan)
            
            # Phase 3: Synthesize results and generate output
            final_output = await self._synthesize_results(context, results)
            
            logger.info(f"Orchestration completed for session {context.session_id}")
            return context.session_id
            
        except Exception as e:
            logger.error(f"Orchestration failed for session {context.session_id}: {str(e)}")
            await self._handle_orchestration_failure(context.session_id, str(e))
            raise OrchestrationError(f"Orchestration failed: {str(e)}", session_id=context.session_id)
    
    async def _create_orchestration_plan(self, context: OrchestrationContext) -> OrchestrationPlan:
        """Create detailed execution plan for orchestration"""
        
        # Analyze request to determine required bot tasks
        required_tasks = await self._analyze_required_tasks(context.development_request, context.requirements)
        
        # Phase 1: Parallel analysis tasks
        phase_1_tasks = []
        for bot_type, tasks in required_tasks.items():
            for task_type in tasks:
                task_def = TaskDefinition(
                    task_type=task_type,
                    bot_type=bot_type,
                    phase=1,
                    estimated_duration_seconds=self._estimate_task_duration(bot_type, task_type)
                )
                phase_1_tasks.append(task_def)
        
        # Phase 2: Synthesis and coordination tasks
        phase_2_tasks = [
            TaskDefinition(
                task_type="synthesize_bot_outputs",
                bot_type=BotType.COORDINATION,
                phase=2,
                depends_on=[task.task_id for task in phase_1_tasks],
                estimated_duration_seconds=180
            )
        ]
        
        # Phase 3: Implementation tasks (depends on synthesis)
        phase_3_tasks = [
            TaskDefinition(
                task_type="generate_application_code",
                bot_type=BotType.COORDINATION,
                phase=3,
                depends_on=[task.task_id for task in phase_2_tasks],
                estimated_duration_seconds=300
            )
        ]
        
        total_duration = (
            max([task.estimated_duration_seconds for task in phase_1_tasks], default=0) +
            sum([task.estimated_duration_seconds for task in phase_2_tasks]) +
            sum([task.estimated_duration_seconds for task in phase_3_tasks])
        )
        
        plan = OrchestrationPlan(
            session_id=context.session_id,
            total_tasks=len(phase_1_tasks) + len(phase_2_tasks) + len(phase_3_tasks),
            phases=[phase_1_tasks, phase_2_tasks, phase_3_tasks],
            estimated_total_duration_seconds=total_duration,
            critical_path=[task.task_id for task in phase_2_tasks + phase_3_tasks]
        )
        
        return plan
    
    async def _execute_orchestration_plan(
        self, 
        context: OrchestrationContext, 
        plan: OrchestrationPlan
    ) -> Dict[str, List[BotResponse]]:
        """Execute orchestration plan phase by phase"""
        
        phase_results = {}
        
        for phase_num, tasks in enumerate(plan.phases, 1):
            logger.info(f"Executing Phase {phase_num} with {len(tasks)} tasks")
            
            if phase_num == 1:
                # Phase 1: Parallel execution
                phase_results[f"phase_{phase_num}"] = await self._execute_parallel_tasks(tasks, context)
            else:
                # Phase 2+: Sequential execution with dependencies
                phase_results[f"phase_{phase_num}"] = await self._execute_sequential_tasks(tasks, context)
        
        return phase_results
    
    async def _execute_parallel_tasks(
        self, 
        tasks: List[TaskDefinition], 
        context: OrchestrationContext
    ) -> List[BotResponse]:
        """Execute tasks in parallel for maximum efficiency"""
        
        # Create bot requests
        requests = []
        for task in tasks:
            bot_request = BotRequest(
                session_id=context.session_id,
                bot_type=task.bot_type,
                task_type=task.task_type,
                parameters={
                    "development_request": context.development_request,
                    "requirements": context.requirements,
                    "project_name": context.project_name,
                    "session_context": context.shared_artifacts
                },
                timeout_seconds=task.estimated_duration_seconds
            )
            requests.append(bot_request)
            self.active_tasks[bot_request.request_id] = bot_request
        
        # Execute all requests in parallel
        tasks_coroutines = [
            self._send_bot_request(request) for request in requests
        ]
        
        try:
            responses = await asyncio.gather(*tasks_coroutines, return_exceptions=True)
        except Exception as e:
            logger.error(f"Parallel task execution failed: {str(e)}")
            raise OrchestrationError(f"Parallel execution failed: {str(e)}")
        
        # Process responses and handle exceptions
        processed_responses = []
        for i, response in enumerate(responses):
            if isinstance(response, Exception):
                # Create error response
                error_response = BotResponse(
                    request_id=requests[i].request_id,
                    session_id=context.session_id,
                    bot_type=requests[i].bot_type,
                    status=TaskStatus.FAILED,
                    error_message=str(response),
                    confidence_score=0.0,
                    execution_time_seconds=0.0
                )
                processed_responses.append(error_response)
                logger.error(f"Task failed for {requests[i].bot_type}: {str(response)}")
            else:
                processed_responses.append(response)
                self.completed_tasks[response.request_id] = response
                
        return processed_responses
    
    async def _execute_sequential_tasks(
        self, 
        tasks: List[TaskDefinition], 
        context: OrchestrationContext
    ) -> List[BotResponse]:
        """Execute tasks sequentially with dependency resolution"""
        
        responses = []
        
        for task in tasks:
            # Check dependencies
            await self._wait_for_dependencies(task.depends_on, context.session_id)
            
            # Create request with dependency results
            dependency_results = {
                req_id: self.completed_tasks[req_id].result 
                for req_id in task.depends_on 
                if req_id in self.completed_tasks
            }
            
            bot_request = BotRequest(
                session_id=context.session_id,
                bot_type=task.bot_type,
                task_type=task.task_type,
                parameters={
                    "development_request": context.development_request,
                    "requirements": context.requirements,
                    "dependency_results": dependency_results,
                    "session_context": context.shared_artifacts
                },
                timeout_seconds=task.estimated_duration_seconds
            )
            
            try:
                response = await self._send_bot_request(bot_request)
                responses.append(response)
                self.completed_tasks[response.request_id] = response
                
            except Exception as e:
                logger.error(f"Sequential task failed for {task.bot_type}: {str(e)}")
                error_response = BotResponse(
                    request_id=bot_request.request_id,
                    session_id=context.session_id,
                    bot_type=task.bot_type,
                    status=TaskStatus.FAILED,
                    error_message=str(e),
                    confidence_score=0.0,
                    execution_time_seconds=0.0
                )
                responses.append(error_response)
        
        return responses
    
    async def _send_bot_request(self, request: BotRequest) -> BotResponse:
        """Send request to specific bot and handle response"""
        
        if request.bot_type not in self.bot_endpoints:
            raise BotCommunicationError(f"No endpoint configured for {request.bot_type}")
        
        endpoint = self.bot_endpoints[request.bot_type]
        
        async with httpx.AsyncClient(timeout=request.timeout_seconds) as client:
            try:
                logger.info(f"Sending {request.task_type} request to {request.bot_type}")
                
                response = await client.post(
                    f"{endpoint}/orchestration/{request.task_type}",
                    json=request.dict(),
                    headers={
                        "Content-Type": "application/json",
                        "X-AMT-Orchestration": "true",
                        "X-Session-ID": request.session_id
                    }
                )
                response.raise_for_status()
                
                bot_response = BotResponse(**response.json())
                logger.info(f"Received response from {request.bot_type}: {bot_response.status}")
                
                return bot_response
                
            except httpx.TimeoutException:
                raise TaskTimeoutError(f"Bot {request.bot_type} request timed out", request.bot_type, request.session_id)
            except httpx.HTTPStatusError as e:
                raise BotCommunicationError(f"Bot {request.bot_type} returned {e.response.status_code}", request.bot_type, request.session_id)
            except Exception as e:
                raise BotCommunicationError(f"Bot {request.bot_type} communication failed: {str(e)}", request.bot_type, request.session_id)
    
    async def _analyze_required_tasks(
        self, 
        development_request: str, 
        requirements: List[str]
    ) -> Dict[BotType, List[str]]:
        """Analyze development request to determine required bot tasks"""
        
        required_tasks = {}
        request_lower = development_request.lower()
        requirements_text = " ".join(requirements).lower()
        combined_text = f"{request_lower} {requirements_text}"
        
        # Design tasks
        if any(keyword in combined_text for keyword in ["ui", "ux", "design", "interface", "user"]):
            required_tasks[BotType.DESIGN] = ["analyze_ux_requirements", "generate_design_system"]
        
        # AI/ML tasks  
        if any(keyword in combined_text for keyword in ["ai", "ml", "intelligence", "algorithm", "model"]):
            required_tasks[BotType.AI_RESEARCH] = ["design_ml_architecture", "plan_ai_deployment"]
        
        # DevOps tasks
        if any(keyword in combined_text for keyword in ["deploy", "infrastructure", "scale", "performance"]):
            required_tasks[BotType.DEVOPS] = ["plan_infrastructure", "design_cicd_pipeline"]
        
        # Innovation tasks
        if any(keyword in combined_text for keyword in ["competitive", "market", "patent", "innovation"]):
            required_tasks[BotType.INNOVATION] = ["analyze_competitive_landscape", "score_innovation_potential"]
        
        # Always include coordination
        required_tasks[BotType.COORDINATION] = ["orchestrate_session"]
        
        return required_tasks
    
    async def _synthesize_results(
        self, 
        context: OrchestrationContext, 
        results: Dict[str, List[BotResponse]]
    ) -> Dict[str, any]:
        """Synthesize bot responses into final output"""
        
        synthesis = {
            "session_id": context.session_id,
            "project_name": context.project_name,
            "execution_summary": {},
            "bot_contributions": {},
            "generated_artifacts": {},
            "triangle_defense_compliance": self._check_triangle_defense_compliance(results),
            "success_rate": self._calculate_success_rate(results),
            "total_execution_time": sum([
                response.execution_time_seconds 
                for phase_responses in results.values()
                for response in phase_responses
            ])
        }
        
        # Collect bot contributions
        for phase_name, phase_responses in results.items():
            for response in phase_responses:
                if response.status == TaskStatus.COMPLETED:
                    bot_key = f"{response.bot_type}_{response.request_id}"
                    synthesis["bot_contributions"][bot_key] = {
                        "result": response.result,
                        "confidence": response.confidence_score,
                        "artifacts": response.artifacts
                    }
        
        return synthesis
    
    def _extract_project_name(self, development_request: str) -> str:
        """Extract meaningful project name from development request"""
        # Simple extraction - can be enhanced with NLP
        words = development_request.split()[:5]
        return " ".join(words).title()
    
    def _estimate_task_duration(self, bot_type: BotType, task_type: str) -> int:
        """Estimate task duration based on bot type and task complexity"""
        duration_map = {
            BotType.DESIGN: {"analyze_ux_requirements": 240, "generate_design_system": 300},
            BotType.AI_RESEARCH: {"design_ml_architecture": 360, "plan_ai_deployment": 180},
            BotType.DEVOPS: {"plan_infrastructure": 300, "design_cicd_pipeline": 240},
            BotType.INNOVATION: {"analyze_competitive_landscape": 420, "score_innovation_potential": 180},
            BotType.COORDINATION: {"orchestrate_session": 120, "synthesize_bot_outputs": 180}
        }
        
        return duration_map.get(bot_type, {}).get(task_type, 300)
    
    async def _wait_for_dependencies(self, dependency_ids: List[str], session_id: str):
        """Wait for dependency tasks to complete"""
        max_wait_time = 600  # 10 minutes
        check_interval = 5   # 5 seconds
        
        start_time = datetime.now()
        
        while True:
            all_completed = all(
                dep_id in self.completed_tasks for dep_id in dependency_ids
            )
            
            if all_completed:
                return
                
            if (datetime.now() - start_time).total_seconds() > max_wait_time:
                raise DependencyError(f"Dependencies not completed within timeout", session_id=session_id)
                
            await asyncio.sleep(check_interval)
    
    def _check_triangle_defense_compliance(self, results: Dict[str, List[BotResponse]]) -> bool:
        """Verify Triangle Defense methodology integration"""
        if not self.triangle_defense_required:
            return True
            
        # Check if any bot included Triangle Defense analysis
        for phase_responses in results.values():
            for response in phase_responses:
                if response.result and "triangle_defense" in str(response.result).lower():
                    return True
                    
        return False
    
    def _calculate_success_rate(self, results: Dict[str, List[BotResponse]]) -> float:
        """Calculate overall success rate of orchestration"""
        total_tasks = sum(len(responses) for responses in results.values())
        if total_tasks == 0:
            return 0.0
            
        successful_tasks = sum(
            1 for phase_responses in results.values()
            for response in phase_responses
            if response.status == TaskStatus.COMPLETED
        )
        
        return successful_tasks / total_tasks
    
    async def _handle_orchestration_failure(self, session_id: str, error_message: str):
        """Handle orchestration failure with cleanup and notification"""
        logger.error(f"Orchestration failure for session {session_id}: {error_message}")
        
        # Clean up active tasks
        if session_id in self.active_sessions:
            del self.active_sessions[session_id]
        
        # Remove from active task tracking
        tasks_to_remove = [
            task_id for task_id, task in self.active_tasks.items()
            if task.session_id == session_id
        ]
        for task_id in tasks_to_remove:
            del self.active_tasks[task_id]
    
    def get_session_status(self, session_id: str) -> Optional[Dict]:
        """Get current status of orchestration session"""
        if session_id not in self.active_sessions:
            return None
            
        context = self.active_sessions[session_id]
        plan = self.session_plans.get(session_id)
        
        completed_count = len([
            task for task in self.completed_tasks.values()
            if task.session_id == session_id
        ])
        
        total_count = plan.total_tasks if plan else 0
        
        return {
            "session_id": session_id,
            "status": "active" if completed_count < total_count else "completed",
            "progress": completed_count / max(total_count, 1),
            "completed_tasks": completed_count,
            "total_tasks": total_count,
            "context": context.dict()
        }
