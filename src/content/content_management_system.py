"""
AMT Orchestration Platform - Content Management and Digital Asset System
File 38 of 47

Comprehensive content management system enabling coaches to create, organize,
and share Triangle Defense playbooks, formation diagrams, coaching videos,
training materials, and multimedia assets with collaborative editing, version
control, M.E.L. AI content generation assistance, and intelligent asset management.

Author: AMT Development Team
Created: 2025-09-25
"""

import asyncio
import logging
import json
import mimetypes
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union, Tuple, BinaryIO
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
import uuid
import re

# Content processing
from PIL import Image, ImageDraw, ImageFont
import cv2
import numpy as np
from moviepy.editor import VideoFileClip
import markdown
from jinja2 import Environment, Template
import PyPDF2
import docx

# Cloud storage
import boto3
from azure.storage.blob import BlobServiceClient
from google.cloud import storage as gcs

# Platform imports
from ..shared.orchestration_protocol import FormationType, TaskStatus, BotType
from ..orchestration.orchestration_service import OrchestrationService
from ..ml.triangle_defense_optimizer import TriangleDefenseOptimizer
from ..user_management.enterprise_user_management import EnterpriseUserManagement, UserRole
from ..security.security_manager import SecurityManager
from ..monitoring.metrics_collector import MetricsCollector
from ..integrations.mel_engine_integration import MELEngineIntegration
from ..integrations.triangle_defense_integration import TriangleDefenseIntegration
from ..search.advanced_search_system import AdvancedSearchSystem
from ..notifications.realtime_notification_system import RealTimeNotificationSystem


class ContentType(Enum):
    """Types of content in the AMT system."""
    PLAYBOOK = "playbook"
    FORMATION_DIAGRAM = "formation_diagram"
    VIDEO = "video"
    DOCUMENT = "document"
    IMAGE = "image"
    AUDIO = "audio"
    PRESENTATION = "presentation"
    DRILL = "drill"
    GAME_PLAN = "game_plan"
    SCOUTING_REPORT = "scouting_report"
    TRAINING_MATERIAL = "training_material"
    MEL_GENERATED = "mel_generated"


class ContentStatus(Enum):
    """Content lifecycle status."""
    DRAFT = "draft"
    REVIEW = "review"
    PUBLISHED = "published"
    ARCHIVED = "archived"
    PRIVATE = "private"
    SHARED = "shared"


class AssetType(Enum):
    """Digital asset types."""
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    DOCUMENT = "document"
    ARCHIVE = "archive"
    RAW_FILE = "raw_file"


class PermissionLevel(Enum):
    """Content permission levels."""
    VIEW = "view"
    COMMENT = "comment"
    EDIT = "edit"
    ADMIN = "admin"
    OWNER = "owner"


@dataclass
class ContentMetadata:
    """Comprehensive content metadata."""
    content_id: str
    title: str
    description: str
    content_type: ContentType
    status: ContentStatus
    created_by: str
    created_at: datetime
    updated_at: datetime
    version: str
    tags: List[str] = field(default_factory=list)
    formation_types: List[FormationType] = field(default_factory=list)
    coaching_level: str = "all"  # youth, high_school, college, professional, all
    file_path: Optional[str] = None
    file_size: int = 0
    mime_type: Optional[str] = None
    thumbnail_path: Optional[str] = None
    duration_seconds: Optional[int] = None
    view_count: int = 0
    download_count: int = 0
    like_count: int = 0
    is_featured: bool = False
    language: str = "en"
    accessibility_features: List[str] = field(default_factory=list)


@dataclass
class ContentVersion:
    """Content version tracking."""
    version_id: str
    content_id: str
    version_number: str
    created_by: str
    created_at: datetime
    change_summary: str
    file_path: str
    file_size: int
    is_current: bool = False


@dataclass
class ContentPermission:
    """Content access permissions."""
    permission_id: str
    content_id: str
    user_id: Optional[str] = None
    role: Optional[UserRole] = None
    permission_level: PermissionLevel = PermissionLevel.VIEW
    granted_by: str = ""
    granted_at: datetime = field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None


