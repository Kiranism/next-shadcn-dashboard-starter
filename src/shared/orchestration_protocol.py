"""
AMT AI Orchestration Protocol
Standardized communication protocol for coordinating specialized AI agents
"""

from pydantic import BaseModel, Field
from enum import Enum
from typing import Dict, List, Optional, Any, Union
from datetime import datetime
import uuid

class BotType(str, Enum):
    """Specialized AI agent types in the AMT ecosystem"""
    DESIGN = "maya-patel"
    DEVOPS = "jake-morrison" 
    INNOVATION = "david-kim"
    AI_RESEARCH = "rachel-foster"
    COORDINATION = "mel-core"

class TaskStatus(str, Enum):
    """Task execution status for orchestration tracking"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    REQUIRES_INPUT = "requires_input"
    BLOCKED = "blocked"

class PriorityLevel(int, Enum):
    """Task priority levels for orchestration queue management"""
    LOW = 1
    NORMAL = 2
    HIGH = 3
    URGENT = 4
    CRITICAL = 5

class BotRequest(BaseModel):
    """Standardized request format for bot orchestration"""
    request_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str = Field(..., description="Orchestration session identifier")
    bot_type: BotType = Field(..., description="Target bot for request")
    task_type: str = Field(..., description="Specific task to execute")
    parameters: Dict[str, Any] = Field(default_factory=dict)
    priority: PriorityLevel = Field(default=PriorityLevel.NORMAL)
    dependencies: List[str] = Field(default_factory=list)
    context: Dict[str, Any] = Field(default_factory=dict)
    timeout_seconds: int = Field(default=300)
    created_at: datetime = Field(default_factory=datetime.now)
    
    class Config:
        use_enum_values = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class BotResponse(BaseModel):
    """Standardized response format from bot orchestration"""
    request_id: str
    session_id: str
    bot_type: BotType
    status: TaskStatus
    result: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    confidence_score: float = Field(ge=0.0, le=1.0, default=0.0)
    execution_time_seconds: float = Field(ge=0.0, default=0.0)
    next_actions: List[str] = Field(default_factory=list)
    artifacts: Dict[str, str] = Field(default_factory=dict)
    knowledge_contributions: Dict[str, Any] = Field(default_factory=dict)
    completed_at: datetime = Field(default_factory=datetime.now)
    
    class Config:
        use_enum_values = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class OrchestrationContext(BaseModel):
    """Shared context for orchestration session"""
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    project_name: str
    development_request: str
    requirements: List[str] = Field(default_factory=list)
    constraints: Dict[str, Any] = Field(default_factory=dict)
    staff_assignments: Dict[str, str] = Field(default_factory=dict)
    nuclino_workspace_id: Optional[str] = None
    shared_artifacts: Dict[str, Any] = Field(default_factory=dict)
    similar_projects: List[Dict[str, Any]] = Field(default_factory=list)
    architectural_patterns: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class TaskDefinition(BaseModel):
    """Definition of orchestration task with coordination details"""
    task_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    task_type: str
    bot_type: BotType
    phase: int = Field(ge=1, description="Execution phase (1=analysis, 2=synthesis, 3=implementation)")
    depends_on: List[str] = Field(default_factory=list)
    estimated_duration_seconds: int = Field(default=300)
    required_artifacts: List[str] = Field(default_factory=list)
    output_artifacts: List[str] = Field(default_factory=list)
    
class OrchestrationPlan(BaseModel):
    """Complete orchestration execution plan"""
    session_id: str
    total_tasks: int
    phases: List[List[TaskDefinition]]
    estimated_total_duration_seconds: int
    critical_path: List[str] = Field(default_factory=list)
    success_criteria: Dict[str, Any] = Field(default_factory=dict)
    fallback_strategies: Dict[str, str] = Field(default_factory=dict)

class KnowledgeUpdate(BaseModel):
    """Knowledge base update from bot learning"""
    session_id: str
    bot_type: BotType
    update_type: str  # "insight", "pattern", "best_practice", "failure_lesson"
    content: Dict[str, Any]
    confidence_level: float = Field(ge=0.0, le=1.0)
    applicable_contexts: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.now)

class HealthCheck(BaseModel):
    """Bot health status for orchestration monitoring"""
    bot_type: BotType
    status: str  # "healthy", "degraded", "unavailable"
    response_time_ms: float
    current_load: float = Field(ge=0.0, le=1.0)
    last_successful_task: Optional[datetime] = None
    error_rate_percent: float = Field(ge=0.0, le=100.0, default=0.0)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

# AMT-specific task type definitions
AMT_TASK_TYPES = {
    BotType.DESIGN: [
        "analyze_ux_requirements",
        "generate_design_system", 
        "create_wireframes",
        "optimize_user_flow",
        "validate_accessibility"
    ],
    BotType.AI_RESEARCH: [
        "design_ml_architecture",
        "optimize_neural_network",
        "evaluate_model_performance", 
        "plan_ai_deployment",
        "analyze_algorithm_requirements"
    ],
    BotType.DEVOPS: [
        "plan_infrastructure",
        "design_cicd_pipeline",
        "configure_monitoring",
        "optimize_deployment",
        "assess_security_requirements"
    ],
    BotType.INNOVATION: [
        "analyze_competitive_landscape",
        "research_patent_landscape",
        "score_innovation_potential",
        "identify_market_opportunities", 
        "evaluate_technology_trends"
    ],
    BotType.COORDINATION: [
        "orchestrate_session",
        "synthesize_bot_outputs",
        "resolve_conflicts",
        "optimize_workflow",
        "ensure_triangle_defense_integration"
    ]
}

# Triangle Defense integration constants
TRIANGLE_DEFENSE_INTEGRATION = {
    "formation_types": ["LARRY", "LINDA", "RICKY", "RITA", "RANDY", "PAT"],
    "analysis_required": True,
    "methodology_compliance": "mandatory",
    "integration_points": [
        "formation_classification",
        "tactical_analysis", 
        "performance_optimization",
        "strategic_planning"
    ]
}

class OrchestrationError(Exception):
    """Base exception for orchestration errors"""
    def __init__(self, message: str, bot_type: BotType = None, session_id: str = None):
        self.message = message
        self.bot_type = bot_type
        self.session_id = session_id
        super().__init__(self.message)

class BotCommunicationError(OrchestrationError):
    """Error in bot-to-bot communication"""
    pass

class TaskTimeoutError(OrchestrationError):
    """Task execution timeout"""
    pass

class DependencyError(OrchestrationError):
    """Task dependency resolution failure"""
    pass
