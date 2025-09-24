"""
AMT Bot Orchestration Middleware
FastAPI middleware and endpoints for integrating existing bots with orchestration system
"""

import asyncio
import time
import logging
import json
from typing import Dict, List, Optional, Any, Callable
from datetime import datetime
from fastapi import FastAPI, Request, Response, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.base import BaseHTTPMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import httpx

from ..shared.orchestration_protocol import (
    BotType, TaskStatus, BotRequest, BotResponse, OrchestrationContext,
    KnowledgeUpdate, HealthCheck, OrchestrationError
)
from ..orchestration.bot_integration_layer import BotIntegrationMixin

logger = logging.getLogger(__name__)

class OrchestrationMiddleware(BaseHTTPMiddleware):
    """Middleware to add orchestration capabilities to existing bots"""
    
    def __init__(self, app: FastAPI, bot_type: BotType, bot_integration: BotIntegrationMixin):
        super().__init__(app)
        self.bot_type = bot_type
        self.bot_integration = bot_integration
        self.request_metrics = {}
        
    async def dispatch(self, request: Request, call_next):
        """Process requests with orchestration context"""
        
        start_time = time.time()
        
        # Check for orchestration headers
        is_orchestration_request = request.headers.get("X-AMT-Orchestration") == "true"
        session_id = request.headers.get("X-Session-ID")
        
        # Add orchestration context to request
        if is_orchestration_request:
            request.state.orchestration = {
                "enabled": True,
                "session_id": session_id,
                "bot_type": self.bot_type,
                "request_time": datetime.now()
            }
        
        try:
            # Process request
            response = await call_next(request)
            
            # Record metrics for orchestration requests
            if is_orchestration_request:
                duration = time.time() - start_time
                await self._record_orchestration_metrics(
                    session_id, duration, response.status_code, None
                )
            
            return response
            
        except Exception as e:
            # Record error metrics
            if is_orchestration_request:
                duration = time.time() - start_time
                await self._record_orchestration_metrics(
                    session_id, duration, 500, str(e)
                )
            
            raise
    
    async def _record_orchestration_metrics(
        self, 
        session_id: str, 
        duration: float, 
        status_code: int, 
        error_message: Optional[str]
    ):
        """Record metrics for orchestration requests"""
        
        if not hasattr(self.bot_integration, 'health_metrics'):
            return
        
        metrics = self.bot_integration.health_metrics
        
        if status_code == 200:
            metrics["successful_tasks"] += 1
        else:
            metrics["failed_tasks"] += 1
        
        metrics["total_execution_time"] += duration
        metrics["last_successful_task"] = datetime.now() if status_code == 200 else metrics.get("last_successful_task")

