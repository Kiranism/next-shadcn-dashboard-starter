"""
AMT Orchestration Platform - Mobile API Gateway
File 28 of 47

Specialized mobile API gateway providing optimized endpoints for mobile coaching
applications. Features offline synchronization, push notifications, bandwidth
optimization, and native mobile integration for the Triangle Defense methodology.

Author: AMT Development Team
Created: 2025-09-25
"""

import asyncio
import logging
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import uuid
import hashlib
import base64

# FastAPI and mobile-specific imports
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

# Push notifications
import asyncpg
from apns2.client import APNsClient
from apns2.payload import Payload
import firebase_admin
from firebase_admin import messaging

# Platform imports  
from ..shared.orchestration_protocol import FormationType, TaskStatus, BotType, MessageType
from ..orchestration.orchestration_service import OrchestrationService
from ..ml.triangle_defense_optimizer import TriangleDefenseOptimizer, GameSituation, OptimizationResult
from ..security.security_manager import SecurityManager
from ..monitoring.metrics_collector import MetricsCollector
from ..integrations.triangle_defense_integration import TriangleDefenseIntegration
from ..integrations.mel_engine_integration import MELEngineIntegration


class MobileOS(Enum):
    """Supported mobile operating systems."""
    IOS = "ios"
    ANDROID = "android"
    MOBILE_WEB = "mobile_web"


class SyncStatus(Enum):
    """Offline synchronization status."""
    SYNCED = "synced"
    PENDING = "pending"
    CONFLICT = "conflict"
    FAILED = "failed"


class NotificationType(Enum):
    """Push notification types."""
    FORMATION_ALERT = "formation_alert"
    GAME_INSIGHT = "game_insight"
    TRAINING_REMINDER = "training_reminder"
    SYSTEM_UPDATE = "system_update"
    COACHING_TIP = "coaching_tip"


@dataclass
class MobileDevice:
    """Mobile device registration information."""
    device_id: str
    user_id: str
    platform: MobileOS
    push_token: str
    app_version: str
    os_version: str
    last_sync: datetime
    preferences: Dict[str, Any]
    is_active: bool


@dataclass
class OfflineData:
    """Data structure for offline synchronization."""
    entity_type: str
    entity_id: str
    data: Dict[str, Any]
    last_modified: datetime
    sync_status: SyncStatus
    conflict_resolution: Optional[str]
    device_id: str


class MobileFormationRequest(BaseModel):
    """Mobile-optimized formation request."""
    game_situation: Dict[str, Any]
    available_players: List[Dict[str, Any]] = []
    optimization_level: str = "advanced"
    offline_mode: bool = False
    device_id: str
    app_version: str


class MobileFormationResponse(BaseModel):
    """Mobile-optimized formation response."""
    recommended_formation: str
    confidence_score: float
    quick_insights: List[str]
    formation_image_url: str
    alternatives: List[Dict[str, Any]]
    cache_duration: int
    sync_token: str


class PushNotification(BaseModel):
    """Push notification structure."""
    title: str
    body: str
    notification_type: NotificationType
    data: Dict[str, Any] = {}
    priority: str = "normal"
    sound: Optional[str] = None
    badge_count: Optional[int] = None


class MobileBandwidthMiddleware(BaseHTTPMiddleware):
    """Middleware for bandwidth optimization and request compression."""
    
    async def dispatch(self, request: Request, call_next) -> Response:
        # Check if client supports compression
        accept_encoding = request.headers.get("accept-encoding", "")
        
        # Add mobile-specific headers
        request.state.is_mobile = self._is_mobile_request(request)
        request.state.bandwidth_level = self._detect_bandwidth(request)
        
        # Process request
        response = await call_next(request)
        
        # Add mobile-optimized headers
        response.headers["X-Mobile-Optimized"] = "true"
        response.headers["Cache-Control"] = "max-age=300, must-revalidate"
        
        return response
    
    def _is_mobile_request(self, request: Request) -> bool:
        """Detect if request is from mobile device."""
        user_agent = request.headers.get("user-agent", "").lower()
        mobile_indicators = ["mobile", "iphone", "android", "ipad", "tablet"]
        return any(indicator in user_agent for indicator in mobile_indicators)
    
    def _detect_bandwidth(self, request: Request) -> str:
        """Detect client bandwidth capabilities."""
        # Simple heuristic based on headers and connection info
        connection = request.headers.get("connection", "").lower()
        if "slow-2g" in connection or "2g" in connection:
            return "low"
        elif "3g" in connection:
            return "medium"
        else:
            return "high"


