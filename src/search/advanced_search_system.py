"""
AMT Orchestration Platform - Advanced Search and Knowledge Discovery System
File 37 of 47

Comprehensive search and knowledge discovery system providing intelligent search
across Triangle Defense formations, M.E.L. AI insights, coaching content, user data,
reports, and all AMT platform knowledge with semantic search, AI-powered recommendations,
and contextual discovery for enhanced coaching intelligence.

Author: AMT Development Team
Created: 2025-09-25
"""

import asyncio
import logging
import json
import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union, Tuple, Set
from dataclasses import dataclass, field
from enum import Enum
import uuid
import math

# Search and NLP
from elasticsearch import AsyncElasticsearch
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import PorterStemmer
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
import spacy

# Platform imports
from ..shared.orchestration_protocol import FormationType, TaskStatus, BotType
from ..orchestration.orchestration_service import OrchestrationService
from ..ml.triangle_defense_optimizer import TriangleDefenseOptimizer
from ..user_management.enterprise_user_management import EnterpriseUserManagement, UserRole
from ..security.security_manager import SecurityManager
from ..monitoring.metrics_collector import MetricsCollector
from ..integrations.mel_engine_integration import MELEngineIntegration
from ..integrations.triangle_defense_integration import TriangleDefenseIntegration
from ..reporting.advanced_reporting_system import AdvancedReportingSystem
from ..documentation.developer_guide_system import DeveloperGuideSystem
from ..automation.workflow_automation_system import WorkflowAutomationSystem


class SearchContentType(Enum):
    """Types of searchable content in AMT platform."""
    FORMATION = "formation"
    MEL_INSIGHT = "mel_insight"
    COACHING_CONTENT = "coaching_content"
    USER_PROFILE = "user_profile"
    REPORT = "report"
    WORKFLOW = "workflow"
    DOCUMENTATION = "documentation"
    PERFORMANCE_DATA = "performance_data"
    GAME_SITUATION = "game_situation"
    TRAINING_MATERIAL = "training_material"
    ANALYTICS = "analytics"
    NOTIFICATION = "notification"


class SearchScope(Enum):
    """Search scope definitions."""
    ALL = "all"
    TRIANGLE_DEFENSE = "triangle_defense"
    MEL_AI = "mel_ai"
    COACHING = "coaching"
    ANALYTICS = "analytics"
    ADMINISTRATION = "administration"
    DEVELOPMENT = "development"
    USER_SPECIFIC = "user_specific"


class SearchMode(Enum):
    """Search modes for different query types."""
    KEYWORD = "keyword"  # Traditional keyword search
    SEMANTIC = "semantic"  # AI-powered semantic search
    NATURAL_LANGUAGE = "natural_language"  # Natural language queries
    FORMATION_SPECIFIC = "formation_specific"  # Triangle Defense formation search
    CONTEXTUAL = "contextual"  # Context-aware search
    RECOMMENDATION = "recommendation"  # AI-powered recommendations


@dataclass
class SearchQuery:
    """Comprehensive search query structure."""
    query_id: str
    query_text: str
    search_mode: SearchMode
    content_types: List[SearchContentType]
    search_scope: SearchScope
    user_id: str
    filters: Dict[str, Any] = field(default_factory=dict)
    date_range: Optional[Tuple[datetime, datetime]] = None
    limit: int = 20
    offset: int = 0
    include_snippets: bool = True
    boost_user_content: bool = True
    formation_context: Optional[FormationType] = None
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class SearchResult:
    """Individual search result with relevance scoring."""
    result_id: str
    content_type: SearchContentType
    title: str
    content: str
    snippet: str
    relevance_score: float
    semantic_score: Optional[float]
    source_id: str
    source_metadata: Dict[str, Any]
    created_at: datetime
    updated_at: Optional[datetime]
    tags: List[str] = field(default_factory=list)
    formation_relevance: Optional[Dict[FormationType, float]] = None
    mel_insights_count: int = 0
    user_context_score: Optional[float] = None