class OrchestrationEndpoints:
    """Standard orchestration endpoints for bot integration"""
    
    def __init__(self, bot_type: BotType, bot_integration: BotIntegrationMixin):
        self.bot_type = bot_type
        self.bot_integration = bot_integration
        self.security = HTTPBearer()
    
    def register_endpoints(self, app: FastAPI):
        """Register orchestration endpoints with FastAPI app"""
        
        @app.post("/orchestration/{task_type}")
        async def handle_orchestration_task(
            task_type: str,
            request: dict,
            background_tasks: BackgroundTasks,
            credentials: HTTPAuthorizationCredentials = Depends(self.security)
        ):
            """Handle orchestration task requests"""
            
            try:
                # Validate orchestration request
                bot_request = BotRequest(**request)
                
                if bot_request.bot_type != self.bot_type:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Request for {bot_request.bot_type} sent to {self.bot_type}"
                    )
                
                # Process request through integration layer
                response = await self.bot_integration.handle_orchestration_request(bot_request)
                
                # Send response to orchestration system (background task)
                if response.status == TaskStatus.COMPLETED:
                    background_tasks.add_task(
                        self._notify_orchestration_system,
                        bot_request.session_id,
                        response
                    )
                
                return response.dict()
                
            except Exception as e:
                logger.error(f"Orchestration task failed: {str(e)}")
                
                error_response = BotResponse(
                    request_id=request.get("request_id", "unknown"),
                    session_id=request.get("session_id", "unknown"),
                    bot_type=self.bot_type,
                    status=TaskStatus.FAILED,
                    error_message=str(e),
                    confidence_score=0.0,
                    execution_time_seconds=0.0
                )
                
                return error_response.dict()
        
        @app.get("/orchestration/health")
        async def get_orchestration_health():
            """Get bot health status for orchestration"""
            
            health_check = self.bot_integration.get_health_status()
            return health_check.dict()
        
        @app.post("/orchestration/context")
        async def update_orchestration_context(context_update: dict):
            """Receive orchestration context updates"""
            
            try:
                session_id = context_update.get("session_id")
                context_data = context_update.get("context", {})
                
                # Store context in bot integration
                if hasattr(self.bot_integration, 'active_sessions'):
                    self.bot_integration.active_sessions[session_id] = context_data
                
                return {"status": "context_updated", "session_id": session_id}
                
            except Exception as e:
                logger.error(f"Context update failed: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @app.post("/orchestration/knowledge")
        async def contribute_knowledge(knowledge_update: dict):
            """Receive knowledge contributions from bot"""
            
            try:
                update = KnowledgeUpdate(**knowledge_update)
                
                # Store knowledge contribution
                if hasattr(self.bot_integration, 'knowledge_cache'):
                    self.bot_integration.knowledge_cache[update.session_id] = update
                
                return {"status": "knowledge_received", "session_id": update.session_id}
                
            except Exception as e:
                logger.error(f"Knowledge contribution failed: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @app.get("/orchestration/capabilities")
        async def get_bot_capabilities():
            """Get bot capabilities and available tasks"""
            
            capabilities = {
                "bot_type": self.bot_type,
                "available_tasks": list(self.bot_integration.task_handlers.keys()),
                "health_status": self.bot_integration.get_health_status().status,
                "orchestration_enabled": self.bot_integration.orchestration_enabled,
                "supported_features": self._get_supported_features()
            }
            
            return capabilities
    
    async def _notify_orchestration_system(self, session_id: str, response: BotResponse):
        """Notify orchestration system of task completion (background task)"""
        
        try:
            # This would send completion notification back to orchestration system
            # For now, just log the completion
            logger.info(f"Task completed for session {session_id}: {response.request_id}")
            
            # In a full implementation, this would make an HTTP request to the orchestration service
            # async with httpx.AsyncClient() as client:
            #     await client.post(
            #         f"http://orchestration-service:8000/api/v1/orchestration/sessions/{session_id}/task-completion",
            #         json=response.dict()
            #     )
            
        except Exception as e:
            logger.error(f"Failed to notify orchestration system: {str(e)}")
    
    def _get_supported_features(self) -> List[str]:
        """Get list of supported orchestration features"""
        
        features = ["task_execution", "health_monitoring"]
        
        if hasattr(self.bot_integration, 'knowledge_cache'):
            features.append("knowledge_contribution")
        
        if hasattr(self.bot_integration, 'active_sessions'):
            features.append("context_awareness")
        
        return features

class BotEnhancementFactory:
    """Factory for creating bot enhancement configurations"""
    
    @staticmethod
    def create_maya_patel_enhancements() -> Dict[str, Any]:
        """Create enhancements for Maya Patel (Design) bot"""
        
        return {
            "bot_type": BotType.DESIGN,
            "orchestration_tasks": {
                "analyze_ux_requirements": {
                    "description": "Analyze UX requirements with orchestration context",
                    "timeout_seconds": 240,
                    "requires_context": True,
                    "outputs": ["design_analysis", "wireframes", "component_library"]
                },
                "generate_design_system": {
                    "description": "Generate design system tokens and components",
                    "timeout_seconds": 300,
                    "requires_context": True,
                    "outputs": ["design_tokens", "component_specs", "style_guide"]
                },
                "create_interactive_prototype": {
                    "description": "Create interactive prototype with Figma integration",
                    "timeout_seconds": 600,
                    "requires_context": True,
                    "outputs": ["figma_prototype", "interaction_specs", "user_flows"]
                },
                "optimize_user_experience": {
                    "description": "Optimize user experience based on AMT principles",
                    "timeout_seconds": 180,
                    "requires_context": True,
                    "outputs": ["ux_improvements", "accessibility_enhancements", "performance_optimizations"]
                }
            },
            "knowledge_contributions": [
                "design_patterns",
                "user_experience_insights",
                "accessibility_best_practices",
                "component_reusability_metrics"
            ],
            "integration_points": {
                "figma_api": "enabled",
                "design_system_sync": "enabled",
                "component_library_updates": "enabled"
            }
        }
    
    @staticmethod
    def create_rachel_foster_enhancements() -> Dict[str, Any]:
        """Create enhancements for Dr. Rachel Foster (AI Research) bot"""
        
        return {
            "bot_type": BotType.AI_RESEARCH,
            "orchestration_tasks": {
                "design_ml_architecture": {
                    "description": "Design ML architecture with Triangle Defense integration",
                    "timeout_seconds": 360,
                    "requires_context": True,
                    "outputs": ["ml_architecture", "model_specifications", "training_pipeline"]
                },
                "optimize_neural_networks": {
                    "description": "Optimize neural network architectures for performance",
                    "timeout_seconds": 480,
                    "requires_context": True,
                    "outputs": ["optimized_models", "performance_metrics", "deployment_specs"]
                },
                "analyze_algorithm_performance": {
                    "description": "Analyze and improve algorithm performance",
                    "timeout_seconds": 300,
                    "requires_context": True,
                    "outputs": ["performance_analysis", "optimization_recommendations", "benchmark_results"]
                },
                "integrate_triangle_defense": {
                    "description": "Integrate Triangle Defense methodology into AI models",
                    "timeout_seconds": 420,
                    "requires_context": True,
                    "outputs": ["td_integration_plan", "model_adaptations", "validation_results"]
                }
            },
            "knowledge_contributions": [
                "ml_architecture_patterns",
                "performance_optimization_techniques",
                "triangle_defense_ai_integration",
                "neural_network_insights"
            ],
            "integration_points": {
                "sagemaker_integration": "enabled",
                "model_registry": "enabled",
                "triangle_defense_api": "enabled",
                "performance_monitoring": "enabled"
            }
        }
    
    @staticmethod
    def create_jake_morrison_enhancements() -> Dict[str, Any]:
        """Create enhancements for Jake Morrison (DevOps) bot"""
        
        return {
            "bot_type": BotType.DEVOPS,
            "orchestration_tasks": {
                "design_infrastructure": {
                    "description": "Design scalable infrastructure with Kubernetes",
                    "timeout_seconds": 300,
                    "requires_context": True,
                    "outputs": ["infrastructure_plan", "terraform_configs", "k8s_manifests"]
                },
                "setup_cicd_pipeline": {
                    "description": "Setup comprehensive CI/CD pipeline",
                    "timeout_seconds": 240,
                    "requires_context": True,
                    "outputs": ["pipeline_config", "deployment_strategy", "testing_framework"]
                },
                "configure_monitoring": {
                    "description": "Configure comprehensive monitoring and alerting",
                    "timeout_seconds": 180,
                    "requires_context": True,
                    "outputs": ["monitoring_config", "alert_rules", "dashboards"]
                },
                "optimize_performance": {
                    "description": "Optimize system performance and resource usage",
                    "timeout_seconds": 360,
                    "requires_context": True,
                    "outputs": ["performance_optimizations", "resource_scaling", "cost_analysis"]
                }
            },
            "knowledge_contributions": [
                "infrastructure_patterns",
                "deployment_best_practices",
                "performance_optimization_strategies",
                "cost_management_insights"
            ],
            "integration_points": {
                "terraform_state_management": "enabled",
                "kubernetes_api": "enabled",
                "monitoring_systems": "enabled",
                "cost_tracking": "enabled"
            }
        }
    
    @staticmethod
    def create_david_kim_enhancements() -> Dict[str, Any]:
        """Create enhancements for Prof. David Kim (Innovation) bot"""
        
        return {
            "bot_type": BotType.INNOVATION,
            "orchestration_tasks": {
                "analyze_competitive_landscape": {
                    "description": "Comprehensive competitive analysis with patent research",
                    "timeout_seconds": 420,
                    "requires_context": True,
                    "outputs": ["competitive_analysis", "patent_landscape", "market_opportunities"]
                },
                "score_innovation_potential": {
                    "description": "Score innovation potential using multi-factor analysis",
                    "timeout_seconds": 240,
                    "requires_context": True,
                    "outputs": ["innovation_score", "risk_assessment", "recommendation_matrix"]
                },
                "research_technology_trends": {
                    "description": "Research emerging technology trends and opportunities",
                    "timeout_seconds": 360,
                    "requires_context": True,
                    "outputs": ["trend_analysis", "technology_roadmap", "adoption_predictions"]
                },
                "develop_ip_strategy": {
                    "description": "Develop intellectual property protection strategy",
                    "timeout_seconds": 300,
                    "requires_context": True,
                    "outputs": ["ip_strategy", "patent_recommendations", "protection_timeline"]
                }
            },
            "knowledge_contributions": [
                "competitive_intelligence",
                "innovation_patterns",
                "technology_trends",
                "ip_strategy_insights"
            ],
            "integration_points": {
                "patent_databases": "enabled",
                "github_analytics": "enabled",
                "market_research_apis": "enabled",
                "competitive_monitoring": "enabled"
            }
        }

async def enhance_existing_bot(
    app: FastAPI,
    bot_type: BotType,
    enhancement_config: Dict[str, Any],
    integration_instance: Optional[BotIntegrationMixin] = None
) -> Dict[str, Any]:
    """Enhance existing bot with orchestration capabilities"""
    
    try:
        # Create bot integration instance if not provided
        if integration_instance is None:
            if bot_type == BotType.DESIGN:
                from ..orchestration.bot_integration_layer import MayaPatelBotIntegration
                integration_instance = MayaPatelBotIntegration()
            elif bot_type == BotType.AI_RESEARCH:
                from ..orchestration.bot_integration_layer import RachelFosterBotIntegration
                integration_instance = RachelFosterBotIntegration()
            elif bot_type == BotType.DEVOPS:
                from ..orchestration.bot_integration_layer import JakeMorrisonBotIntegration
                integration_instance = JakeMorrisonBotIntegration()
            elif bot_type == BotType.INNOVATION:
                from ..orchestration.bot_integration_layer import DavidKimBotIntegration
                integration_instance = DavidKimBotIntegration()
            else:
                raise ValueError(f"Unsupported bot type: {bot_type}")
        
        # Add orchestration middleware
        app.add_middleware(OrchestrationMiddleware, bot_type=bot_type, bot_integration=integration_instance)
        
        # Register orchestration endpoints
        orchestration_endpoints = OrchestrationEndpoints(bot_type, integration_instance)
        orchestration_endpoints.register_endpoints(app)
        
        # Add bot-specific task handlers based on configuration
        for task_name, task_config in enhancement_config.get("orchestration_tasks", {}).items():
            if not hasattr(integration_instance, f"_handle_{task_name}"):
                logger.warning(f"Task handler not implemented: {task_name}")
                continue
            
            handler = getattr(integration_instance, f"_handle_{task_name}")
            integration_instance.register_task_handler(task_name, handler)
        
        logger.info(f"Successfully enhanced {bot_type} bot with orchestration capabilities")
        
        return {
            "status": "enhanced",
            "bot_type": bot_type,
            "tasks_registered": len(enhancement_config.get("orchestration_tasks", {})),
            "features_enabled": len(enhancement_config.get("integration_points", {})),
            "orchestration_ready": True
        }
        
    except Exception as e:
        logger.error(f"Failed to enhance {bot_type} bot: {str(e)}")
        raise OrchestrationError(f"Bot enhancement failed: {str(e)}")

def create_bot_enhancement_config(bot_type: BotType) -> Dict[str, Any]:
    """Create appropriate enhancement configuration for bot type"""
    
    factory = BotEnhancementFactory()
    
    if bot_type == BotType.DESIGN:
        return factory.create_maya_patel_enhancements()
    elif bot_type == BotType.AI_RESEARCH:
        return factory.create_rachel_foster_enhancements()
    elif bot_type == BotType.DEVOPS:
        return factory.create_jake_morrison_enhancements()
    elif bot_type == BotType.INNOVATION:
        return factory.create_david_kim_enhancements()
    else:
        raise ValueError(f"No enhancement configuration available for {bot_type}")

# Convenience function for quick bot enhancement
async def quick_enhance_bot(app: FastAPI, bot_type: BotType) -> Dict[str, Any]:
    """Quickly enhance a bot with standard orchestration capabilities"""
    
    config = create_bot_enhancement_config(bot_type)
    return await enhance_existing_bot(app, bot_type, config)

# Example usage for existing bot applications
"""
# In Maya Patel's main.py:
from src.bot_enhancements.orchestration_middleware import quick_enhance_bot, BotType

app = FastAPI(title="Maya Patel Design Bot")

# Add your existing routes...
@app.get("/design/analysis")
async def analyze_design():
    # existing functionality
    pass

# Enhance with orchestration capabilities
enhancement_result = await quick_enhance_bot(app, BotType.DESIGN)
print(f"Bot enhanced: {enhancement_result}")

# The bot now supports:
# POST /orchestration/analyze_ux_requirements
# POST /orchestration/generate_design_system
# GET /orchestration/health
# etc.
"""
