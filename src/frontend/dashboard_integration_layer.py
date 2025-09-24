"""
AMT Dashboard Integration Layer
React/Next.js frontend integration with Python orchestration backend
"""

import asyncio
import logging
import json
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
from pathlib import Path
import base64

# FastAPI and WebSocket integration
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sse_starlette.sse import EventSourceResponse

from ..shared.orchestration_protocol import BotType, TaskStatus, SessionState
from ..orchestration.orchestration_service import get_orchestration_service
from ..security.security_manager import get_security_manager, SecurityContext, AuthenticationMethod
from ..monitoring.observability_stack import get_observability_stack
from ..orchestration.creative_tools_manager import ToolType, create_coaching_visualization
from ..integrations.external_systems_gateway import get_external_systems_gateway

logger = logging.getLogger(__name__)

class DashboardModule(str, Enum):
    """AMT Dashboard modules"""
    POWER_PLAYBOOKS = "power_playbooks"
    MEL_AI = "mel_ai"
    EXECUTIVE_SUITE = "executive_suite"
    DYNAMIC_FABRICATOR = "dynamic_fabricator"
    GAME_CHANGER = "game_changer"
    Q3_QUARTERBACK = "q3_quarterback"
    DYNAMIC_PREDICTOR = "dynamic_predictor"
    PRO_SCOUT = "pro_scout"
    RECRUIT = "recruit"
    STRENGTH = "strength"
    MEDICINE = "medicine"
    ACADEMICS = "academics"

class TriangleDefenseFormation(str, Enum):
    """Triangle Defense formation classifications for dashboard"""
    LARRY = "larry"      # MO Left + Male - #4ECDC4
    LINDA = "linda"      # MO Left + Female - #FF6B6B  
    RICKY = "ricky"      # MO Right + Male - #FFD93D
    RITA = "rita"        # MO Right + Female - #9B59B6
    MALE_MID = "male_mid"    # MO Middle + Male - #3498DB
    FEMALE_MID = "female_mid" # MO Middle + Female - #E74C3C

@dataclass
class DashboardUser:
    """Dashboard user with AMT organizational structure"""
    user_id: str
    email: str
    name: str
    tier: str  # founder_authority, ai_core, executive_command, etc.
    role: str
    has_admin_access: bool
    triangle_defense_access: bool
    module_permissions: List[DashboardModule]
    last_login: Optional[datetime] = None

@dataclass
class ModuleStatus:
    """Status of dashboard module"""
    module: DashboardModule
    status: str  # active, beta, coming_soon
    launch_date: Optional[datetime]
    description: str
    features: List[str]
    triangle_defense_integrated: bool = False

@dataclass
class MELCommand:
    """M.E.L. AI command interface data"""
    command_id: str
    user_id: str
    natural_language_input: str
    interpreted_command: Dict[str, Any]
    triangle_defense_context: Optional[str] = None
    execution_status: str = "processing"
    response: Optional[Dict[str, Any]] = None
    created_at: datetime = None