@dataclass
class SearchResponse:
    """Complete search response with results and metadata."""
    query_id: str
    results: List[SearchResult]
    total_results: int
    search_time_ms: float
    suggestions: List[str] = field(default_factory=list)
    facets: Dict[str, List[Dict[str, Any]]] = field(default_factory=dict)
    related_searches: List[str] = field(default_factory=list)
    ai_insights: Optional[str] = None
    formation_recommendations: List[FormationType] = field(default_factory=list)


@dataclass
class KnowledgeNode:
    """Knowledge graph node for content relationships."""
    node_id: str
    content_type: SearchContentType
    title: str
    summary: str
    metadata: Dict[str, Any]
    connections: List[str] = field(default_factory=list)  # Connected node IDs
    relevance_weights: Dict[str, float] = field(default_factory=dict)
    last_accessed: Optional[datetime] = None
    access_count: int = 0


class AdvancedSearchSystem:
    """
    Advanced Search and Knowledge Discovery System for AMT Platform.
    
    Provides comprehensive search capabilities including:
    - Semantic search across all Triangle Defense formations and content
    - M.E.L. AI insight discovery and recommendation
    - Natural language query processing with AI understanding
    - Formation-specific search with contextual relevance
    - Intelligent content discovery and recommendations
    - Knowledge graph for content relationships
    - User-personalized search results
    - Real-time search analytics and insights
    - Cross-platform content indexing
    - Advanced filtering and faceted search
    - Search query understanding and expansion
    - Coaching knowledge base integration
    """

    def __init__(
        self,
        orchestration_service: OrchestrationService,
        ml_optimizer: TriangleDefenseOptimizer,
        user_management: EnterpriseUserManagement,
        mel_engine: MELEngineIntegration,
        triangle_defense: TriangleDefenseIntegration,
        reporting_system: AdvancedReportingSystem,
        documentation_system: DeveloperGuideSystem,
        workflow_system: WorkflowAutomationSystem,
        security_manager: SecurityManager,
        metrics_collector: MetricsCollector
    ):
        self.orchestration = orchestration_service
        self.ml_optimizer = ml_optimizer
        self.user_management = user_management
        self.mel_engine = mel_engine
        self.triangle_defense = triangle_defense
        self.reporting = reporting_system
        self.documentation = documentation_system
        self.workflows = workflow_system
        self.security = security_manager
        self.metrics = metrics_collector
        
        self.logger = logging.getLogger(__name__)
        
        # Search infrastructure
        self.elasticsearch_client: Optional[AsyncElasticsearch] = None
        self.sentence_transformer: Optional[SentenceTransformer] = None
        self.tfidf_vectorizer: Optional[TfidfVectorizer] = None
        self.nlp_model = None
        
        # Knowledge management
        self.knowledge_graph: Dict[str, KnowledgeNode] = {}
        self.content_embeddings: Dict[str, np.ndarray] = {}
        self.search_analytics: Dict[str, Any] = {}
        
        # Search optimization
        self.stemmer = PorterStemmer()
        self.stop_words = set()
        self.query_cache: Dict[str, SearchResponse] = {}
        self.popular_queries: Dict[str, int] = {}
        
        # AMT-specific search configuration
        self.amt_config = {
            'formation_keywords': {
                FormationType.LARRY: ['larry', 'mo left', 'male left', 'short yardage', 'goal line'],
                FormationType.LINDA: ['linda', 'mo left', 'female left', 'balanced attack'],
                FormationType.RICKY: ['ricky', 'mo right', 'male right', 'power run'],
                FormationType.RITA: ['rita', 'mo right', 'female right', 'stretch play'],
                FormationType.MALE_MID: ['male mid', 'mo middle', 'male middle', 'up middle'],
                FormationType.FEMALE_MID: ['female mid', 'mo middle', 'female middle', 'center gap']
            },
            'content_weights': {
                SearchContentType.FORMATION: 1.5,  # Higher weight for formation content
                SearchContentType.MEL_INSIGHT: 1.3,
                SearchContentType.COACHING_CONTENT: 1.2,
                SearchContentType.ANALYTICS: 1.0,
                SearchContentType.DOCUMENTATION: 0.8
            },
            'user_role_boosts': {
                UserRole.FOUNDER_AUTHORITY: 1.0,  # No boost needed
                UserRole.EXECUTIVE_COMMAND: 1.0,
                UserRole.FOOTBALL_OPERATIONS: 1.3,  # Boost coaching content
                UserRole.STRATEGIC_LEADERSHIP: 1.1,
                UserRole.INNOVATION_DIVISION: 0.9  # Technical content focus
            },
            'semantic_similarity_threshold': 0.7,
            'max_suggestions': 5,
            'cache_ttl_minutes': 15
        }
        
        # System configuration
        self.config = {
            'elasticsearch_index': 'amt_knowledge_base',
            'max_search_results': 100,
            'search_timeout_seconds': 10,
            'embedding_model': 'all-MiniLM-L6-v2',
            'reindex_interval_hours': 4,
            'analytics_retention_days': 30,
            'query_expansion_enabled': True,
            'personalization_enabled': True
        }

    async def initialize(self) -> bool:
        """Initialize the advanced search system."""
        try:
            self.logger.info("Initializing Advanced Search System...")
            
            # Setup Elasticsearch
            await self._setup_elasticsearch()
            
            # Initialize NLP models
            await self._initialize_nlp_models()
            
            # Load and prepare stopwords
            await self._setup_text_processing()
            
            # Build initial knowledge graph
            await self._build_knowledge_graph()
            
            # Index all existing content
            await self._initial_content_indexing()
            
            # Start background tasks
            asyncio.create_task(self._periodic_reindexing())
            asyncio.create_task(self._update_search_analytics())
            
            self.logger.info("Advanced Search System initialized successfully")
            await self.metrics.record_event("search_system_initialized", {
                "elasticsearch_connected": self.elasticsearch_client is not None,
                "nlp_models_loaded": self.sentence_transformer is not None,
                "knowledge_nodes": len(self.knowledge_graph)
            })
            
            return True
            
        except Exception as e:
            self.logger.error(f"Search System initialization failed: {str(e)}")
            return False

    async def search(self, search_query: SearchQuery) -> SearchResponse:
        """Execute comprehensive search across AMT platform content."""
        start_time = datetime.utcnow()
        
        try:
            self.logger.info(f"Executing search: '{search_query.query_text}' ({search_query.search_mode.value})")
            
            # Check cache first
            cache_key = self._generate_cache_key(search_query)
            if cache_key in self.query_cache:
                cached_response = self.query_cache[cache_key]
                if (datetime.utcnow() - start_time).total_seconds() * 1000 < self.config['search_timeout_seconds'] * 1000:
                    return cached_response
            
            # Validate user permissions
            if not await self._validate_search_permissions(search_query):
                raise ValueError("Insufficient permissions for search scope")
            
            # Process and expand query
            processed_query = await self._process_search_query(search_query)
            
            # Execute different search modes
            if search_query.search_mode == SearchMode.SEMANTIC:
                results = await self._semantic_search(processed_query)
            elif search_query.search_mode == SearchMode.FORMATION_SPECIFIC:
                results = await self._formation_specific_search(processed_query)
            elif search_query.search_mode == SearchMode.NATURAL_LANGUAGE:
                results = await self._natural_language_search(processed_query)
            elif search_query.search_mode == SearchMode.CONTEXTUAL:
                results = await self._contextual_search(processed_query)
            elif search_query.search_mode == SearchMode.RECOMMENDATION:
                results = await self._recommendation_search(processed_query)
            else:
                results = await self._keyword_search(processed_query)
            
            # Apply user personalization
            if self.config['personalization_enabled']:
                results = await self._personalize_results(results, search_query)
            
            # Generate search response
            search_time = (datetime.utcnow() - start_time).total_seconds() * 1000
            
            response = SearchResponse(
                query_id=search_query.query_id,
                results=results[:search_query.limit],
                total_results=len(results),
                search_time_ms=search_time,
                suggestions=await self._generate_search_suggestions(search_query),
                facets=await self._generate_search_facets(results),
                related_searches=await self._get_related_searches(search_query),
                ai_insights=await self._generate_ai_insights(search_query, results),
                formation_recommendations=await self._recommend_formations(search_query, results)
            )
            
            # Cache response
            self.query_cache[cache_key] = response
            
            # Record search analytics
            await self._record_search_analytics(search_query, response)
            
            self.logger.info(f"Search completed: {len(results)} results in {search_time:.2f}ms")
            return response
            
        except Exception as e:
            self.logger.error(f"Search execution failed: {str(e)}")
            raise

    async def search_formations(
        self,
        formation_query: str,
        game_context: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None
    ) -> SearchResponse:
        """Specialized search for Triangle Defense formations."""
        try:
            # Create formation-specific search query
            search_query = SearchQuery(
                query_id=str(uuid.uuid4()),
                query_text=formation_query,
                search_mode=SearchMode.FORMATION_SPECIFIC,
                content_types=[SearchContentType.FORMATION, SearchContentType.COACHING_CONTENT],
                search_scope=SearchScope.TRIANGLE_DEFENSE,
                user_id=user_id or "anonymous",
                filters={
                    'formations': list(FormationType),
                    'game_context': game_context
                }
            )
            
            # Execute search with formation-specific enhancements
            response = await self.search(search_query)
            
            # Add formation-specific insights
            response.formation_recommendations = await self._analyze_formation_query_intent(formation_query)
            
            return response
            
        except Exception as e:
            self.logger.error(f"Formation search failed: {str(e)}")
            raise

    async def search_mel_insights(
        self,
        coaching_topic: str,
        context: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None
    ) -> SearchResponse:
        """Specialized search for M.E.L. AI coaching insights."""
        try:
            search_query = SearchQuery(
                query_id=str(uuid.uuid4()),
                query_text=coaching_topic,
                search_mode=SearchMode.SEMANTIC,
                content_types=[SearchContentType.MEL_INSIGHT, SearchContentType.COACHING_CONTENT],
                search_scope=SearchScope.MEL_AI,
                user_id=user_id or "anonymous",
                filters={'context': context}
            )
            
            response = await self.search(search_query)
            
            # Enhance with M.E.L.-specific insights
            if self.mel_engine and len(response.results) > 0:
                mel_context = {
                    'search_results': [r.title for r in response.results[:3]],
                    'coaching_topic': coaching_topic
                }
                
                additional_insight = await self.mel_engine.generate_contextual_insight(
                    context=mel_context,
                    user_id=user_id
                )
                
                if additional_insight:
                    response.ai_insights = additional_insight
            
            return response
            
        except Exception as e:
            self.logger.error(f"M.E.L. insights search failed: {str(e)}")
            raise

    async def get_search_suggestions(
        self,
        partial_query: str,
        search_scope: SearchScope = SearchScope.ALL,
        user_id: Optional[str] = None
    ) -> List[str]:
        """Get intelligent search suggestions for autocomplete."""
        try:
            suggestions = []
            
            # Get popular queries that match
            matching_popular = [
                query for query in self.popular_queries.keys()
                if partial_query.lower() in query.lower()
            ]
            suggestions.extend(sorted(matching_popular, key=lambda x: self.popular_queries[x], reverse=True)[:3])
            
            # Add formation-specific suggestions
            if search_scope in [SearchScope.ALL, SearchScope.TRIANGLE_DEFENSE]:
                formation_suggestions = await self._get_formation_suggestions(partial_query)
                suggestions.extend(formation_suggestions)
            
            # Add M.E.L.-specific suggestions
            if search_scope in [SearchScope.ALL, SearchScope.MEL_AI]:
                mel_suggestions = await self._get_mel_suggestions(partial_query)
                suggestions.extend(mel_suggestions)
            
            # Remove duplicates and limit
            unique_suggestions = list(dict.fromkeys(suggestions))
            return unique_suggestions[:self.amt_config['max_suggestions']]
            
        except Exception as e:
            self.logger.error(f"Search suggestions failed: {str(e)}")
            return []

    async def discover_related_content(
        self,
        content_id: str,
        content_type: SearchContentType,
        user_id: Optional[str] = None
    ) -> List[SearchResult]:
        """Discover content related to a specific item using knowledge graph."""
        try:
            # Get knowledge node
            knowledge_node = self.knowledge_graph.get(content_id)
            if not knowledge_node:
                return []
            
            # Find connected content
            related_results = []
            
            for connected_id in knowledge_node.connections:
                connected_node = self.knowledge_graph.get(connected_id)
                if connected_node:
                    # Calculate relevance based on connection strength
                    relevance = knowledge_node.relevance_weights.get(connected_id, 0.5)
                    
                    result = SearchResult(
                        result_id=connected_id,
                        content_type=connected_node.content_type,
                        title=connected_node.title,
                        content=connected_node.summary,
                        snippet=connected_node.summary[:200] + "...",
                        relevance_score=relevance,
                        semantic_score=None,
                        source_id=connected_id,
                        source_metadata=connected_node.metadata,
                        created_at=datetime.utcnow(),
                        updated_at=None
                    )
                    
                    related_results.append(result)
            
            # Sort by relevance and return top results
            related_results.sort(key=lambda x: x.relevance_score, reverse=True)
            return related_results[:10]
            
        except Exception as e:
            self.logger.error(f"Related content discovery failed: {str(e)}")
            return []

    # Private helper methods

    async def _setup_elasticsearch(self) -> None:
        """Setup Elasticsearch connection and indexes."""
        try:
            # Initialize Elasticsearch client
            self.elasticsearch_client = AsyncElasticsearch([
                {'host': 'localhost', 'port': 9200}
            ])
            
            # Test connection
            if await self.elasticsearch_client.ping():
                self.logger.info("Elasticsearch connection established")
                
                # Create index if it doesn't exist
                index_exists = await self.elasticsearch_client.indices.exists(
                    index=self.config['elasticsearch_index']
                )
                
                if not index_exists:
                    await self._create_elasticsearch_index()
            else:
                self.logger.warning("Elasticsearch connection failed, using fallback search")
                self.elasticsearch_client = None
                
        except Exception as e:
            self.logger.error(f"Elasticsearch setup failed: {str(e)}")
            self.elasticsearch_client = None

    async def _initialize_nlp_models(self) -> None:
        """Initialize NLP models for semantic search."""
        try:
            # Load sentence transformer model
            self.sentence_transformer = SentenceTransformer(self.config['embedding_model'])
            
            # Initialize TF-IDF vectorizer
            self.tfidf_vectorizer = TfidfVectorizer(
                max_features=5000,
                stop_words='english',
                ngram_range=(1, 2)
            )
            
            # Load spaCy model for NLP processing
            try:
                self.nlp_model = spacy.load("en_core_web_sm")
            except OSError:
                self.logger.warning("spaCy model not found, using basic text processing")
                self.nlp_model = None
            
            self.logger.info("NLP models initialized successfully")
            
        except Exception as e:
            self.logger.error(f"NLP model initialization failed: {str(e)}")

    async def _build_knowledge_graph(self) -> None:
        """Build knowledge graph connecting related content."""
        try:
            # Create nodes for formations
            for formation in FormationType:
                node = KnowledgeNode(
                    node_id=f"formation_{formation.value}",
                    content_type=SearchContentType.FORMATION,
                    title=f"Triangle Defense {formation.value} Formation",
                    summary=f"Comprehensive information about the {formation.value} formation in Triangle Defense methodology",
                    metadata={
                        'formation_type': formation.value,
                        'category': 'triangle_defense',
                        'keywords': self.amt_config['formation_keywords'].get(formation, [])
                    }
                )
                self.knowledge_graph[node.node_id] = node
            
            # Create connections between formations
            await self._create_formation_connections()
            
            # Add M.E.L. insights nodes
            await self._add_mel_insights_nodes()
            
            # Add coaching content nodes
            await self._add_coaching_content_nodes()
            
            self.logger.info(f"Knowledge graph built with {len(self.knowledge_graph)} nodes")
            
        except Exception as e:
            self.logger.error(f"Knowledge graph building failed: {str(e)}")

    async def _semantic_search(self, search_query: SearchQuery) -> List[SearchResult]:
        """Execute semantic search using sentence embeddings."""
        try:
            if not self.sentence_transformer:
                return await self._keyword_search(search_query)
            
            # Generate query embedding
            query_embedding = self.sentence_transformer.encode([search_query.query_text])
            
            # Search through content embeddings
            results = []
            
            for content_id, content_embedding in self.content_embeddings.items():
                # Calculate semantic similarity
                similarity = cosine_similarity(query_embedding, content_embedding.reshape(1, -1))[0][0]
                
                if similarity > self.amt_config['semantic_similarity_threshold']:
                    # Get content details
                    knowledge_node = self.knowledge_graph.get(content_id)
                    if knowledge_node:
                        result = SearchResult(
                            result_id=str(uuid.uuid4()),
                            content_type=knowledge_node.content_type,
                            title=knowledge_node.title,
                            content=knowledge_node.summary,
                            snippet=knowledge_node.summary[:200] + "...",
                            relevance_score=similarity,
                            semantic_score=similarity,
                            source_id=content_id,
                            source_metadata=knowledge_node.metadata,
                            created_at=datetime.utcnow(),
                            updated_at=None
                        )
                        results.append(result)
            
            # Sort by relevance
            results.sort(key=lambda x: x.relevance_score, reverse=True)
            return results
            
        except Exception as e:
            self.logger.error(f"Semantic search failed: {str(e)}")
            return []

    async def _formation_specific_search(self, search_query: SearchQuery) -> List[SearchResult]:
        """Execute formation-specific search with Triangle Defense context."""
        try:
            results = []
            query_lower = search_query.query_text.lower()
            
            # Check for explicit formation mentions
            mentioned_formations = []
            for formation, keywords in self.amt_config['formation_keywords'].items():
                if any(keyword in query_lower for keyword in keywords):
                    mentioned_formations.append(formation)
            
            # Search formation-specific content
            for formation in mentioned_formations or list(FormationType):
                formation_node_id = f"formation_{formation.value}"
                knowledge_node = self.knowledge_graph.get(formation_node_id)
                
                if knowledge_node:
                    # Calculate formation relevance
                    relevance = 1.0 if formation in mentioned_formations else 0.5
                    
                    # Check keyword matches
                    keywords = self.amt_config['formation_keywords'].get(formation, [])
                    keyword_matches = sum(1 for keyword in keywords if keyword in query_lower)
                    relevance += keyword_matches * 0.2
                    
                    result = SearchResult(
                        result_id=str(uuid.uuid4()),
                        content_type=SearchContentType.FORMATION,
                        title=knowledge_node.title,
                        content=knowledge_node.summary,
                        snippet=knowledge_node.summary[:200] + "...",
                        relevance_score=min(relevance, 1.0),
                        semantic_score=None,
                        source_id=formation_node_id,
                        source_metadata=knowledge_node.metadata,
                        created_at=datetime.utcnow(),
                        updated_at=None,
                        formation_relevance={formation: relevance}
                    )
                    results.append(result)
            
            results.sort(key=lambda x: x.relevance_score, reverse=True)
            return results
            
        except Exception as e:
            self.logger.error(f"Formation-specific search failed: {str(e)}")
            return []

    async def _generate_search_suggestions(self, search_query: SearchQuery) -> List[str]:
        """Generate intelligent search suggestions."""
        try:
            suggestions = []
            query_words = search_query.query_text.lower().split()
            
            # Formation-based suggestions
            if search_query.search_scope in [SearchScope.ALL, SearchScope.TRIANGLE_DEFENSE]:
                for formation, keywords in self.amt_config['formation_keywords'].items():
                    if any(word in keywords for word in query_words):
                        suggestions.append(f"Triangle Defense {formation.value} formation analysis")
                        suggestions.append(f"{formation.value} formation vs Cover 2")
            
            # Coaching-specific suggestions
            coaching_suggestions = [
                "defensive strategy optimization",
                "game situation analysis",
                "player development insights",
                "formation effectiveness metrics"
            ]
            
            suggestions.extend([s for s in coaching_suggestions if any(word in s for word in query_words)])
            
            return suggestions[:self.amt_config['max_suggestions']]
            
        except Exception as e:
            self.logger.error(f"Search suggestion generation failed: {str(e)}")
            return []

    async def _record_search_analytics(
        self, 
        search_query: SearchQuery, 
        response: SearchResponse
    ) -> None:
        """Record search analytics for optimization."""
        try:
            # Update popular queries
            query_key = search_query.query_text.lower()
            self.popular_queries[query_key] = self.popular_queries.get(query_key, 0) + 1
            
            # Record detailed analytics
            analytics_data = {
                'query_id': search_query.query_id,
                'user_id': search_query.user_id,
                'query_text': search_query.query_text,
                'search_mode': search_query.search_mode.value,
                'results_count': response.total_results,
                'search_time_ms': response.search_time_ms,
                'timestamp': datetime.utcnow().isoformat()
            }
            
            # Store in search analytics
            date_key = datetime.utcnow().strftime('%Y-%m-%d')
            if date_key not in self.search_analytics:
                self.search_analytics[date_key] = []
            
            self.search_analytics[date_key].append(analytics_data)
            
            # Record metrics
            await self.metrics.record_event("search_executed", {
                "search_mode": search_query.search_mode.value,
                "results_count": response.total_results,
                "search_time_ms": response.search_time_ms,
                "user_id": search_query.user_id
            })
            
        except Exception as e:
            self.logger.error(f"Search analytics recording failed: {str(e)}")

    async def get_search_analytics(self, days: int = 7) -> Dict[str, Any]:
        """Get search analytics for the specified number of days."""
        try:
            # Calculate date range
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=days)
            
            # Collect analytics data
            analytics = {
                'total_searches': 0,
                'unique_users': set(),
                'popular_queries': [],
                'search_modes': {},
                'avg_search_time_ms': 0.0,
                'avg_results_per_search': 0.0,
                'daily_breakdown': {}
            }
            
            total_search_time = 0
            total_results = 0
            
            # Process daily analytics
            for i in range(days):
                date = (start_date + timedelta(days=i)).strftime('%Y-%m-%d')
                daily_searches = self.search_analytics.get(date, [])
                
                analytics['daily_breakdown'][date] = {
                    'searches': len(daily_searches),
                    'unique_users': len(set(s['user_id'] for s in daily_searches))
                }
                
                for search in daily_searches:
                    analytics['total_searches'] += 1
                    analytics['unique_users'].add(search['user_id'])
                    
                    search_mode = search['search_mode']
                    analytics['search_modes'][search_mode] = analytics['search_modes'].get(search_mode, 0) + 1
                    
                    total_search_time += search['search_time_ms']
                    total_results += search['results_count']
            
            # Calculate averages
            if analytics['total_searches'] > 0:
                analytics['avg_search_time_ms'] = total_search_time / analytics['total_searches']
                analytics['avg_results_per_search'] = total_results / analytics['total_searches']
            
            # Get popular queries
            analytics['popular_queries'] = sorted(
                self.popular_queries.items(), 
                key=lambda x: x[1], 
                reverse=True
            )[:10]
            
            # Convert unique users set to count
            analytics['unique_users'] = len(analytics['unique_users'])
            
            return analytics
            
        except Exception as e:
            self.logger.error(f"Search analytics retrieval failed: {str(e)}")
            return {}

    async def get_search_status(self) -> Dict[str, Any]:
        """Get current search system status."""
        return {
            "system_initialized": bool(self.sentence_transformer),
            "elasticsearch_connected": self.elasticsearch_client is not None,
            "nlp_models_loaded": {
                "sentence_transformer": self.sentence_transformer is not None,
                "tfidf_vectorizer": self.tfidf_vectorizer is not None,
                "spacy_model": self.nlp_model is not None
            },
            "knowledge_graph_nodes": len(self.knowledge_graph),
            "content_embeddings": len(self.content_embeddings),
            "cached_queries": len(self.query_cache),
            "popular_queries_count": len(self.popular_queries),
            "search_analytics_days": len(self.search_analytics),
            "amt_search_configuration": {
                "formation_types": len(self.amt_config['formation_keywords']),
                "content_types": len(SearchContentType),
                "search_modes": len(SearchMode),
                "search_scopes": len(SearchScope)
            }
        }


# Export main class
__all__ = [
    'AdvancedSearchSystem',
    'SearchQuery',
    'SearchResult', 
    'SearchResponse',
    'KnowledgeNode',
    'SearchContentType',
    'SearchScope',
    'SearchMode'
]