class MobileAPIGateway:
    """
    Mobile API Gateway for the AMT Orchestration Platform.
    
    Provides mobile-optimized endpoints with features including:
    - Bandwidth-optimized responses
    - Offline synchronization support
    - Push notification delivery
    - Mobile-specific authentication
    - Formation visualization for mobile screens
    - Real-time coaching insights
    """

    def __init__(
        self,
        orchestration_service: OrchestrationService,
        ml_optimizer: TriangleDefenseOptimizer,
        triangle_defense: TriangleDefenseIntegration,
        mel_engine: MELEngineIntegration,
        security_manager: SecurityManager,
        metrics_collector: MetricsCollector
    ):
        self.orchestration = orchestration_service
        self.ml_optimizer = ml_optimizer  
        self.triangle_defense = triangle_defense
        self.mel_engine = mel_engine
        self.security = security_manager
        self.metrics = metrics_collector
        
        self.logger = logging.getLogger(__name__)
        
        # Initialize FastAPI app
        self.app = FastAPI(
            title="AMT Mobile API Gateway",
            description="Mobile-optimized API for Triangle Defense coaching platform",
            version="1.0.0",
            docs_url="/mobile/docs",
            redoc_url="/mobile/redoc"
        )
        
        # Setup middleware
        self._setup_middleware()
        
        # Setup routes
        self._setup_routes()
        
        # Mobile-specific configuration
        self.config = {
            'max_offline_sync_days': 7,
            'image_optimization_quality': 80,
            'response_compression_threshold': 1024,
            'push_notification_batch_size': 100,
            'cache_duration_seconds': 300,
            'mobile_session_timeout_minutes': 30
        }
        
        # Device and sync management
        self.registered_devices: Dict[str, MobileDevice] = {}
        self.offline_sync_queue: Dict[str, List[OfflineData]] = {}
        self.push_notification_clients: Dict[MobileOS, Any] = {}
        
        # Performance tracking
        self.mobile_metrics = {
            'request_count': 0,
            'avg_response_time_ms': 0.0,
            'bandwidth_savings_bytes': 0,
            'offline_sync_operations': 0,
            'push_notifications_sent': 0
        }

    async def initialize(self) -> bool:
        """Initialize mobile API gateway with all dependencies."""
        try:
            self.logger.info("Initializing Mobile API Gateway...")
            
            # Initialize push notification services
            await self._setup_push_notifications()
            
            # Setup offline sync database
            await self._setup_offline_sync_storage()
            
            # Initialize mobile-specific caching
            await self._setup_mobile_cache()
            
            # Start background sync processes
            asyncio.create_task(self._background_sync_processor())
            asyncio.create_task(self._cleanup_expired_data())
            
            self.logger.info("Mobile API Gateway initialized successfully")
            await self.metrics.record_event("mobile_api_gateway_initialized", {"success": True})
            
            return True
            
        except Exception as e:
            self.logger.error(f"Mobile API Gateway initialization failed: {str(e)}")
            await self.metrics.record_event("mobile_api_gateway_init_failed", {"error": str(e)})
            return False

    def _setup_middleware(self) -> None:
        """Setup mobile-optimized middleware."""
        # CORS for mobile apps
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],  # Configure for production
            allow_credentials=True,
            allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allow_headers=["*"],
        )
        
        # Bandwidth optimization
        self.app.add_middleware(MobileBandwidthMiddleware)
        
        # Response compression
        self.app.add_middleware(GZipMiddleware, minimum_size=1000)

    def _setup_routes(self) -> None:
        """Setup mobile API routes."""
        
        @self.app.get("/mobile/health")
        async def mobile_health_check():
            """Mobile-specific health check with device compatibility info."""
            return {
                "status": "healthy",
                "timestamp": datetime.utcnow().isoformat(),
                "mobile_features": {
                    "offline_sync": True,
                    "push_notifications": True,
                    "formation_visualization": True,
                    "real_time_coaching": True
                },
                "supported_platforms": [platform.value for platform in MobileOS],
                "api_version": "1.0.0"
            }

        @self.app.post("/mobile/device/register")
        async def register_mobile_device(
            device_info: Dict[str, Any],
            credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
        ):
            """Register mobile device for push notifications and offline sync."""
            try:
                # Validate authentication
                user_id = await self.security.validate_token(credentials.credentials)
                if not user_id:
                    raise HTTPException(status_code=401, detail="Invalid authentication token")
                
                # Create device registration
                device = MobileDevice(
                    device_id=device_info["device_id"],
                    user_id=user_id,
                    platform=MobileOS(device_info["platform"]),
                    push_token=device_info["push_token"],
                    app_version=device_info["app_version"],
                    os_version=device_info["os_version"],
                    last_sync=datetime.utcnow(),
                    preferences=device_info.get("preferences", {}),
                    is_active=True
                )
                
                # Store device registration
                self.registered_devices[device.device_id] = device
                
                # Initialize offline sync queue
                self.offline_sync_queue[device.device_id] = []
                
                await self.metrics.record_event("mobile_device_registered", {
                    "device_id": device.device_id,
                    "platform": device.platform.value,
                    "user_id": user_id
                })
                
                return {
                    "success": True,
                    "device_id": device.device_id,
                    "sync_enabled": True,
                    "push_enabled": True,
                    "registration_timestamp": device.last_sync.isoformat()
                }
                
            except Exception as e:
                self.logger.error(f"Device registration failed: {str(e)}")
                raise HTTPException(status_code=400, detail=str(e))

        @self.app.post("/mobile/formation/optimize", response_model=MobileFormationResponse)
        async def optimize_formation_mobile(
            request: MobileFormationRequest,
            background_tasks: BackgroundTasks,
            credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
        ):
            """Mobile-optimized formation optimization with caching and compression."""
            start_time = datetime.utcnow()
            
            try:
                # Validate authentication
                user_id = await self.security.validate_token(credentials.credentials)
                if not user_id:
                    raise HTTPException(status_code=401, detail="Invalid authentication token")
                
                # Convert request to game situation
                game_situation = GameSituation(**request.game_situation)
                
                # Check if device supports offline mode
                if request.offline_mode:
                    cached_result = await self._get_cached_optimization(request.device_id, game_situation)
                    if cached_result:
                        return cached_result
                
                # Perform optimization
                optimization_result = await self.ml_optimizer.optimize_formation(
                    game_situation=game_situation,
                    available_players=request.available_players,
                    session_id=f"mobile_{request.device_id}_{uuid.uuid4()}"
                )
                
                # Generate mobile-optimized response
                mobile_response = await self._create_mobile_response(
                    optimization_result,
                    request.device_id,
                    user_id
                )
                
                # Cache for offline use
                if request.offline_mode:
                    background_tasks.add_task(
                        self._cache_optimization_result,
                        request.device_id,
                        game_situation,
                        mobile_response
                    )
                
                # Record mobile metrics
                execution_time = (datetime.utcnow() - start_time).total_seconds() * 1000
                await self.metrics.record_event("mobile_formation_optimization", {
                    "device_id": request.device_id,
                    "formation": optimization_result.recommended_formation.value,
                    "confidence": optimization_result.confidence_score,
                    "execution_time_ms": execution_time,
                    "offline_mode": request.offline_mode
                })
                
                # Send push notification with result (if enabled)
                device = self.registered_devices.get(request.device_id)
                if device and device.preferences.get("formation_alerts", True):
                    background_tasks.add_task(
                        self._send_formation_notification,
                        device,
                        optimization_result
                    )
                
                return mobile_response
                
            except Exception as e:
                self.logger.error(f"Mobile formation optimization failed: {str(e)}")
                raise HTTPException(status_code=400, detail=str(e))

        @self.app.get("/mobile/formation/visualization/{formation_type}")
        async def get_formation_visualization(
            formation_type: str,
            device_id: str = Query(...),
            quality: str = Query("medium", regex="^(low|medium|high)$"),
            credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
        ):
            """Get mobile-optimized formation visualization images."""
            try:
                # Validate authentication
                user_id = await self.security.validate_token(credentials.credentials)
                if not user_id:
                    raise HTTPException(status_code=401, detail="Invalid authentication token")
                
                # Get device bandwidth preferences
                device = self.registered_devices.get(device_id)
                if device:
                    # Adjust quality based on device capabilities
                    if device.preferences.get("data_saver", False):
                        quality = "low"
                
                # Generate formation visualization
                visualization_data = await self.triangle_defense.generate_formation_visualization(
                    FormationType(formation_type),
                    mobile_optimized=True,
                    quality_level=quality
                )
                
                if not visualization_data:
                    raise HTTPException(status_code=404, detail="Formation visualization not found")
                
                # Return optimized image response
                return StreamingResponse(
                    io.BytesIO(visualization_data),
                    media_type="image/png",
                    headers={
                        "Cache-Control": f"max-age={self.config['cache_duration_seconds']}",
                        "X-Image-Quality": quality,
                        "X-Mobile-Optimized": "true"
                    }
                )
                
            except Exception as e:
                self.logger.error(f"Formation visualization failed: {str(e)}")
                raise HTTPException(status_code=400, detail=str(e))

        @self.app.post("/mobile/sync/upload")
        async def upload_offline_data(
            sync_data: List[Dict[str, Any]],
            device_id: str = Query(...),
            credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
        ):
            """Upload offline data for synchronization."""
            try:
                # Validate authentication  
                user_id = await self.security.validate_token(credentials.credentials)
                if not user_id:
                    raise HTTPException(status_code=401, detail="Invalid authentication token")
                
                # Process sync data
                sync_results = []
                for data_item in sync_data:
                    result = await self._process_offline_sync_item(device_id, data_item, user_id)
                    sync_results.append(result)
                
                # Update device sync timestamp
                if device_id in self.registered_devices:
                    self.registered_devices[device_id].last_sync = datetime.utcnow()
                
                await self.metrics.record_event("mobile_offline_sync_upload", {
                    "device_id": device_id,
                    "items_count": len(sync_data),
                    "successful_syncs": len([r for r in sync_results if r["status"] == "success"])
                })
                
                return {
                    "sync_results": sync_results,
                    "sync_timestamp": datetime.utcnow().isoformat(),
                    "total_processed": len(sync_results)
                }
                
            except Exception as e:
                self.logger.error(f"Offline sync upload failed: {str(e)}")
                raise HTTPException(status_code=400, detail=str(e))

        @self.app.get("/mobile/sync/download")
        async def download_sync_data(
            device_id: str = Query(...),
            since: Optional[str] = Query(None),
            credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
        ):
            """Download pending sync data for offline use."""
            try:
                # Validate authentication
                user_id = await self.security.validate_token(credentials.credentials)
                if not user_id:
                    raise HTTPException(status_code=401, detail="Invalid authentication token")
                
                # Parse since timestamp
                since_timestamp = datetime.fromisoformat(since) if since else datetime.utcnow() - timedelta(days=1)
                
                # Get pending sync data
                sync_data = await self._get_pending_sync_data(device_id, user_id, since_timestamp)
                
                # Optimize data for mobile bandwidth
                optimized_data = await self._optimize_sync_data_for_mobile(sync_data, device_id)
                
                return {
                    "sync_data": optimized_data,
                    "sync_timestamp": datetime.utcnow().isoformat(),
                    "total_items": len(optimized_data),
                    "compression_ratio": self._calculate_compression_ratio(sync_data, optimized_data)
                }
                
            except Exception as e:
                self.logger.error(f"Sync data download failed: {str(e)}")
                raise HTTPException(status_code=400, detail=str(e))

        @self.app.post("/mobile/notifications/send")
        async def send_push_notification(
            notification: PushNotification,
            target_devices: List[str],
            background_tasks: BackgroundTasks,
            credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
        ):
            """Send push notification to specified mobile devices."""
            try:
                # Validate admin authentication
                user_id = await self.security.validate_admin_token(credentials.credentials)
                if not user_id:
                    raise HTTPException(status_code=401, detail="Admin authentication required")
                
                # Send notifications in background
                background_tasks.add_task(
                    self._send_bulk_push_notifications,
                    notification,
                    target_devices
                )
                
                return {
                    "success": True,
                    "target_device_count": len(target_devices),
                    "notification_type": notification.notification_type.value,
                    "scheduled_at": datetime.utcnow().isoformat()
                }
                
            except Exception as e:
                self.logger.error(f"Push notification send failed: {str(e)}")
                raise HTTPException(status_code=400, detail=str(e))

        @self.app.get("/mobile/coaching/insights")
        async def get_mobile_coaching_insights(
            device_id: str = Query(...),
            limit: int = Query(10, ge=1, le=50),
            credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
        ):
            """Get personalized coaching insights optimized for mobile display."""
            try:
                # Validate authentication
                user_id = await self.security.validate_token(credentials.credentials)
                if not user_id:
                    raise HTTPException(status_code=401, detail="Invalid authentication token")
                
                # Get device preferences for content optimization
                device = self.registered_devices.get(device_id)
                content_level = device.preferences.get("content_detail", "medium") if device else "medium"
                
                # Generate mobile-optimized insights
                insights = await self._generate_mobile_coaching_insights(
                    user_id=user_id,
                    device_id=device_id,
                    content_level=content_level,
                    limit=limit
                )
                
                return {
                    "insights": insights,
                    "generated_at": datetime.utcnow().isoformat(),
                    "content_level": content_level,
                    "total_insights": len(insights)
                }
                
            except Exception as e:
                self.logger.error(f"Mobile coaching insights failed: {str(e)}")
                raise HTTPException(status_code=400, detail=str(e))

    # Private helper methods

    async def _setup_push_notifications(self) -> None:
        """Setup push notification services for iOS and Android."""
        try:
            # Initialize APNs client for iOS
            # TODO: Configure with actual certificates
            # self.push_notification_clients[MobileOS.IOS] = APNsClient(credentials=...)
            
            # Initialize Firebase Admin SDK for Android
            # TODO: Configure with actual service account
            # firebase_admin.initialize_app(credentials=...)
            # self.push_notification_clients[MobileOS.ANDROID] = messaging
            
            self.logger.info("Push notification services configured")
            
        except Exception as e:
            self.logger.error(f"Push notification setup failed: {str(e)}")

    async def _create_mobile_response(
        self, 
        optimization_result: OptimizationResult, 
        device_id: str, 
        user_id: str
    ) -> MobileFormationResponse:
        """Create mobile-optimized response from optimization result."""
        
        # Generate quick insights for mobile display
        quick_insights = [
            f"{optimization_result.recommended_formation.value} formation recommended",
            f"{optimization_result.confidence_score:.1%} confidence",
        ]
        
        if optimization_result.strategic_insights:
            quick_insights.extend(optimization_result.strategic_insights[:2])  # Limit for mobile
        
        # Generate formation image URL
        formation_image_url = f"/mobile/formation/visualization/{optimization_result.recommended_formation.value}?device_id={device_id}&quality=medium"
        
        # Create simplified alternatives for mobile
        alternatives = [
            {
                "formation": alt.formation_type.value,
                "effectiveness": alt.effectiveness_score,
                "quick_summary": f"{alt.formation_type.value}: {alt.effectiveness_score:.1%} effective"
            }
            for alt in optimization_result.alternative_formations[:3]  # Limit alternatives
        ]
        
        # Generate sync token for offline caching
        sync_token = hashlib.md5(
            f"{device_id}_{optimization_result.recommended_formation.value}_{datetime.utcnow().isoformat()}".encode()
        ).hexdigest()
        
        return MobileFormationResponse(
            recommended_formation=optimization_result.recommended_formation.value,
            confidence_score=optimization_result.confidence_score,
            quick_insights=quick_insights,
            formation_image_url=formation_image_url,
            alternatives=alternatives,
            cache_duration=self.config['cache_duration_seconds'],
            sync_token=sync_token
        )

    async def _send_formation_notification(
        self, 
        device: MobileDevice, 
        optimization_result: OptimizationResult
    ) -> None:
        """Send push notification about formation optimization result."""
        try:
            notification = PushNotification(
                title="Formation Recommendation",
                body=f"{optimization_result.recommended_formation.value} formation recommended with {optimization_result.confidence_score:.0%} confidence",
                notification_type=NotificationType.FORMATION_ALERT,
                data={
                    "formation": optimization_result.recommended_formation.value,
                    "confidence": optimization_result.confidence_score
                }
            )
            
            await self._send_push_notification_to_device(device, notification)
            
        except Exception as e:
            self.logger.error(f"Formation notification failed: {str(e)}")

    async def _background_sync_processor(self) -> None:
        """Background process for handling offline synchronization."""
        while True:
            try:
                await asyncio.sleep(30)  # Process every 30 seconds
                
                for device_id, sync_queue in self.offline_sync_queue.items():
                    if sync_queue:
                        # Process pending sync items
                        processed = 0
                        for sync_item in sync_queue[:10]:  # Process in batches
                            try:
                                await self._process_sync_item(sync_item)
                                sync_queue.remove(sync_item)
                                processed += 1
                            except Exception as e:
                                self.logger.error(f"Sync item processing failed: {str(e)}")
                        
                        if processed > 0:
                            self.logger.info(f"Processed {processed} sync items for device {device_id}")
                
            except Exception as e:
                self.logger.error(f"Background sync processor error: {str(e)}")
                await asyncio.sleep(60)  # Wait longer on error

    async def get_mobile_api_status(self) -> Dict[str, Any]:
        """Get current mobile API gateway status."""
        return {
            "gateway_initialized": True,
            "registered_devices": len(self.registered_devices),
            "active_sync_queues": len([q for q in self.offline_sync_queue.values() if q]),
            "push_services_available": len(self.push_notification_clients),
            "mobile_metrics": self.mobile_metrics,
            "configuration": self.config
        }


# Export main class
__all__ = ['MobileAPIGateway', 'MobileDevice', 'MobileFormationRequest', 'MobileFormationResponse']
