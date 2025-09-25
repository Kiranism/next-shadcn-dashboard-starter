"""
AMT Orchestration Platform - Real-Time Data Streaming Service
File 43 of 47

High-performance real-time data streaming service for live coaching intelligence.
Provides millisecond-precision formation analysis, live game situation processing,
real-time M.E.L. AI coaching insights, WebSocket broadcasting, Apache Kafka
integration, and instant Triangle Defense optimization during active games.

Author: AMT Development Team
Created: 2025-09-25
"""

import asyncio
import logging
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union, Tuple, Callable, AsyncIterator
from dataclasses import dataclass, field
from enum import Enum
import uuid
import websockets
from websockets.server import WebSocketServerProtocol
from kafka import KafkaProducer, KafkaConsumer
from kafka.errors import KafkaError
import redis.asyncio as aioredis
import asyncpg
from aiokafka import AIOKafkaProducer, AIOKafkaConsumer
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, BackgroundTasks
from pydantic import BaseModel, Field
import msgpack
import orjson
from scipy import spatial
import numpy as np

# Platform imports
from ..shared.orchestration_protocol import FormationType, TaskStatus, BotType
from ..orchestration.orchestration_service import OrchestrationService
from ..ml.triangle_defense_optimizer import TriangleDefenseOptimizer
from ..integrations.mel_engine_integration import MELEngineIntegration
from ..integrations.triangle_defense_integration import TriangleDefenseIntegration
from ..integrations.airtable_connector_service import AirtableConnectorService
from ..notifications.realtime_notification_system import RealTimeNotificationSystem
from ..user_management.enterprise_user_management import EnterpriseUserManagement
from ..security.security_manager import SecurityManager
from ..monitoring.metrics_collector import MetricsCollector
from ..performance.performance_optimization_system import PerformanceOptimizationSystem
from ..automation.workflow_automation_system import WorkflowAutomationSystem


class StreamingEventType(Enum):
    """Types of real-time streaming events."""
    FORMATION_CHANGE = "formation_change"
    DOWN_DISTANCE_UPDATE = "down_distance_update"
    FIELD_POSITION_UPDATE = "field_position_update"
    PERSONNEL_CHANGE = "personnel_change"
    TIMEOUT_CALLED = "timeout_called"
    SCORE_UPDATE = "score_update"
    INJURY_TIMEOUT = "injury_timeout"
    COACHING_INSIGHT = "coaching_insight"
    ML_OPTIMIZATION = "ml_optimization"
    PATTERN_BREAK_ALERT = "pattern_break_alert"
    CRITICAL_SITUATION = "critical_situation"
    GAME_STATE_CHANGE = "game_state_change"


class StreamingPriority(Enum):
    """Priority levels for streaming data."""
    CRITICAL = "critical"     # Formation changes, scoring plays
    HIGH = "high"            # Down/distance, field position
    NORMAL = "normal"        # Statistics, analytics
    LOW = "low"             # Historical data, trends


class GameSituation(Enum):
    """Current game situation contexts."""
    RED_ZONE = "red_zone"
    GOAL_LINE = "goal_line"
    TWO_MINUTE_WARNING = "two_minute_warning"
    FOURTH_DOWN = "fourth_down"
    SHORT_YARDAGE = "short_yardage"
    LONG_YARDAGE = "long_yardage"
    HURRY_UP_OFFENSE = "hurry_up_offense"
    NORMAL_PLAY = "normal_play"


@dataclass
class LiveGameData:
    """Live game data structure."""
    game_id: str
    timestamp: datetime
    quarter: int
    time_remaining: str
    down: int
    distance: int
    yard_line: int
    field_zone: str
    hash_mark: str
    score_home: int
    score_away: int
    possession: str
    formation_type: str
    personnel_group: str
    situation_context: GameSituation
    sequence_id: str = field(default_factory=lambda: str(uuid.uuid4()))


