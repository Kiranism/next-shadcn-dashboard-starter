"""
AMT Knowledge Base Integration
Advanced integration with Griptape Core and AMT conversation pattern learning
"""

import asyncio
import logging
import json
from typing import Dict, List, Optional, Any, Union, Tuple
from datetime import datetime, timedelta
from pathlib import Path
from dataclasses import dataclass, asdict, field
from enum import Enum
import uuid

from ..shared.orchestration_protocol import (
    BotType, TaskStatus, OrchestrationContext, KnowledgeUpdate
)

# Import AMT-enhanced Griptape components
try:
    from griptape.structures import AMTAgent
    from griptape.ml import (
        ConversationPatternAnalyzer, AMTLearningCoordinator,
        InteractionOutcome, DomainCategory, LearningPattern,
        create_amt_conversation_analyzer
    )
    from griptape.memory import ConversationMemory
    from griptape.rules import Rule, Ruleset
    GRIPTAPE_AVAILABLE = True
except ImportError:
    logging.warning("AMT Griptape Core not available - using fallback implementations")
    GRIPTAPE_AVAILABLE = False
    AMTAgent = None

logger = logging.getLogger(__name__)

class KnowledgeScope(str, Enum):
    """Scope of knowledge base entries"""
    GLOBAL = "global"                    # Available to all bots
    ORGANIZATIONAL = "organizational"    # Available within org tier
    DEPARTMENTAL = "departmental"        # Available within department
    BOT_SPECIFIC = "bot_specific"        # Specific to individual bot
    SESSION_SPECIFIC = "session_specific" # Specific to orchestration session

class LearningConfidence(str, Enum):
    """Confidence levels for learned patterns"""
    LOW = "low"           # 0.0 - 0.4
    MEDIUM = "medium"     # 0.4 - 0.7  
    HIGH = "high"         # 0.7 - 0.9
    EXPERT = "expert"     # 0.9 - 1.0

@dataclass
class KnowledgeEntry:
    """Individual knowledge base entry"""
    entry_id: str
    bot_type: BotType
    domain: str
    pattern_type: str
    content: Dict[str, Any]
    confidence_score: float
    usage_count: int = 0
    success_rate: float = 1.0
    scope: KnowledgeScope = KnowledgeScope.BOT_SPECIFIC
    tags: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    expires_at: Optional[datetime] = None
    source_sessions: List[str] = field(default_factory=list)

@dataclass
class OrganizationalKnowledge:
    """Knowledge organized by AMT organizational structure"""
    tier_knowledge: Dict[str, List[KnowledgeEntry]] = field(default_factory=dict)
    department_knowledge: Dict[str, List[KnowledgeEntry]] = field(default_factory=dict)
    cross_bot_patterns: List[KnowledgeEntry] = field(default_factory=list)
    triangle_defense_insights: List[KnowledgeEntry] = field(default_factory=list)

