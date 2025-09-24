"""
AMT Orchestration Service
Main service orchestrator that coordinates all orchestration components
"""

import asyncio
import logging
import signal
import sys
from typing import Dict, List, Optional, Any
from datetime import datetime
from contextlib import asynccontextmanager
import uvicorn
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .central_orchestrator import CentralOrchestrator
from .knowledge_aware_orchestrator import KnowledgeAwareOrchestrator
from .realtime_coordinator import RealtimeCoordinator
from .bot_integration_layer import (
    MayaPatelBotIntegration, RachelFosterBotIntegration,
    JakeMorrisonBotIntegration, DavidKimBotIntegration
)
from .staff_integration_manager import StaffIntegrationManager
from .error_recovery_manager import ErrorRecoveryManager
from .configuration_manager import ConfigurationManager, get_config_manager, initialize_configuration
from .session_manager import SessionManager, SessionPriority
from .metrics_collector import MetricsCollector
from ..shared.orchestration_protocol import (
    BotType, TaskStatus, OrchestrationError, BotCommunicationError
)

logger = logging.getLogger(__name__)

class OrchestrationService:
    """Main orchestration service that coordinates all components"""
    
    def __init__(self, config_file_path: Optional[str] = None):
        # Core components
        self.config_manager: Optional[ConfigurationManager] = None
        self.session_manager: Optional[SessionManager] = None
        self.orchestrator: Optional[KnowledgeAwareOrchestrator] = None
        self.realtime_coordinator: Optional[RealtimeCoordinator] = None
        self.staff_manager: Optional[StaffIntegrationManager] = None
        self.error_manager: Optional[ErrorRecoveryManager] = None
        self.metrics_collector: Optional[MetricsCollector] = None
        
        # Bot integrations
        self.bot_integrations: Dict[BotType, Any] = {}
        
        # Service state
        self.is_initialized = False
        self.is_running = False
        self.startup_time: Optional[datetime] = None
        self.shutdown_handlers: List[callable] = []
        
        # FastAPI application
        self.app: Optional[FastAPI] = None
        
        # Configuration
        self.config_file_path = config_file_path
        
        # Background tasks
        self.background_tasks: List[asyncio.Task] = []
        
    async def initialize(self) -> bool:
        """Initialize all orchestration components"""
        
        if self.is_initialized:
            logger.warning("Orchestration service already initialized")
            return True
        
        try:
            logger.info("Initializing AMT Orchestration Service...")
            
            # 1. Initialize configuration manager
            self.config_manager = get_config_manager()
            if self.config_file_path:
                self.config_manager.config_file_path = self.config_file_path
            
            config = await initialize_configuration(self.config_file_path)
            logger.info(f"Configuration loaded for environment: {config.environment}")
            
            # 2. Initialize staff integration manager
            self.staff_manager = StaffIntegrationManager()
            logger.info("Staff integration manager initialized")
            
            # 3. Initialize error recovery manager
            self.error_manager = ErrorRecoveryManager(
                staff_integration_manager=self.staff_manager
            )
            logger.info("Error recovery manager initialized")
            
            # 4. Initialize metrics collector
            self.metrics_collector = MetricsCollector(
                config_manager=self.config_manager
            )
            await self.metrics_collector.initialize()
            logger.info("Metrics collector initialized")
            
            # 5. Initialize real-time coordinator
            self.realtime_coordinator = RealtimeCoordinator()
            await self.realtime_coordinator.start_background_services()
            logger.info("Real-time coordinator initialized")
            
            # 6. Initialize session manager
            self.session_manager = SessionManager(
                staff_manager=self.staff_manager,
                error_manager=self.error_manager,
                realtime_coordinator=self.realtime_coordinator,
                config_manager=self.config_manager
            )
            await self.session_manager.initialize()
            logger.info("Session manager initialized")
            
            # 7. Initialize knowledge-aware orchestrator
            self.orchestrator = KnowledgeAwareOrchestrator(
                bot_endpoints=config.get_bot_endpoints_dict(),
                nuclino_config=config.nuclino.__dict__ if config.nuclino.enabled else None
            )
            logger.info("Knowledge-aware orchestrator initialized")
            
            # 8. Update component references
            self.error_manager.realtime_coordinator = self.realtime_coordinator
            self.metrics_collector.session_manager = self.session_manager
            self.metrics_collector.orchestrator = self.orchestrator
            self.metrics_collector.realtime_coordinator = self.realtime_coordinator
            
            # 9. Initialize bot integrations (placeholder for future integration)
            await self._initialize_bot_integrations()
            
            # 10. Initialize FastAPI application
            await self._initialize_web_service()
            
            # 11. Register shutdown handlers
            self._register_shutdown_handlers()
            
            self.is_initialized = True
            self.startup_time = datetime.now()
            
            logger.info("AMT Orchestration Service initialized successfully")
            
            # Record startup metrics
            self.metrics_collector.increment_counter(
                "service_startups",
                self.metrics_collector.MetricScope.SYSTEM
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize orchestration service: {str(e)}")
            await self._cleanup_partial_initialization()
            raise OrchestrationError(f"Service initialization failed: {str(e)}")
    
    async def _initialize_bot_integrations(self):
        """Initialize bot integration components"""
        
        # These would be initialized when the actual bot services are available
        # For now, we register the integration classes for future use
        
        self.bot_integrations = {
            BotType.DESIGN: MayaPatelBotIntegration,
            BotType.AI_RESEARCH: RachelFosterBotIntegration,
            BotType.DEVOPS: JakeMorrisonBotIntegration,
            BotType.INNOVATION: DavidKimBotIntegration
        }
        
        logger.info(f"Bot integrations registered: {list(self.bot_integrations.keys())}")
    
    async def _initialize_web_service(self):
        """Initialize FastAPI web service"""
        
        self.app = FastAPI(
            title="AMT Orchestration Service",
            description="AI-Orchestrated Developer Studio API",
            version="1.0.0",
            docs_url="/docs" if self.config_manager.config.debug else None,
            redoc_url="/redoc" if self.config_manager.config.debug else None
        )
        
        # Add CORS middleware
        if self.config_manager.config.security.allowed_origins:
            self.app.add_middleware(
                CORSMiddleware,
                allow_origins=self.config_manager.config.security.allowed_origins,
                allow_credentials=True,
                allow_methods=["*"],
                allow_headers=["*"]
            )
        
        # Register API routes
        await self._register_api_routes()
        
        # Register WebSocket routes
        await self._register_websocket_routes()
        
        logger.info("FastAPI web service initialized")
    
    async def _register_api_routes(self):
        """Register REST API routes"""
        
        @self.app.post("/api/v1/orchestration/sessions")
        async def create_orchestration_session(request: Dict[str, Any]):
            """Create new orchestration session"""
            
            try:
                # Validate request
                if not request.get("user_request") or not request.get("user_id"):
                    raise HTTPException(status_code=400, detail="Missing required fields")
                
                # Create session
                session_id = await self.session_manager.create_session(
                    user_request=request["user_request"],
                    requirements=request.get("requirements", []),
                    user_id=request["user_id"],
                    constraints=request.get("constraints"),
                    priority=SessionPriority(request.get("priority", "normal"))
                )
                
                # Start session
                success = await self.session_manager.start_session(session_id)
                
                if not success:
                    raise HTTPException(status_code=500, detail="Failed to start session")
                
                # Record metrics
                self.metrics_collector.increment_counter(
                    "api_sessions_created",
                    self.metrics_collector.MetricScope.SYSTEM
                )
                
                return JSONResponse({
                    "session_id": session_id,
                    "status": "created",
                    "message": "Orchestration session created and started"
                })
                
            except Exception as e:
                logger.error(f"Failed to create session: {str(e)}")
                self.metrics_collector.increment_counter(
                    "api_errors",
                    self.metrics_collector.MetricScope.SYSTEM,
                    tags={"endpoint": "create_session"}
                )
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.get("/api/v1/orchestration/sessions/{session_id}")
        async def get_session_status(session_id: str):
            """Get session status and progress"""
            
            try:
                snapshot = self.session_manager.get_session_snapshot(session_id)
                
                if not snapshot:
                    raise HTTPException(status_code=404, detail="Session not found")
                
                return JSONResponse(snapshot.__dict__)
                
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Failed to get session status: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.post("/api/v1/orchestration/sessions/{session_id}/suspend")
        async def suspend_session(session_id: str, request: Dict[str, Any]):
            """Suspend active session"""
            
            try:
                reason = request.get("reason", "Manual suspension")
                resume_conditions = request.get("resume_conditions")
                
                success = await self.session_manager.suspend_session(
                    session_id, reason, resume_conditions
                )
                
                if not success:
                    raise HTTPException(status_code=400, detail="Cannot suspend session")
                
                return JSONResponse({
                    "session_id": session_id,
                    "status": "suspended",
                    "reason": reason
                })
                
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Failed to suspend session: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.post("/api/v1/orchestration/sessions/{session_id}/resume")
        async def resume_session(session_id: str):
            """Resume suspended session"""
            
            try:
                success = await self.session_manager.resume_session(session_id)
                
                if not success:
                    raise HTTPException(status_code=400, detail="Cannot resume session")
                
                return JSONResponse({
                    "session_id": session_id,
                    "status": "resumed"
                })
                
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Failed to resume session: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.get("/api/v1/orchestration/sessions")
        async def list_sessions(user_id: Optional[str] = None):
            """List orchestration sessions"""
            
            try:
                if user_id:
                    sessions = self.session_manager.list_sessions_by_user(user_id)
                else:
                    sessions = self.session_manager.list_active_sessions()
                
                return JSONResponse({
                    "sessions": [session.__dict__ for session in sessions],
                    "count": len(sessions)
                })
                
            except Exception as e:
                logger.error(f"Failed to list sessions: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.get("/api/v1/health")
        async def health_check():
            """Service health check"""
            
            health_status = {
                "status": "healthy" if self.is_running else "unhealthy",
                "timestamp": datetime.now().isoformat(),
                "uptime_seconds": (
                    (datetime.now() - self.startup_time).total_seconds()
                    if self.startup_time else 0
                ),
                "components": {
                    "config_manager": self.config_manager is not None,
                    "session_manager": self.session_manager is not None,
                    "orchestrator": self.orchestrator is not None,
                    "realtime_coordinator": self.realtime_coordinator is not None,
                    "staff_manager": self.staff_manager is not None,
                    "error_manager": self.error_manager is not None,
                    "metrics_collector": self.metrics_collector is not None
                }
            }
            
            return JSONResponse(health_status)
        
        @self.app.get("/api/v1/metrics")
        async def get_metrics():
            """Get system metrics"""
            
            try:
                health_report = self.metrics_collector.get_system_health_report()
                session_metrics = self.session_manager.get_session_metrics()
                
                return JSONResponse({
                    "system_health": health_report,
                    "session_metrics": session_metrics,
                    "timestamp": datetime.now().isoformat()
                })
                
            except Exception as e:
                logger.error(f"Failed to get metrics: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.get("/api/v1/metrics/bot/{bot_type}")
        async def get_bot_metrics(bot_type: str):
            """Get bot-specific performance metrics"""
            
            try:
                bot_enum = BotType(bot_type)
                report = self.metrics_collector.get_bot_performance_report(bot_enum)
                
                return JSONResponse(report)
                
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid bot type: {bot_type}")
            except Exception as e:
                logger.error(f"Failed to get bot metrics: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.get("/api/v1/staff")
        async def get_staff_directory():
            """Get AMT staff directory"""
            
            try:
                directory = self.staff_manager.get_staff_directory()
                
                return JSONResponse({
                    "staff_directory": directory,
                    "total_staff": len(directory),
                    "timestamp": datetime.now().isoformat()
                })
                
            except Exception as e:
                logger.error(f"Failed to get staff directory: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.get("/api/v1/staff/{staff_id}/workload")
        async def get_staff_workload(staff_id: str):
            """Get staff member workload"""
            
            try:
                workload = self.staff_manager.get_staff_workload(staff_id)
                
                if not workload:
                    raise HTTPException(status_code=404, detail="Staff member not found")
                
                return JSONResponse(workload)
                
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Failed to get staff workload: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))
    
    async def _register_websocket_routes(self):
        """Register WebSocket routes"""
        
        @self.app.websocket("/ws/orchestration/realtime/{session_id}")
        async def websocket_endpoint(websocket: WebSocket, session_id: str):
            """Real-time orchestration updates WebSocket"""
            
            try:
                await self.realtime_coordinator.handle_websocket_connection(
                    websocket, f"/orchestration/realtime/{session_id}"
                )
            except WebSocketDisconnect:
                logger.info(f"WebSocket disconnected for session {session_id}")
            except Exception as e:
                logger.error(f"WebSocket error for session {session_id}: {str(e)}")
        
        @self.app.websocket("/ws/system/metrics")
        async def metrics_websocket(websocket: WebSocket):
            """Real-time system metrics WebSocket"""
            
            await websocket.accept()
            
            try:
                while True:
                    # Send metrics every 10 seconds
                    await asyncio.sleep(10)
                    
                    metrics = self.metrics_collector.get_system_health_report()
                    await websocket.send_json(metrics)
                    
            except WebSocketDisconnect:
                logger.info("Metrics WebSocket disconnected")
            except Exception as e:
                logger.error(f"Metrics WebSocket error: {str(e)}")
    
    def _register_shutdown_handlers(self):
        """Register system shutdown handlers"""
        
        def signal_handler(signum, frame):
            logger.info(f"Received signal {signum}, initiating graceful shutdown...")
            asyncio.create_task(self.shutdown())
        
        signal.signal(signal.SIGTERM, signal_handler)
        signal.signal(signal.SIGINT, signal_handler)
    
    async def start(self, host: str = "0.0.0.0", port: int = 8000):
        """Start the orchestration service"""
        
        if not self.is_initialized:
            await self.initialize()
        
        if self.is_running:
            logger.warning("Service is already running")
            return
        
        try:
            logger.info(f"Starting AMT Orchestration Service on {host}:{port}")
            
            self.is_running = True
            
            # Start health monitoring task
            health_task = asyncio.create_task(self._health_monitor())
            self.background_tasks.append(health_task)
            
            # Start the FastAPI server
            config = uvicorn.Config(
                app=self.app,
                host=host,
                port=port,
                log_level="info" if self.config_manager.config.debug else "warning",
                access_log=self.config_manager.config.debug
            )
            
            server = uvicorn.Server(config)
            
            # Add server shutdown handler
            self.shutdown_handlers.append(server.shutdown)
            
            await server.serve()
            
        except Exception as e:
            logger.error(f"Failed to start orchestration service: {str(e)}")
            self.is_running = False
            raise
    
    async def _health_monitor(self):
        """Background health monitoring task"""
        
        while self.is_running:
            try:
                await asyncio.sleep(30)  # Check every 30 seconds
                
                # Check component health
                unhealthy_components = []
                
                if not self.session_manager:
                    unhealthy_components.append("session_manager")
                
                if not self.orchestrator:
                    unhealthy_components.append("orchestrator")
                
                if not self.realtime_coordinator:
                    unhealthy_components.append("realtime_coordinator")
                
                if unhealthy_components:
                    logger.warning(f"Unhealthy components detected: {unhealthy_components}")
                    
                    # Record health metrics
                    self.metrics_collector.set_gauge(
                        "service_health_score",
                        1.0 - (len(unhealthy_components) / 7),  # 7 total components
                        self.metrics_collector.MetricScope.SYSTEM
                    )
                else:
                    self.metrics_collector.set_gauge(
                        "service_health_score",
                        1.0,
                        self.metrics_collector.MetricScope.SYSTEM
                    )
                
            except Exception as e:
                logger.error(f"Health monitor error: {str(e)}")
    
    async def shutdown(self, force: bool = False):
        """Shutdown the orchestration service gracefully"""
        
        logger.info("Initiating orchestration service shutdown...")
        
        self.is_running = False
        
        try:
            # Cancel background tasks
            for task in self.background_tasks:
                if not task.done():
                    task.cancel()
                    try:
                        await asyncio.wait_for(task, timeout=5.0)
                    except (asyncio.CancelledError, asyncio.TimeoutError):
                        pass
            
            # Shutdown components in reverse order
            shutdown_order = [
                ("metrics_collector", self.metrics_collector),
                ("session_manager", self.session_manager),
                ("realtime_coordinator", self.realtime_coordinator),
                ("error_manager", self.error_manager),
                ("orchestrator", self.orchestrator),
                ("config_manager", self.config_manager)
            ]
            
            for component_name, component in shutdown_order:
                if component and hasattr(component, 'shutdown'):
                    try:
                        logger.info(f"Shutting down {component_name}...")
                        await asyncio.wait_for(component.shutdown(), timeout=10.0)
                    except asyncio.TimeoutError:
                        logger.warning(f"{component_name} shutdown timed out")
                    except Exception as e:
                        logger.error(f"Error shutting down {component_name}: {str(e)}")
            
            # Execute shutdown handlers
            for handler in self.shutdown_handlers:
                try:
                    if asyncio.iscoroutinefunction(handler):
                        await handler()
                    else:
                        handler()
                except Exception as e:
                    logger.error(f"Shutdown handler error: {str(e)}")
            
            logger.info("Orchestration service shutdown complete")
            
        except Exception as e:
            logger.error(f"Error during shutdown: {str(e)}")
            if not force:
                raise
    
    async def _cleanup_partial_initialization(self):
        """Clean up after partial initialization failure"""
        
        components_to_cleanup = [
            self.metrics_collector,
            self.session_manager,
            self.realtime_coordinator,
            self.error_manager
        ]
        
        for component in components_to_cleanup:
            if component and hasattr(component, 'shutdown'):
                try:
                    await component.shutdown()
                except Exception as e:
                    logger.error(f"Cleanup error: {str(e)}")
    
    def get_service_status(self) -> Dict[str, Any]:
        """Get comprehensive service status"""
        
        return {
            "service_name": "AMT Orchestration Service",
            "version": "1.0.0",
            "is_initialized": self.is_initialized,
            "is_running": self.is_running,
            "startup_time": self.startup_time.isoformat() if self.startup_time else None,
            "uptime_seconds": (
                (datetime.now() - self.startup_time).total_seconds()
                if self.startup_time else 0
            ),
            "components": {
                "config_manager": self.config_manager is not None,
                "session_manager": self.session_manager is not None,
                "orchestrator": self.orchestrator is not None,
                "realtime_coordinator": self.realtime_coordinator is not None,
                "staff_manager": self.staff_manager is not None,
                "error_manager": self.error_manager is not None,
                "metrics_collector": self.metrics_collector is not None
            },
            "bot_integrations": list(self.bot_integrations.keys()),
            "background_tasks": len(self.background_tasks),
            "environment": (
                self.config_manager.config.environment 
                if self.config_manager and self.config_manager.config else "unknown"
            )
        }

# Global service instance
_orchestration_service: Optional[OrchestrationService] = None

def get_orchestration_service(config_file_path: Optional[str] = None) -> OrchestrationService:
    """Get global orchestration service instance"""
    global _orchestration_service
    
    if _orchestration_service is None:
        _orchestration_service = OrchestrationService(config_file_path)
    
    return _orchestration_service

async def start_orchestration_service(
    config_file_path: Optional[str] = None,
    host: str = "0.0.0.0",
    port: int = 8000
):
    """Start orchestration service (convenience function)"""
    
    service = get_orchestration_service(config_file_path)
    await service.start(host, port)

async def shutdown_orchestration_service(force: bool = False):
    """Shutdown orchestration service (convenience function)"""
    
    global _orchestration_service
    
    if _orchestration_service:
        await _orchestration_service.shutdown(force)
        _orchestration_service = None

# CLI entry point
async def main():
    """Main entry point for running the orchestration service"""
    
    import argparse
    
    parser = argparse.ArgumentParser(description="AMT Orchestration Service")
    parser.add_argument("--config", type=str, help="Configuration file path")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Host to bind to")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind to")
    parser.add_argument("--debug", action="store_true", help="Enable debug mode")
    
    args = parser.parse_args()
    
    # Configure logging
    logging.basicConfig(
        level=logging.DEBUG if args.debug else logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    
    try:
        await start_orchestration_service(
            config_file_path=args.config,
            host=args.host,
            port=args.port
        )
    except KeyboardInterrupt:
        logger.info("Received keyboard interrupt")
    except Exception as e:
        logger.error(f"Service error: {str(e)}")
        sys.exit(1)
    finally:
        await shutdown_orchestration_service()

if __name__ == "__main__":
    asyncio.run(main())
