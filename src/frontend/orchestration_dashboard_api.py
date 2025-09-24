"""
AMT Orchestration Dashboard API
Frontend API layer for the AI-Orchestrated Developer Studio dashboard
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Depends, Query, WebSocket, WebSocketDisconnect
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import json
import io
from pathlib import Path

from ..shared.orchestration_protocol import BotType, TaskStatus, SessionState
from ..orchestration.orchestration_service import get_orchestration_service
from ..orchestration.session_manager import SessionPriority
from ..orchestration.creative_tools_manager import ToolType, AnimationType, create_coaching_visualization
from ..orchestration.knowledge_base_integration import get_knowledge_base

logger = logging.getLogger(__name__)

class OrchestrationDashboardAPI:
    """Frontend API layer for orchestration dashboard"""
    
    def __init__(self, app: FastAPI):
        self.app = app
        self.orchestration_service = get_orchestration_service()
        self.knowledge_base = get_knowledge_base()
        self.security = HTTPBearer()
        
        # WebSocket connections for real-time updates
        self.active_connections: Dict[str, List[WebSocket]] = {}
        
        # Register all API routes
        self._register_dashboard_routes()
        self._register_creative_tools_routes()
        self._register_knowledge_base_routes()
        self._register_websocket_routes()
        
        # Add CORS middleware for frontend
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["http://localhost:3000", "https://app.analyzemyteam.com"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    
    def _register_dashboard_routes(self):
        """Register main dashboard API routes"""
        
        @self.app.get("/api/dashboard/overview")
        async def get_dashboard_overview(
            credentials: HTTPAuthorizationCredentials = Depends(self.security)
        ):
            """Get comprehensive dashboard overview"""
            
            try:
                # Get orchestration service status
                service_status = self.orchestration_service.get_service_status()
                
                # Get active sessions
                active_sessions = []
                if self.orchestration_service.session_manager:
                    sessions = self.orchestration_service.session_manager.list_active_sessions()
                    active_sessions = [self._format_session_for_dashboard(session) for session in sessions]
                
                # Get system metrics
                system_metrics = {}
                if self.orchestration_service.metrics_collector:
                    system_metrics = self.orchestration_service.metrics_collector.get_system_health_report()
                
                # Get bot status
                bot_status = await self._get_bot_status_summary()
                
                # Get staff workload
                staff_workload = await self._get_staff_workload_summary()
                
                # Get recent knowledge insights
                knowledge_insights = await self._get_recent_knowledge_insights()
                
                return JSONResponse({
                    "timestamp": datetime.now().isoformat(),
                    "service_status": service_status,
                    "active_sessions": active_sessions,
                    "system_metrics": system_metrics,
                    "bot_status": bot_status,
                    "staff_workload": staff_workload,
                    "knowledge_insights": knowledge_insights,
                    "quick_stats": {
                        "total_active_sessions": len(active_sessions),
                        "system_health_score": system_metrics.get("system_resources", {}).get("cpu_usage", 0),
                        "available_bots": len([bot for bot in bot_status if bot.get("status") == "healthy"]),
                        "staff_utilization": staff_workload.get("average_utilization", 0)
                    }
                })
                
            except Exception as e:
                logger.error(f"Dashboard overview failed: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.post("/api/dashboard/sessions")
        async def create_orchestration_session(
            request: Dict[str, Any],
            credentials: HTTPAuthorizationCredentials = Depends(self.security)
        ):
            """Create new orchestration session from dashboard"""
            
            try:
                # Validate request
                required_fields = ["user_request", "user_id"]
                for field in required_fields:
                    if field not in request:
                        raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
                
                # Create session through orchestration service
                if not self.orchestration_service.session_manager:
                    raise HTTPException(status_code=503, detail="Session manager not available")
                
                session_id = await self.orchestration_service.session_manager.create_session(
                    user_request=request["user_request"],
                    requirements=request.get("requirements", []),
                    user_id=request["user_id"],
                    constraints=request.get("constraints"),
                    priority=SessionPriority(request.get("priority", "normal"))
                )
                
                # Start session
                success = await self.orchestration_service.session_manager.start_session(session_id)
                
                if not success:
                    raise HTTPException(status_code=500, detail="Failed to start session")
                
                # Get session details for response
                session_snapshot = self.orchestration_service.session_manager.get_session_snapshot(session_id)
                
                return JSONResponse({
                    "session_id": session_id,
                    "status": "created",
                    "session_details": self._format_session_for_dashboard(session_snapshot) if session_snapshot else None,
                    "created_at": datetime.now().isoformat()
                })
                
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Session creation failed: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.get("/api/dashboard/sessions/{session_id}")
        async def get_session_details(
            session_id: str,
            include_history: bool = Query(False),
            credentials: HTTPAuthorizationCredentials = Depends(self.security)
        ):
            """Get detailed session information"""
            
            try:
                if not self.orchestration_service.session_manager:
                    raise HTTPException(status_code=503, detail="Session manager not available")
                
                # Get session snapshot
                snapshot = self.orchestration_service.session_manager.get_session_snapshot(session_id)
                if not snapshot:
                    raise HTTPException(status_code=404, detail="Session not found")
                
                # Get full session object for additional details
                session = self.orchestration_service.session_manager.get_session(session_id)
                
                session_details = self._format_session_for_dashboard(snapshot)
                
                if session and include_history:
                    session_details["progress_history"] = session.progress_checkpoints
                    session_details["knowledge_updates"] = [
                        update.__dict__ for update in session.knowledge_updates
                    ]
                    session_details["error_events"] = session.error_events
                
                return JSONResponse(session_details)
                
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Session details failed: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.post("/api/dashboard/sessions/{session_id}/action")
        async def session_action(
            session_id: str,
            action_request: Dict[str, Any],
            credentials: HTTPAuthorizationCredentials = Depends(self.security)
        ):
            """Perform action on session (suspend, resume, abort)"""
            
            try:
                action = action_request.get("action")
                if not action:
                    raise HTTPException(status_code=400, detail="Action required")
                
                if not self.orchestration_service.session_manager:
                    raise HTTPException(status_code=503, detail="Session manager not available")
                
                success = False
                result_message = ""
                
                if action == "suspend":
                    reason = action_request.get("reason", "Manual suspension from dashboard")
                    success = await self.orchestration_service.session_manager.suspend_session(
                        session_id, reason, action_request.get("resume_conditions")
                    )
                    result_message = "Session suspended"
                
                elif action == "resume":
                    success = await self.orchestration_service.session_manager.resume_session(session_id)
                    result_message = "Session resumed"
                
                elif action == "abort":
                    reason = action_request.get("reason", "Manual abort from dashboard")
                    success = await self.orchestration_service.session_manager.abort_session(session_id, reason)
                    result_message = "Session aborted"
                
                else:
                    raise HTTPException(status_code=400, detail=f"Unknown action: {action}")
                
                if not success:
                    raise HTTPException(status_code=400, detail=f"Could not {action} session")
                
                return JSONResponse({
                    "session_id": session_id,
                    "action": action,
                    "success": success,
                    "message": result_message,
                    "timestamp": datetime.now().isoformat()
                })
                
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Session action failed: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))
    
    def _register_creative_tools_routes(self):
        """Register creative tools API routes"""
        
        @self.app.get("/api/creative-tools/available")
        async def get_available_tools(
            credentials: HTTPAuthorizationCredentials = Depends(self.security)
        ):
            """Get available creative tools and capabilities"""
            
            try:
                from ..orchestration.creative_tools_manager import get_available_creative_tools
                return JSONResponse(get_available_creative_tools())
                
            except Exception as e:
                logger.error(f"Failed to get creative tools: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.post("/api/creative-tools/create-visualization")
        async def create_visualization(
            request: Dict[str, Any],
            credentials: HTTPAuthorizationCredentials = Depends(self.security)
        ):
            """Create coaching visualization using creative tools"""
            
            try:
                tool_type = ToolType(request.get("tool_type"))
                data = request.get("data", {})
                options = request.get("options", {})
                
                result = await create_coaching_visualization(tool_type, data, options)
                
                return JSONResponse({
                    "tool_type": tool_type,
                    "result": result,
                    "created_at": datetime.now().isoformat()
                })
                
            except ValueError as e:
                raise HTTPException(status_code=400, detail=f"Invalid tool type: {str(e)}")
            except Exception as e:
                logger.error(f"Visualization creation failed: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.get("/api/creative-tools/formations")
        async def get_formation_templates():
            """Get available formation templates"""
            
            return JSONResponse({
                "triangle_defense_formations": ["LARRY", "LINDA", "RICKY", "RITA", "RANDY", "PAT"],
                "standard_formations": ["I-Formation", "Spread", "Pistol", "Shotgun", "Wildcat"],
                "custom_formations": []  # Would load from user's saved formations
            })
        
        @self.app.post("/api/creative-tools/export")
        async def export_creative_content(
            request: Dict[str, Any],
            credentials: HTTPAuthorizationCredentials = Depends(self.security)
        ):
            """Export creative content in specified format"""
            
            try:
                content_id = request.get("content_id")
                export_format = request.get("format", "json")
                
                # This would export the actual content
                # For now, return a placeholder response
                
                return JSONResponse({
                    "content_id": content_id,
                    "export_format": export_format,
                    "download_url": f"/api/creative-tools/download/{content_id}",
                    "expires_at": (datetime.now() + timedelta(hours=24)).isoformat()
                })
                
            except Exception as e:
                logger.error(f"Export failed: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))
    
    def _register_knowledge_base_routes(self):
        """Register knowledge base API routes"""
        
        @self.app.get("/api/knowledge/summary")
        async def get_knowledge_summary(
            credentials: HTTPAuthorizationCredentials = Depends(self.security)
        ):
            """Get knowledge base summary"""
            
            try:
                summary = await self.knowledge_base.get_organizational_knowledge_summary()
                return JSONResponse(summary)
                
            except Exception as e:
                logger.error(f"Knowledge summary failed: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.get("/api/knowledge/bot/{bot_type}/expertise")
        async def get_bot_expertise(
            bot_type: str,
            credentials: HTTPAuthorizationCredentials = Depends(self.security)
        ):
            """Get bot expertise summary"""
            
            try:
                bot_enum = BotType(bot_type)
                expertise = await self.knowledge_base.get_bot_expertise_summary(bot_enum)
                return JSONResponse(expertise)
                
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid bot type: {bot_type}")
            except Exception as e:
                logger.error(f"Bot expertise failed: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.post("/api/knowledge/query")
        async def query_knowledge_base(
            request: Dict[str, Any],
            credentials: HTTPAuthorizationCredentials = Depends(self.security)
        ):
            """Query knowledge base for relevant information"""
            
            try:
                bot_type = BotType(request.get("bot_type"))
                context = request.get("context", {})
                session_id = request.get("session_id")
                
                relevant_entries = await self.knowledge_base.query_knowledge_for_context(
                    bot_type, context, session_id
                )
                
                # Format entries for frontend
                formatted_entries = []
                for entry in relevant_entries:
                    formatted_entries.append({
                        "id": entry.entry_id,
                        "domain": entry.domain,
                        "pattern_type": entry.pattern_type,
                        "confidence": entry.confidence_score,
                        "tags": entry.tags,
                        "created_at": entry.created_at.isoformat(),
                        "usage_count": entry.usage_count,
                        "success_rate": entry.success_rate
                    })
                
                return JSONResponse({
                    "query_context": context,
                    "relevant_entries": formatted_entries,
                    "total_matches": len(formatted_entries)
                })
                
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid request parameters")
            except Exception as e:
                logger.error(f"Knowledge query failed: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))
    
    def _register_websocket_routes(self):
        """Register WebSocket routes for real-time updates"""
        
        @self.app.websocket("/ws/dashboard/{user_id}")
        async def dashboard_websocket(websocket: WebSocket, user_id: str):
            """WebSocket endpoint for dashboard real-time updates"""
            
            await websocket.accept()
            
            # Add to active connections
            if user_id not in self.active_connections:
                self.active_connections[user_id] = []
            self.active_connections[user_id].append(websocket)
            
            try:
                # Send initial dashboard state
                overview = await self._get_dashboard_overview_for_websocket()
                await websocket.send_json({
                    "type": "dashboard_overview",
                    "data": overview,
                    "timestamp": datetime.now().isoformat()
                })
                
                # Keep connection alive and handle incoming messages
                while True:
                    message = await websocket.receive_json()
                    await self._handle_websocket_message(websocket, user_id, message)
                    
            except WebSocketDisconnect:
                logger.info(f"Dashboard WebSocket disconnected for user {user_id}")
            except Exception as e:
                logger.error(f"Dashboard WebSocket error for user {user_id}: {str(e)}")
            finally:
                # Remove from active connections
                if user_id in self.active_connections:
                    self.active_connections[user_id].remove(websocket)
                    if not self.active_connections[user_id]:
                        del self.active_connections[user_id]
        
        @self.app.websocket("/ws/session/{session_id}")
        async def session_websocket(websocket: WebSocket, session_id: str):
            """WebSocket endpoint for session-specific updates"""
            
            await websocket.accept()
            
            try:
                # Connect to orchestration real-time coordinator
                if self.orchestration_service.realtime_coordinator:
                    # This would integrate with the existing real-time coordinator
                    # For now, send periodic updates
                    while True:
                        await asyncio.sleep(5)
                        
                        # Get session status
                        if self.orchestration_service.session_manager:
                            snapshot = self.orchestration_service.session_manager.get_session_snapshot(session_id)
                            if snapshot:
                                await websocket.send_json({
                                    "type": "session_update",
                                    "data": self._format_session_for_dashboard(snapshot),
                                    "timestamp": datetime.now().isoformat()
                                })
                        
            except WebSocketDisconnect:
                logger.info(f"Session WebSocket disconnected for session {session_id}")
            except Exception as e:
                logger.error(f"Session WebSocket error for session {session_id}: {str(e)}")
    
    async def _handle_websocket_message(self, websocket: WebSocket, user_id: str, message: Dict[str, Any]):
        """Handle incoming WebSocket messages"""
        
        message_type = message.get("type")
        
        if message_type == "subscribe_to_session":
            session_id = message.get("session_id")
            # Subscribe user to session updates
            await websocket.send_json({
                "type": "subscription_confirmed",
                "session_id": session_id,
                "timestamp": datetime.now().isoformat()
            })
        
        elif message_type == "request_update":
            # Send fresh dashboard overview
            overview = await self._get_dashboard_overview_for_websocket()
            await websocket.send_json({
                "type": "dashboard_update",
                "data": overview,
                "timestamp": datetime.now().isoformat()
            })
    
    def _format_session_for_dashboard(self, snapshot) -> Dict[str, Any]:
        """Format session snapshot for dashboard display"""
        
        return {
            "session_id": snapshot.session_id,
            "state": snapshot.state,
            "priority": snapshot.priority,
            "progress_percentage": snapshot.progress_percentage,
            "current_phase": snapshot.current_phase,
            "active_tasks": snapshot.active_tasks,
            "completed_tasks": snapshot.completed_tasks,
            "failed_tasks": snapshot.failed_tasks,
            "execution_time": snapshot.execution_time,
            "estimated_completion": snapshot.estimated_completion.isoformat() if snapshot.estimated_completion else None,
            "staff_assigned": snapshot.staff_assigned,
            "error_count": snapshot.error_count,
            "last_activity": snapshot.last_activity.isoformat(),
            "created_at": snapshot.created_at.isoformat(),
            "status_color": self._get_status_color(snapshot.state),
            "progress_bar_color": self._get_progress_color(snapshot.progress_percentage)
        }
    
    def _get_status_color(self, state: str) -> str:
        """Get color code for session state"""
        
        color_map = {
            "initializing": "#FCD34D",    # Yellow
            "planning": "#60A5FA",        # Blue
            "executing": "#34D399",       # Green
            "synthesizing": "#A78BFA",    # Purple
            "completed": "#10B981",       # Green
            "failed": "#EF4444",          # Red
            "aborted": "#6B7280",         # Gray
            "suspended": "#F59E0B"        # Orange
        }
        
        return color_map.get(state, "#6B7280")
    
    def _get_progress_color(self, progress: float) -> str:
        """Get color code for progress percentage"""
        
        if progress < 25:
            return "#EF4444"  # Red
        elif progress < 50:
            return "#F59E0B"  # Orange
        elif progress < 75:
            return "#FCD34D"  # Yellow
        else:
            return "#10B981"  # Green
    
    async def _get_bot_status_summary(self) -> List[Dict[str, Any]]:
        """Get summary of all bot statuses"""
        
        bot_statuses = []
        
        for bot_type in BotType:
            # This would check actual bot health
            # For now, return mock data
            bot_statuses.append({
                "bot_type": bot_type,
                "status": "healthy",
                "response_time_ms": 150,
                "success_rate": 0.92,
                "active_tasks": 2,
                "last_activity": datetime.now().isoformat()
            })
        
        return bot_statuses
    
    async def _get_staff_workload_summary(self) -> Dict[str, Any]:
        """Get summary of staff workload across organization"""
        
        if not self.orchestration_service.staff_manager:
            return {"average_utilization": 0, "total_staff": 0}
        
        # This would calculate actual staff utilization
        # For now, return mock data
        return {
            "total_staff": 25,
            "active_staff": 18,
            "average_utilization": 0.65,
            "high_utilization_staff": 4,
            "available_staff": 7
        }
    
    async def _get_recent_knowledge_insights(self) -> Dict[str, Any]:
        """Get recent knowledge base insights"""
        
        try:
            summary = await self.knowledge_base.get_organizational_knowledge_summary()
            
            return {
                "total_entries": summary.get("total_knowledge_entries", 0),
                "recent_learnings": summary.get("knowledge_quality", {}).get("recent_learnings", 0),
                "high_confidence_patterns": summary.get("knowledge_quality", {}).get("high_confidence_entries", 0),
                "triangle_defense_insights": summary.get("triangle_defense_insights", 0)
            }
            
        except Exception as e:
            logger.error(f"Failed to get knowledge insights: {str(e)}")
            return {"error": "Unable to retrieve knowledge insights"}
    
    async def _get_dashboard_overview_for_websocket(self) -> Dict[str, Any]:
        """Get dashboard overview optimized for WebSocket transmission"""
        
        # Lightweight version of dashboard overview for real-time updates
        return {
            "active_sessions_count": len(self.orchestration_service.session_manager.active_sessions) if self.orchestration_service.session_manager else 0,
            "system_health": "healthy",  # Would check actual system health
            "available_bots": 4,
            "knowledge_entries": await self._get_recent_knowledge_insights()
        }
    
    async def broadcast_to_all_users(self, message: Dict[str, Any]):
        """Broadcast message to all connected dashboard users"""
        
        disconnected_users = []
        
        for user_id, websockets in self.active_connections.items():
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
            del self.active_connections[user_id]

def create_dashboard_api(app: FastAPI) -> OrchestrationDashboardAPI:
    """Create and configure dashboard API"""
    
    return OrchestrationDashboardAPI(app)

# Example usage in main application
"""
from fastapi import FastAPI
from src.frontend.orchestration_dashboard_api import create_dashboard_api

app = FastAPI(title="AMT Orchestration Dashboard")

# Create dashboard API
dashboard_api = create_dashboard_api(app)

# The app now has all dashboard routes:
# GET /api/dashboard/overview
# POST /api/dashboard/sessions
# WebSocket /ws/dashboard/{user_id}
# etc.
"""