class KnowledgeBaseIntegration:
    """Advanced knowledge base with Griptape ML integration"""
    
    def __init__(self, storage_path: Optional[Path] = None):
        self.storage_path = storage_path or Path("knowledge_base")
        self.storage_path.mkdir(parents=True, exist_ok=True)
        
        # Knowledge storage
        self.knowledge_entries: Dict[str, KnowledgeEntry] = {}
        self.organizational_knowledge = OrganizationalKnowledge()
        
        # Bot-specific analyzers and agents
        self.bot_analyzers: Dict[BotType, ConversationPatternAnalyzer] = {}
        self.amt_agents: Dict[BotType, AMTAgent] = {}
        
        # Learning coordination
        self.learning_coordinator = None
        if GRIPTAPE_AVAILABLE:
            self.learning_coordinator = AMTLearningCoordinator()
        
        # AMT organizational mapping
        self.org_hierarchy = self._initialize_org_hierarchy()
        
        # Knowledge base statistics
        self.stats = {
            "total_entries": 0,
            "successful_applications": 0,
            "failed_applications": 0,
            "cross_bot_learnings": 0,
            "triangle_defense_patterns": 0
        }
        
        # Load existing knowledge
        asyncio.create_task(self._load_existing_knowledge())
    
    def _initialize_org_hierarchy(self) -> Dict[str, Any]:
        """Initialize AMT organizational hierarchy for knowledge sharing"""
        
        return {
            "tiers": {
                "founder": {
                    "level": 1,
                    "knowledge_access": "all",
                    "bots": ["denauld-brown"]
                },
                "ai_core": {
                    "level": 2, 
                    "knowledge_access": "all",
                    "bots": ["mel-ai"]
                },
                "executive": {
                    "level": 3,
                    "knowledge_access": "strategic_and_below",
                    "bots": ["courtney-sellars", "alexandra-martinez"]
                },
                "strategic": {
                    "level": 4,
                    "knowledge_access": "strategic_and_below", 
                    "bots": ["marcus-sterling", "darius-washington", "dr-james-wright"]
                },
                "innovation": {
                    "level": 5,
                    "knowledge_access": "innovation_and_below",
                    "bots": ["maya-patel", "rachel-foster", "jake-morrison", "david-kim"]
                }
            },
            "departments": {
                "design": ["maya-patel"],
                "ai_research": ["rachel-foster"],
                "devops": ["jake-morrison"],
                "innovation": ["david-kim"]
            }
        }
    
    async def initialize_bot_learning(
        self,
        bot_type: BotType,
        bot_name: str,
        organizational_tier: str,
        department: str,
        expertise_areas: List[str]
    ) -> bool:
        """Initialize learning capabilities for a specific bot"""
        
        if not GRIPTAPE_AVAILABLE:
            logger.warning(f"Griptape not available - cannot initialize learning for {bot_name}")
            return False
        
        try:
            # Create conversation pattern analyzer
            analyzer = create_amt_conversation_analyzer(
                bot_id=bot_name.lower().replace(" ", "_").replace("-", "_"),
                organizational_tier=organizational_tier.lower()
            )
            
            # Load existing learning data
            learning_path = self.storage_path / f"{bot_name.lower().replace(' ', '_')}_patterns.json"
            if learning_path.exists():
                analyzer.load_learning_data(learning_path)
            
            self.bot_analyzers[bot_type] = analyzer
            
            # Create AMT Agent instance for advanced capabilities
            amt_agent = AMTAgent(
                bot_name=bot_name,
                organizational_tier=organizational_tier,
                emergency_priority=self._get_emergency_priority(bot_name),
                department=department,
                expertise_areas=expertise_areas,
                learning_data_path=learning_path
            )
            
            self.amt_agents[bot_type] = amt_agent
            
            logger.info(f"Initialized learning capabilities for {bot_name} ({bot_type})")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize bot learning for {bot_name}: {str(e)}")
            return False
    
    def _get_emergency_priority(self, bot_name: str) -> int:
        """Get emergency priority based on bot name"""
        
        priority_mapping = {
            "denauld-brown": 1,
            "mel-ai": 2, 
            "courtney-sellars": 3,
            "alexandra-martinez": 4,
            "maya-patel": 16,
            "rachel-foster": 14,
            "jake-morrison": 15,
            "david-kim": 13
        }
        
        return priority_mapping.get(bot_name.lower(), 20)
    
    async def analyze_conversation_for_learning(
        self,
        bot_type: BotType,
        session_id: str,
        messages: List[Dict[str, str]],
        outcome: Optional[InteractionOutcome] = None
    ) -> Dict[str, Any]:
        """Analyze conversation for learning patterns"""
        
        if bot_type not in self.bot_analyzers:
            logger.warning(f"No analyzer available for {bot_type}")
            return {}
        
        try:
            analyzer = self.bot_analyzers[bot_type]
            
            # Analyze conversation
            conversation_metrics = analyzer.analyze_conversation(messages)
            
            # Extract learned patterns
            patterns = analyzer.get_recent_patterns(limit=5)
            
            # Create knowledge entries from patterns
            knowledge_entries = []
            for pattern in patterns:
                entry = await self._create_knowledge_entry_from_pattern(
                    bot_type, session_id, pattern, conversation_metrics
                )
                if entry:
                    knowledge_entries.append(entry)
            
            # Store knowledge entries
            for entry in knowledge_entries:
                await self._store_knowledge_entry(entry)
            
            # Update organizational knowledge
            await self._update_organizational_knowledge(bot_type, knowledge_entries)
            
            return {
                "session_id": session_id,
                "bot_type": bot_type,
                "patterns_learned": len(patterns),
                "knowledge_entries_created": len(knowledge_entries),
                "conversation_metrics": asdict(conversation_metrics),
                "domain_expertise_updated": analyzer.get_domain_expertise_summary()
            }
            
        except Exception as e:
            logger.error(f"Conversation analysis failed for {bot_type}: {str(e)}")
            return {"error": str(e)}
    
    async def _create_knowledge_entry_from_pattern(
        self,
        bot_type: BotType,
        session_id: str,
        pattern: LearningPattern,
        metrics: Any
    ) -> Optional[KnowledgeEntry]:
        """Create knowledge entry from learned pattern"""
        
        if not pattern or pattern.confidence_score < 0.3:
            return None
        
        try:
            # Determine knowledge scope based on pattern type and confidence
            scope = self._determine_knowledge_scope(bot_type, pattern)
            
            # Create knowledge entry
            entry = KnowledgeEntry(
                entry_id=str(uuid.uuid4()),
                bot_type=bot_type,
                domain=pattern.domain.value if hasattr(pattern.domain, 'value') else str(pattern.domain),
                pattern_type=pattern.pattern_type,
                content={
                    "pattern_data": asdict(pattern),
                    "context_triggers": pattern.context_triggers,
                    "successful_responses": pattern.successful_responses,
                    "effectiveness_score": pattern.confidence_score
                },
                confidence_score=pattern.confidence_score,
                scope=scope,
                tags=self._generate_knowledge_tags(pattern, metrics),
                source_sessions=[session_id]
            )
            
            return entry
            
        except Exception as e:
            logger.error(f"Failed to create knowledge entry from pattern: {str(e)}")
            return None
    
    def _determine_knowledge_scope(self, bot_type: BotType, pattern: LearningPattern) -> KnowledgeScope:
        """Determine appropriate scope for knowledge entry"""
        
        # High confidence patterns with broad applicability
        if pattern.confidence_score > 0.8 and hasattr(pattern, 'generalizability') and pattern.generalizability > 0.7:
            return KnowledgeScope.ORGANIZATIONAL
        
        # Medium confidence patterns applicable to department
        elif pattern.confidence_score > 0.6:
            return KnowledgeScope.DEPARTMENTAL
        
        # Lower confidence or highly specific patterns
        else:
            return KnowledgeScope.BOT_SPECIFIC
    
    def _generate_knowledge_tags(self, pattern: LearningPattern, metrics: Any) -> List[str]:
        """Generate tags for knowledge entry"""
        
        tags = []
        
        # Add domain tags
        if hasattr(pattern, 'domain'):
            tags.append(f"domain_{pattern.domain}")
        
        # Add pattern type tags
        tags.append(f"pattern_{pattern.pattern_type}")
        
        # Add confidence level tags
        if pattern.confidence_score > 0.9:
            tags.append("expert_level")
        elif pattern.confidence_score > 0.7:
            tags.append("high_confidence")
        elif pattern.confidence_score > 0.4:
            tags.append("medium_confidence")
        
        # Add Triangle Defense tags if applicable
        if hasattr(metrics, 'domain_tags') and any('triangle_defense' in tag.lower() for tag in metrics.domain_tags):
            tags.append("triangle_defense")
        
        return tags
    
    async def _store_knowledge_entry(self, entry: KnowledgeEntry):
        """Store knowledge entry in the knowledge base"""
        
        self.knowledge_entries[entry.entry_id] = entry
        self.stats["total_entries"] += 1
        
        # Save to persistent storage
        await self._persist_knowledge_entry(entry)
    
    async def _update_organizational_knowledge(
        self,
        bot_type: BotType,
        entries: List[KnowledgeEntry]
    ):
        """Update organizational knowledge structure"""
        
        for entry in entries:
            # Update tier knowledge
            bot_info = self._get_bot_organizational_info(bot_type)
            if bot_info:
                tier = bot_info.get("tier", "unknown")
                if tier not in self.organizational_knowledge.tier_knowledge:
                    self.organizational_knowledge.tier_knowledge[tier] = []
                
                self.organizational_knowledge.tier_knowledge[tier].append(entry)
                
                # Update department knowledge
                department = bot_info.get("department", "unknown")
                if department not in self.organizational_knowledge.department_knowledge:
                    self.organizational_knowledge.department_knowledge[department] = []
                
                self.organizational_knowledge.department_knowledge[department].append(entry)
            
            # Check for cross-bot applicable patterns
            if entry.scope in [KnowledgeScope.ORGANIZATIONAL, KnowledgeScope.DEPARTMENTAL]:
                self.organizational_knowledge.cross_bot_patterns.append(entry)
                self.stats["cross_bot_learnings"] += 1
            
            # Check for Triangle Defense patterns
            if "triangle_defense" in entry.tags:
                self.organizational_knowledge.triangle_defense_insights.append(entry)
                self.stats["triangle_defense_patterns"] += 1
    
    def _get_bot_organizational_info(self, bot_type: BotType) -> Optional[Dict[str, str]]:
        """Get organizational information for bot type"""
        
        bot_mapping = {
            BotType.DESIGN: {"tier": "innovation", "department": "design"},
            BotType.AI_RESEARCH: {"tier": "innovation", "department": "ai_research"},
            BotType.DEVOPS: {"tier": "innovation", "department": "devops"},
            BotType.INNOVATION: {"tier": "innovation", "department": "innovation"}
        }
        
        return bot_mapping.get(bot_type)
    
    async def query_knowledge_for_context(
        self,
        bot_type: BotType,
        context: Dict[str, Any],
        session_id: Optional[str] = None
    ) -> List[KnowledgeEntry]:
        """Query knowledge base for relevant entries given context"""
        
        relevant_entries = []
        
        # Get context keywords
        context_text = json.dumps(context, default=str).lower()
        context_keywords = self._extract_keywords(context_text)
        
        # Search through knowledge entries
        for entry in self.knowledge_entries.values():
            relevance_score = self._calculate_relevance_score(
                entry, bot_type, context_keywords, session_id
            )
            
            if relevance_score > 0.3:  # Threshold for relevance
                relevant_entries.append((entry, relevance_score))
        
        # Sort by relevance and return top matches
        relevant_entries.sort(key=lambda x: x[1], reverse=True)
        return [entry for entry, score in relevant_entries[:10]]
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Extract keywords from text for matching"""
        
        # Simple keyword extraction (could be enhanced with NLP)
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
        words = text.lower().split()
        keywords = [word for word in words if len(word) > 2 and word not in stop_words]
        return keywords
    
    def _calculate_relevance_score(
        self,
        entry: KnowledgeEntry,
        bot_type: BotType,
        context_keywords: List[str],
        session_id: Optional[str]
    ) -> float:
        """Calculate relevance score for knowledge entry"""
        
        score = 0.0
        
        # Bot type match
        if entry.bot_type == bot_type:
            score += 0.3
        
        # Scope accessibility
        if self._is_knowledge_accessible(entry, bot_type):
            score += 0.2
        
        # Keyword matching
        entry_text = json.dumps(entry.content, default=str).lower()
        matched_keywords = sum(1 for keyword in context_keywords if keyword in entry_text)
        if context_keywords:
            keyword_score = matched_keywords / len(context_keywords)
            score += keyword_score * 0.3
        
        # Confidence and success rate
        score += entry.confidence_score * 0.1
        score += entry.success_rate * 0.1
        
        # Recency boost
        days_old = (datetime.now() - entry.created_at).days
        if days_old < 7:
            score += 0.1
        elif days_old > 30:
            score -= 0.1
        
        return min(score, 1.0)
    
    def _is_knowledge_accessible(self, entry: KnowledgeEntry, bot_type: BotType) -> bool:
        """Check if knowledge entry is accessible to bot type"""
        
        if entry.scope == KnowledgeScope.GLOBAL:
            return True
        
        if entry.scope == KnowledgeScope.BOT_SPECIFIC:
            return entry.bot_type == bot_type
        
        bot_info = self._get_bot_organizational_info(bot_type)
        if not bot_info:
            return False
        
        if entry.scope == KnowledgeScope.DEPARTMENTAL:
            entry_bot_info = self._get_bot_organizational_info(entry.bot_type)
            if entry_bot_info:
                return bot_info["department"] == entry_bot_info["department"]
        
        if entry.scope == KnowledgeScope.ORGANIZATIONAL:
            return True  # All bots within organization can access
        
        return False
    
    async def suggest_response_strategy(
        self,
        bot_type: BotType,
        context: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Suggest response strategy based on learned patterns"""
        
        if bot_type not in self.bot_analyzers:
            return None
        
        try:
            analyzer = self.bot_analyzers[bot_type]
            strategy = analyzer.suggest_response_strategy(context)
            
            if strategy:
                return {
                    "strategy": strategy,
                    "confidence": self._calculate_strategy_confidence(strategy, context),
                    "supporting_patterns": await self._get_supporting_patterns(bot_type, context)
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to suggest response strategy: {str(e)}")
            return None
    
    def _calculate_strategy_confidence(self, strategy: str, context: Dict[str, Any]) -> float:
        """Calculate confidence in suggested strategy"""
        
        # Simple confidence calculation based on context completeness
        context_completeness = len(context) / 10.0  # Normalize to 0-1
        return min(context_completeness + 0.3, 1.0)
    
    async def _get_supporting_patterns(
        self,
        bot_type: BotType,
        context: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Get patterns that support the suggested strategy"""
        
        relevant_entries = await self.query_knowledge_for_context(bot_type, context)
        
        supporting_patterns = []
        for entry in relevant_entries[:3]:  # Top 3 most relevant
            supporting_patterns.append({
                "pattern_type": entry.pattern_type,
                "confidence": entry.confidence_score,
                "domain": entry.domain,
                "usage_count": entry.usage_count,
                "success_rate": entry.success_rate
            })
        
        return supporting_patterns
    
    async def record_knowledge_application(
        self,
        entry_id: str,
        success: bool,
        session_id: str
    ):
        """Record the application and success of knowledge entry"""
        
        if entry_id not in self.knowledge_entries:
            logger.warning(f"Knowledge entry {entry_id} not found")
            return
        
        entry = self.knowledge_entries[entry_id]
        entry.usage_count += 1
        
        # Update success rate using exponential moving average
        alpha = 0.1  # Learning rate
        new_success = 1.0 if success else 0.0
        entry.success_rate = (1 - alpha) * entry.success_rate + alpha * new_success
        
        # Update statistics
        if success:
            self.stats["successful_applications"] += 1
        else:
            self.stats["failed_applications"] += 1
        
        # Add session to source sessions
        if session_id not in entry.source_sessions:
            entry.source_sessions.append(session_id)
        
        # Update timestamp
        entry.updated_at = datetime.now()
        
        # Persist changes
        await self._persist_knowledge_entry(entry)
    
    async def get_bot_expertise_summary(self, bot_type: BotType) -> Dict[str, Any]:
        """Get expertise summary for specific bot"""
        
        if bot_type not in self.amt_agents:
            return {"error": "Bot not initialized"}
        
        try:
            agent = self.amt_agents[bot_type]
            return agent.get_expertise_summary()
            
        except Exception as e:
            logger.error(f"Failed to get expertise summary for {bot_type}: {str(e)}")
            return {"error": str(e)}
    
    async def get_organizational_knowledge_summary(self) -> Dict[str, Any]:
        """Get summary of organizational knowledge"""
        
        return {
            "total_knowledge_entries": len(self.knowledge_entries),
            "tier_distribution": {
                tier: len(entries) 
                for tier, entries in self.organizational_knowledge.tier_knowledge.items()
            },
            "department_distribution": {
                dept: len(entries)
                for dept, entries in self.organizational_knowledge.department_knowledge.items()
            },
            "cross_bot_patterns": len(self.organizational_knowledge.cross_bot_patterns),
            "triangle_defense_insights": len(self.organizational_knowledge.triangle_defense_insights),
            "statistics": self.stats,
            "knowledge_quality": {
                "high_confidence_entries": len([
                    e for e in self.knowledge_entries.values() 
                    if e.confidence_score > 0.8
                ]),
                "expert_level_entries": len([
                    e for e in self.knowledge_entries.values()
                    if "expert_level" in e.tags
                ]),
                "recent_learnings": len([
                    e for e in self.knowledge_entries.values()
                    if (datetime.now() - e.created_at).days < 7
                ])
            }
        }
    
    async def _persist_knowledge_entry(self, entry: KnowledgeEntry):
        """Persist knowledge entry to storage"""
        
        entry_path = self.storage_path / f"entries/{entry.entry_id}.json"
        entry_path.parent.mkdir(parents=True, exist_ok=True)
        
        try:
            with open(entry_path, 'w') as f:
                json.dump(asdict(entry), f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Failed to persist knowledge entry {entry.entry_id}: {str(e)}")
    
    async def _load_existing_knowledge(self):
        """Load existing knowledge from storage"""
        
        entries_path = self.storage_path / "entries"
        if not entries_path.exists():
            return
        
        try:
            for entry_file in entries_path.glob("*.json"):
                with open(entry_file, 'r') as f:
                    entry_data = json.load(f)
                    entry = KnowledgeEntry(**entry_data)
                    self.knowledge_entries[entry.entry_id] = entry
            
            logger.info(f"Loaded {len(self.knowledge_entries)} existing knowledge entries")
            
        except Exception as e:
            logger.error(f"Failed to load existing knowledge: {str(e)}")
    
    async def cleanup_expired_knowledge(self):
        """Remove expired knowledge entries"""
        
        now = datetime.now()
        expired_entries = [
            entry_id for entry_id, entry in self.knowledge_entries.items()
            if entry.expires_at and entry.expires_at < now
        ]
        
        for entry_id in expired_entries:
            del self.knowledge_entries[entry_id]
            
            # Remove file
            entry_path = self.storage_path / f"entries/{entry_id}.json"
            if entry_path.exists():
                entry_path.unlink()
        
        if expired_entries:
            logger.info(f"Cleaned up {len(expired_entries)} expired knowledge entries")

# Factory function for creating knowledge base integration
def create_knowledge_base_integration(
    storage_path: Optional[Path] = None,
    enable_learning: bool = True
) -> KnowledgeBaseIntegration:
    """Create knowledge base integration with optional configuration"""
    
    if not GRIPTAPE_AVAILABLE and enable_learning:
        logger.warning("Griptape not available - learning features will be limited")
    
    return KnowledgeBaseIntegration(storage_path)

# Global knowledge base instance
_knowledge_base: Optional[KnowledgeBaseIntegration] = None

def get_knowledge_base() -> KnowledgeBaseIntegration:
    """Get global knowledge base instance"""
    global _knowledge_base
    
    if _knowledge_base is None:
        _knowledge_base = create_knowledge_base_integration()
    
    return _knowledge_base