@dataclass
class PlaybookSection:
    """Playbook section structure."""
    section_id: str
    title: str
    content: str
    order: int
    formation_type: Optional[FormationType] = None
    diagrams: List[str] = field(default_factory=list)  # Asset IDs
    videos: List[str] = field(default_factory=list)  # Asset IDs
    notes: str = ""


@dataclass
class Playbook:
    """Complete playbook structure."""
    playbook_id: str
    metadata: ContentMetadata
    sections: List[PlaybookSection]
    formation_focus: List[FormationType] = field(default_factory=list)
    target_audience: str = "coaching_staff"
    difficulty_level: str = "intermediate"
    estimated_study_time_minutes: int = 60


@dataclass
class DigitalAsset:
    """Digital asset with processing information."""
    asset_id: str
    filename: str
    asset_type: AssetType
    file_path: str
    file_size: int
    mime_type: str
    uploaded_by: str
    uploaded_at: datetime
    metadata: Dict[str, Any] = field(default_factory=dict)
    processing_status: str = "completed"
    thumbnail_path: Optional[str] = None
    preview_path: Optional[str] = None
    checksums: Dict[str, str] = field(default_factory=dict)
    related_content: List[str] = field(default_factory=list)


class ContentManagementSystem:
    """
    Content Management and Digital Asset System for AMT Platform.
    
    Provides comprehensive content management including:
    - Triangle Defense playbook creation and management
    - Formation diagram generation and editing
    - Video and multimedia asset management
    - Collaborative content editing with version control
    - M.E.L. AI-assisted content generation
    - Content permissions and sharing
    - Digital asset processing and optimization
    - Content search and discovery integration
    - Automated content tagging and categorization
    - Content analytics and usage tracking
    - Multi-format content export and distribution
    - Template library for standardized content creation
    """

    def __init__(
        self,
        orchestration_service: OrchestrationService,
        ml_optimizer: TriangleDefenseOptimizer,
        user_management: EnterpriseUserManagement,
        mel_engine: MELEngineIntegration,
        triangle_defense: TriangleDefenseIntegration,
        search_system: AdvancedSearchSystem,
        notification_system: RealTimeNotificationSystem,
        security_manager: SecurityManager,
        metrics_collector: MetricsCollector
    ):
        self.orchestration = orchestration_service
        self.ml_optimizer = ml_optimizer
        self.user_management = user_management
        self.mel_engine = mel_engine
        self.triangle_defense = triangle_defense
        self.search_system = search_system
        self.notifications = notification_system
        self.security = security_manager
        self.metrics = metrics_collector
        
        self.logger = logging.getLogger(__name__)
        
        # Content storage
        self.content_metadata: Dict[str, ContentMetadata] = {}
        self.content_versions: Dict[str, List[ContentVersion]] = {}
        self.content_permissions: Dict[str, List[ContentPermission]] = {}
        self.playbooks: Dict[str, Playbook] = {}
        self.digital_assets: Dict[str, DigitalAsset] = {}
        
        # Content templates
        self.content_templates: Dict[str, Dict[str, Any]] = {}
        
        # Cloud storage clients
        self.storage_clients: Dict[str, Any] = {}
        
        # AMT-specific content configuration
        self.amt_config = {
            'formation_colors': {
                FormationType.LARRY: '#4ECDC4',
                FormationType.LINDA: '#FF6B6B',
                FormationType.RICKY: '#FFD93D',
                FormationType.RITA: '#9B59B6',
                FormationType.MALE_MID: '#3498DB',
                FormationType.FEMALE_MID: '#E74C3C'
            },
            'default_templates': {
                'basic_playbook': {
                    'sections': ['Overview', 'Formation Setup', 'Key Points', 'Coaching Tips', 'Common Mistakes'],
                    'formation_focus': [],
                    'target_audience': 'coaching_staff'
                },
                'formation_specific_playbook': {
                    'sections': ['Formation Introduction', 'Personnel Requirements', 'Alignment', 'Responsibilities', 'Variations', 'Game Situations'],
                    'formation_focus': [],
                    'target_audience': 'coaching_staff'
                },
                'scouting_report': {
                    'sections': ['Opponent Overview', 'Defensive Tendencies', 'Key Players', 'Recommended Formations', 'Game Plan'],
                    'formation_focus': [],
                    'target_audience': 'coaching_staff'
                }
            },
            'coaching_levels': ['youth', 'high_school', 'college', 'professional', 'all'],
            'supported_file_types': {
                'image': ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'],
                'video': ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'],
                'document': ['.pdf', '.doc', '.docx', '.txt', '.md'],
                'audio': ['.mp3', '.wav', '.aac', '.ogg'],
                'archive': ['.zip', '.rar', '.7z', '.tar.gz']
            },
            'max_file_sizes': {
                'image': 10 * 1024 * 1024,  # 10MB
                'video': 500 * 1024 * 1024,  # 500MB
                'document': 50 * 1024 * 1024,  # 50MB
                'audio': 100 * 1024 * 1024  # 100MB
            }
        }
        
        # System configuration
        self.config = {
            'storage_backend': 'local',  # local, s3, azure, gcp
            'content_base_path': './content',
            'assets_base_path': './assets',
            'thumbnails_base_path': './thumbnails',
            'auto_generate_thumbnails': True,
            'version_retention_days': 90,
            'content_indexing_enabled': True,
            'mel_content_assistance': True,
            'collaborative_editing': True
        }

    async def initialize(self) -> bool:
        """Initialize the content management system."""
        try:
            self.logger.info("Initializing Content Management System...")
            
            # Setup storage directories
            await self._setup_storage_directories()
            
            # Initialize cloud storage if configured
            await self._setup_cloud_storage()
            
            # Create default content templates
            await self._create_default_templates()
            
            # Setup content processing pipelines
            await self._setup_content_processing()
            
            # Initialize content indexing for search
            if self.config['content_indexing_enabled']:
                await self._initialize_content_indexing()
            
            self.logger.info("Content Management System initialized successfully")
            await self.metrics.record_event("content_management_initialized", {
                "templates_created": len(self.content_templates),
                "storage_backend": self.config['storage_backend']
            })
            
            return True
            
        except Exception as e:
            self.logger.error(f"Content Management System initialization failed: {str(e)}")
            return False

    async def create_playbook(
        self,
        title: str,
        description: str,
        formation_types: List[FormationType],
        created_by: str,
        template: Optional[str] = None,
        coaching_level: str = "all"
    ) -> str:
        """Create a new Triangle Defense playbook."""
        try:
            playbook_id = str(uuid.uuid4())
            
            # Create content metadata
            metadata = ContentMetadata(
                content_id=playbook_id,
                title=title,
                description=description,
                content_type=ContentType.PLAYBOOK,
                status=ContentStatus.DRAFT,
                created_by=created_by,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
                version="1.0.0",
                tags=["playbook", "triangle_defense"],
                formation_types=formation_types,
                coaching_level=coaching_level
            )
            
            # Create playbook structure from template
            template_config = self.content_templates.get(
                template or 'basic_playbook',
                self.amt_config['default_templates']['basic_playbook']
            )
            
            sections = []
            for i, section_title in enumerate(template_config['sections']):
                section = PlaybookSection(
                    section_id=str(uuid.uuid4()),
                    title=section_title,
                    content="",
                    order=i + 1,
                    formation_type=formation_types[0] if formation_types else None
                )
                sections.append(section)
            
            # Create playbook
            playbook = Playbook(
                playbook_id=playbook_id,
                metadata=metadata,
                sections=sections,
                formation_focus=formation_types,
                target_audience=template_config.get('target_audience', 'coaching_staff'),
                difficulty_level="intermediate"
            )
            
            # Store playbook and metadata
            self.playbooks[playbook_id] = playbook
            self.content_metadata[playbook_id] = metadata
            self.content_versions[playbook_id] = []
            
            # Set owner permissions
            await self._set_content_permissions(playbook_id, created_by, PermissionLevel.OWNER)
            
            # Index content for search
            if self.config['content_indexing_enabled']:
                await self._index_content_for_search(playbook_id, metadata)
            
            await self.metrics.record_event("playbook_created", {
                "playbook_id": playbook_id,
                "created_by": created_by,
                "formation_types": [f.value for f in formation_types],
                "sections_count": len(sections)
            })
            
            self.logger.info(f"Playbook created: {title} ({playbook_id})")
            return playbook_id
            
        except Exception as e:
            self.logger.error(f"Playbook creation failed: {str(e)}")
            raise

    async def update_playbook_section(
        self,
        playbook_id: str,
        section_id: str,
        content: Optional[str] = None,
        title: Optional[str] = None,
        updated_by: str = "",
        formation_type: Optional[FormationType] = None
    ) -> bool:
        """Update a specific section of a playbook."""
        try:
            playbook = self.playbooks.get(playbook_id)
            if not playbook:
                raise ValueError("Playbook not found")
            
            # Check permissions
            if not await self._check_content_permission(playbook_id, updated_by, PermissionLevel.EDIT):
                raise ValueError("Insufficient permissions to edit playbook")
            
            # Find and update section
            section = next((s for s in playbook.sections if s.section_id == section_id), None)
            if not section:
                raise ValueError("Section not found")
            
            # Update section content
            if content is not None:
                section.content = content
            if title is not None:
                section.title = title
            if formation_type is not None:
                section.formation_type = formation_type
            
            # Update playbook metadata
            playbook.metadata.updated_at = datetime.utcnow()
            
            # Create new version if significant changes
            if content and len(content) > 100:  # Significant content change
                await self._create_content_version(playbook_id, updated_by, "Section updated")
            
            # M.E.L. AI content assistance
            if self.config['mel_content_assistance'] and self.mel_engine:
                suggestions = await self._get_mel_content_suggestions(section, formation_type)
                if suggestions:
                    # Add suggestions as notes or separate field
                    section.notes = f"M.E.L. AI Suggestions: {suggestions}"
            
            # Update search index
            if self.config['content_indexing_enabled']:
                await self._update_content_in_search_index(playbook_id, playbook.metadata)
            
            # Send collaboration notification
            await self._send_collaboration_notification(playbook_id, updated_by, "section_updated")
            
            await self.metrics.record_event("playbook_section_updated", {
                "playbook_id": playbook_id,
                "section_id": section_id,
                "updated_by": updated_by,
                "content_length": len(content) if content else 0
            })
            
            return True
            
        except Exception as e:
            self.logger.error(f"Playbook section update failed: {str(e)}")
            return False

    async def upload_digital_asset(
        self,
        file_data: bytes,
        filename: str,
        uploaded_by: str,
        asset_type: Optional[AssetType] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """Upload and process a digital asset."""
        try:
            asset_id = str(uuid.uuid4())
            
            # Detect asset type if not provided
            if not asset_type:
                asset_type = self._detect_asset_type(filename)
            
            # Validate file size
            if not await self._validate_file_size(file_data, asset_type):
                raise ValueError("File size exceeds maximum allowed for this type")
            
            # Generate file paths
            file_extension = Path(filename).suffix.lower()
            stored_filename = f"{asset_id}{file_extension}"
            file_path = Path(self.config['assets_base_path']) / stored_filename
            
            # Save file to storage
            await self._save_file(file_data, file_path)
            
            # Process asset (thumbnails, previews, etc.)
            processing_results = await self._process_asset(asset_id, file_path, asset_type)
            
            # Create digital asset record
            digital_asset = DigitalAsset(
                asset_id=asset_id,
                filename=filename,
                asset_type=asset_type,
                file_path=str(file_path),
                file_size=len(file_data),
                mime_type=mimetypes.guess_type(filename)[0] or 'application/octet-stream',
                uploaded_by=uploaded_by,
                uploaded_at=datetime.utcnow(),
                metadata=metadata or {},
                processing_status="completed",
                thumbnail_path=processing_results.get('thumbnail_path'),
                preview_path=processing_results.get('preview_path'),
                checksums={
                    'md5': hashlib.md5(file_data).hexdigest(),
                    'sha256': hashlib.sha256(file_data).hexdigest()
                }
            )
            
            # Store asset
            self.digital_assets[asset_id] = digital_asset
            
            # Index asset for search
            if self.config['content_indexing_enabled']:
                await self._index_asset_for_search(asset_id, digital_asset)
            
            await self.metrics.record_event("digital_asset_uploaded", {
                "asset_id": asset_id,
                "asset_type": asset_type.value,
                "file_size": len(file_data),
                "uploaded_by": uploaded_by
            })
            
            self.logger.info(f"Digital asset uploaded: {filename} ({asset_id})")
            return asset_id
            
        except Exception as e:
            self.logger.error(f"Digital asset upload failed: {str(e)}")
            raise

    async def generate_formation_diagram(
        self,
        formation_type: FormationType,
        title: str,
        created_by: str,
        annotations: Optional[List[Dict[str, Any]]] = None,
        style: str = "standard"
    ) -> str:
        """Generate a Triangle Defense formation diagram."""
        try:
            diagram_id = str(uuid.uuid4())
            
            # Create formation diagram using PIL
            diagram_image = await self._create_formation_diagram(
                formation_type, title, annotations, style
            )
            
            # Save diagram as PNG
            filename = f"{formation_type.value}_diagram_{diagram_id}.png"
            file_path = Path(self.config['assets_base_path']) / filename
            diagram_image.save(file_path, format='PNG')
            
            # Create content metadata
            metadata = ContentMetadata(
                content_id=diagram_id,
                title=title,
                description=f"Formation diagram for {formation_type.value}",
                content_type=ContentType.FORMATION_DIAGRAM,
                status=ContentStatus.PUBLISHED,
                created_by=created_by,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
                version="1.0.0",
                tags=["formation", "diagram", formation_type.value.lower()],
                formation_types=[formation_type],
                file_path=str(file_path),
                file_size=file_path.stat().st_size,
                mime_type="image/png"
            )
            
            # Store metadata
            self.content_metadata[diagram_id] = metadata
            
            # Set permissions
            await self._set_content_permissions(diagram_id, created_by, PermissionLevel.OWNER)
            
            # Index for search
            if self.config['content_indexing_enabled']:
                await self._index_content_for_search(diagram_id, metadata)
            
            await self.metrics.record_event("formation_diagram_generated", {
                "diagram_id": diagram_id,
                "formation_type": formation_type.value,
                "created_by": created_by
            })
            
            self.logger.info(f"Formation diagram generated: {title} ({diagram_id})")
            return diagram_id
            
        except Exception as e:
            self.logger.error(f"Formation diagram generation failed: {str(e)}")
            raise

    async def get_mel_content_assistance(
        self,
        content_type: ContentType,
        context: Dict[str, Any],
        user_id: str
    ) -> Dict[str, Any]:
        """Get M.E.L. AI assistance for content creation."""
        try:
            if not self.mel_engine:
                return {"suggestions": [], "generated_content": ""}
            
            # Create context-specific prompt
            prompt = await self._create_mel_content_prompt(content_type, context)
            
            # Get M.E.L. AI assistance
            response = await self.mel_engine.process_command(
                command=prompt,
                user_id=user_id,
                context={
                    'content_type': content_type.value,
                    'formation_context': context.get('formation_type'),
                    'coaching_level': context.get('coaching_level', 'all')
                }
            )
            
            assistance = {
                'suggestions': [],
                'generated_content': '',
                'coaching_tips': [],
                'formation_insights': []
            }
            
            if hasattr(response, 'content'):
                assistance['generated_content'] = response.content
            
            if hasattr(response, 'suggestions'):
                assistance['suggestions'] = response.suggestions
            
            if hasattr(response, 'coaching_tips'):
                assistance['coaching_tips'] = response.coaching_tips
            
            return assistance
            
        except Exception as e:
            self.logger.error(f"M.E.L. content assistance failed: {str(e)}")
            return {"suggestions": [], "generated_content": ""}

    async def share_content(
        self,
        content_id: str,
        target_users: List[str],
        permission_level: PermissionLevel,
        shared_by: str,
        message: Optional[str] = None
    ) -> bool:
        """Share content with specific users."""
        try:
            # Check if user has permission to share
            if not await self._check_content_permission(content_id, shared_by, PermissionLevel.ADMIN):
                raise ValueError("Insufficient permissions to share content")
            
            # Get content metadata
            metadata = self.content_metadata.get(content_id)
            if not metadata:
                raise ValueError("Content not found")
            
            # Grant permissions to target users
            for user_id in target_users:
                await self._set_content_permissions(content_id, user_id, permission_level, shared_by)
            
            # Send sharing notifications
            if self.notifications:
                await self._send_content_sharing_notifications(
                    content_id, target_users, shared_by, message
                )
            
            await self.metrics.record_event("content_shared", {
                "content_id": content_id,
                "shared_by": shared_by,
                "target_users_count": len(target_users),
                "permission_level": permission_level.value
            })
            
            return True
            
        except Exception as e:
            self.logger.error(f"Content sharing failed: {str(e)}")
            return False

    # Private helper methods

    async def _create_formation_diagram(
        self,
        formation_type: FormationType,
        title: str,
        annotations: Optional[List[Dict[str, Any]]] = None,
        style: str = "standard"
    ) -> Image.Image:
        """Create a visual formation diagram."""
        try:
            # Create base image
            width, height = 800, 600
            image = Image.new('RGB', (width, height), color='white')
            draw = ImageDraw.Draw(image)
            
            # Draw field background
            field_color = '#228B22'  # Forest green
            draw.rectangle([50, 50, width-50, height-50], fill=field_color, outline='white', width=3)
            
            # Get formation color
            formation_color = self.amt_config['formation_colors'].get(formation_type, '#000000')
            
            # Draw formation-specific elements based on Triangle Defense methodology
            if formation_type == FormationType.LARRY:
                # LARRY formation - MO Left + Male
                positions = [
                    (150, 200, "METRO"),
                    (100, 250, "APEX"),
                    (200, 250, "MIKE"),
                    (150, 300, "MAC"),
                    (250, 350, "STAR"),
                    (350, 400, "SOLO")
                ]
            elif formation_type == FormationType.LINDA:
                # LINDA formation - MO Left + Female
                positions = [
                    (150, 200, "METRO"),
                    (100, 250, "APEX"),
                    (200, 250, "MIKE"),
                    (150, 300, "MAC"),
                    (300, 350, "STAR"),
                    (400, 400, "SOLO")
                ]
            elif formation_type == FormationType.RICKY:
                # RICKY formation - MO Right + Male
                positions = [
                    (650, 200, "METRO"),
                    (700, 250, "APEX"),
                    (600, 250, "MIKE"),
                    (650, 300, "MAC"),
                    (550, 350, "STAR"),
                    (450, 400, "SOLO")
                ]
            elif formation_type == FormationType.RITA:
                # RITA formation - MO Right + Female
                positions = [
                    (650, 200, "METRO"),
                    (700, 250, "APEX"),
                    (600, 250, "MIKE"),
                    (650, 300, "MAC"),
                    (500, 350, "STAR"),
                    (400, 400, "SOLO")
                ]
            elif formation_type == FormationType.MALE_MID:
                # MALE MID formation - MO Middle + Male
                positions = [
                    (400, 200, "METRO"),
                    (350, 250, "APEX"),
                    (450, 250, "MIKE"),
                    (400, 300, "MAC"),
                    (300, 350, "STAR"),
                    (500, 400, "SOLO")
                ]
            else:  # FEMALE_MID
                # FEMALE MID formation - MO Middle + Female
                positions = [
                    (400, 200, "METRO"),
                    (350, 250, "APEX"),
                    (450, 250, "MIKE"),
                    (400, 300, "MAC"),
                    (250, 350, "STAR"),
                    (550, 400, "SOLO")
                ]
            
            # Draw positions
            try:
                font = ImageFont.truetype("arial.ttf", 20)
            except OSError:
                font = ImageFont.load_default()
            
            for x, y, position_name in positions:
                # Draw circle for position
                circle_radius = 25
                draw.ellipse(
                    [x-circle_radius, y-circle_radius, x+circle_radius, y+circle_radius],
                    fill=formation_color,
                    outline='white',
                    width=2
                )
                
                # Draw position label
                text_bbox = draw.textbbox((0, 0), position_name, font=font)
                text_width = text_bbox[2] - text_bbox[0]
                text_height = text_bbox[3] - text_bbox[1]
                draw.text(
                    (x - text_width//2, y - text_height//2),
                    position_name,
                    fill='white',
                    font=font
                )
            
            # Draw title
            title_font = ImageFont.load_default()
            try:
                title_font = ImageFont.truetype("arial.ttf", 24)
            except OSError:
                pass
            
            title_bbox = draw.textbbox((0, 0), title, font=title_font)
            title_width = title_bbox[2] - title_bbox[0]
            draw.text(
                (width//2 - title_width//2, 10),
                title,
                fill='black',
                font=title_font
            )
            
            # Add annotations if provided
            if annotations:
                for annotation in annotations:
                    if 'text' in annotation and 'x' in annotation and 'y' in annotation:
                        draw.text(
                            (annotation['x'], annotation['y']),
                            annotation['text'],
                            fill=annotation.get('color', 'black'),
                            font=font
                        )
            
            return image
            
        except Exception as e:
            self.logger.error(f"Formation diagram creation failed: {str(e)}")
            # Return a basic error image
            error_image = Image.new('RGB', (400, 300), color='white')
            error_draw = ImageDraw.Draw(error_image)
            error_draw.text((50, 150), "Error generating diagram", fill='red')
            return error_image

    async def _process_asset(
        self,
        asset_id: str,
        file_path: Path,
        asset_type: AssetType
    ) -> Dict[str, Any]:
        """Process uploaded asset (generate thumbnails, previews, etc.)."""
        try:
            processing_results = {}
            
            if asset_type == AssetType.IMAGE and self.config['auto_generate_thumbnails']:
                # Generate image thumbnail
                thumbnail_path = await self._generate_image_thumbnail(file_path, asset_id)
                processing_results['thumbnail_path'] = str(thumbnail_path) if thumbnail_path else None
                
            elif asset_type == AssetType.VIDEO:
                # Generate video thumbnail and preview
                thumbnail_path = await self._generate_video_thumbnail(file_path, asset_id)
                processing_results['thumbnail_path'] = str(thumbnail_path) if thumbnail_path else None
                
                # Extract video metadata
                try:
                    with VideoFileClip(str(file_path)) as clip:
                        processing_results['duration'] = clip.duration
                        processing_results['fps'] = clip.fps
                        processing_results['resolution'] = (clip.w, clip.h)
                except Exception as e:
                    self.logger.warning(f"Video metadata extraction failed: {str(e)}")
            
            return processing_results
            
        except Exception as e:
            self.logger.error(f"Asset processing failed: {str(e)}")
            return {}

    async def _generate_image_thumbnail(self, image_path: Path, asset_id: str) -> Optional[Path]:
        """Generate thumbnail for image asset."""
        try:
            with Image.open(image_path) as img:
                # Create thumbnail
                thumbnail_size = (200, 200)
                img.thumbnail(thumbnail_size, Image.Resampling.LANCZOS)
                
                # Save thumbnail
                thumbnail_filename = f"thumb_{asset_id}.jpg"
                thumbnail_path = Path(self.config['thumbnails_base_path']) / thumbnail_filename
                img.save(thumbnail_path, format='JPEG', quality=80)
                
                return thumbnail_path
                
        except Exception as e:
            self.logger.error(f"Image thumbnail generation failed: {str(e)}")
            return None

    async def _set_content_permissions(
        self,
        content_id: str,
        user_id: str,
        permission_level: PermissionLevel,
        granted_by: str = ""
    ) -> None:
        """Set content permissions for a user."""
        try:
            permission = ContentPermission(
                permission_id=str(uuid.uuid4()),
                content_id=content_id,
                user_id=user_id,
                permission_level=permission_level,
                granted_by=granted_by
            )
            
            if content_id not in self.content_permissions:
                self.content_permissions[content_id] = []
            
            self.content_permissions[content_id].append(permission)
            
        except Exception as e:
            self.logger.error(f"Setting content permissions failed: {str(e)}")

    async def _check_content_permission(
        self,
        content_id: str,
        user_id: str,
        required_level: PermissionLevel
    ) -> bool:
        """Check if user has required permission level for content."""
        try:
            permissions = self.content_permissions.get(content_id, [])
            
            # Check user-specific permissions
            user_permissions = [p for p in permissions if p.user_id == user_id]
            
            permission_hierarchy = {
                PermissionLevel.VIEW: 1,
                PermissionLevel.COMMENT: 2,
                PermissionLevel.EDIT: 3,
                PermissionLevel.ADMIN: 4,
                PermissionLevel.OWNER: 5
            }
            
            required_level_value = permission_hierarchy.get(required_level, 0)
            
            for permission in user_permissions:
                user_level_value = permission_hierarchy.get(permission.permission_level, 0)
                if user_level_value >= required_level_value:
                    return True
            
            # Check role-based permissions
            user = self.user_management.users.get(user_id)
            if user and user.role in [UserRole.FOUNDER_AUTHORITY, UserRole.EXECUTIVE_COMMAND]:
                return True  # Admin override
            
            return False
            
        except Exception as e:
            self.logger.error(f"Content permission check failed: {str(e)}")
            return False

    async def get_content_library(
        self,
        user_id: str,
        content_type: Optional[ContentType] = None,
        formation_type: Optional[FormationType] = None,
        status: Optional[ContentStatus] = None,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Get user's accessible content library."""
        try:
            accessible_content = []
            
            for content_id, metadata in self.content_metadata.items():
                # Check access permissions
                if not await self._check_content_permission(content_id, user_id, PermissionLevel.VIEW):
                    continue
                
                # Apply filters
                if content_type and metadata.content_type != content_type:
                    continue
                
                if formation_type and formation_type not in metadata.formation_types:
                    continue
                
                if status and metadata.status != status:
                    continue
                
                # Add to results
                content_info = {
                    'content_id': content_id,
                    'title': metadata.title,
                    'description': metadata.description,
                    'content_type': metadata.content_type.value,
                    'status': metadata.status.value,
                    'created_at': metadata.created_at.isoformat(),
                    'updated_at': metadata.updated_at.isoformat(),
                    'tags': metadata.tags,
                    'formation_types': [f.value for f in metadata.formation_types],
                    'view_count': metadata.view_count,
                    'is_featured': metadata.is_featured
                }
                
                accessible_content.append(content_info)
            
            # Sort by most recent
            accessible_content.sort(key=lambda x: x['updated_at'], reverse=True)
            
            # Apply pagination
            paginated_content = accessible_content[offset:offset + limit]
            
            return {
                'content': paginated_content,
                'total_count': len(accessible_content),
                'limit': limit,
                'offset': offset,
                'has_more': offset + limit < len(accessible_content)
            }
            
        except Exception as e:
            self.logger.error(f"Content library retrieval failed: {str(e)}")
            return {'content': [], 'total_count': 0}

    async def get_content_status(self) -> Dict[str, Any]:
        """Get current content management system status."""
        return {
            "system_initialized": bool(self.content_templates),
            "total_content_items": len(self.content_metadata),
            "total_digital_assets": len(self.digital_assets),
            "playbooks_count": len(self.playbooks),
            "content_by_type": {
                content_type.value: len([
                    c for c in self.content_metadata.values() 
                    if c.content_type == content_type
                ])
                for content_type in ContentType
            },
            "content_by_status": {
                status.value: len([
                    c for c in self.content_metadata.values() 
                    if c.status == status
                ])
                for status in ContentStatus
            },
            "storage_backend": self.config['storage_backend'],
            "content_templates": len(self.content_templates),
            "mel_content_assistance_enabled": self.config['mel_content_assistance'],
            "collaborative_editing_enabled": self.config['collaborative_editing']
        }


# Export main class
__all__ = [
    'ContentManagementSystem',
    'ContentMetadata',
    'Playbook',
    'PlaybookSection', 
    'DigitalAsset',
    'ContentVersion',
    'ContentPermission',
    'ContentType',
    'ContentStatus',
    'AssetType',
    'PermissionLevel'
]