@dataclass
class StreamingEvent:
    """Real-time streaming event data."""
    event_id: str
    event_type: StreamingEventType
    priority: StreamingPriority
    timestamp: datetime
    game_data: LiveGameData
    formation_data: Dict[str, Any]
    coaching_insights: Dict[str, Any]
    ml_recommendations: Dict[str, Any]
    user_targets: List[str] = field(default_factory=list)
    broadcast_channels: List[str] = field(default_factory=list)
    expiry_seconds: int = 300


@dataclass
class FormationAnalysisStream:
    """Real-time Triangle Defense formation analysis."""
    analysis_id: str
    formation_type: str
    confidence_score: float
    effectiveness_prediction: float
    recommended_adjustments: List[str]
    pattern_match_percentage: float
    break_point_probability: float
    mo_position_optimal: bool
    tactical_advantages: List[str]
    potential_weaknesses: List[str]
    coaching_priority: StreamingPriority


@dataclass
class ConnectionMetrics:
    """WebSocket connection performance metrics."""
    connection_id: str
    user_id: str
    connected_at: datetime
    messages_sent: int
    messages_received: int
    last_ping: datetime
    latency_ms: float
    bandwidth_usage_kb: float
    connection_quality: str  # excellent, good, fair, poor


class RealTimeDataStreamingService:
    """
    High-Performance Real-Time Data Streaming Service for AMT Platform.
    
    Provides enterprise-grade live coaching intelligence including:
    - Millisecond-precision formation analysis streaming
    - Live game situation processing with instant Triangle Defense optimization
    - Real-time M.E.L. AI coaching insights delivery
    - WebSocket broadcasting to coaching staff and stakeholders
    - Apache Kafka integration for high-throughput data processing
    - Intelligent stream routing based on user roles and priorities
    - Live pattern recognition and break point detection
    - Formation effectiveness prediction during active plays
    - Multi-channel broadcasting (WebSocket, Kafka, Redis Pub/Sub)
    - Connection quality monitoring and adaptive streaming
    - Automatic failover and redundancy management
    - Real-time analytics and performance optimization
    - Live coaching decision support with instant recommendations
    - Game situation awareness and context-sensitive insights
    """

    def __init__(
        self,
        kafka_bootstrap_servers: List[str],
        redis_url: str,
        websocket_port: int,
        orchestration_service: OrchestrationService,
        ml_optimizer: TriangleDefenseOptimizer,
        mel_engine: MELEngineIntegration,
        triangle_defense: TriangleDefenseIntegration,
        airtable_connector: AirtableConnectorService,
        notification_system: RealTimeNotificationSystem,
        user_management: EnterpriseUserManagement,
        workflow_system: WorkflowAutomationSystem,
        performance_system: PerformanceOptimizationSystem,
        security_manager: SecurityManager,
        metrics_collector: MetricsCollector
    ):
        # Store AMT platform services
        self.orchestration = orchestration_service
        self.ml_optimizer = ml_optimizer
        self.mel_engine = mel_engine
        self.triangle_defense = triangle_defense
        self.airtable_connector = airtable_connector
        self.notifications = notification_system
        self.user_management = user_management
        self.workflows = workflow_system
        self.performance = performance_system
        self.security = security_manager
        self.metrics = metrics_collector
        
        self.logger = logging.getLogger(__name__)
        
        # Streaming configuration
        self.kafka_servers = kafka_bootstrap_servers
        self.redis_url = redis_url
        self.websocket_port = websocket_port
        
        # Kafka producers and consumers
        self.kafka_producer = None
        self.kafka_consumer = None
        
        # Redis connection for caching and pub/sub
        self.redis_client = None
        
        # WebSocket connection management
        self.websocket_connections: Dict[str, WebSocketServerProtocol] = {}
        self.connection_metrics: Dict[str, ConnectionMetrics] = {}
        self.user_subscriptions: Dict[str, List[str]] = {}  # user_id -> channels
        
        # Streaming state
        self.active_games: Dict[str, LiveGameData] = {}
        self.formation_streams: Dict[str, AsyncIterator[FormationAnalysisStream]] = {}
        self.event_queue = asyncio.Queue(maxsize=10000)
        
        # Performance monitoring
        self.streaming_metrics = {
            'events_processed': 0,
            'messages_broadcasted': 0,
            'formation_analyses_streamed': 0,
            'ml_optimizations_processed': 0,
            'mel_insights_delivered': 0,
            'websocket_connections': 0,
            'avg_latency_ms': 0.0,
            'throughput_events_per_second': 0.0,
            'cache_hit_ratio': 0.0
        }
        
        # Triangle Defense streaming configuration
        self.triangle_defense_config = {
            'formation_priorities': {
                'Larry (Male)': StreamingPriority.CRITICAL,
                'Linda (Female)': StreamingPriority.CRITICAL,
                'Ricky (Male)': StreamingPriority.HIGH,
                'Rita (Female)': StreamingPriority.HIGH,
                'Leon (Male)': StreamingPriority.NORMAL,
                'Randy (Male)': StreamingPriority.NORMAL,
                'Pat (Neutral)': StreamingPriority.NORMAL
            },
            'critical_situations': {
                GameSituation.RED_ZONE: 50,      # Stream every 50ms
                GameSituation.GOAL_LINE: 25,     # Stream every 25ms
                GameSituation.FOURTH_DOWN: 100,  # Stream every 100ms
                GameSituation.TWO_MINUTE_WARNING: 75,
                GameSituation.NORMAL_PLAY: 200   # Stream every 200ms
            },
            'effectiveness_thresholds': {
                'critical_alert': 60.0,  # Below 60% effectiveness
                'warning_alert': 70.0,   # Below 70% effectiveness
                'optimization_trigger': 75.0  # Below 75% effectiveness
            }
        }
        
        # Background tasks
        self.event_processor_task = None
        self.kafka_consumer_task = None
        self.websocket_server_task = None
        self.connection_monitor_task = None
        self.performance_monitor_task = None

    async def initialize(self) -> bool:
        """Initialize the real-time streaming service."""
        try:
            self.logger.info("Initializing Real-Time Data Streaming Service...")
            
            # Initialize Kafka producer and consumer
            await self._initialize_kafka()
            
            # Initialize Redis connection
            await self._initialize_redis()
            
            # Setup WebSocket server
            await self._initialize_websocket_server()
            
            # Setup streaming topics and channels
            await self._setup_streaming_infrastructure()
            
            # Start background processors
            await self._start_background_processors()
            
            # Initialize Triangle Defense streaming pipelines
            await self._initialize_triangle_defense_streams()
            
            self.logger.info("Real-Time Data Streaming Service initialized successfully")
            await self.metrics.record_event("streaming_service_initialized", {
                "kafka_servers": len(self.kafka_servers),
                "websocket_port": self.websocket_port,
                "streaming_channels": len(self.triangle_defense_config['formation_priorities'])
            })
            
            return True
            
        except Exception as e:
            self.logger.error(f"Real-Time Streaming Service initialization failed: {str(e)}")
            return False

    async def stream_formation_analysis(
        self,
        game_id: str,
        formation_data: Dict[str, Any],
        priority: StreamingPriority = StreamingPriority.HIGH
    ) -> bool:
        """Stream real-time Triangle Defense formation analysis."""
        try:
            start_time = time.time()
            
            # Extract formation information
            formation_type = formation_data.get('formation_type', 'Unknown')
            field_zone = formation_data.get('field_zone', 'MOF')
            hash_position = formation_data.get('hash_position', 'Middle')
            down = formation_data.get('down', 1)
            distance = formation_data.get('distance', 10)
            
            # Perform rapid ML optimization
            optimization_result = await self.ml_optimizer.optimize_formation_for_situation({
                'formation_type': formation_type,
                'field_zone': field_zone,
                'hash_position': hash_position,
                'down': down,
                'distance': distance,
                'game_situation': self._determine_game_situation(formation_data)
            })
            
            # Generate M.E.L. AI coaching insights
            coaching_insights = await self._generate_rapid_coaching_insights(
                formation_data, 
                optimization_result
            )
            
            # Create formation analysis stream
            analysis_stream = FormationAnalysisStream(
                analysis_id=str(uuid.uuid4()),
                formation_type=formation_type,
                confidence_score=optimization_result.get('confidence', 0.0),
                effectiveness_prediction=optimization_result.get('predicted_effectiveness', 0.0),
                recommended_adjustments=optimization_result.get('adjustments', []),
                pattern_match_percentage=optimization_result.get('pattern_match', 0.0),
                break_point_probability=optimization_result.get('break_point_risk', 0.0),
                mo_position_optimal=optimization_result.get('mo_optimal', False),
                tactical_advantages=coaching_insights.get('advantages', []),
                potential_weaknesses=coaching_insights.get('weaknesses', []),
                coaching_priority=priority
            )
            
            # Create streaming event
            streaming_event = StreamingEvent(
                event_id=str(uuid.uuid4()),
                event_type=StreamingEventType.FORMATION_CHANGE,
                priority=priority,
                timestamp=datetime.utcnow(),
                game_data=self.active_games.get(game_id),
                formation_data=formation_data,
                coaching_insights=coaching_insights,
                ml_recommendations=optimization_result,
                broadcast_channels=['formation_analysis', f'game_{game_id}', 'coaching_staff']
            )
            
            # Queue event for processing
            await self.event_queue.put(streaming_event)
            
            # For critical situations, broadcast immediately
            if priority == StreamingPriority.CRITICAL:
                await self._broadcast_critical_event(streaming_event)
            
            # Sync with Airtable for permanent storage
            await self._sync_formation_analysis_to_airtable(analysis_stream, game_id)
            
            processing_time = (time.time() - start_time) * 1000  # Convert to milliseconds
            
            # Update metrics
            self.streaming_metrics['formation_analyses_streamed'] += 1
            self.streaming_metrics['avg_latency_ms'] = (
                (self.streaming_metrics['avg_latency_ms'] + processing_time) / 2
            )
            
            await self.metrics.record_event("formation_analysis_streamed", {
                "game_id": game_id,
                "formation_type": formation_type,
                "processing_time_ms": processing_time,
                "priority": priority.value,
                "effectiveness_prediction": analysis_stream.effectiveness_prediction
            })
            
            return True
            
        except Exception as e:
            self.logger.error(f"Formation analysis streaming failed: {str(e)}")
            return False

    async def broadcast_live_game_update(
        self,
        game_id: str,
        update_data: Dict[str, Any],
        event_type: StreamingEventType = StreamingEventType.GAME_STATE_CHANGE
    ) -> bool:
        """Broadcast live game updates to all connected clients."""
        try:
            # Update active game data
            if game_id in self.active_games:
                game_data = self.active_games[game_id]
                
                # Update game data with new information
                for key, value in update_data.items():
                    if hasattr(game_data, key):
                        setattr(game_data, key, value)
                
                game_data.timestamp = datetime.utcnow()
            else:
                # Create new game data
                game_data = LiveGameData(
                    game_id=game_id,
                    timestamp=datetime.utcnow(),
                    quarter=update_data.get('quarter', 1),
                    time_remaining=update_data.get('time_remaining', '15:00'),
                    down=update_data.get('down', 1),
                    distance=update_data.get('distance', 10),
                    yard_line=update_data.get('yard_line', 50),
                    field_zone=update_data.get('field_zone', 'MOF'),
                    hash_mark=update_data.get('hash_mark', 'Middle'),
                    score_home=update_data.get('score_home', 0),
                    score_away=update_data.get('score_away', 0),
                    possession=update_data.get('possession', 'home'),
                    formation_type=update_data.get('formation_type', 'Unknown'),
                    personnel_group=update_data.get('personnel_group', '11 Personnel'),
                    situation_context=GameSituation(update_data.get('situation_context', 'normal_play'))
                )
                
                self.active_games[game_id] = game_data
            
            # Determine priority based on game situation
            priority = self._determine_update_priority(game_data, event_type)
            
            # Create streaming event
            streaming_event = StreamingEvent(
                event_id=str(uuid.uuid4()),
                event_type=event_type,
                priority=priority,
                timestamp=datetime.utcnow(),
                game_data=game_data,
                formation_data=update_data,
                coaching_insights={},
                ml_recommendations={},
                broadcast_channels=[f'game_{game_id}', 'live_updates', 'coaching_dashboard']
            )
            
            # Broadcast via multiple channels
            await self._broadcast_multi_channel(streaming_event)
            
            # Trigger formation analysis if formation changed
            if 'formation_type' in update_data:
                await self.stream_formation_analysis(
                    game_id, 
                    update_data, 
                    priority
                )
            
            self.streaming_metrics['messages_broadcasted'] += 1
            
            return True
            
        except Exception as e:
            self.logger.error(f"Live game update broadcast failed: {str(e)}")
            return False

    async def subscribe_user_to_channels(
        self,
        user_id: str,
        channels: List[str],
        websocket: WebSocketServerProtocol
    ) -> bool:
        """Subscribe user to specific streaming channels."""
        try:
            # Validate user permissions
            user_permissions = await self.user_management.get_user_permissions(user_id)
            
            if not user_permissions:
                await websocket.send(json.dumps({
                    'type': 'error',
                    'message': 'Invalid user credentials'
                }))
                return False
            
            # Filter channels based on user access level
            allowed_channels = await self._filter_channels_by_permissions(channels, user_permissions)
            
            if not allowed_channels:
                await websocket.send(json.dumps({
                    'type': 'error',
                    'message': 'No permissions for requested channels'
                }))
                return False
            
            # Store connection and subscriptions
            connection_id = str(uuid.uuid4())
            self.websocket_connections[connection_id] = websocket
            self.user_subscriptions[user_id] = allowed_channels
            
            # Initialize connection metrics
            self.connection_metrics[connection_id] = ConnectionMetrics(
                connection_id=connection_id,
                user_id=user_id,
                connected_at=datetime.utcnow(),
                messages_sent=0,
                messages_received=0,
                last_ping=datetime.utcnow(),
                latency_ms=0.0,
                bandwidth_usage_kb=0.0,
                connection_quality='good'
            )
            
            # Subscribe to Redis channels
            for channel in allowed_channels:
                await self.redis_client.subscribe(f"amt_stream:{channel}")
            
            # Send confirmation
            await websocket.send(json.dumps({
                'type': 'subscription_confirmed',
                'channels': allowed_channels,
                'connection_id': connection_id,
                'timestamp': datetime.utcnow().isoformat()
            }))
            
            self.streaming_metrics['websocket_connections'] += 1
            
            self.logger.info(f"User {user_id} subscribed to channels: {allowed_channels}")
            
            return True
            
        except Exception as e:
            self.logger.error(f"User channel subscription failed: {str(e)}")
            return False

    async def process_mel_coaching_insight(
        self,
        coaching_request: Dict[str, Any],
        game_id: Optional[str] = None,
        priority: StreamingPriority = StreamingPriority.HIGH
    ) -> bool:
        """Process and stream M.E.L. AI coaching insights in real-time."""
        try:
            # Generate M.E.L. coaching insights
            insights = await self.mel_engine.generate_coaching_insights(coaching_request)
            
            if not insights:
                return False
            
            # Create coaching insight streaming event
            streaming_event = StreamingEvent(
                event_id=str(uuid.uuid4()),
                event_type=StreamingEventType.COACHING_INSIGHT,
                priority=priority,
                timestamp=datetime.utcnow(),
                game_data=self.active_games.get(game_id) if game_id else None,
                formation_data=coaching_request.get('formation_data', {}),
                coaching_insights=insights,
                ml_recommendations={},
                broadcast_channels=['coaching_insights', 'mel_ai', f'game_{game_id}' if game_id else 'general']
            )
            
            # Queue for processing
            await self.event_queue.put(streaming_event)
            
            # For high priority insights, broadcast immediately
            if priority in [StreamingPriority.CRITICAL, StreamingPriority.HIGH]:
                await self._broadcast_coaching_insight(streaming_event)
            
            # Store in Airtable for historical analysis
            await self.airtable_connector.sync_mel_ai_insights({
                'integration_id': streaming_event.event_id,
                'analysis_type': 'Real-Time Coaching Insight',
                'mel_score': insights.get('confidence_score', 0.0),
                'insights_summary': insights.get('summary', ''),
                'mel_integration_insights': insights.get('detailed_analysis', ''),
                'complexity_level': 'Real-Time'
            })
            
            self.streaming_metrics['mel_insights_delivered'] += 1
            
            return True
            
        except Exception as e:
            self.logger.error(f"M.E.L. coaching insight processing failed: {str(e)}")
            return False

    # Private helper methods
    
    async def _initialize_kafka(self) -> None:
        """Initialize Kafka producer and consumer."""
        try:
            # Initialize Kafka producer
            self.kafka_producer = AIOKafkaProducer(
                bootstrap_servers=self.kafka_servers,
                value_serializer=lambda v: msgpack.packb(v),
                compression_type='snappy',
                batch_size=16384,
                linger_ms=10
            )
            await self.kafka_producer.start()
            
            # Initialize Kafka consumer
            self.kafka_consumer = AIOKafkaConsumer(
                'amt_formation_analysis',
                'amt_game_events',
                'amt_coaching_insights',
                bootstrap_servers=self.kafka_servers,
                value_deserializer=lambda m: msgpack.unpackb(m, raw=False),
                auto_offset_reset='latest'
            )
            await self.kafka_consumer.start()
            
            self.logger.info("Kafka producer and consumer initialized")
            
        except Exception as e:
            self.logger.error(f"Kafka initialization failed: {str(e)}")
            raise

    async def _initialize_redis(self) -> None:
        """Initialize Redis connection for pub/sub."""
        try:
            self.redis_client = await aioredis.from_url(
                self.redis_url,
                decode_responses=True,
                max_connections=20
            )
            
            # Test connection
            await self.redis_client.ping()
            
            self.logger.info("Redis connection initialized")
            
        except Exception as e:
            self.logger.error(f"Redis initialization failed: {str(e)}")
            raise

    async def _broadcast_multi_channel(self, event: StreamingEvent) -> None:
        """Broadcast streaming event via multiple channels."""
        try:
            event_data = {
                'event_id': event.event_id,
                'event_type': event.event_type.value,
                'priority': event.priority.value,
                'timestamp': event.timestamp.isoformat(),
                'game_data': event.game_data.__dict__ if event.game_data else {},
                'formation_data': event.formation_data,
                'coaching_insights': event.coaching_insights,
                'ml_recommendations': event.ml_recommendations
            }
            
            # Serialize event data
            json_data = orjson.dumps(event_data).decode('utf-8')
            msgpack_data = msgpack.packb(event_data)
            
            # Broadcast via WebSocket
            await self._broadcast_websocket(json_data, event.broadcast_channels)
            
            # Broadcast via Kafka
            for channel in event.broadcast_channels:
                await self.kafka_producer.send(f'amt_{channel}', msgpack_data)
            
            # Broadcast via Redis Pub/Sub
            for channel in event.broadcast_channels:
                await self.redis_client.publish(f'amt_stream:{channel}', json_data)
            
        except Exception as e:
            self.logger.error(f"Multi-channel broadcast failed: {str(e)}")

    async def _broadcast_websocket(self, data: str, channels: List[str]) -> None:
        """Broadcast data to WebSocket connections subscribed to channels."""
        try:
            disconnected_connections = []
            
            for connection_id, websocket in self.websocket_connections.items():
                try:
                    # Find user subscriptions
                    user_id = None
                    for uid, user_channels in self.user_subscriptions.items():
                        if any(channel in user_channels for channel in channels):
                            user_id = uid
                            break
                    
                    if user_id:
                        await websocket.send(data)
                        
                        # Update connection metrics
                        if connection_id in self.connection_metrics:
                            self.connection_metrics[connection_id].messages_sent += 1
                            self.connection_metrics[connection_id].bandwidth_usage_kb += len(data) / 1024
                
                except websockets.exceptions.ConnectionClosed:
                    disconnected_connections.append(connection_id)
                except Exception as e:
                    self.logger.warning(f"Failed to send to WebSocket {connection_id}: {str(e)}")
                    disconnected_connections.append(connection_id)
            
            # Cleanup disconnected connections
            for connection_id in disconnected_connections:
                await self._cleanup_connection(connection_id)
                
        except Exception as e:
            self.logger.error(f"WebSocket broadcast failed: {str(e)}")

    def _determine_game_situation(self, formation_data: Dict[str, Any]) -> GameSituation:
        """Determine current game situation from formation data."""
        yard_line = formation_data.get('yard_line', 50)
        down = formation_data.get('down', 1)
        distance = formation_data.get('distance', 10)
        time_remaining = formation_data.get('time_remaining', '15:00')
        
        # Goal line situation
        if yard_line <= 3:
            return GameSituation.GOAL_LINE
        
        # Red zone situation
        if yard_line <= 20:
            return GameSituation.RED_ZONE
        
        # Fourth down
        if down == 4:
            return GameSituation.FOURTH_DOWN
        
        # Short yardage
        if distance <= 2:
            return GameSituation.SHORT_YARDAGE
        
        # Long yardage
        if distance >= 15:
            return GameSituation.LONG_YARDAGE
        
        # Two minute warning (simplified check)
        if '2:' in time_remaining or '1:' in time_remaining or '0:' in time_remaining:
            return GameSituation.TWO_MINUTE_WARNING
        
        return GameSituation.NORMAL_PLAY

    async def get_streaming_service_status(self) -> Dict[str, Any]:
        """Get comprehensive streaming service status."""
        return {
            "service_initialized": self.kafka_producer is not None and self.redis_client is not None,
            "active_games": len(self.active_games),
            "websocket_connections": len(self.websocket_connections),
            "event_queue_size": self.event_queue.qsize(),
            "streaming_metrics": self.streaming_metrics.copy(),
            "kafka_status": {
                "producer_active": self.kafka_producer is not None,
                "consumer_active": self.kafka_consumer is not None,
                "bootstrap_servers": self.kafka_servers
            },
            "redis_status": {
                "connected": self.redis_client is not None,
                "url": self.redis_url
            },
            "background_tasks": {
                "event_processor": self.event_processor_task is not None and not self.event_processor_task.done(),
                "kafka_consumer": self.kafka_consumer_task is not None and not self.kafka_consumer_task.done(),
                "websocket_server": self.websocket_server_task is not None and not self.websocket_server_task.done(),
                "connection_monitor": self.connection_monitor_task is not None and not self.connection_monitor_task.done(),
                "performance_monitor": self.performance_monitor_task is not None and not self.performance_monitor_task.done()
            },
            "triangle_defense_config": {
                "formation_priorities": {k: v.value for k, v in self.triangle_defense_config['formation_priorities'].items()},
                "critical_situations": {k.value: v for k, v in self.triangle_defense_config['critical_situations'].items()}
            }
        }


# Export main class
__all__ = [
    'RealTimeDataStreamingService',
    'StreamingEvent',
    'LiveGameData',
    'FormationAnalysisStream',
    'StreamingEventType',
    'StreamingPriority',
    'GameSituation',
    'ConnectionMetrics'
]
