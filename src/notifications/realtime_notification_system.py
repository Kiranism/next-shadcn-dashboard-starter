"""
AMT Orchestration Platform - Real-Time Notification System
File 33 of 47

Comprehensive real-time notification system providing instant alerts for Triangle Defense
formation changes, M.E.L. AI insights, coaching notifications, system alerts, and
multi-channel communication (push notifications, WebSocket, email, SMS) across
the AMT Platform ecosystem with role-based delivery and priority management.

Author: AMT Development Team
Created: 2025-09-25
"""

import asyncio
import logging
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union, Set, Callable
from dataclasses import dataclass, asdict, field
from enum import Enum
import uuid
import re

# Real-time communication
import websockets
from websockets.server import WebSocketServerProtocol
import socketio
from aiohttp import web
import redis.asyncio as redis

# Push notifications
from apns2.client import APNsClient
from apns2.payload import Payload
import firebase_admin
from firebase_admin import messaging
from pyfcm import FCMNotification

# Email notifications
import aiosmtplib
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
from email.mime.base import MimeBase
from email import encoders
import jinja2

# SMS notifications
from twilio.rest import Client as TwilioClient
import boto3

# Platform imports
from ..shared.orchestration_protocol import FormationType, TaskStatus, BotType
from ..orchestration.orchestration_service import OrchestrationService
from ..ml.triangle_defense_optimizer import TriangleDefenseOptimizer
from ..user_management.enterprise_user_management import EnterpriseUserManagement, UserRole
from ..security.security_manager import SecurityManager
from ..monitoring.metrics_collector import MetricsCollector
from ..integrations.mel_engine_integration import MELEngineIntegration


class NotificationType(Enum):
    """Types of notifications in the AMT system."""
    FORMATION_ALERT = "formation_alert"
    FORMATION_OPTIMIZATION = "formation_optimization"
    MEL_AI_INSIGHT = "mel_ai_insight"
    GAME_SITUATION_UPDATE = "game_situation_update"
    COACHING_REMINDER = "coaching_reminder"
    SYSTEM_ALERT = "system_alert"
    USER_ACTION = "user_action"
    PERFORMANCE_ALERT = "performance_alert"
    SECURITY_ALERT = "security_alert"
    TRIANGLE_DEFENSE_UPDATE = "triangle_defense_update"
    MODULE_UPDATE = "module_update"
    ANALYTICS_INSIGHT = "analytics_insight"


class NotificationPriority(Enum):
    """Notification priority levels."""
    CRITICAL = "critical"  # Immediate delivery, override do-not-disturb
    HIGH = "high"  # Quick delivery, high visibility
    MEDIUM = "medium"  # Normal delivery
    LOW = "low"  # Batch delivery, low visibility


class NotificationChannel(Enum):
    """Available notification channels."""
    PUSH = "push"  # Mobile/web push notifications
    WEBSOCKET = "websocket"  # Real-time WebSocket
    EMAIL = "email"  # Email notifications
    SMS = "sms"  # Text message notifications
    IN_APP = "in_app"  # In-application notifications
    WEBHOOK = "webhook"  # External webhook calls


class DeliveryStatus(Enum):
    """Notification delivery status."""
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"
    EXPIRED = "expired"


@dataclass
class NotificationContent:
    """Structured notification content."""
    title: str
    body: str
    summary: Optional[str] = None
    data: Dict[str, Any] = field(default_factory=dict)
    action_url: Optional[str] = None
    image_url: Optional[str] = None
    sound: Optional[str] = None
    badge: Optional[int] = None


@dataclass
class NotificationTarget:
    """Notification delivery target."""
    target_id: str
    target_type: str  # "user", "role", "group", "all"
    channels: List[NotificationChannel]
    preferences: Dict[str, Any] = field(default_factory=dict)


