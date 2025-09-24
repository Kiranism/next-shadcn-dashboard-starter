"""
AMT External Systems Gateway
Integration layer connecting AMT orchestration with existing AnalyzeMyTeam GraphQL ecosystem
"""

import asyncio
import logging
import json
from typing import Dict, List, Optional, Any, Union, Callable
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import httpx
import strawberry
from strawberry.extensions import QueryDepthLimiter
from strawberry.fastapi import GraphQLRouter

from ..shared.orchestration_protocol import (
    BotType, TaskStatus, BotRequest, BotResponse, OrchestrationContext
)
from ..orchestration.session_manager import SessionSnapshot
from ..orchestration.knowledge_base_integration import get_knowledge_base

logger = logging.getLogger(__name__)

class ExternalSystemType(str, Enum):
    """Types of external systems integrated"""
    TRIANGLE_DEFENSE = "triangle_defense"
    MVA_ANALYTICS = "mva_analytics"
    MEL_ENGINE = "mel_engine"
    DYNAMIC_FABRICATOR = "dynamic_fabricator"
    GAME_CHANGER = "game_changer"
    UNIFIED_GRAPHQL = "unified_graphql"

@dataclass
class SystemIntegrationConfig:
    """Configuration for external system integration"""
    system_type: ExternalSystemType
    endpoint: str
    timeout_seconds: int = 30
    retry_attempts: int = 3
    auth_required: bool = False
    auth_token: Optional[str] = None
    custom_headers: Dict[str, str] = None

@dataclass
class IntegrationResult:
    """Result from external system integration"""
    system_type: ExternalSystemType
    success: bool
    data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    response_time_ms: Optional[float] = None
    metadata: Dict[str, Any] = None

