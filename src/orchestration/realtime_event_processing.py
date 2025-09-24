"""
AMT Real-time Event Processing Integration
Bridges orchestration system with M.E.L. Triangle Defense Flink/Kafka infrastructure
"""

import asyncio
import logging
import json
from typing import Dict, List, Optional, Any, Callable, Union
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict, field
from enum import Enum
import uuid
from pathlib import Path

# Kafka/Flink integration
try:
    from kafka import KafkaProducer, KafkaConsumer
    from kafka.errors import KafkaError
    KAFKA_AVAILABLE = True
except ImportError:
    logging.warning("Kafka client not available - using fallback event processing")
    KAFKA_AVAILABLE = False

from ..shared.orchestration_protocol import BotType, TaskStatus, OrchestrationContext

logger = logging.getLogger(__name__)

class MELStage(str, Enum):
    """M.E.L. Triangle Defense processing stages"""
    MAKING = "making"           # Formation pattern recognition
    EFFICIENCY = "efficiency"   # Resource optimization analysis  
    LOGICAL = "logical"         # Strategic recommendations

class TriangleDefenseCall(str, Enum):
    """Triangle Defense formation classifications"""
    LARRY = "larry"     # Cover 3 defense
    LINDA = "linda"     # Cover 2 defense  
    RICKY = "ricky"     # Man coverage
    RITA = "rita"       # Zone blitz
    RANDY = "randy"     # Goal line defense
    PAT = "pat"         # Hybrid/default

class AlertPriority(str, Enum):
    """Alert priority levels for coaching staff"""
    CRITICAL = "critical"   # Immediate attention required
    HIGH = "high"          # Address within 1 play
    MEDIUM = "medium"      # Address within 1 series
    LOW = "low"           # General awareness

@dataclass
class FormationEvent:
    """Formation analysis event for M.E.L. processing"""
    formation_id: str
    formation_classification: str
    making_score: int
    pattern_recognition: str
    mo_position: str  # Mike/Outside linebacker position
    personnel_group: str
    hash_position: str
    down_distance: str
    field_position: int
    session_id: Optional[str] = None
    bot_type: Optional[BotType] = None
    timestamp: datetime = field(default_factory=datetime.now)
    coordination_table: Optional[str] = None
    ai_insights: Optional[str] = None

@dataclass
class CoachingAlert:
    """Real-time coaching alert from Triangle Defense analysis"""
    alert_id: str
    alert_timestamp: datetime
    formation_type: str
    alert_type: str  # 'PATTERN_BREAK', 'LOW_EFFICIENCY', 'HIGH_PERFORMANCE'
    message: str
    confidence_score: float
    recommended_action: str
    priority_level: AlertPriority
    coaching_staff: str
    triangle_defense_call: TriangleDefenseCall
    metadata: Dict[str, Any] = field(default_factory=dict)
    session_id: Optional[str] = None
    bot_response_required: bool = False

@dataclass
class MELProcessingResult:
    """Result from M.E.L. processing pipeline"""
    record_id: str
    stage: MELStage
    input_data: Dict[str, Any]
    output_data: Dict[str, Any]
    processing_time_ms: float
    confidence_level: float
    success: bool
    error_message: Optional[str] = None
    next_stage_ready: bool = False
    session_id: Optional[str] = None

