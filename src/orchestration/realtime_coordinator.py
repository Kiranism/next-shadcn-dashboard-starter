"""
AMT Real-Time Coordination Service
WebSocket-based real-time updates and status coordination for orchestration
"""

import asyncio
import websockets
import json
import logging
from typing import Dict, Set, List, Optional, Any
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum

from ..shared.orchestration_protocol import (
    BotType, TaskStatus, BotResponse, OrchestrationContext, 
    KnowledgeUpdate, HealthCheck
)

logger = logging.getLogger(__name__)

class UpdateType(str, Enum):
    """Types of real-time updates"""
    ORCHESTRATION_STATUS = "orchestration_status"
    BOT_STATUS = "bot_status" 
    TASK_PROGRESS = "task_progress"
    KNOWLEDGE_UPDATE = "knowledge_update"
    STAFF_NOTIFICATION = "staff_notification"
    ERROR_ALERT = "error_alert"
    SESSION_COMPLETE = "session_complete"

@dataclass
class RealtimeUpdate:
    """Standardized real-time update message"""
    update_type: UpdateType
    session_id: str
    timestamp: str
    data: Dict[str, Any]
    source: str
    priority: int = 1  # 1=low, 2=normal, 3=high, 4=urgent

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

class ConnectionManager:
    """Manages WebSocket connections and message routing"""
    
    def __init__(self):
        # Active connections by session
        self.session_connections: Dict[str, Set[websockets.WebSocketServerProtocol]] = {}
        # All active connections
        self.active_connections: Set[websockets.WebSocketServerProtocol] = set()
        # Connection metadata
        self.connection_metadata: Dict[websockets.WebSocketServerProtocol, Dict[str, Any]] = {}
        # Message queues for offline sessions
        self.message_queues: Dict[str, List[RealtimeUpdate]] = {}
        
    async def connect(
        self, 
        websocket: websockets.WebSocketServerProtocol, 
        session_id: str,
        user_id: str,
        connection_type: str = "dashboard"
    ):
        """Register new WebSocket connection"""
        
        # Add to active connections
        self.active_connections.add(websocket)
        
        # Add to session connections
        if session_id not in self.session_connections:
            self.session_connections[session_id] = set()
        self.session_connections[session_id].add(websocket)
        
        # Store connection metadata
        self.connection_metadata[websocket] = {
            "session_id": session_id,
            "user_id": user_id,
            "connection_type": connection_type,
            "connected_at": datetime.now().isoformat(),
            "last_activity": datetime.now().isoformat()
        }
        
        # Send queued messages if any
        if session_id in self.message_queues:
            for message in self.message_queues[session_id]:
                await self._send_to_connection(websocket, message)
            # Clear queue after sending
            del self.message_queues[session_id]
            
        logger.info(f"WebSocket connected for session {session_id}, user {user_id}")
        
        # Send connection confirmation
        await self._send_to_connection(websocket, RealtimeUpdate(
            update_type=UpdateType.ORCHESTRATION_STATUS,
            session_id=session_id,
            timestamp=datetime.now().isoformat(),
            data={
                "status": "connected",
                "message": "Real-time coordination active",
                "capabilities": ["status_updates", "progress_tracking", "error_alerts"]
            },
            source="realtime_coordinator"
        ))
    
    async def disconnect(self, websocket: websockets.WebSocketServerProtocol):
        """Handle WebSocket disconnection"""
        
        # Remove from active connections
        self.active_connections.discard(websocket)
        
        # Get connection info before removing
        connection_info = self.connection_metadata.get(websocket, {})
        session_id = connection_info.get("session_id")
        
        # Remove from session connections
        if session_id and session_id in self.session_connections:
            self.session_connections[session_id].discard(websocket)
            if not self.session_connections[session_id]:
                del self.session_connections[session_id]
        
        # Clean up metadata
        self.connection_metadata.pop(websocket, None)
        
        logger.info(f"WebSocket disconnected for session {session_id}")
    
    async def broadcast_to_session(self, session_id: str, update: RealtimeUpdate):
        """Broadcast update to all connections in a session"""
        
        if session_id not in self.session_connections:
            # Queue message for when connections are established
            if session_id not in self.message_queues:
                self.message_queues[session_id] = []
            self.message_queues[session_id].append(update)
            return
        
        connections = self.session_connections[session_id].copy()
        disconnected = set()
        
        for websocket in connections:
            try:
                await self._send_to_connection(websocket, update)
                # Update last activity
                if websocket in self.connection_metadata:
                    self.connection_metadata[websocket]["last_activity"] = datetime.now().isoformat()
                    
            except websockets.exceptions.ConnectionClosed:
                disconnected.add(websocket)
            except Exception as e:
                logger.error(f"Failed to send message to websocket: {str(e)}")
                disconnected.add(websocket)
        
        # Clean up disconnected websockets
        for websocket in disconnected:
            await self.disconnect(websocket)
    
    async def broadcast_to_all(self, update: RealtimeUpdate):
        """Broadcast update to all active connections"""
        
        connections = self.active_connections.copy()
        disconnected = set()
        
        for websocket in connections:
            try:
                await self._send_to_connection(websocket, update)
            except websockets.exceptions.ConnectionClosed:
                disconnected.add(websocket)
            except Exception as e:
                logger.error(f"Failed to broadcast to websocket: {str(e)}")
                disconnected.add(websocket)
        
        # Clean up disconnected websockets
        for websocket in disconnected:
            await self.disconnect(websocket)
    
    async def _send_to_connection(
        self, 
        websocket: websockets.WebSocketServerProtocol, 
        update: RealtimeUpdate
    ):
        """Send update to specific WebSocket connection"""
        
        message = json.dumps(update.to_dict(), default=str)
        await websocket.send(message)
    
    def get_session_stats(self, session_id: str) -> Dict[str, Any]:
        """Get statistics for a session"""
        
        connections = self.session_connections.get(session_id, set())
        
        return {
            "session_id": session_id,
            "active_connections": len(connections),
            "connection_types": [
                self.connection_metadata.get(ws, {}).get("connection_type", "unknown")
                for ws in connections
            ],
            "queued_messages": len(self.message_queues.get(session_id, [])),
            "last_activity": max([
                self.connection_metadata.get(ws, {}).get("last_activity", "1970-01-01T00:00:00")
                for ws in connections
            ] or ["1970-01-01T00:00:00"])
        }