class ExternalSystemsGateway:
    """Gateway for integrating with external AnalyzeMyTeam systems"""
    
    def __init__(self):
        # HTTP client for API calls
        self.http_client = httpx.AsyncClient(timeout=30.0)
        
        # System configurations
        self.system_configs = self._initialize_system_configs()
        
        # Integration state
        self.system_health_cache = {}
        self.last_health_check = {}
        
        # Callback handlers for different integrations
        self.integration_handlers: Dict[ExternalSystemType, List[Callable]] = {
            system_type: [] for system_type in ExternalSystemType
        }
        
        # Performance metrics
        self.integration_metrics = {
            "total_requests": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "average_response_time": 0.0,
            "system_performance": {}
        }
    
    def _initialize_system_configs(self) -> Dict[ExternalSystemType, SystemIntegrationConfig]:
        """Initialize configurations for all external systems"""
        
        return {
            ExternalSystemType.TRIANGLE_DEFENSE: SystemIntegrationConfig(
                system_type=ExternalSystemType.TRIANGLE_DEFENSE,
                endpoint="http://triangle-defense-service:8000",
                timeout_seconds=30,
                retry_attempts=3
            ),
            ExternalSystemType.MVA_ANALYTICS: SystemIntegrationConfig(
                system_type=ExternalSystemType.MVA_ANALYTICS,
                endpoint="http://mva-analytics-service:8000",
                timeout_seconds=45,
                retry_attempts=2
            ),
            ExternalSystemType.MEL_ENGINE: SystemIntegrationConfig(
                system_type=ExternalSystemType.MEL_ENGINE,
                endpoint="http://mel-engine-service:8000",
                timeout_seconds=60,
                retry_attempts=3
            ),
            ExternalSystemType.DYNAMIC_FABRICATOR: SystemIntegrationConfig(
                system_type=ExternalSystemType.DYNAMIC_FABRICATOR,
                endpoint="http://dynamic-fabricator-service:8000",
                timeout_seconds=120,  # Video processing takes longer
                retry_attempts=2
            ),
            ExternalSystemType.GAME_CHANGER: SystemIntegrationConfig(
                system_type=ExternalSystemType.GAME_CHANGER,
                endpoint="http://game-changer-service:8000",
                timeout_seconds=30,
                retry_attempts=3
            ),
            ExternalSystemType.UNIFIED_GRAPHQL: SystemIntegrationConfig(
                system_type=ExternalSystemType.UNIFIED_GRAPHQL,
                endpoint="http://unified-graphql-service:8000/graphql",
                timeout_seconds=60,
                retry_attempts=2,
                custom_headers={"Content-Type": "application/json"}
            )
        }
    
    async def check_systems_health(self) -> Dict[ExternalSystemType, IntegrationResult]:
        """Check health of all external systems"""
        
        health_results = {}
        
        for system_type, config in self.system_configs.items():
            try:
                start_time = datetime.now()
                
                # Skip GraphQL endpoint for health checks (use different endpoint)
                health_endpoint = config.endpoint
                if system_type == ExternalSystemType.UNIFIED_GRAPHQL:
                    health_endpoint = config.endpoint.replace("/graphql", "/health")
                
                response = await self.http_client.get(f"{health_endpoint}/health")
                response_time = (datetime.now() - start_time).total_seconds() * 1000
                
                if response.status_code == 200:
                    health_data = response.json() if response.content else {"status": "healthy"}
                    
                    result = IntegrationResult(
                        system_type=system_type,
                        success=True,
                        data=health_data,
                        response_time_ms=response_time
                    )
                else:
                    result = IntegrationResult(
                        system_type=system_type,
                        success=False,
                        error_message=f"HTTP {response.status_code}",
                        response_time_ms=response_time
                    )
                
            except Exception as e:
                result = IntegrationResult(
                    system_type=system_type,
                    success=False,
                    error_message=str(e)
                )
            
            health_results[system_type] = result
            self.system_health_cache[system_type] = result
            self.last_health_check[system_type] = datetime.now()
        
        return health_results
    
    async def execute_graphql_query(
        self,
        query: str,
        variables: Optional[Dict[str, Any]] = None,
        operation_name: Optional[str] = None
    ) -> IntegrationResult:
        """Execute GraphQL query against unified API"""
        
        config = self.system_configs[ExternalSystemType.UNIFIED_GRAPHQL]
        
        try:
            start_time = datetime.now()
            
            payload = {
                "query": query,
                "variables": variables or {},
            }
            
            if operation_name:
                payload["operationName"] = operation_name
            
            response = await self.http_client.post(
                config.endpoint,
                json=payload,
                headers=config.custom_headers or {}
            )
            
            response_time = (datetime.now() - start_time).total_seconds() * 1000
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for GraphQL errors
                if "errors" in data:
                    return IntegrationResult(
                        system_type=ExternalSystemType.UNIFIED_GRAPHQL,
                        success=False,
                        error_message=f"GraphQL errors: {data['errors']}",
                        response_time_ms=response_time
                    )
                
                return IntegrationResult(
                    system_type=ExternalSystemType.UNIFIED_GRAPHQL,
                    success=True,
                    data=data.get("data", {}),
                    response_time_ms=response_time,
                    metadata={"extensions": data.get("extensions")}
                )
            
            else:
                return IntegrationResult(
                    system_type=ExternalSystemType.UNIFIED_GRAPHQL,
                    success=False,
                    error_message=f"HTTP {response.status_code}: {response.text}",
                    response_time_ms=response_time
                )
        
        except Exception as e:
            logger.error(f"GraphQL query execution failed: {str(e)}")
            return IntegrationResult(
                system_type=ExternalSystemType.UNIFIED_GRAPHQL,
                success=False,
                error_message=str(e)
            )
    
    async def triangle_defense_analysis(
        self,
        field_data: Dict[str, Any],
        session_id: Optional[str] = None
    ) -> IntegrationResult:
        """Execute Triangle Defense analysis via GraphQL"""
        
        query = """
        query TriangleDefenseAnalysis($fieldData: String!) {
            triangleDefenseAnalysis(fieldData: $fieldData) {
                analysisId
                timestamp
                formationType
                triangleStrength
                coordinateStability
                moAnalysis
                confidenceScore
            }
        }
        """
        
        variables = {
            "fieldData": json.dumps(field_data)
        }
        
        result = await self.execute_graphql_query(query, variables)
        
        if result.success and session_id:
            # Store result in knowledge base for learning
            await self._store_analysis_result("triangle_defense", result.data, session_id)
        
        return result
    
    async def mva_complete_analysis(
        self,
        mo_vectors: List[Dict[str, Any]],
        field_data: Dict[str, Any],
        triangle_defense_data: Optional[Dict] = None,
        session_id: Optional[str] = None
    ) -> IntegrationResult:
        """Execute complete MVA analysis via GraphQL"""
        
        query = """
        query MVAAnalysis($moVectors: String!, $fieldData: String!, $triangleDefenseData: String) {
            mvaAnalysis(
                moVectors: $moVectors, 
                fieldData: $fieldData, 
                triangleDefenseData: $triangleDefenseData
            ) {
                analysisId
                timestamp
                triangleInfluence
                hashInfluence
                fieldZoneAnalysis
                breakPointAnalysis
                resultAnalysis
                overallScore
                optimizationSuggestions
            }
        }
        """
        
        variables = {
            "moVectors": json.dumps(mo_vectors),
            "fieldData": json.dumps(field_data),
            "triangleDefenseData": json.dumps(triangle_defense_data) if triangle_defense_data else None
        }
        
        result = await self.execute_graphql_query(query, variables)
        
        if result.success and session_id:
            await self._store_analysis_result("mva_analysis", result.data, session_id)
        
        return result
    
    async def integrated_analysis(
        self,
        analysis_type: str,
        field_data: Optional[Dict[str, Any]] = None,
        video_data: Optional[str] = None,
        coaching_context: Optional[Dict[str, Any]] = None,
        team_name: Optional[str] = None,
        coaching_level: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> IntegrationResult:
        """Execute comprehensive integrated analysis"""
        
        mutation = """
        mutation CreateIntegratedAnalysis($request: AnalysisRequest!) {
            createIntegratedAnalysis(request: $request) {
                sessionId
                timestamp
                triangleDefense {
                    analysisId
                    formationType
                    triangleStrength
                    confidenceScore
                }
                mvaAnalysis {
                    analysisId
                    overallScore
                    optimizationSuggestions
                }
                coachingRecommendation {
                    recommendationId
                    primaryRecommendation
                    alternatives
                    confidenceLevel
                    followUpActions
                }
                videoAnalysis {
                    analysisId
                    playersDetected
                    motionVectorsCount
                    processingTime
                }
                overallInsights
                actionItems
            }
        }
        """
        
        variables = {
            "request": {
                "analysisType": analysis_type,
                "fieldData": json.dumps(field_data) if field_data else None,
                "videoData": video_data,
                "coachingContext": json.dumps(coaching_context) if coaching_context else None,
                "teamName": team_name,
                "coachingLevel": coaching_level
            }
        }
        
        result = await self.execute_graphql_query(mutation, variables)
        
        if result.success and session_id:
            await self._store_analysis_result("integrated_analysis", result.data, session_id)
        
        return result
    
    async def _store_analysis_result(
        self,
        analysis_type: str,
        result_data: Dict[str, Any],
        session_id: str
    ):
        """Store analysis result in knowledge base for learning"""
        
        try:
            knowledge_base = get_knowledge_base()
            
            if knowledge_base:
                # Convert analysis result to knowledge entry format
                knowledge_data = {
                    "analysis_type": analysis_type,
                    "result": result_data,
                    "session_id": session_id,
                    "timestamp": datetime.now().isoformat(),
                    "source": "external_systems_gateway"
                }
                
                # This would be stored as a knowledge contribution
                logger.info(f"Stored {analysis_type} analysis result for session {session_id}")
        
        except Exception as e:
            logger.error(f"Failed to store analysis result: {str(e)}")
    
    async def process_orchestration_request(
        self,
        bot_request: BotRequest,
        context: OrchestrationContext
    ) -> BotResponse:
        """Process orchestration request using external systems"""
        
        try:
            start_time = datetime.now()
            
            # Determine which external systems to use based on bot type and request
            systems_needed = self._determine_required_systems(bot_request, context)
            
            # Execute analyses
            analysis_results = {}
            
            for system_type in systems_needed:
                if system_type == ExternalSystemType.TRIANGLE_DEFENSE:
                    field_data = self._extract_field_data_from_context(context)
                    if field_data:
                        result = await self.triangle_defense_analysis(field_data, bot_request.session_id)
                        analysis_results["triangle_defense"] = result
                
                elif system_type == ExternalSystemType.MVA_ANALYTICS:
                    mo_vectors = self._extract_mo_vectors_from_context(context)
                    field_data = self._extract_field_data_from_context(context)
                    
                    if mo_vectors and field_data:
                        triangle_data = analysis_results.get("triangle_defense", {}).get("data")
                        result = await self.mva_complete_analysis(
                            mo_vectors, field_data, triangle_data, bot_request.session_id
                        )
                        analysis_results["mva_analysis"] = result
            
            # Integrate results into bot response
            response_result = self._integrate_analysis_results(analysis_results)
            
            execution_time = (datetime.now() - start_time).total_seconds()
            
            return BotResponse(
                request_id=bot_request.request_id,
                session_id=bot_request.session_id,
                bot_type=bot_request.bot_type,
                status=TaskStatus.COMPLETED,
                result=response_result,
                confidence_score=self._calculate_confidence_score(analysis_results),
                execution_time_seconds=execution_time
            )
        
        except Exception as e:
            logger.error(f"External systems processing failed: {str(e)}")
            
            return BotResponse(
                request_id=bot_request.request_id,
                session_id=bot_request.session_id,
                bot_type=bot_request.bot_type,
                status=TaskStatus.FAILED,
                error_message=str(e),
                confidence_score=0.0,
                execution_time_seconds=0.0
            )
    
    def _determine_required_systems(
        self,
        bot_request: BotRequest,
        context: OrchestrationContext
    ) -> List[ExternalSystemType]:
        """Determine which external systems are needed for the request"""
        
        systems = []
        
        # Check request content for relevant keywords
        request_content = bot_request.task_description.lower()
        
        if any(keyword in request_content for keyword in ["triangle", "defense", "formation"]):
            systems.append(ExternalSystemType.TRIANGLE_DEFENSE)
        
        if any(keyword in request_content for keyword in ["mva", "analytics", "motion", "vector"]):
            systems.append(ExternalSystemType.MVA_ANALYTICS)
        
        if any(keyword in request_content for keyword in ["coaching", "recommendation", "strategy"]):
            systems.append(ExternalSystemType.MEL_ENGINE)
        
        if any(keyword in request_content for keyword in ["video", "frame", "visual"]):
            systems.append(ExternalSystemType.DYNAMIC_FABRICATOR)
        
        # Default to integrated analysis if no specific systems identified
        if not systems:
            systems = [ExternalSystemType.UNIFIED_GRAPHQL]
        
        return systems
    
    def _extract_field_data_from_context(self, context: OrchestrationContext) -> Optional[Dict[str, Any]]:
        """Extract field data from orchestration context"""
        
        if hasattr(context, 'session_data') and context.session_data:
            field_data = context.session_data.get("field_data")
            if field_data:
                return field_data
        
        # Generate mock field data if none available
        return {
            "players": [
                {"x": 0, "y": 0, "player_id": "qb", "jersey_number": 9, "position": "QB"},
                {"x": -5, "y": -2, "player_id": "rb", "jersey_number": 21, "position": "RB"}
            ],
            "field_position": 50,
            "down_distance": "1st and 10",
            "formation_type": "i_formation"
        }
    
    def _extract_mo_vectors_from_context(self, context: OrchestrationContext) -> Optional[List[Dict[str, Any]]]:
        """Extract MO vectors from orchestration context"""
        
        if hasattr(context, 'session_data') and context.session_data:
            mo_vectors = context.session_data.get("mo_vectors")
            if mo_vectors:
                return mo_vectors
        
        # Generate basic MO vectors from field data
        field_data = self._extract_field_data_from_context(context)
        if field_data and "players" in field_data:
            mo_vectors = []
            for i, player in enumerate(field_data["players"]):
                mo_vector = {
                    "mo_id": f"mo_{i}",
                    "initial_position": [player.get("x", 0), player.get("y", 0)],
                    "final_position": [player.get("x", 0) + 5, player.get("y", 0)],
                    "velocity": 5.0,
                    "direction": 0.0,
                    "timestamp": 0.0,
                    "player_id": player.get("player_id")
                }
                mo_vectors.append(mo_vector)
            return mo_vectors
        
        return None
    
    def _integrate_analysis_results(self, analysis_results: Dict[str, IntegrationResult]) -> Dict[str, Any]:
        """Integrate multiple analysis results into coherent response"""
        
        integrated_result = {
            "analysis_summary": {},
            "recommendations": [],
            "insights": [],
            "confidence_scores": {}
        }
        
        for analysis_type, result in analysis_results.items():
            if result.success and result.data:
                integrated_result["analysis_summary"][analysis_type] = result.data
                integrated_result["confidence_scores"][analysis_type] = self._extract_confidence_from_result(result)
                
                # Extract recommendations and insights
                if analysis_type == "triangle_defense" and result.data:
                    triangle_data = result.data.get("triangleDefenseAnalysis", {})
                    if triangle_data.get("triangleStrength", 0) > 0.7:
                        integrated_result["insights"].append("Strong triangle formation detected")
                    
                elif analysis_type == "mva_analysis" and result.data:
                    mva_data = result.data.get("mvaAnalysis", {})
                    suggestions = mva_data.get("optimizationSuggestions", [])
                    integrated_result["recommendations"].extend(suggestions[:3])  # Top 3
        
        return integrated_result
    
    def _extract_confidence_from_result(self, result: IntegrationResult) -> float:
        """Extract confidence score from analysis result"""
        
        if not result.data:
            return 0.0
        
        # Look for confidence scores in various result formats
        if "triangleDefenseAnalysis" in result.data:
            return result.data["triangleDefenseAnalysis"].get("confidenceScore", 0.0)
        elif "mvaAnalysis" in result.data:
            return result.data["mvaAnalysis"].get("overallScore", 0.0)
        elif "coachingRecommendation" in result.data:
            confidence_map = {"HIGH": 0.9, "MEDIUM": 0.7, "LOW": 0.4}
            confidence_level = result.data["coachingRecommendation"].get("confidenceLevel", "LOW")
            return confidence_map.get(confidence_level, 0.4)
        
        return 0.5  # Default confidence
    
    def _calculate_confidence_score(self, analysis_results: Dict[str, IntegrationResult]) -> float:
        """Calculate overall confidence score from multiple analyses"""
        
        if not analysis_results:
            return 0.0
        
        successful_results = [r for r in analysis_results.values() if r.success]
        
        if not successful_results:
            return 0.0
        
        # Average confidence from all successful results
        confidence_scores = [self._extract_confidence_from_result(result) for result in successful_results]
        return sum(confidence_scores) / len(confidence_scores)
    
    def add_integration_handler(
        self,
        system_type: ExternalSystemType,
        handler: Callable[[IntegrationResult], None]
    ):
        """Add handler for integration results"""
        self.integration_handlers[system_type].append(handler)
    
    async def get_integration_metrics(self) -> Dict[str, Any]:
        """Get integration performance metrics"""
        
        return {
            "metrics": self.integration_metrics.copy(),
            "system_health": {
                system_type.value: {
                    "healthy": result.success,
                    "last_check": self.last_health_check.get(system_type, "never").isoformat()
                    if isinstance(self.last_health_check.get(system_type), datetime)
                    else self.last_health_check.get(system_type, "never")
                }
                for system_type, result in self.system_health_cache.items()
            },
            "available_systems": list(self.system_configs.keys())
        }
    
    async def shutdown(self):
        """Shutdown external systems gateway"""
        
        logger.info("Shutting down external systems gateway...")
        
        # Close HTTP client
        await self.http_client.aclose()
        
        logger.info("External systems gateway shutdown complete")

# AMT-specific GraphQL extensions
@strawberry.type
class AMTOrchestrationQuery:
    """AMT orchestration GraphQL queries"""
    
    @strawberry.field
    async def orchestration_systems_health(self) -> str:
        """Get health of orchestration-integrated external systems"""
        gateway = get_external_systems_gateway()
        health_results = await gateway.check_systems_health()
        
        return json.dumps({
            system_type.value: {
                "healthy": result.success,
                "error": result.error_message,
                "response_time": result.response_time_ms
            }
            for system_type, result in health_results.items()
        })
    
    @strawberry.field
    async def orchestration_analysis(
        self,
        session_id: str,
        analysis_type: str,
        field_data: Optional[str] = None
    ) -> str:
        """Execute orchestration-integrated analysis"""
        gateway = get_external_systems_gateway()
        
        field_dict = json.loads(field_data) if field_data else None
        
        result = await gateway.integrated_analysis(
            analysis_type=analysis_type,
            field_data=field_dict,
            session_id=session_id
        )
        
        return json.dumps({
            "success": result.success,
            "data": result.data,
            "error": result.error_message
        })

# Global gateway instance
_external_systems_gateway: Optional[ExternalSystemsGateway] = None

def get_external_systems_gateway() -> ExternalSystemsGateway:
    """Get global external systems gateway instance"""
    global _external_systems_gateway
    
    if _external_systems_gateway is None:
        _external_systems_gateway = ExternalSystemsGateway()
    
    return _external_systems_gateway

async def initialize_external_systems_gateway() -> bool:
    """Initialize external systems gateway"""
    gateway = get_external_systems_gateway()
    
    # Perform initial health check
    health_results = await gateway.check_systems_health()
    
    healthy_systems = [result for result in health_results.values() if result.success]
    
    logger.info(f"External systems gateway initialized - {len(healthy_systems)}/{len(health_results)} systems healthy")
    
    return len(healthy_systems) > 0

# Integration with orchestration bot processing
class ExternalSystemsBotMixin:
    """Mixin for bot integrations that use external systems"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.external_gateway = get_external_systems_gateway()
    
    async def process_with_external_systems(
        self,
        bot_request: BotRequest,
        context: OrchestrationContext
    ) -> BotResponse:
        """Process bot request using external systems"""
        
        return await self.external_gateway.process_orchestration_request(bot_request, context)
    
    async def get_triangle_defense_insights(
        self,
        field_data: Dict[str, Any],
        session_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get Triangle Defense insights for bot processing"""
        
        result = await self.external_gateway.triangle_defense_analysis(field_data, session_id)
        
        if result.success:
            return result.data
        
        return None
    
    async def get_coaching_recommendations(
        self,
        coaching_context: Dict[str, Any],
        session_id: str
    ) -> Optional[List[str]]:
        """Get coaching recommendations for bot processing"""
        
        result = await self.external_gateway.integrated_analysis(
            analysis_type="COACHING_SESSION",
            coaching_context=coaching_context,
            session_id=session_id
        )
        
        if result.success and result.data:
            integrated_data = result.data.get("createIntegratedAnalysis", {})
            return integrated_data.get("actionItems", [])
        
        return None

# Factory function for GraphQL router with AMT extensions
def create_amt_graphql_router() -> GraphQLRouter:
    """Create GraphQL router with AMT orchestration extensions"""
    
    # Combine original GraphQL schema with AMT extensions
    extended_schema = strawberry.Schema(
        query=AMTOrchestrationQuery,
        extensions=[QueryDepthLimiter(max_depth=10)]
    )
    
    return GraphQLRouter(extended_schema)