class RealtimeEventProcessor:
    """Real-time event processing integration with M.E.L. Triangle Defense infrastructure"""
    
    def __init__(
        self,
        kafka_config: Optional[Dict[str, Any]] = None,
        flink_config: Optional[Dict[str, Any]] = None,
        enable_triangle_defense: bool = True
    ):
        # Configuration
        self.kafka_config = kafka_config or self._default_kafka_config()
        self.flink_config = flink_config or self._default_flink_config()
        self.enable_triangle_defense = enable_triangle_defense
        
        # Kafka clients
        self.producer: Optional[KafkaProducer] = None
        self.consumers: Dict[str, KafkaConsumer] = {}
        
        # Event handlers
        self.formation_handlers: List[Callable[[FormationEvent], None]] = []
        self.alert_handlers: List[Callable[[CoachingAlert], None]] = []
        self.mel_result_handlers: List[Callable[[MELProcessingResult], None]] = []
        
        # Processing statistics
        self.stats = {
            "events_processed": 0,
            "formations_analyzed": 0,
            "alerts_generated": 0,
            "mel_pipeline_executions": 0,
            "errors": 0,
            "last_activity": None
        }
        
        # Triangle Defense topics
        self.topics = {
            "formations": "triangle-defense-formations",
            "alerts": "triangle-defense-coaching-alerts", 
            "pattern_updates": "formation-pattern-updates",
            "mel_making": "mel-making-results",
            "mel_efficiency": "mel-efficiency-results",
            "mel_logical": "mel-logical-results",
            "monitoring": "mel-pipeline-monitoring",
            "dlq": "mel-processing-dlq"
        }
        
        # Background processing tasks
        self.processing_tasks: List[asyncio.Task] = []
        
    def _default_kafka_config(self) -> Dict[str, Any]:
        """Default Kafka configuration based on M.E.L. settings"""
        
        return {
            "bootstrap_servers": ["kafka:29092", "kafka-2:29092", "kafka-3:29092"],
            "client_id": "amt-orchestration-processor",
            "security_protocol": "PLAINTEXT",
            "producer_config": {
                "acks": "all",
                "retries": 2147483647,
                "enable_idempotence": True,
                "compression_type": "lz4",
                "batch_size": 32768,
                "linger_ms": 5
            },
            "consumer_config": {
                "group_id": "amt-orchestration-consumers",
                "auto_offset_reset": "latest",
                "enable_auto_commit": False,
                "max_poll_records": 500
            }
        }
    
    def _default_flink_config(self) -> Dict[str, Any]:
        """Default Flink configuration for job submission"""
        
        return {
            "jobmanager_url": "http://flink-jobmanager:8081",
            "parallelism": 4,
            "checkpoint_interval": 30000,
            "restart_strategy": "exponential-delay"
        }
    
    async def initialize(self) -> bool:
        """Initialize real-time event processing"""
        
        if not KAFKA_AVAILABLE:
            logger.warning("Kafka not available - real-time processing will be limited")
            return False
        
        try:
            # Initialize Kafka producer
            self.producer = KafkaProducer(
                bootstrap_servers=self.kafka_config["bootstrap_servers"],
                client_id=self.kafka_config["client_id"],
                value_serializer=lambda v: json.dumps(v, default=str).encode('utf-8'),
                key_serializer=lambda k: k.encode('utf-8') if k else None,
                **self.kafka_config["producer_config"]
            )
            
            # Initialize consumers for different topics
            await self._initialize_consumers()
            
            # Start background processing tasks
            await self._start_background_tasks()
            
            logger.info("Real-time event processing initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize real-time event processing: {str(e)}")
            return False
    
    async def _initialize_consumers(self):
        """Initialize Kafka consumers for different event types"""
        
        # Formation events consumer
        formation_consumer = KafkaConsumer(
            self.topics["formations"],
            bootstrap_servers=self.kafka_config["bootstrap_servers"],
            group_id=f"{self.kafka_config['consumer_config']['group_id']}-formations",
            value_deserializer=lambda m: json.loads(m.decode('utf-8')),
            **self.kafka_config["consumer_config"]
        )
        self.consumers["formations"] = formation_consumer
        
        # Coaching alerts consumer
        alerts_consumer = KafkaConsumer(
            self.topics["alerts"],
            bootstrap_servers=self.kafka_config["bootstrap_servers"],
            group_id=f"{self.kafka_config['consumer_config']['group_id']}-alerts",
            value_deserializer=lambda m: json.loads(m.decode('utf-8')),
            **self.kafka_config["consumer_config"]
        )
        self.consumers["alerts"] = alerts_consumer
        
        # M.E.L. results consumers
        for stage in ["making", "efficiency", "logical"]:
            consumer = KafkaConsumer(
                self.topics[f"mel_{stage}"],
                bootstrap_servers=self.kafka_config["bootstrap_servers"],
                group_id=f"{self.kafka_config['consumer_config']['group_id']}-{stage}",
                value_deserializer=lambda m: json.loads(m.decode('utf-8')),
                **self.kafka_config["consumer_config"]
            )
            self.consumers[f"mel_{stage}"] = consumer
    
    async def _start_background_tasks(self):
        """Start background event processing tasks"""
        
        # Formation events processor
        formation_task = asyncio.create_task(self._process_formation_events())
        self.processing_tasks.append(formation_task)
        
        # Coaching alerts processor
        alerts_task = asyncio.create_task(self._process_coaching_alerts())
        self.processing_tasks.append(alerts_task)
        
        # M.E.L. results processors
        for stage in ["making", "efficiency", "logical"]:
            task = asyncio.create_task(self._process_mel_results(stage))
            self.processing_tasks.append(task)
        
        # Statistics reporter
        stats_task = asyncio.create_task(self._report_statistics())
        self.processing_tasks.append(stats_task)
    
    async def process_orchestration_formation_event(
        self,
        session_id: str,
        bot_type: BotType,
        formation_data: Dict[str, Any]
    ) -> str:
        """Process formation event from orchestration session"""
        
        try:
            # Create formation event
            formation_event = FormationEvent(
                formation_id=str(uuid.uuid4()),
                formation_classification=formation_data.get("formation_type", "unknown"),
                making_score=formation_data.get("making_score", 50),
                pattern_recognition=formation_data.get("pattern", "standard"),
                mo_position=formation_data.get("mo_position", "middle"),
                personnel_group=formation_data.get("personnel", "11_personnel"),
                hash_position=formation_data.get("hash", "right_hash"),
                down_distance=formation_data.get("down_distance", "1st_and_10"),
                field_position=formation_data.get("field_position", 50),
                session_id=session_id,
                bot_type=bot_type,
                ai_insights=json.dumps(formation_data.get("ai_analysis", {}))
            )
            
            # Send to M.E.L. processing pipeline
            await self._publish_formation_event(formation_event)
            
            self.stats["formations_analyzed"] += 1
            self.stats["last_activity"] = datetime.now()
            
            logger.info(f"Processed formation event for session {session_id}: {formation_event.formation_id}")
            
            return formation_event.formation_id
            
        except Exception as e:
            logger.error(f"Failed to process formation event: {str(e)}")
            self.stats["errors"] += 1
            raise
    
    async def _publish_formation_event(self, event: FormationEvent):
        """Publish formation event to Kafka topic"""
        
        if not self.producer:
            logger.warning("Kafka producer not available - cannot publish formation event")
            return
        
        try:
            # Convert to dict for serialization
            event_data = asdict(event)
            
            # Publish to formations topic
            future = self.producer.send(
                self.topics["formations"],
                key=event.formation_id,
                value=event_data
            )
            
            # Wait for confirmation
            record_metadata = future.get(timeout=10)
            
            logger.debug(f"Published formation event to {record_metadata.topic}:{record_metadata.partition}")
            
        except KafkaError as e:
            logger.error(f"Failed to publish formation event: {str(e)}")
            raise
    
    async def _process_formation_events(self):
        """Background task to process incoming formation events"""
        
        if "formations" not in self.consumers:
            logger.warning("Formation events consumer not available")
            return
        
        consumer = self.consumers["formations"]
        
        while True:
            try:
                # Poll for messages
                message_pack = consumer.poll(timeout_ms=1000)
                
                for topic_partition, messages in message_pack.items():
                    for message in messages:
                        try:
                            # Deserialize formation event
                            event_data = message.value
                            formation_event = FormationEvent(**event_data)
                            
                            # Process through handlers
                            for handler in self.formation_handlers:
                                await asyncio.create_task(handler(formation_event))
                            
                            self.stats["events_processed"] += 1
                            
                            # Commit offset
                            consumer.commit_async()
                            
                        except Exception as e:
                            logger.error(f"Error processing formation event: {str(e)}")
                            self.stats["errors"] += 1
                
            except Exception as e:
                logger.error(f"Formation events processing error: {str(e)}")
                await asyncio.sleep(5)  # Wait before retrying
    
    async def _process_coaching_alerts(self):
        """Background task to process coaching alerts"""
        
        if "alerts" not in self.consumers:
            logger.warning("Coaching alerts consumer not available")
            return
        
        consumer = self.consumers["alerts"]
        
        while True:
            try:
                message_pack = consumer.poll(timeout_ms=1000)
                
                for topic_partition, messages in message_pack.items():
                    for message in messages:
                        try:
                            # Deserialize coaching alert
                            alert_data = message.value
                            
                            # Convert timestamp string back to datetime
                            if "alert_timestamp" in alert_data:
                                alert_data["alert_timestamp"] = datetime.fromisoformat(
                                    alert_data["alert_timestamp"].replace("Z", "+00:00")
                                )
                            
                            coaching_alert = CoachingAlert(
                                alert_id=alert_data["alert_id"],
                                alert_timestamp=alert_data["alert_timestamp"],
                                formation_type=alert_data["formation_type"],
                                alert_type=alert_data["alert_type"],
                                message=alert_data["message"],
                                confidence_score=alert_data["confidence_score"],
                                recommended_action=alert_data["recommended_action"],
                                priority_level=AlertPriority(alert_data["priority_level"]),
                                coaching_staff=alert_data["coaching_staff"],
                                triangle_defense_call=TriangleDefenseCall(alert_data["triangle_defense_call"]),
                                metadata=alert_data.get("metadata", {}),
                                session_id=alert_data.get("session_id"),
                                bot_response_required=alert_data.get("bot_response_required", False)
                            )
                            
                            # Process through handlers
                            for handler in self.alert_handlers:
                                await asyncio.create_task(handler(coaching_alert))
                            
                            self.stats["alerts_generated"] += 1
                            
                            # Commit offset
                            consumer.commit_async()
                            
                        except Exception as e:
                            logger.error(f"Error processing coaching alert: {str(e)}")
                            self.stats["errors"] += 1
                
            except Exception as e:
                logger.error(f"Coaching alerts processing error: {str(e)}")
                await asyncio.sleep(5)
    
    async def _process_mel_results(self, stage: str):
        """Background task to process M.E.L. stage results"""
        
        consumer_key = f"mel_{stage}"
        if consumer_key not in self.consumers:
            logger.warning(f"M.E.L. {stage} consumer not available")
            return
        
        consumer = self.consumers[consumer_key]
        
        while True:
            try:
                message_pack = consumer.poll(timeout_ms=1000)
                
                for topic_partition, messages in message_pack.items():
                    for message in messages:
                        try:
                            # Deserialize M.E.L. result
                            result_data = message.value
                            
                            mel_result = MELProcessingResult(
                                record_id=result_data["record_id"],
                                stage=MELStage(stage),
                                input_data=result_data["input_data"],
                                output_data=result_data["output_data"],
                                processing_time_ms=result_data["processing_time_ms"],
                                confidence_level=result_data["confidence_level"],
                                success=result_data["success"],
                                error_message=result_data.get("error_message"),
                                next_stage_ready=result_data.get("next_stage_ready", False),
                                session_id=result_data.get("session_id")
                            )
                            
                            # Process through handlers
                            for handler in self.mel_result_handlers:
                                await asyncio.create_task(handler(mel_result))
                            
                            self.stats["mel_pipeline_executions"] += 1
                            
                            # Commit offset
                            consumer.commit_async()
                            
                        except Exception as e:
                            logger.error(f"Error processing M.E.L. {stage} result: {str(e)}")
                            self.stats["errors"] += 1
                
            except Exception as e:
                logger.error(f"M.E.L. {stage} processing error: {str(e)}")
                await asyncio.sleep(5)
    
    async def _report_statistics(self):
        """Background task to report processing statistics"""
        
        while True:
            try:
                await asyncio.sleep(60)  # Report every minute
                
                logger.info(f"Event Processing Stats: {self.stats}")
                
                # Publish statistics to monitoring topic
                if self.producer:
                    stats_message = {
                        "timestamp": datetime.now().isoformat(),
                        "component": "amt-orchestration-event-processor",
                        "statistics": self.stats
                    }
                    
                    self.producer.send(
                        self.topics["monitoring"],
                        key="amt-orchestration-stats",
                        value=stats_message
                    )
                
            except Exception as e:
                logger.error(f"Statistics reporting error: {str(e)}")
    
    def add_formation_handler(self, handler: Callable[[FormationEvent], None]):
        """Add handler for formation events"""
        self.formation_handlers.append(handler)
    
    def add_alert_handler(self, handler: Callable[[CoachingAlert], None]):
        """Add handler for coaching alerts"""
        self.alert_handlers.append(handler)
    
    def add_mel_result_handler(self, handler: Callable[[MELProcessingResult], None]):
        """Add handler for M.E.L. processing results"""
        self.mel_result_handlers.append(handler)
    
    async def trigger_triangle_defense_analysis(
        self,
        formation_data: Dict[str, Any],
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Trigger comprehensive Triangle Defense analysis"""
        
        if not self.enable_triangle_defense:
            return {"error": "Triangle Defense analysis not enabled"}
        
        try:
            # Create analysis request
            analysis_request = {
                "analysis_id": str(uuid.uuid4()),
                "formation_data": formation_data,
                "session_id": session_id,
                "timestamp": datetime.now().isoformat(),
                "requested_by": "amt-orchestration"
            }
            
            # Submit to Triangle Defense processing pipeline
            # This would trigger the Flink jobs for comprehensive analysis
            
            return {
                "analysis_id": analysis_request["analysis_id"],
                "status": "submitted",
                "expected_completion": (datetime.now() + timedelta(seconds=30)).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Triangle Defense analysis failed: {str(e)}")
            return {"error": str(e)}
    
    async def get_processing_statistics(self) -> Dict[str, Any]:
        """Get current processing statistics"""
        
        return {
            "statistics": self.stats.copy(),
            "topics": self.topics.copy(),
            "consumers_active": len(self.consumers),
            "producer_active": self.producer is not None,
            "handlers_registered": {
                "formation_handlers": len(self.formation_handlers),
                "alert_handlers": len(self.alert_handlers),
                "mel_result_handlers": len(self.mel_result_handlers)
            }
        }
    
    async def shutdown(self):
        """Shutdown real-time event processing"""
        
        logger.info("Shutting down real-time event processing...")
        
        # Cancel background tasks
        for task in self.processing_tasks:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
        
        # Close Kafka connections
        if self.producer:
            self.producer.close()
        
        for consumer in self.consumers.values():
            consumer.close()
        
        logger.info("Real-time event processing shutdown complete")

# Factory function
def create_realtime_event_processor(
    kafka_config: Optional[Dict[str, Any]] = None,
    enable_triangle_defense: bool = True
) -> RealtimeEventProcessor:
    """Create real-time event processor with configuration"""
    
    return RealtimeEventProcessor(
        kafka_config=kafka_config,
        enable_triangle_defense=enable_triangle_defense
    )

# Integration with orchestration system
class OrchestrationEventHandler:
    """Handler for integrating orchestration events with real-time processing"""
    
    def __init__(self, event_processor: RealtimeEventProcessor):
        self.event_processor = event_processor
        
        # Register handlers
        event_processor.add_alert_handler(self._handle_coaching_alert)
        event_processor.add_mel_result_handler(self._handle_mel_result)
    
    async def _handle_coaching_alert(self, alert: CoachingAlert):
        """Handle coaching alerts from Triangle Defense analysis"""
        
        if alert.bot_response_required and alert.session_id:
            # This would notify the orchestration system that a bot response is needed
            logger.info(f"Bot response required for alert {alert.alert_id} in session {alert.session_id}")
            
            # Could trigger specific bot actions based on alert type
            if alert.priority_level == AlertPriority.CRITICAL:
                # Immediate bot intervention required
                pass
    
    async def _handle_mel_result(self, result: MELProcessingResult):
        """Handle M.E.L. processing results"""
        
        if result.session_id and result.success:
            # Update session with M.E.L. insights
            logger.info(f"M.E.L. {result.stage} completed for session {result.session_id}")
            
            # Could feed results back into orchestration context
            if result.next_stage_ready:
                # Trigger next M.E.L. stage
                pass

# Global instance
_realtime_processor: Optional[RealtimeEventProcessor] = None

def get_realtime_event_processor() -> Optional[RealtimeEventProcessor]:
    """Get global real-time event processor instance"""
    global _realtime_processor
    return _realtime_processor

async def initialize_realtime_processing(
    kafka_config: Optional[Dict[str, Any]] = None
) -> bool:
    """Initialize global real-time event processing"""
    global _realtime_processor
    
    if _realtime_processor is None:
        _realtime_processor = create_realtime_event_processor(kafka_config)
        return await _realtime_processor.initialize()
    
    return True