class RealtimeCoordinator:
    """Main real-time coordination service"""
    
    def __init__(self, orchestrator=None):
        self.orchestrator = orchestrator
        self.connection_manager = ConnectionManager()
        self.bot_health_status: Dict[BotType, HealthCheck] = {}
        self.update_history: Dict[str, List[RealtimeUpdate]] = {}
        self.max_history_size = 100
        
        # Start background tasks
        self._background_tasks = []
    
    async def start_background_services(self):
        """Start background monitoring and cleanup services"""
        
        self._background_tasks.extend([
            asyncio.create_task(self._health_monitor()),
            asyncio.create_task(self._connection_cleanup()),
            asyncio.create_task(self._update_history_cleanup())
        ])
        
        logger.info("Real-time coordination background services started")
    
    async def stop_background_services(self):
        """Stop background services"""
        
        for task in self._background_tasks:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
        
        self._background_tasks.clear()
        logger.info("Real-time coordination background services stopped")
    
    async def handle_websocket_connection(
        self, 
        websocket: websockets.WebSocketServerProtocol, 
        path: str
    ):
        """Handle incoming WebSocket connections"""
        
        try:
            # Parse connection path to extract session info
            path_parts = path.strip('/').split('/')
            if len(path_parts) < 3:
                await websocket.close(code=1002, reason="Invalid connection path")
                return
            
            session_id = path_parts[2]  # /orchestration/realtime/{session_id}
            
            # Get user info from query params or headers
            user_id = websocket.request_headers.get("X-User-ID", "unknown")
            connection_type = websocket.request_headers.get("X-Connection-Type", "dashboard")
            
            # Register connection
            await self.connection_manager.connect(websocket, session_id, user_id, connection_type)
            
            # Keep connection alive and handle messages
            await self._handle_connection_messages(websocket, session_id)
            
        except websockets.exceptions.ConnectionClosed:
            pass
        except Exception as e:
            logger.error(f"WebSocket connection error: {str(e)}")
        finally:
            await self.connection_manager.disconnect(websocket)
    
    async def _handle_connection_messages(
        self, 
        websocket: websockets.WebSocketServerProtocol, 
        session_id: str
    ):
        """Handle incoming messages from WebSocket client"""
        
        async for message in websocket:
            try:
                data = json.loads(message)
                message_type = data.get("type", "unknown")
                
                if message_type == "ping":
                    # Respond to ping with pong
                    pong_update = RealtimeUpdate(
                        update_type=UpdateType.ORCHESTRATION_STATUS,
                        session_id=session_id,
                        timestamp=datetime.now().isoformat(),
                        data={"type": "pong"},
                        source="realtime_coordinator"
                    )
                    await self.connection_manager._send_to_connection(websocket, pong_update)
                
                elif message_type == "get_status":
                    # Send current session status
                    await self._send_session_status(websocket, session_id)
                
                elif message_type == "get_bot_health":
                    # Send bot health status
                    await self._send_bot_health_status(websocket, session_id)
                
                # Update last activity
                connection_info = self.connection_manager.connection_metadata.get(websocket, {})
                connection_info["last_activity"] = datetime.now().isoformat()
                
            except json.JSONDecodeError:
                logger.warning(f"Invalid JSON received from WebSocket: {message}")
            except Exception as e:
                logger.error(f"Error handling WebSocket message: {str(e)}")
    
    async def notify_orchestration_progress(
        self, 
        session_id: str, 
        progress_data: Dict[str, Any]
    ):
        """Notify clients of orchestration progress"""
        
        update = RealtimeUpdate(
            update_type=UpdateType.ORCHESTRATION_STATUS,
            session_id=session_id,
            timestamp=datetime.now().isoformat(),
            data=progress_data,
            source="orchestration_engine",
            priority=2
        )
        
        await self.connection_manager.broadcast_to_session(session_id, update)
        self._add_to_history(session_id, update)
    
    async def notify_bot_status_change(
        self, 
        session_id: str, 
        bot_type: BotType, 
        status_data: Dict[str, Any]
    ):
        """Notify clients of bot status changes"""
        
        update = RealtimeUpdate(
            update_type=UpdateType.BOT_STATUS,
            session_id=session_id,
            timestamp=datetime.now().isoformat(),
            data={
                "bot_type": bot_type,
                "status": status_data["status"],
                "progress": status_data.get("progress", 0),
                "current_task": status_data.get("current_task", ""),
                "estimated_completion": status_data.get("estimated_completion"),
                "confidence": status_data.get("confidence", 0)
            },
            source=f"bot_{bot_type}",
            priority=2
        )
        
        await self.connection_manager.broadcast_to_session(session_id, update)
        self._add_to_history(session_id, update)
    
    async def notify_task_completion(
        self, 
        session_id: str, 
        task_result: BotResponse
    ):
        """Notify clients of task completion"""
        
        update = RealtimeUpdate(
            update_type=UpdateType.TASK_PROGRESS,
            session_id=session_id,
            timestamp=datetime.now().isoformat(),
            data={
                "task_id": task_result.request_id,
                "bot_type": task_result.bot_type,
                "status": task_result.status,
                "confidence_score": task_result.confidence_score,
                "execution_time": task_result.execution_time_seconds,
                "has_artifacts": len(task_result.artifacts) > 0,
                "next_actions": task_result.next_actions
            },
            source="task_manager",
            priority=3 if task_result.status == TaskStatus.COMPLETED else 4
        )
        
        await self.connection_manager.broadcast_to_session(session_id, update)
        self._add_to_history(session_id, update)
    
    async def notify_knowledge_update(
        self, 
        session_id: str, 
        knowledge_update: KnowledgeUpdate
    ):
        """Notify clients of knowledge base updates"""
        
        update = RealtimeUpdate(
            update_type=UpdateType.KNOWLEDGE_UPDATE,
            session_id=session_id,
            timestamp=datetime.now().isoformat(),
            data={
                "bot_type": knowledge_update.bot_type,
                "update_type": knowledge_update.update_type,
                "confidence_level": knowledge_update.confidence_level,
                "applicable_contexts": knowledge_update.applicable_contexts,
                "summary": self._summarize_knowledge_content(knowledge_update.content)
            },
            source="knowledge_base",
            priority=1
        )
        
        await self.connection_manager.broadcast_to_session(session_id, update)
        self._add_to_history(session_id, update)
    
    async def notify_error(
        self, 
        session_id: str, 
        error_data: Dict[str, Any],
        priority: int = 4
    ):
        """Notify clients of errors"""
        
        update = RealtimeUpdate(
            update_type=UpdateType.ERROR_ALERT,
            session_id=session_id,
            timestamp=datetime.now().isoformat(),
            data=error_data,
            source="error_handler",
            priority=priority
        )
        
        await self.connection_manager.broadcast_to_session(session_id, update)
        self._add_to_history(session_id, update)
    
    async def notify_staff_assignment(
        self, 
        session_id: str, 
        staff_data: Dict[str, Any]
    ):
        """Notify clients of staff assignments and oversight"""
        
        update = RealtimeUpdate(
            update_type=UpdateType.STAFF_NOTIFICATION,
            session_id=session_id,
            timestamp=datetime.now().isoformat(),
            data=staff_data,
            source="staff_manager",
            priority=2
        )
        
        await self.connection_manager.broadcast_to_session(session_id, update)
        self._add_to_history(session_id, update)
    
    async def update_bot_health(self, bot_type: BotType, health_check: HealthCheck):
        """Update bot health status"""
        
        self.bot_health_status[bot_type] = health_check
        
        # Broadcast health update if there are issues
        if health_check.status != "healthy":
            health_update = RealtimeUpdate(
                update_type=UpdateType.BOT_STATUS,
                session_id="global",
                timestamp=datetime.now().isoformat(),
                data={
                    "bot_type": bot_type,
                    "health_status": health_check.status,
                    "response_time_ms": health_check.response_time_ms,
                    "current_load": health_check.current_load,
                    "error_rate": health_check.error_rate_percent
                },
                source="health_monitor",
                priority=3 if health_check.status == "degraded" else 4
            )
            
            await self.connection_manager.broadcast_to_all(health_update)
    
    async def _send_session_status(
        self, 
        websocket: websockets.WebSocketServerProtocol, 
        session_id: str
    ):
        """Send current session status to specific connection"""
        
        if self.orchestrator:
            status_data = self.orchestrator.get_session_status(session_id)
        else:
            status_data = {"session_id": session_id, "status": "unknown"}
        
        update = RealtimeUpdate(
            update_type=UpdateType.ORCHESTRATION_STATUS,
            session_id=session_id,
            timestamp=datetime.now().isoformat(),
            data=status_data,
            source="status_query"
        )
        
        await self.connection_manager._send_to_connection(websocket, update)
    
    async def _send_bot_health_status(
        self, 
        websocket: websockets.WebSocketServerProtocol, 
        session_id: str
    ):
        """Send bot health status to specific connection"""
        
        health_data = {
            bot_type: {
                "status": health_check.status,
                "response_time_ms": health_check.response_time_ms,
                "current_load": health_check.current_load,
                "error_rate_percent": health_check.error_rate_percent,
                "last_successful_task": health_check.last_successful_task
            }
            for bot_type, health_check in self.bot_health_status.items()
        }
        
        update = RealtimeUpdate(
            update_type=UpdateType.BOT_STATUS,
            session_id=session_id,
            timestamp=datetime.now().isoformat(),
            data=health_data,
            source="health_query"
        )
        
        await self.connection_manager._send_to_connection(websocket, update)
    
    def _add_to_history(self, session_id: str, update: RealtimeUpdate):
        """Add update to session history"""
        
        if session_id not in self.update_history:
            self.update_history[session_id] = []
        
        self.update_history[session_id].append(update)
        
        # Trim history if too large
        if len(self.update_history[session_id]) > self.max_history_size:
            self.update_history[session_id] = self.update_history[session_id][-self.max_history_size:]
    
    def _summarize_knowledge_content(self, content: Dict[str, Any]) -> str:
        """Create summary of knowledge update content"""
        
        if not content:
            return "No content"
        
        # Simple summarization - can be enhanced
        summary_parts = []
        
        if "insights" in content:
            summary_parts.append(f"{len(content['insights'])} new insights")
        
        if "patterns" in content:
            summary_parts.append(f"{len(content['patterns'])} patterns identified")
        
        if "recommendations" in content:
            summary_parts.append(f"{len(content['recommendations'])} recommendations")
        
        return ", ".join(summary_parts) if summary_parts else "Knowledge update received"
    
    async def _health_monitor(self):
        """Background task to monitor system health"""
        
        while True:
            try:
                await asyncio.sleep(30)  # Check every 30 seconds
                
                # Monitor bot health (placeholder - would integrate with actual health checks)
                current_time = datetime.now()
                
                for bot_type in BotType:
                    if bot_type not in self.bot_health_status:
                        continue
                    
                    health_check = self.bot_health_status[bot_type]
                    
                    # Check if health data is stale
                    if health_check.last_successful_task:
                        time_since_success = current_time - health_check.last_successful_task
                        if time_since_success > timedelta(minutes=10):
                            # Update health status to degraded
                            health_check.status = "degraded"
                            health_check.error_rate_percent = min(health_check.error_rate_percent + 5, 100)
                
            except Exception as e:
                logger.error(f"Health monitor error: {str(e)}")
    
    async def _connection_cleanup(self):
        """Background task to clean up stale connections"""
        
        while True:
            try:
                await asyncio.sleep(60)  # Cleanup every minute
                
                current_time = datetime.now()
                stale_connections = []
                
                for websocket, metadata in self.connection_manager.connection_metadata.items():
                    last_activity = datetime.fromisoformat(metadata.get("last_activity", "1970-01-01T00:00:00"))
                    if current_time - last_activity > timedelta(minutes=30):  # 30 minute timeout
                        stale_connections.append(websocket)
                
                # Clean up stale connections
                for websocket in stale_connections:
                    await self.connection_manager.disconnect(websocket)
                
                if stale_connections:
                    logger.info(f"Cleaned up {len(stale_connections)} stale connections")
                
            except Exception as e:
                logger.error(f"Connection cleanup error: {str(e)}")
    
    async def _update_history_cleanup(self):
        """Background task to clean up old update history"""
        
        while True:
            try:
                await asyncio.sleep(3600)  # Cleanup every hour
                
                cutoff_time = datetime.now() - timedelta(hours=24)  # Keep 24 hours
                
                for session_id, updates in list(self.update_history.items()):
                    # Filter out old updates
                    filtered_updates = [
                        update for update in updates
                        if datetime.fromisoformat(update.timestamp) > cutoff_time
                    ]
                    
                    if filtered_updates:
                        self.update_history[session_id] = filtered_updates
                    else:
                        del self.update_history[session_id]
                
            except Exception as e:
                logger.error(f"Update history cleanup error: {str(e)}")
    
    def get_connection_stats(self) -> Dict[str, Any]:
        """Get overall connection statistics"""
        
        total_connections = len(self.connection_manager.active_connections)
        session_count = len(self.connection_manager.session_connections)
        queued_messages = sum(len(queue) for queue in self.connection_manager.message_queues.values())
        
        return {
            "total_active_connections": total_connections,
            "active_sessions": session_count,
            "queued_messages": queued_messages,
            "bot_health_status": {
                bot_type: health.status 
                for bot_type, health in self.bot_health_status.items()
            },
            "update_history_size": sum(len(history) for history in self.update_history.values())
        }
    
    def get_session_update_history(self, session_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get update history for a specific session"""
        
        history = self.update_history.get(session_id, [])
        return [update.to_dict() for update in history[-limit:]]