class DashboardIntegrationLayer:
    """Integration layer connecting Next.js dashboard to orchestration backend"""
    
    def __init__(self, app: FastAPI):
        self.app = app
        
        # Core services
        self.orchestration_service = get_orchestration_service()
        self.security_manager = get_security_manager()
        self.observability_stack = get_observability_stack()
        self.external_gateway = get_external_systems_gateway()
        
        # Dashboard state
        self.dashboard_users: Dict[str, DashboardUser] = {}
        self.active_mel_sessions: Dict[str, List[MELCommand]] = {}
        self.module_statuses: Dict[DashboardModule, ModuleStatus] = {}
        
        # WebSocket connections for real-time updates
        self.websocket_connections: Dict[str, List[WebSocket]] = {}
        
        # Initialize dashboard configuration
        self._initialize_dashboard_config()
        
        # Register API endpoints
        self._register_dashboard_endpoints()
        
        # Configure CORS for Next.js frontend
        self._configure_cors()
    
    def _configure_cors(self):
        """Configure CORS for Next.js frontend"""
        
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=[
                "http://localhost:3000",  # Next.js development
                "https://portal.analyzemyteam.com",  # Production frontend
                "https://amt-portal.netlify.app"  # Netlify deployment
            ],
            allow_credentials=True,
            allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
            allow_headers=["*"],
        )
    
    def _initialize_dashboard_config(self):
        """Initialize dashboard configuration"""
        
        # Initialize dashboard users with AMT organizational structure
        self._initialize_dashboard_users()
        
        # Initialize module statuses
        self._initialize_module_statuses()
    
    def _initialize_dashboard_users(self):
        """Initialize dashboard users based on AMT organizational structure"""
        
        dashboard_users_config = [
            # Founder Authority (Tier 1)
            {
                "user_id": "denauld_brown",
                "email": "denauld@analyzemyteam.com",
                "name": "Denauld Brown",
                "tier": "founder_authority",
                "role": "Founder & Triangle Defense Creator",
                "has_admin_access": True,
                "triangle_defense_access": True,
                "module_permissions": list(DashboardModule)  # Full access
            },
            # AI Core (Tier 2)
            {
                "user_id": "mel_ai",
                "email": "mel@analyzemyteam.com", 
                "name": "M.E.L.",
                "tier": "ai_core",
                "role": "Master Intelligence Engine",
                "has_admin_access": True,
                "triangle_defense_access": True,
                "module_permissions": list(DashboardModule)
            },
            # Executive Command (Tier 3)
            {
                "user_id": "courtney_sellars",
                "email": "courtney@analyzemyteam.com",
                "name": "Courtney Sellars",
                "tier": "executive_command", 
                "role": "CEO/Chief Legal Officer",
                "has_admin_access": True,
                "triangle_defense_access": True,
                "module_permissions": [
                    DashboardModule.POWER_PLAYBOOKS,
                    DashboardModule.MEL_AI,
                    DashboardModule.EXECUTIVE_SUITE,
                    DashboardModule.PRO_SCOUT
                ]
            },
            {
                "user_id": "alexandra_martinez",
                "email": "alexandra@analyzemyteam.com",
                "name": "Alexandra Martinez", 
                "tier": "executive_command",
                "role": "Chief Administrative Officer",
                "has_admin_access": True,
                "triangle_defense_access": True,
                "module_permissions": [
                    DashboardModule.POWER_PLAYBOOKS,
                    DashboardModule.MEL_AI,
                    DashboardModule.EXECUTIVE_SUITE,
                    DashboardModule.ACADEMICS
                ]
            },
            # Strategic Leadership (Tier 4) - Sample users
            {
                "user_id": "tony_rivera",
                "email": "tony@analyzemyteam.com",
                "name": "Tony Rivera",
                "tier": "strategic_leadership",
                "role": "Strategic Operations Director", 
                "has_admin_access": False,
                "triangle_defense_access": True,
                "module_permissions": [
                    DashboardModule.POWER_PLAYBOOKS,
                    DashboardModule.MEL_AI,
                    DashboardModule.PRO_SCOUT,
                    DashboardModule.Q3_QUARTERBACK
                ]
            }
        ]
        
        for user_config in dashboard_users_config:
            user = DashboardUser(**user_config)
            self.dashboard_users[user.user_id] = user
    
    def _initialize_module_statuses(self):
        """Initialize module statuses for dashboard display"""
        
        module_configs = [
            # Active modules
            {
                "module": DashboardModule.POWER_PLAYBOOKS,
                "status": "active",
                "launch_date": datetime(2024, 12, 1),
                "description": "Interactive digital playbooks with yard-based animation",
                "features": ["Interactive playbooks", "Yard-based animation", "Triangle Defense integration"],
                "triangle_defense_integrated": True
            },
            {
                "module": DashboardModule.MEL_AI,
                "status": "active", 
                "launch_date": datetime(2024, 12, 15),
                "description": "Master Intelligence Engine powered by Claude Sonnet 4",
                "features": ["Natural language commands", "Triangle Defense analysis", "AI coaching insights"],
                "triangle_defense_integrated": True
            },
            # Beta modules
            {
                "module": DashboardModule.EXECUTIVE_SUITE,
                "status": "beta",
                "launch_date": datetime(2025, 2, 1),
                "description": "Strategic command center with executive analytics",
                "features": ["Financial metrics", "Team performance", "Strategic initiatives"],
                "triangle_defense_integrated": True
            },
            # Coming soon modules
            {
                "module": DashboardModule.DYNAMIC_FABRICATOR,
                "status": "coming_soon",
                "launch_date": datetime(2025, 4, 1),
                "description": "Advanced video analysis and motion capture",
                "features": ["Video breakdown", "Motion analysis", "Frame-by-frame review"],
                "triangle_defense_integrated": True
            },
            {
                "module": DashboardModule.GAME_CHANGER,
                "status": "coming_soon", 
                "launch_date": datetime(2025, 4, 15),
                "description": "Game situation analysis and recommendations",
                "features": ["Situational analysis", "Game flow tracking", "Decision support"],
                "triangle_defense_integrated": True
            },
            {
                "module": DashboardModule.PRO_SCOUT,
                "status": "coming_soon",
                "launch_date": datetime(2025, 5, 1), 
                "description": "Professional scouting and player evaluation",
                "features": ["Player analysis", "Scouting reports", "Talent evaluation"],
                "triangle_defense_integrated": True
            },
            {
                "module": DashboardModule.Q3_QUARTERBACK,
                "status": "coming_soon",
                "launch_date": datetime(2025, 6, 1),
                "description": "Quarterback-specific training and analysis",
                "features": ["QB metrics", "Decision analysis", "Training programs"],
                "triangle_defense_integrated": True
            },
            {
                "module": DashboardModule.DYNAMIC_PREDICTOR,
                "status": "coming_soon",
                "launch_date": datetime(2025, 6, 15),
                "description": "Predictive analytics and outcome modeling",
                "features": ["Outcome prediction", "Risk analysis", "Success modeling"],
                "triangle_defense_integrated": True
            },
            {
                "module": DashboardModule.RECRUIT,
                "status": "coming_soon",
                "launch_date": datetime(2025, 7, 1),
                "description": "Recruiting management and prospect tracking",
                "features": ["Prospect database", "Recruiting workflows", "Communication tools"],
                "triangle_defense_integrated": False
            },
            {
                "module": DashboardModule.STRENGTH,
                "status": "coming_soon",
                "launch_date": datetime(2025, 7, 15),
                "description": "Strength and conditioning program management", 
                "features": ["Workout programs", "Progress tracking", "Injury prevention"],
                "triangle_defense_integrated": False
            },
            {
                "module": DashboardModule.MEDICINE,
                "status": "coming_soon",
                "launch_date": datetime(2025, 8, 1),
                "description": "Sports medicine and health monitoring",
                "features": ["Health tracking", "Injury management", "Recovery protocols"],
                "triangle_defense_integrated": False
            },
            {
                "module": DashboardModule.ACADEMICS,
                "status": "coming_soon",
                "launch_date": datetime(2025, 8, 15),
                "description": "Academic performance and eligibility tracking",
                "features": ["Grade tracking", "Study programs", "Eligibility monitoring"],
                "triangle_defense_integrated": False
            }
        ]
        
        for config in module_configs:
            module = config.pop("module")
            status = ModuleStatus(**config)
            self.module_statuses[module] = status
    
    def _register_dashboard_endpoints(self):
        """Register dashboard-specific API endpoints"""
        
        # Authentication endpoints
        @self.app.post("/api/dashboard/auth/login")
        async def dashboard_login(request: Dict[str, str]):
            """Dashboard user login"""
            
            try:
                email = request.get("email")
                password = request.get("password")
                
                if not email or not password:
                    raise HTTPException(status_code=400, detail="Email and password required")
                
                # Find user by email
                dashboard_user = None
                for user in self.dashboard_users.values():
                    if user.email == email:
                        dashboard_user = user
                        break
                
                if not dashboard_user:
                    raise HTTPException(status_code=401, detail="Invalid credentials")
                
                # For demo purposes, accept "demo" as password
                if password != "demo":
                    raise HTTPException(status_code=401, detail="Invalid credentials")
                
                # Create security context
                context = await self.security_manager.authenticate_user(
                    {"user_id": dashboard_user.user_id},
                    "127.0.0.1",  # Would get from request
                    "AMT-Dashboard",
                    AuthenticationMethod.SERVICE_ACCOUNT
                )
                
                if not context:
                    raise HTTPException(status_code=401, detail="Authentication failed")
                
                # Update last login
                dashboard_user.last_login = datetime.now()
                
                # Create JWT token
                jwt_token = self.security_manager.create_jwt_token(
                    user_id=dashboard_user.user_id,
                    permissions=context.permissions,
                    security_level=context.security_level,
                    expires_minutes=480  # 8 hours
                )
                
                return JSONResponse({
                    "success": True,
                    "user": {
                        "id": dashboard_user.user_id,
                        "email": dashboard_user.email,
                        "name": dashboard_user.name,
                        "tier": dashboard_user.tier,
                        "role": dashboard_user.role,
                        "has_admin_access": dashboard_user.has_admin_access,
                        "triangle_defense_access": dashboard_user.triangle_defense_access,
                        "module_permissions": [m.value for m in dashboard_user.module_permissions]
                    },
                    "token": jwt_token,
                    "expires_in": 28800  # 8 hours in seconds
                })
                
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Dashboard login error: {str(e)}")
                raise HTTPException(status_code=500, detail="Login failed")
        
        # Dashboard data endpoints
        @self.app.get("/api/dashboard/modules")
        async def get_dashboard_modules(
            credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
        ):
            """Get dashboard modules with status"""
            
            # Would validate JWT token here
            modules_data = []
            
            for module, status in self.module_statuses.items():
                modules_data.append({
                    "id": module.value,
                    "name": module.value.replace("_", " ").title(),
                    "status": status.status,
                    "launch_date": status.launch_date.isoformat() if status.launch_date else None,
                    "description": status.description,
                    "features": status.features,
                    "triangle_defense_integrated": status.triangle_defense_integrated,
                    "color_class": self._get_module_color_class(status.status)
                })
            
            return JSONResponse({
                "modules": modules_data,
                "total_modules": len(modules_data),
                "active_modules": len([m for m in modules_data if m["status"] == "active"]),
                "beta_modules": len([m for m in modules_data if m["status"] == "beta"]),
                "coming_soon_modules": len([m for m in modules_data if m["status"] == "coming_soon"])
            })
        
        @self.app.post("/api/dashboard/mel/command")
        async def execute_mel_command(
            request: Dict[str, str],
            credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
        ):
            """Execute M.E.L. AI command"""
            
            try:
                user_id = request.get("user_id", "unknown")
                natural_input = request.get("command", "")
                
                if not natural_input:
                    raise HTTPException(status_code=400, detail="Command required")
                
                # Create MEL command
                mel_command = MELCommand(
                    command_id=f"mel_{int(datetime.now().timestamp())}",
                    user_id=user_id,
                    natural_language_input=natural_input,
                    interpreted_command={},
                    created_at=datetime.now()
                )
                
                # Interpret command using NLP (simplified)
                interpreted = await self._interpret_mel_command(natural_input)
                mel_command.interpreted_command = interpreted
                
                # Check for Triangle Defense context
                if any(formation in natural_input.lower() for formation in ["larry", "linda", "ricky", "rita"]):
                    mel_command.triangle_defense_context = self._extract_triangle_defense_context(natural_input)
                
                # Store command
                if user_id not in self.active_mel_sessions:
                    self.active_mel_sessions[user_id] = []
                self.active_mel_sessions[user_id].append(mel_command)
                
                # Execute command through orchestration if needed
                if interpreted.get("requires_orchestration"):
                    orchestration_result = await self._execute_orchestration_command(interpreted, user_id)
                    mel_command.response = orchestration_result
                    mel_command.execution_status = "completed"
                else:
                    # Generate response
                    mel_command.response = await self._generate_mel_response(interpreted, mel_command.triangle_defense_context)
                    mel_command.execution_status = "completed"
                
                return JSONResponse({
                    "command_id": mel_command.command_id,
                    "status": mel_command.execution_status,
                    "response": mel_command.response,
                    "triangle_defense_context": mel_command.triangle_defense_context
                })
                
            except Exception as e:
                logger.error(f"M.E.L. command execution error: {str(e)}")
                raise HTTPException(status_code=500, detail="Command execution failed")
        
        @self.app.get("/api/dashboard/triangle-defense/formations")
        async def get_triangle_defense_formations():
            """Get Triangle Defense formation data for dashboard"""
            
            formations_data = []
            
            for formation in TriangleDefenseFormation:
                formation_info = {
                    "id": formation.value,
                    "name": formation.value.upper(),
                    "color": self._get_formation_color(formation),
                    "description": self._get_formation_description(formation),
                    "type": self._get_formation_type(formation),
                    "mo_position": self._get_mo_position(formation),
                    "success_rate": 0.85  # Mock data
                }
                formations_data.append(formation_info)
            
            return JSONResponse({
                "formations": formations_data,
                "total_formations": len(formations_data),
                "classification_system": "Triangle Defense Methodology by Denauld Brown"
            })
        
        @self.app.get("/api/dashboard/executive/metrics")
        async def get_executive_metrics(
            credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
        ):
            """Get executive dashboard metrics"""
            
            # Would validate admin access here
            
            # Get orchestration metrics
            if self.orchestration_service.metrics_collector:
                system_health = self.orchestration_service.metrics_collector.get_system_health_report()
            else:
                system_health = {}
            
            # Mock executive metrics
            executive_metrics = {
                "financial_performance": {
                    "monthly_revenue": 125000,
                    "annual_target": 1500000,
                    "growth_rate": 0.15,
                    "modules_revenue": {
                        "power_playbooks": 45000,
                        "mel_ai": 80000
                    }
                },
                "platform_performance": {
                    "active_users": 1247,
                    "session_success_rate": 0.94,
                    "avg_session_duration": 18.5,
                    "module_adoption": {
                        "power_playbooks": 0.78,
                        "mel_ai": 0.85
                    }
                },
                "system_health": system_health,
                "strategic_initiatives": [
                    {
                        "name": "Q2 Module Launch", 
                        "progress": 0.65,
                        "target_date": "2025-04-01",
                        "status": "on_track"
                    },
                    {
                        "name": "Enterprise Integration",
                        "progress": 0.40,
                        "target_date": "2025-06-01", 
                        "status": "on_track"
                    }
                ]
            }
            
            return JSONResponse(executive_metrics)
        
        # Creative tools integration
        @self.app.post("/api/dashboard/creative/formation")
        async def create_formation_visualization(
            request: Dict[str, Any],
            credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
        ):
            """Create formation visualization for dashboard"""
            
            try:
                result = await create_coaching_visualization(
                    ToolType.FORMATION_DESIGNER,
                    request.get("data", {}),
                    request.get("options", {})
                )
                
                return JSONResponse({
                    "success": True,
                    "visualization": result,
                    "triangle_defense_classified": True
                })
                
            except Exception as e:
                logger.error(f"Formation visualization error: {str(e)}")
                raise HTTPException(status_code=500, detail="Visualization creation failed")
        
        # WebSocket endpoint for real-time updates
        @self.app.websocket("/ws/dashboard/{user_id}")
        async def dashboard_websocket(websocket: WebSocket, user_id: str):
            """Dashboard WebSocket for real-time updates"""
            
            await websocket.accept()
            
            # Add to connections
            if user_id not in self.websocket_connections:
                self.websocket_connections[user_id] = []
            self.websocket_connections[user_id].append(websocket)
            
            try:
                # Send initial dashboard state
                await websocket.send_json({
                    "type": "dashboard_init",
                    "data": {
                        "modules": len(self.module_statuses),
                        "active_sessions": len(self.orchestration_service.session_manager.active_sessions) if self.orchestration_service.session_manager else 0,
                        "mel_commands_today": len(self.active_mel_sessions.get(user_id, []))
                    }
                })
                
                # Keep connection alive
                while True:
                    message = await websocket.receive_json()
                    
                    if message.get("type") == "ping":
                        await websocket.send_json({"type": "pong"})
                    elif message.get("type") == "subscribe_module":
                        # Handle module-specific subscriptions
                        module_name = message.get("module")
                        await websocket.send_json({
                            "type": "module_subscribed",
                            "module": module_name
                        })
                    
            except WebSocketDisconnect:
                logger.info(f"Dashboard WebSocket disconnected: {user_id}")
            except Exception as e:
                logger.error(f"Dashboard WebSocket error: {str(e)}")
            finally:
                # Remove from connections
                if user_id in self.websocket_connections:
                    self.websocket_connections[user_id].remove(websocket)
                    if not self.websocket_connections[user_id]:
                        del self.websocket_connections[user_id]
    
    async def _interpret_mel_command(self, natural_input: str) -> Dict[str, Any]:
        """Interpret natural language M.E.L. command"""
        
        # Simplified NLP interpretation
        lower_input = natural_input.lower()
        
        # Formation analysis commands
        if any(keyword in lower_input for keyword in ["analyze", "formation", "triangle"]):
            return {
                "command_type": "formation_analysis",
                "requires_orchestration": True,
                "bot_type": "AI_RESEARCH",
                "parameters": {
                    "analysis_type": "triangle_defense",
                    "input_text": natural_input
                }
            }
        
        # Practice plan commands
        elif any(keyword in lower_input for keyword in ["practice", "plan", "drill"]):
            return {
                "command_type": "practice_planning",
                "requires_orchestration": True,
                "bot_type": "DESIGN", 
                "parameters": {
                    "plan_type": "practice",
                    "input_text": natural_input
                }
            }
        
        # Scouting report commands
        elif any(keyword in lower_input for keyword in ["scout", "report", "opponent"]):
            return {
                "command_type": "scouting_report",
                "requires_orchestration": True,
                "bot_type": "AI_RESEARCH",
                "parameters": {
                    "report_type": "scouting",
                    "input_text": natural_input
                }
            }
        
        # General query
        else:
            return {
                "command_type": "general_query",
                "requires_orchestration": False,
                "parameters": {
                    "query": natural_input
                }
            }
    
    def _extract_triangle_defense_context(self, natural_input: str) -> str:
        """Extract Triangle Defense context from command"""
        
        formations_mentioned = []
        for formation in TriangleDefenseFormation:
            if formation.value in natural_input.lower():
                formations_mentioned.append(formation.value.upper())
        
        if formations_mentioned:
            return f"Triangle Defense formations referenced: {', '.join(formations_mentioned)}"
        
        return "General Triangle Defense methodology context"
    
    async def _execute_orchestration_command(self, interpreted: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """Execute command through orchestration system"""
        
        try:
            if not self.orchestration_service.session_manager:
                return {"error": "Orchestration service not available"}
            
            # Create orchestration session
            session_id = await self.orchestration_service.session_manager.create_session(
                user_request=interpreted["parameters"]["input_text"],
                requirements=["triangle_defense_analysis"],
                user_id=user_id,
                priority="normal"
            )
            
            # Start session
            success = await self.orchestration_service.session_manager.start_session(session_id)
            
            if success:
                return {
                    "session_id": session_id,
                    "status": "orchestration_started",
                    "message": "Command sent to orchestration system for processing"
                }
            else:
                return {"error": "Failed to start orchestration session"}
                
        except Exception as e:
            logger.error(f"Orchestration execution error: {str(e)}")
            return {"error": f"Orchestration failed: {str(e)}"}
    
    async def _generate_mel_response(self, interpreted: Dict[str, Any], triangle_context: Optional[str]) -> Dict[str, Any]:
        """Generate M.E.L. AI response"""
        
        command_type = interpreted.get("command_type", "general_query")
        
        responses = {
            "general_query": {
                "message": "I'm M.E.L., your Master Intelligence Engine. How can I help you with Triangle Defense analysis or coaching strategy today?",
                "suggestions": [
                    "Analyze formation Larry vs Cover 3",
                    "Generate practice plan for red zone offense", 
                    "Create scouting report template"
                ]
            },
            "formation_analysis": {
                "message": "I'll analyze the Triangle Defense formation for you. This analysis will consider coordinate stability, MO positioning, and defensive adjustments.",
                "analysis_type": "triangle_defense_formation",
                "triangle_context": triangle_context
            },
            "practice_planning": {
                "message": "I'll create a Triangle Defense-focused practice plan. This will include formation drills, coordination exercises, and situational work.",
                "plan_type": "triangle_defense_practice",
                "components": ["Formation alignment", "MO coordination", "Coverage recognition"]
            }
        }
        
        return responses.get(command_type, responses["general_query"])
    
    def _get_module_color_class(self, status: str) -> str:
        """Get CSS color class for module status"""
        
        color_map = {
            "active": "bg-green-500",
            "beta": "bg-yellow-500", 
            "coming_soon": "bg-gray-400"
        }
        
        return color_map.get(status, "bg-gray-400")
    
    def _get_formation_color(self, formation: TriangleDefenseFormation) -> str:
        """Get color code for Triangle Defense formation"""
        
        color_map = {
            TriangleDefenseFormation.LARRY: "#4ECDC4",
            TriangleDefenseFormation.LINDA: "#FF6B6B",
            TriangleDefenseFormation.RICKY: "#FFD93D", 
            TriangleDefenseFormation.RITA: "#9B59B6",
            TriangleDefenseFormation.MALE_MID: "#3498DB",
            TriangleDefenseFormation.FEMALE_MID: "#E74C3C"
        }
        
        return color_map.get(formation, "#888888")
    
    def _get_formation_description(self, formation: TriangleDefenseFormation) -> str:
        """Get description for Triangle Defense formation"""
        
        descriptions = {
            TriangleDefenseFormation.LARRY: "MO Left + Male - Strong side coverage with left triangle coordination",
            TriangleDefenseFormation.LINDA: "MO Left + Female - Flexible left-side defensive alignment", 
            TriangleDefenseFormation.RICKY: "MO Right + Male - Power right-side triangle formation",
            TriangleDefenseFormation.RITA: "MO Right + Female - Adaptive right-side coverage",
            TriangleDefenseFormation.MALE_MID: "MO Middle + Male - Central command triangle structure",
            TriangleDefenseFormation.FEMALE_MID: "MO Middle + Female - Dynamic central coordination"
        }
        
        return descriptions.get(formation, "Triangle Defense formation")
    
    def _get_formation_type(self, formation: TriangleDefenseFormation) -> str:
        """Get formation type classification"""
        
        if "male" in formation.value:
            return "Male"
        elif "female" in formation.value:
            return "Female" 
        else:
            return "Neutral"
    
    def _get_mo_position(self, formation: TriangleDefenseFormation) -> str:
        """Get MO (Mike/Outside) position for formation"""
        
        if "left" in formation.value or formation == TriangleDefenseFormation.LARRY or formation == TriangleDefenseFormation.LINDA:
            return "Left"
        elif "right" in formation.value or formation == TriangleDefenseFormation.RICKY or formation == TriangleDefenseFormation.RITA:
            return "Right"
        else:
            return "Middle"
    
    async def broadcast_dashboard_update(self, update_type: str, data: Dict[str, Any]):
        """Broadcast update to all connected dashboard users"""
        
        message = {
            "type": update_type,
            "data": data,
            "timestamp": datetime.now().isoformat()
        }
        
        disconnected_users = []
        
        for user_id, websockets in self.websocket_connections.items():
            disconnected_websockets = []
            
            for websocket in websockets:
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    logger.warning(f"Failed to send to user {user_id}: {str(e)}")
                    disconnected_websockets.append(websocket)
            
            # Clean up disconnected websockets
            for websocket in disconnected_websockets:
                websockets.remove(websocket)
            
            if not websockets:
                disconnected_users.append(user_id)
        
        # Clean up users with no active connections
        for user_id in disconnected_users:
            del self.websocket_connections[user_id]
    
    def get_dashboard_metrics(self) -> Dict[str, Any]:
        """Get dashboard integration metrics"""
        
        return {
            "connected_users": len(self.websocket_connections),
            "active_mel_sessions": len(self.active_mel_sessions),
            "total_dashboard_users": len(self.dashboard_users),
            "admin_users": len([u for u in self.dashboard_users.values() if u.has_admin_access]),
            "triangle_defense_users": len([u for u in self.dashboard_users.values() if u.triangle_defense_access]),
            "active_modules": len([m for m in self.module_statuses.values() if m.status == "active"]),
            "beta_modules": len([m for m in self.module_statuses.values() if m.status == "beta"]),
            "coming_soon_modules": len([m for m in self.module_statuses.values() if m.status == "coming_soon"])
        }

def create_dashboard_integration(app: FastAPI) -> DashboardIntegrationLayer:
    """Create dashboard integration layer"""
    
    return DashboardIntegrationLayer(app)

# Global integration instance
_dashboard_integration: Optional[DashboardIntegrationLayer] = None

def get_dashboard_integration() -> Optional[DashboardIntegrationLayer]:
    """Get global dashboard integration instance"""
    return _dashboard_integration

def initialize_dashboard_integration(app: FastAPI) -> DashboardIntegrationLayer:
    """Initialize dashboard integration with FastAPI app"""
    global _dashboard_integration
    
    _dashboard_integration = DashboardIntegrationLayer(app)
    return _dashboard_integration

# Example usage with FastAPI
"""
from fastapi import FastAPI
from src.frontend.dashboard_integration_layer import initialize_dashboard_integration

app = FastAPI(title="AMT Portal API")

# Initialize dashboard integration
dashboard_integration = initialize_dashboard_integration(app)

# The dashboard integration layer now provides:
# - POST /api/dashboard/auth/login
# - GET /api/dashboard/modules  
# - POST /api/dashboard/mel/command
# - GET /api/dashboard/triangle-defense/formations
# - GET /api/dashboard/executive/metrics
# - POST /api/dashboard/creative/formation
# - WebSocket /ws/dashboard/{user_id}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
"""
