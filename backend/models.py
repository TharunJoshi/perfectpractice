"""
Extended Pydantic Models for PerfectPractice - All Advanced Features
"""
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime


# ============================================
# ANALYTICS & PROGRESS MODELS
# ============================================

class UserStats(BaseModel):
    user_id: str
    total_sessions: int
    total_practice_time: int  # minutes
    current_streak: int  # days
    longest_streak: int
    total_calories: float
    sessions_by_focus: dict  # {batting: 10, bowling: 5, fielding: 3}
    weaknesses: List[str]  # identified from AI feedback
    improvement_areas: List[str]
    last_practice: Optional[datetime] = None


class ProgressDataPoint(BaseModel):
    date: str
    sessions_count: int
    total_minutes: int
    calories_burned: float
    skill_score: Optional[float] = None  # 0-100


class WeaknessHeatmap(BaseModel):
    weakness: str
    count: int
    last_seen: datetime
    improvement_rate: float  # percentage


# ============================================
# TEMPLATES & CUSTOM DRILLS
# ============================================

class DrillStep(BaseModel):
    name: str
    duration: int
    description: str
    videos: List[dict] = []


class SessionTemplate(BaseModel):
    name: str
    description: str
    focus_area: str
    skill_level: str
    duration: int
    warmup_steps: List[DrillStep]
    practice_steps: List[DrillStep]
    cooldown_steps: List[DrillStep]
    is_public: bool = False
    created_by: str
    created_at: datetime
    used_count: int = 0


class SessionTemplateCreate(BaseModel):
    name: str
    description: str
    focus_area: str
    skill_level: str
    duration: int
    warmup_steps: List[dict]
    practice_steps: List[dict]
    cooldown_steps: List[dict]
    is_public: bool = False


class SessionTemplateResponse(BaseModel):
    id: str
    name: str
    description: str
    focus_area: str
    skill_level: str
    duration: int
    warmup_steps: List[dict]
    practice_steps: List[dict]
    cooldown_steps: List[dict]
    is_public: bool
    created_by: str
    created_at: datetime
    used_count: int


# ============================================
# GOALS & ACHIEVEMENTS
# ============================================

class Goal(BaseModel):
    title: str
    description: str
    target_value: float
    current_value: float
    unit: str  # sessions, minutes, streaks, etc.
    deadline: Optional[datetime] = None
    is_completed: bool = False


class GoalCreate(BaseModel):
    title: str
    description: str
    target_value: float
    unit: str
    deadline: Optional[datetime] = None


class GoalResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: str
    target_value: float
    current_value: float
    unit: str
    deadline: Optional[datetime] = None
    is_completed: bool
    progress_percentage: float
    created_at: datetime


class Achievement(BaseModel):
    name: str
    description: str
    icon: str
    criteria: dict  # {type: "streak", value: 7}
    unlocked: bool = False
    unlocked_at: Optional[datetime] = None


class AchievementResponse(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    unlocked: bool
    unlocked_at: Optional[datetime] = None


# ============================================
# TEAM & SOCIAL MODELS
# ============================================

class Team(BaseModel):
    name: str
    description: str
    sport: str
    created_by: str  # coach/captain
    members: List[str]  # user IDs
    coaches: List[str]  # user IDs
    created_at: datetime
    is_public: bool = False


class TeamCreate(BaseModel):
    name: str
    description: str
    sport: str = "cricket"
    is_public: bool = False


class TeamResponse(BaseModel):
    id: str
    name: str
    description: str
    sport: str
    created_by: str
    members: List[str]
    coaches: List[str]
    member_count: int
    created_at: datetime
    is_public: bool


class CoachPlayerRelation(BaseModel):
    coach_id: str
    player_id: str
    sport: str
    status: str  # pending, active, inactive
    created_at: datetime
    notes: Optional[str] = None


class CoachPlayerCreate(BaseModel):
    player_email: str
    sport: str = "cricket"
    notes: Optional[str] = None


class LeaderboardEntry(BaseModel):
    user_id: str
    user_name: str
    total_sessions: int
    total_time: int
    current_streak: int
    rank: int


class SessionComment(BaseModel):
    session_id: str
    user_id: str
    user_name: str
    comment: str
    created_at: datetime


class SessionCommentCreate(BaseModel):
    comment: str


class SessionCommentResponse(BaseModel):
    id: str
    session_id: str
    user_id: str
    user_name: str
    comment: str
    created_at: datetime


# ============================================
# VIDEO ENHANCEMENT MODELS
# ============================================

class VideoComparison(BaseModel):
    user_video_id: str
    pro_video_url: str
    comparison_notes: str
    created_at: datetime


class VideoComparisonCreate(BaseModel):
    media_id: str
    pro_video_url: str
    comparison_notes: Optional[str] = None


class VideoComparisonResponse(BaseModel):
    id: str
    user_video_id: str
    pro_video_url: str
    comparison_notes: str
    ai_analysis: Optional[dict] = None
    created_at: datetime


class VideoAnnotation(BaseModel):
    media_id: str
    user_id: str
    timestamp: float  # seconds
    annotation_type: str  # arrow, circle, text
    data: dict  # position, text, etc.
    created_at: datetime


class VideoAnnotationCreate(BaseModel):
    media_id: str
    timestamp: float
    annotation_type: str
    data: dict


# ============================================
# NOTIFICATIONS
# ============================================

class Notification(BaseModel):
    user_id: str
    title: str
    message: str
    type: str  # reminder, achievement, team_invite, etc.
    is_read: bool = False
    created_at: datetime
    action_url: Optional[str] = None


class NotificationCreate(BaseModel):
    title: str
    message: str
    type: str
    action_url: Optional[str] = None


class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime
    action_url: Optional[str] = None


# ============================================
# USER PREFERENCES
# ============================================

class UserPreferences(BaseModel):
    user_id: str
    theme: str = "dark"  # dark, light
    notifications_enabled: bool = True
    reminder_time: Optional[str] = None  # "18:00"
    reminder_days: List[str] = []  # ["monday", "wednesday", "friday"]
    preferred_focus_areas: List[str] = []
    offline_mode: bool = True