@dataclass
class Notification:
    """Complete notification structure."""
    notification_id: str
    type: NotificationType
    priority: NotificationPriority
    content: NotificationContent
    targets: List[NotificationTarget]
    created_at: datetime
    scheduled_for: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    created_by: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    delivery_status: Dict[str, DeliveryStatus] = field(default_factory=dict)
    retry_count: int = 0
    max_retries: int = 3


@dataclass
class NotificationPreferences:
    """User notification preferences."""
    user_id: str
    enabled_channels: Set[NotificationChannel]
    enabled_types: Set[NotificationType]
    priority_filters: Dict[NotificationPriority, bool]
    quiet_hours: Optional[Dict[str, str]]  # {"start": "22:00", "end": "07:00"}
    timezone: str
    triangle_defense_alerts: bool
    mel_ai_insights: bool
    formation_updates: bool
    system_alerts: bool
    email_digest: bool
    digest_frequency: str  # "daily", "weekly", "never"


@dataclass
class WebSocketConnection:
    """WebSocket connection tracking."""
    connection_id: str
    user_id: str
    websocket: WebSocketServerProtocol
    connected_at: datetime
    last_activity: datetime
    subscriptions: Set[str]
    metadata: Dict[str, Any]


class RealTimeNotificationSystem:
    """
    Real-Time Notification System for AMT Platform.
    
    Provides comprehensive multi-channel notification capabilities including:
    - Formation optimization alerts and Triangle Defense updates
    - M.E.L. AI coaching insights and recommendations
    - Real-time WebSocket communications for live updates
    - Mobile push notifications (iOS/Android)
    - Email notifications with rich templates
    - SMS alerts for critical situations
    - In-app notification center
    - Role-based notification routing
    - Priority-based delivery management
    - User preference management
    - Delivery tracking and analytics
    - Webhook integrations for external systems
    """

    def __init__(
        self,
        orchestration_service: OrchestrationService,
        ml_optimizer: TriangleDefenseOptimizer,
        user_management: EnterpriseUserManagement,
        mel_engine: MELEngineIntegration,
        security_manager: SecurityManager,
        metrics_collector: MetricsCollector
    ):
        self.orchestration = orchestration_service
        self.ml_optimizer = ml_optimizer
        self.user_management = user_management
        self.mel_engine = mel_engine
        self.security = security_manager
        self.metrics = metrics_collector
        
        self.logger = logging.getLogger(__name__)
        
        # Notification storage and tracking
        self.notifications: Dict[str, Notification] = {}
        self.user_preferences: Dict[str, NotificationPreferences] = {}
        self.active_websockets: Dict[str, WebSocketConnection] = {}
        self.notification_queue: asyncio.Queue = asyncio.Queue()
        self.delivery_callbacks: Dict[str, Callable] = {}
        
        # External service clients
        self.push_clients: Dict[str, Any] = {}
        self.email_client = None
        self.sms_client = None
        self.redis_client = None
        
        # Socket.IO server for real-time communication
        self.sio = socketio.AsyncServer(cors_allowed_origins="*")
        self.sio_app = web.Application()
        self.sio.attach(self.sio_app)
        
        # AMT-specific configuration
        self.amt_config = {
            'default_preferences': {
                UserRole.FOUNDER_AUTHORITY: {
                    'channels': {NotificationChannel.PUSH, NotificationChannel.EMAIL, NotificationChannel.WEBSOCKET},
                    'types': set(NotificationType),
                    'priority_all': True
                },
                UserRole.AI_CORE: {
                    'channels': {NotificationChannel.WEBSOCKET, NotificationChannel.IN_APP},
                    'types': {NotificationType.MEL_AI_INSIGHT, NotificationType.SYSTEM_ALERT},
                    'priority_all': False
                },
                UserRole.EXECUTIVE_COMMAND: {
                    'channels': {NotificationChannel.PUSH, NotificationChannel.EMAIL, NotificationChannel.WEBSOCKET},
                    'types': {NotificationType.FORMATION_ALERT, NotificationType.MEL_AI_INSIGHT, 
                            NotificationType.PERFORMANCE_ALERT, NotificationType.SYSTEM_ALERT},
                    'priority_all': True
                },
                UserRole.FOOTBALL_OPERATIONS: {
                    'channels': {NotificationChannel.PUSH, NotificationChannel.WEBSOCKET, NotificationChannel.SMS},
                    'types': {NotificationType.FORMATION_ALERT, NotificationType.FORMATION_OPTIMIZATION,
                            NotificationType.COACHING_REMINDER, NotificationType.TRIANGLE_DEFENSE_UPDATE},
                    'priority_all': False
                }
            },
            'formation_colors': {
                FormationType.LARRY: '#4ECDC4',
                FormationType.LINDA: '#FF6B6B',
                FormationType.RICKY: '#FFD93D',
                FormationType.RITA: '#9B59B6',
                FormationType.MALE_MID: '#3498DB',
                FormationType.FEMALE_MID: '#E74C3C'
            },
            'notification_templates': {
                'formation_optimization': {
                    'title': 'Formation Recommendation: {formation}',
                    'body': '{formation} formation recommended with {confidence}% confidence for current situation',
                    'sound': 'formation_alert.wav'
                },
                'mel_insight': {
                    'title': 'M.E.L. Coaching Insight',
                    'body': 'New strategic insight available: {summary}',
                    'sound': 'insight_chime.wav'
                },
                'game_situation': {
                    'title': 'Game Situation Update',
                    'body': 'Down {down}, {distance} yards to go - Triangle Defense analysis ready',
                    'sound': 'game_update.wav'
                }
            }
        }
        
        # System configuration
        self.config = {
            'websocket_port': 8765,
            'max_websocket_connections': 1000,
            'notification_batch_size': 100,
            'retry_delay_seconds': [30, 300, 900],  # 30s, 5m, 15m
            'notification_ttl_hours': 72,
            'queue_processing_interval': 1,
            'websocket_ping_interval': 30,
            'delivery_tracking_enabled': True
        }
        
        # Background tasks
        self.queue_processor_task = None
        self.cleanup_task = None
        self.websocket_server = None

    async def initialize(self) -> bool:
        """Initialize the real-time notification system."""
        try:
            self.logger.info("Initializing Real-Time Notification System...")
            
            # Setup external service clients
            await self._setup_push_notification_clients()
            await self._setup_email_client()
            await self._setup_sms_client()
            await self._setup_redis_client()
            
            # Setup WebSocket server
            await self._setup_websocket_server()
            
            # Setup Socket.IO event handlers
            await self._setup_socketio_handlers()
            
            # Load user preferences
            await self._load_user_preferences()
            
            # Start background tasks
            await self._start_background_tasks()
            
            # Setup system event listeners
            await self._setup_system_event_listeners()
            
            self.logger.info("Real-Time Notification System initialized successfully")
            await self.metrics.record_event("notification_system_initialized", {"success": True})
            
            return True
            
        except Exception as e:
            self.logger.error(f"Notification System initialization failed: {str(e)}")
            await self.metrics.record_event("notification_system_init_failed", {"error": str(e)})
            return False

    async def send_notification(
        self,
        notification_type: NotificationType,
        content: NotificationContent,
        targets: List[NotificationTarget],
        priority: NotificationPriority = NotificationPriority.MEDIUM,
        scheduled_for: Optional[datetime] = None,
        created_by: Optional[str] = None
    ) -> str:
        """Send notification to specified targets."""
        try:
            notification_id = str(uuid.uuid4())
            
            # Create notification
            notification = Notification(
                notification_id=notification_id,
                type=notification_type,
                priority=priority,
                content=content,
                targets=targets,
                created_at=datetime.utcnow(),
                scheduled_for=scheduled_for,
                expires_at=datetime.utcnow() + timedelta(hours=self.config['notification_ttl_hours']),
                created_by=created_by,
                metadata={},
                delivery_status={},
                retry_count=0
            )
            
            # Store notification
            self.notifications[notification_id] = notification
            
            # Queue for immediate or scheduled delivery
            if scheduled_for and scheduled_for > datetime.utcnow():
                await self._schedule_notification(notification)
            else:
                await self.notification_queue.put(notification)
            
            self.logger.info(f"Notification {notification_id} queued for delivery")
            
            await self.metrics.record_event("notification_created", {
                "notification_id": notification_id,
                "type": notification_type.value,
                "priority": priority.value,
                "target_count": len(targets),
                "scheduled": scheduled_for is not None
            })
            
            return notification_id
            
        except Exception as e:
            self.logger.error(f"Failed to send notification: {str(e)}")
            raise

    async def send_formation_alert(
        self,
        formation: FormationType,
        confidence: float,
        situation_context: Dict[str, Any],
        target_users: List[str]
    ) -> str:
        """Send Triangle Defense formation optimization alert."""
        try:
            # Create formation-specific content
            template = self.amt_config['notification_templates']['formation_optimization']
            formation_color = self.amt_config['formation_colors'].get(formation, '#999999')
            
            content = NotificationContent(
                title=template['title'].format(formation=formation.value),
                body=template['body'].format(
                    formation=formation.value,
                    confidence=int(confidence * 100)
                ),
                summary=f"{formation.value} formation - {confidence:.0%} confidence",
                data={
                    'formation': formation.value,
                    'confidence': confidence,
                    'situation': situation_context,
                    'color': formation_color,
                    'action_type': 'formation_optimization'
                },
                action_url=f"/portal/formations/{formation.value.lower()}",
                sound=template.get('sound')
            )
            
            # Create targets for football operations and coaching staff
            targets = []
            for user_id in target_users:
                user = self.user_management.users.get(user_id)
                if user and user.role in [UserRole.FOOTBALL_OPERATIONS, UserRole.FOUNDER_AUTHORITY, UserRole.EXECUTIVE_COMMAND]:
                    # High priority channels for formation alerts
                    channels = [NotificationChannel.PUSH, NotificationChannel.WEBSOCKET]
                    if user.role == UserRole.FOOTBALL_OPERATIONS:
                        channels.append(NotificationChannel.SMS)  # SMS for coaching staff
                    
                    targets.append(NotificationTarget(
                        target_id=user_id,
                        target_type="user",
                        channels=channels,
                        preferences={'urgent': True}
                    ))
            
            return await self.send_notification(
                notification_type=NotificationType.FORMATION_ALERT,
                content=content,
                targets=targets,
                priority=NotificationPriority.HIGH
            )
            
        except Exception as e:
            self.logger.error(f"Formation alert failed: {str(e)}")
            raise

    async def send_mel_insight(
        self,
        insight: str,
        insight_type: str,
        confidence: float,
        target_roles: List[UserRole]
    ) -> str:
        """Send M.E.L. AI coaching insight notification."""
        try:
            template = self.amt_config['notification_templates']['mel_insight']
            
            content = NotificationContent(
                title=template['title'],
                body=template['body'].format(summary=insight[:100] + "..." if len(insight) > 100 else insight),
                summary=f"M.E.L. {insight_type} insight",
                data={
                    'insight': insight,
                    'insight_type': insight_type,
                    'confidence': confidence,
                    'source': 'mel_ai',
                    'action_type': 'view_insight'
                },
                action_url="/portal/mel/insights",
                sound=template.get('sound')
            )
            
            # Target users by role
            targets = []
            for user in self.user_management.users.values():
                if user.role in target_roles:
                    user_prefs = self.user_preferences.get(user.user_id)
                    channels = [NotificationChannel.WEBSOCKET, NotificationChannel.IN_APP]
                    
                    # Add push notifications if user has enabled M.E.L. insights
                    if (user_prefs and user_prefs.mel_ai_insights) or not user_prefs:
                        channels.append(NotificationChannel.PUSH)
                    
                    targets.append(NotificationTarget(
                        target_id=user.user_id,
                        target_type="user",
                        channels=channels
                    ))
            
            return await self.send_notification(
                notification_type=NotificationType.MEL_AI_INSIGHT,
                content=content,
                targets=targets,
                priority=NotificationPriority.MEDIUM
            )
            
        except Exception as e:
            self.logger.error(f"M.E.L. insight notification failed: {str(e)}")
            raise

    async def send_system_alert(
        self,
        alert_type: str,
        message: str,
        severity: str,
        affected_components: List[str]
    ) -> str:
        """Send system alert to administrators."""
        try:
            priority_map = {
                'critical': NotificationPriority.CRITICAL,
                'high': NotificationPriority.HIGH,
                'medium': NotificationPriority.MEDIUM,
                'low': NotificationPriority.LOW
            }
            
            content = NotificationContent(
                title=f"System Alert: {alert_type}",
                body=message,
                summary=f"{severity.upper()} system alert",
                data={
                    'alert_type': alert_type,
                    'severity': severity,
                    'affected_components': affected_components,
                    'timestamp': datetime.utcnow().isoformat(),
                    'action_type': 'system_alert'
                },
                action_url="/portal/admin/system-health"
            )
            
            # Target admin users
            targets = []
            admin_roles = [UserRole.FOUNDER_AUTHORITY, UserRole.EXECUTIVE_COMMAND]
            
            for user in self.user_management.users.values():
                if user.role in admin_roles:
                    channels = [NotificationChannel.PUSH, NotificationChannel.EMAIL, NotificationChannel.WEBSOCKET]
                    if severity == 'critical':
                        channels.append(NotificationChannel.SMS)
                    
                    targets.append(NotificationTarget(
                        target_id=user.user_id,
                        target_type="user",
                        channels=channels,
                        preferences={'override_quiet_hours': severity == 'critical'}
                    ))
            
            return await self.send_notification(
                notification_type=NotificationType.SYSTEM_ALERT,
                content=content,
                targets=targets,
                priority=priority_map.get(severity, NotificationPriority.MEDIUM)
            )
            
        except Exception as e:
            self.logger.error(f"System alert notification failed: {str(e)}")
            raise

    async def broadcast_websocket_message(
        self,
        message: Dict[str, Any],
        room: Optional[str] = None,
        user_ids: Optional[List[str]] = None
    ) -> int:
        """Broadcast message via WebSocket to connected clients."""
        try:
            delivered_count = 0
            
            if room:
                # Broadcast to specific room
                await self.sio.emit('notification', message, room=room)
                delivered_count = len(self.sio.manager.get_participants(room))
                
            elif user_ids:
                # Send to specific users
                for user_id in user_ids:
                    user_connections = [
                        conn for conn in self.active_websockets.values() 
                        if conn.user_id == user_id
                    ]
                    
                    for connection in user_connections:
                        try:
                            await self.sio.emit('notification', message, room=connection.connection_id)
                            delivered_count += 1
                        except Exception as e:
                            self.logger.warning(f"Failed to deliver WebSocket message to {user_id}: {str(e)}")
            else:
                # Broadcast to all connected clients
                await self.sio.emit('notification', message)
                delivered_count = len(self.active_websockets)
            
            await self.metrics.record_event("websocket_broadcast", {
                "message_type": message.get('type', 'unknown'),
                "delivered_count": delivered_count,
                "room": room,
                "targeted_users": len(user_ids) if user_ids else 0
            })
            
            return delivered_count
            
        except Exception as e:
            self.logger.error(f"WebSocket broadcast failed: {str(e)}")
            return 0

    # Private helper methods

    async def _setup_socketio_handlers(self) -> None:
        """Setup Socket.IO event handlers."""
        
        @self.sio.event
        async def connect(sid, environ, auth):
            """Handle client connection."""
            try:
                # Authenticate user
                token = auth.get('token') if auth else None
                if not token:
                    await self.sio.disconnect(sid)
                    return False
                
                # Validate token and get user
                user_session = await self.security.validate_token(token)
                if not user_session:
                    await self.sio.disconnect(sid)
                    return False
                
                # Create connection record
                connection = WebSocketConnection(
                    connection_id=sid,
                    user_id=user_session.user_id,
                    websocket=None,  # Socket.IO handles this
                    connected_at=datetime.utcnow(),
                    last_activity=datetime.utcnow(),
                    subscriptions=set(),
                    metadata={}
                )
                
                self.active_websockets[sid] = connection
                
                # Join user to their personal room
                await self.sio.enter_room(sid, f"user_{user_session.user_id}")
                
                # Join role-based rooms
                user = self.user_management.users.get(user_session.user_id)
                if user:
                    await self.sio.enter_room(sid, f"role_{user.role.value}")
                
                self.logger.info(f"WebSocket client connected: {sid} (user: {user_session.user_id})")
                
                await self.metrics.record_event("websocket_connected", {
                    "user_id": user_session.user_id,
                    "connection_id": sid
                })
                
                return True
                
            except Exception as e:
                self.logger.error(f"WebSocket connection failed: {str(e)}")
                await self.sio.disconnect(sid)
                return False
        
        @self.sio.event
        async def disconnect(sid):
            """Handle client disconnection."""
            try:
                connection = self.active_websockets.get(sid)
                if connection:
                    await self.metrics.record_event("websocket_disconnected", {
                        "user_id": connection.user_id,
                        "connection_id": sid,
                        "duration_seconds": (datetime.utcnow() - connection.connected_at).total_seconds()
                    })
                    
                    del self.active_websockets[sid]
                
                self.logger.info(f"WebSocket client disconnected: {sid}")
                
            except Exception as e:
                self.logger.error(f"WebSocket disconnection handling failed: {str(e)}")
        
        @self.sio.event
        async def subscribe(sid, data):
            """Handle subscription to notification channels."""
            try:
                connection = self.active_websockets.get(sid)
                if not connection:
                    return {'error': 'Connection not found'}
                
                channels = data.get('channels', [])
                for channel in channels:
                    connection.subscriptions.add(channel)
                    await self.sio.enter_room(sid, f"channel_{channel}")
                
                return {'success': True, 'subscribed_channels': list(connection.subscriptions)}
                
            except Exception as e:
                self.logger.error(f"Channel subscription failed: {str(e)}")
                return {'error': 'Subscription failed'}

    async def _process_notification_queue(self) -> None:
        """Background task to process notification queue."""
        while True:
            try:
                # Get notification from queue
                notification = await asyncio.wait_for(
                    self.notification_queue.get(),
                    timeout=self.config['queue_processing_interval']
                )
                
                # Process notification
                await self._deliver_notification(notification)
                
            except asyncio.TimeoutError:
                # No notifications in queue, continue
                continue
            except Exception as e:
                self.logger.error(f"Notification queue processing failed: {str(e)}")
                await asyncio.sleep(5)

    async def _deliver_notification(self, notification: Notification) -> None:
        """Deliver notification through all specified channels."""
        try:
            delivery_results = {}
            
            for target in notification.targets:
                target_results = {}
                
                for channel in target.channels:
                    try:
                        if channel == NotificationChannel.PUSH:
                            success = await self._deliver_push_notification(notification, target)
                        elif channel == NotificationChannel.WEBSOCKET:
                            success = await self._deliver_websocket_notification(notification, target)
                        elif channel == NotificationChannel.EMAIL:
                            success = await self._deliver_email_notification(notification, target)
                        elif channel == NotificationChannel.SMS:
                            success = await self._deliver_sms_notification(notification, target)
                        elif channel == NotificationChannel.IN_APP:
                            success = await self._deliver_in_app_notification(notification, target)
                        else:
                            success = False
                        
                        target_results[channel.value] = DeliveryStatus.SENT if success else DeliveryStatus.FAILED
                        
                    except Exception as e:
                        self.logger.error(f"Channel {channel.value} delivery failed: {str(e)}")
                        target_results[channel.value] = DeliveryStatus.FAILED
                
                delivery_results[target.target_id] = target_results
            
            # Update delivery status
            notification.delivery_status = delivery_results
            
            await self.metrics.record_event("notification_delivered", {
                "notification_id": notification.notification_id,
                "type": notification.type.value,
                "target_count": len(notification.targets),
                "delivery_results": delivery_results
            })
            
        except Exception as e:
            self.logger.error(f"Notification delivery failed: {str(e)}")

    async def _deliver_websocket_notification(
        self, 
        notification: Notification, 
        target: NotificationTarget
    ) -> bool:
        """Deliver notification via WebSocket."""
        try:
            message = {
                'id': notification.notification_id,
                'type': notification.type.value,
                'priority': notification.priority.value,
                'title': notification.content.title,
                'body': notification.content.body,
                'data': notification.content.data,
                'timestamp': notification.created_at.isoformat(),
                'action_url': notification.content.action_url
            }
            
            if target.target_type == "user":
                await self.sio.emit('notification', message, room=f"user_{target.target_id}")
            elif target.target_type == "role":
                await self.sio.emit('notification', message, room=f"role_{target.target_id}")
            else:
                await self.sio.emit('notification', message)
            
            return True
            
        except Exception as e:
            self.logger.error(f"WebSocket delivery failed: {str(e)}")
            return False

    async def _start_background_tasks(self) -> None:
        """Start background processing tasks."""
        self.queue_processor_task = asyncio.create_task(self._process_notification_queue())
        self.cleanup_task = asyncio.create_task(self._cleanup_expired_notifications())

    async def _cleanup_expired_notifications(self) -> None:
        """Clean up expired notifications and inactive connections."""
        while True:
            try:
                await asyncio.sleep(3600)  # Run every hour
                
                current_time = datetime.utcnow()
                expired_notifications = [
                    notif_id for notif_id, notif in self.notifications.items()
                    if notif.expires_at and notif.expires_at < current_time
                ]
                
                for notif_id in expired_notifications:
                    del self.notifications[notif_id]
                
                if expired_notifications:
                    self.logger.info(f"Cleaned up {len(expired_notifications)} expired notifications")
                
                # Clean up inactive WebSocket connections
                inactive_connections = [
                    conn_id for conn_id, conn in self.active_websockets.items()
                    if (current_time - conn.last_activity).total_seconds() > 3600
                ]
                
                for conn_id in inactive_connections:
                    del self.active_websockets[conn_id]
                
            except Exception as e:
                self.logger.error(f"Cleanup task failed: {str(e)}")

    async def get_notification_status(self) -> Dict[str, Any]:
        """Get current notification system status."""
        return {
            "system_initialized": bool(self.push_clients or self.email_client),
            "active_notifications": len(self.notifications),
            "queue_size": self.notification_queue.qsize(),
            "active_websockets": len(self.active_websockets),
            "user_preferences": len(self.user_preferences),
            "delivery_channels": {
                "push": bool(self.push_clients),
                "email": bool(self.email_client),
                "sms": bool(self.sms_client),
                "websocket": bool(self.active_websockets),
                "redis": bool(self.redis_client)
            },
            "amt_configuration": {
                "default_roles": len(self.amt_config['default_preferences']),
                "formation_templates": len(self.amt_config['notification_templates']),
                "formation_colors": len(self.amt_config['formation_colors'])
            }
        }


# Export main class
__all__ = [
    'RealTimeNotificationSystem',
    'Notification',
    'NotificationContent', 
    'NotificationTarget',
    'NotificationPreferences',
    'NotificationType',
    'NotificationPriority',
    'NotificationChannel'
]
