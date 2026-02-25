"""
Advanced Features API Routes for PerfectPractice
Includes: Analytics, Templates, Goals, Teams, Achievements, etc.
"""
from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime, timedelta
from typing import List
import os
from collections import defaultdict

# Import models from models.py
from models import *

# Import existing helper functions (we'll need get_current_user)
advanced_router = APIRouter(prefix="/api")


# ============================================
# ANALYTICS & PROGRESS ENDPOINTS
# ============================================

async def calculate_user_stats(db, user_id: str):
    """Calculate comprehensive user statistics"""
    # Get all user sessions
    sessions = await db.sessions.find({"participants": user_id}).to_list(1000)
    
    total_sessions = len(sessions)
    completed_sessions = [s for s in sessions if s["status"] == "completed"]
    
    total_time = sum(s["duration"] for s in completed_sessions)
    
    # Get all activities
    activities = await db.activities.find({"user_id": user_id}).to_list(1000)
    total_calories = sum(a["calories"] for a in activities)
    
    # Calculate streaks
    session_dates = sorted([s["created_at"].date() for s in completed_sessions])
    current_streak = 0
    longest_streak = 0
    temp_streak = 0
    
    for i, date in enumerate(session_dates):
        if i == 0 or (date - session_dates[i-1]).days == 1:
            temp_streak += 1
            longest_streak = max(longest_streak, temp_streak)
        else:
            temp_streak = 1
    
    # Current streak only if last session was recent
    if session_dates and (datetime.utcnow().date() - session_dates[-1]).days <= 1:
        current_streak = temp_streak
    
    # Sessions by focus area
    sessions_by_focus = defaultdict(int)
    for s in sessions:
        sessions_by_focus[s["focus_area"]] += 1
    
    # Extract weaknesses from media AI feedback
    weaknesses = []
    media_list = await db.media.find({"user_id": user_id}).to_list(100)
    for media in media_list:
        if media.get("ai_feedback") and media["ai_feedback"].get("needs_improvement"):
            weaknesses.extend(media["ai_feedback"]["needs_improvement"])
    
    # Get unique weaknesses with counts
    weakness_counts = {}
    for w in weaknesses:
        weakness_counts[w] = weakness_counts.get(w, 0) + 1
    
    top_weaknesses = sorted(weakness_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    
    return {
        "user_id": user_id,
        "total_sessions": total_sessions,
        "total_practice_time": total_time,
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "total_calories": total_calories,
        "sessions_by_focus": dict(sessions_by_focus),
        "weaknesses": [w[0] for w in top_weaknesses],
        "improvement_areas": [w[0] for w in top_weaknesses[:3]],
        "last_practice": sessions[-1]["created_at"] if sessions else None
    }


@advanced_router.get("/analytics/stats")
async def get_user_stats(db: AsyncIOMotorDatabase = Depends(lambda: db), current_user: dict = Depends(get_current_user)):
    """Get comprehensive user statistics"""
    stats = await calculate_user_stats(db, str(current_user["_id"]))
    return stats


@advanced_router.get("/analytics/progress")
async def get_progress_data(
    days: int = 30,
    db: AsyncIOMotorDatabase = Depends(lambda: db),
    current_user: dict = Depends(get_current_user)
):
    """Get progress data for charts (last N days)"""
    user_id = str(current_user["_id"])
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Get sessions in date range
    sessions = await db.sessions.find({
        "participants": user_id,
        "created_at": {"$gte": start_date, "$lte": end_date}
    }).to_list(1000)
    
    # Group by date
    daily_data = {}
    for session in sessions:
        date_key = session["created_at"].strftime("%Y-%m-%d")
        if date_key not in daily_data:
            daily_data[date_key] = {
                "date": date_key,
                "sessions_count": 0,
                "total_minutes": 0,
                "calories_burned": 0.0
            }
        daily_data[date_key]["sessions_count"] += 1
        if session["status"] == "completed":
            daily_data[date_key]["total_minutes"] += session["duration"]
    
    # Get activities for calorie data
    activities = await db.activities.find({
        "user_id": user_id,
        "logged_at": {"$gte": start_date, "$lte": end_date}
    }).to_list(1000)
    
    for activity in activities:
        date_key = activity["logged_at"].strftime("%Y-%m-%d")
        if date_key in daily_data:
            daily_data[date_key]["calories_burned"] += activity["calories"]
    
    return sorted(daily_data.values(), key=lambda x: x["date"])


@advanced_router.get("/analytics/weakness-heatmap")
async def get_weakness_heatmap(
    db: AsyncIOMotorDatabase = Depends(lambda: db),
    current_user: dict = Depends(get_current_user)
):
    """Get weakness heatmap data"""
    user_id = str(current_user["_id"])
    
    # Get all media with AI feedback
    media_list = await db.media.find({"user_id": user_id}).sort("uploaded_at", -1).to_list(100)
    
    weakness_data = {}
    for media in media_list:
        if media.get("ai_feedback") and media["ai_feedback"].get("needs_improvement"):
            for weakness in media["ai_feedback"]["needs_improvement"]:
                if weakness not in weakness_data:
                    weakness_data[weakness] = {
                        "weakness": weakness,
                        "count": 0,
                        "last_seen": media["uploaded_at"],
                        "first_seen": media["uploaded_at"]
                    }
                weakness_data[weakness]["count"] += 1
                weakness_data[weakness]["first_seen"] = media["uploaded_at"]
    
    # Calculate improvement rate (fewer occurrences over time = improvement)
    result = []
    for w_data in weakness_data.values():
        days_span = max(1, (w_data["last_seen"] - w_data["first_seen"]).days)
        improvement_rate = max(0, 100 - (w_data["count"] / days_span * 10))
        result.append({
            **w_data,
            "improvement_rate": round(improvement_rate, 1)
        })
    
    return sorted(result, key=lambda x: x["count"], reverse=True)


# ============================================
# SESSION TEMPLATES
# ============================================

@advanced_router.post("/templates")
async def create_template(
    template_data: SessionTemplateCreate,
    db: AsyncIOMotorDatabase = Depends(lambda: db),
    current_user: dict = Depends(get_current_user)
):
    """Create a session template"""
    template_doc = {
        **template_data.dict(),
        "created_by": str(current_user["_id"]),
        "created_at": datetime.utcnow(),
        "used_count": 0
    }
    
    result = await db.templates.insert_one(template_doc)
    template_doc["_id"] = result.inserted_id
    
    return SessionTemplateResponse(
        id=str(template_doc["_id"]),
        **template_data.dict(),
        created_by=str(current_user["_id"]),
        created_at=template_doc["created_at"],
        used_count=0
    )


@advanced_router.get("/templates")
async def get_templates(
    focus_area: str = None,
    skill_level: str = None,
    db: AsyncIOMotorDatabase = Depends(lambda: db),
    current_user: dict = Depends(get_current_user)
):
    """Get session templates (user's + public)"""
    user_id = str(current_user["_id"])
    
    query = {
        "$or": [
            {"created_by": user_id},
            {"is_public": True}
        ]
    }
    
    if focus_area:
        query["focus_area"] = focus_area
    if skill_level:
        query["skill_level"] = skill_level
    
    templates = await db.templates.find(query).sort("used_count", -1).to_list(100)
    
    return [
        SessionTemplateResponse(
            id=str(t["_id"]),
            name=t["name"],
            description=t["description"],
            focus_area=t["focus_area"],
            skill_level=t["skill_level"],
            duration=t["duration"],
            warmup_steps=t["warmup_steps"],
            practice_steps=t["practice_steps"],
            cooldown_steps=t["cooldown_steps"],
            is_public=t["is_public"],
            created_by=t["created_by"],
            created_at=t["created_at"],
            used_count=t.get("used_count", 0)
        )
        for t in templates
    ]


@advanced_router.post("/templates/{template_id}/use")
async def use_template(
    template_id: str,
    db: AsyncIOMotorDatabase = Depends(lambda: db),
    current_user: dict = Depends(get_current_user)
):
    """Increment template usage count"""
    await db.templates.update_one(
        {"_id": ObjectId(template_id)},
        {"$inc": {"used_count": 1}}
    )
    return {"message": "Template usage recorded"}


# ============================================
# GOALS & MILESTONES
# ============================================

@advanced_router.post("/goals")
async def create_goal(
    goal_data: GoalCreate,
    db: AsyncIOMotorDatabase = Depends(lambda: db),
    current_user: dict = Depends(get_current_user)
):
    """Create a personal goal"""
    goal_doc = {
        "user_id": str(current_user["_id"]),
        **goal_data.dict(),
        "current_value": 0.0,
        "is_completed": False,
        "created_at": datetime.utcnow()
    }
    
    result = await db.goals.insert_one(goal_doc)
    
    return GoalResponse(
        id=str(result.inserted_id),
        user_id=goal_doc["user_id"],
        title=goal_data.title,
        description=goal_data.description,
        target_value=goal_data.target_value,
        current_value=0.0,
        unit=goal_data.unit,
        deadline=goal_data.deadline,
        is_completed=False,
        progress_percentage=0.0,
        created_at=goal_doc["created_at"]
    )


@advanced_router.get("/goals")
async def get_goals(
    db: AsyncIOMotorDatabase = Depends(lambda: db),
    current_user: dict = Depends(get_current_user)
):
    """Get user's goals"""
    user_id = str(current_user["_id"])
    goals = await db.goals.find({"user_id": user_id}).sort("created_at", -1).to_list(100)
    
    return [
        GoalResponse(
            id=str(g["_id"]),
            user_id=g["user_id"],
            title=g["title"],
            description=g["description"],
            target_value=g["target_value"],
            current_value=g["current_value"],
            unit=g["unit"],
            deadline=g.get("deadline"),
            is_completed=g["is_completed"],
            progress_percentage=round((g["current_value"] / g["target_value"]) * 100, 1),
            created_at=g["created_at"]
        )
        for g in goals
    ]


@advanced_router.put("/goals/{goal_id}/progress")
async def update_goal_progress(
    goal_id: str,
    value: float,
    db: AsyncIOMotorDatabase = Depends(lambda: db),
    current_user: dict = Depends(get_current_user)
):
    """Update goal progress"""
    goal = await db.goals.find_one({"_id": ObjectId(goal_id), "user_id": str(current_user["_id"])})
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    new_value = goal["current_value"] + value
    is_completed = new_value >= goal["target_value"]
    
    await db.goals.update_one(
        {"_id": ObjectId(goal_id)},
        {"$set": {"current_value": new_value, "is_completed": is_completed}}
    )
    
    return {"message": "Goal progress updated", "new_value": new_value, "is_completed": is_completed}


# ============================================
# ACHIEVEMENTS
# ============================================

ACHIEVEMENTS = [
    {"name": "First Practice", "description": "Complete your first session", "icon": "🎯", "criteria": {"type": "sessions", "value": 1}},
    {"name": "Week Warrior", "description": "7-day practice streak", "icon": "🔥", "criteria": {"type": "streak", "value": 7}},
    {"name": "Dedicated", "description": "30 total sessions", "icon": "💪", "criteria": {"type": "sessions", "value": 30}},
    {"name": "Century", "description": "100 total sessions", "icon": "💯", "criteria": {"type": "sessions", "value": 100}},
    {"name": "Marathon", "description": "1000 minutes practiced", "icon": "⏱️", "criteria": {"type": "minutes", "value": 1000}},
    {"name": "Calorie Crusher", "description": "Burn 5000 calories", "icon": "🔥", "criteria": {"type": "calories", "value": 5000}},
    {"name": "Upload Master", "description": "Upload 50 practice shots", "icon": "📹", "criteria": {"type": "uploads", "value": 50}},
]


@advanced_router.get("/achievements")
async def get_achievements(
    db: AsyncIOMotorDatabase = Depends(lambda: db),
    current_user: dict = Depends(get_current_user)
):
    """Get user achievements"""
    user_id = str(current_user["_id"])
    stats = await calculate_user_stats(db, user_id)
    
    # Get media count
    media_count = await db.media.count_documents({"user_id": user_id})
    
    user_achievements = await db.user_achievements.find({"user_id": user_id}).to_list(100)
    unlocked_names = {a["achievement_name"] for a in user_achievements}
    
    result = []
    for achievement in ACHIEVEMENTS:
        unlocked = False
        unlocked_at = None
        
        # Check if criteria met
        if achievement["criteria"]["type"] == "sessions" and stats["total_sessions"] >= achievement["criteria"]["value"]:
            unlocked = True
        elif achievement["criteria"]["type"] == "streak" and stats["current_streak"] >= achievement["criteria"]["value"]:
            unlocked = True
        elif achievement["criteria"]["type"] == "minutes" and stats["total_practice_time"] >= achievement["criteria"]["value"]:
            unlocked = True
        elif achievement["criteria"]["type"] == "calories" and stats["total_calories"] >= achievement["criteria"]["value"]:
            unlocked = True
        elif achievement["criteria"]["type"] == "uploads" and media_count >= achievement["criteria"]["value"]:
            unlocked = True
        
        # If unlocked and not in DB, add it
        if unlocked and achievement["name"] not in unlocked_names:
            achievement_doc = {
                "user_id": user_id,
                "achievement_name": achievement["name"],
                "unlocked_at": datetime.utcnow()
            }
            await db.user_achievements.insert_one(achievement_doc)
            unlocked_at = achievement_doc["unlocked_at"]
        elif achievement["name"] in unlocked_names:
            user_ach = next(a for a in user_achievements if a["achievement_name"] == achievement["name"])
            unlocked_at = user_ach["unlocked_at"]
        
        result.append({
            "name": achievement["name"],
            "description": achievement["description"],
            "icon": achievement["icon"],
            "unlocked": unlocked,
            "unlocked_at": unlocked_at
        })
    
    return result


# ============================================
# TEAMS
# ============================================

@advanced_router.post("/teams")
async def create_team(
    team_data: TeamCreate,
    db: AsyncIOMotorDatabase = Depends(lambda: db),
    current_user: dict = Depends(get_current_user)
):
    """Create a team"""
    team_doc = {
        "name": team_data.name,
        "description": team_data.description,
        "sport": team_data.sport,
        "created_by": str(current_user["_id"]),
        "members": [str(current_user["_id"])],
        "coaches": [],
        "created_at": datetime.utcnow(),
        "is_public": team_data.is_public
    }
    
    result = await db.teams.insert_one(team_doc)
    
    return TeamResponse(
        id=str(result.inserted_id),
        name=team_doc["name"],
        description=team_doc["description"],
        sport=team_doc["sport"],
        created_by=team_doc["created_by"],
        members=team_doc["members"],
        coaches=team_doc["coaches"],
        member_count=1,
        created_at=team_doc["created_at"],
        is_public=team_doc["is_public"]
    )


@advanced_router.get("/teams")
async def get_teams(
    db: AsyncIOMotorDatabase = Depends(lambda: db),
    current_user: dict = Depends(get_current_user)
):
    """Get user's teams"""
    user_id = str(current_user["_id"])
    teams = await db.teams.find({
        "$or": [
            {"members": user_id},
            {"coaches": user_id}
        ]
    }).to_list(100)
    
    return [
        TeamResponse(
            id=str(t["_id"]),
            name=t["name"],
            description=t["description"],
            sport=t["sport"],
            created_by=t["created_by"],
            members=t["members"],
            coaches=t["coaches"],
            member_count=len(t["members"]),
            created_at=t["created_at"],
            is_public=t["is_public"]
        )
        for t in teams
    ]


@advanced_router.post("/teams/{team_id}/join")
async def join_team(
    team_id: str,
    db: AsyncIOMotorDatabase = Depends(lambda: db),
    current_user: dict = Depends(get_current_user)
):
    """Join a team"""
    user_id = str(current_user["_id"])
    
    team = await db.teams.find_one({"_id": ObjectId(team_id)})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    if user_id in team["members"]:
        raise HTTPException(status_code=400, detail="Already a member")
    
    await db.teams.update_one(
        {"_id": ObjectId(team_id)},
        {"$push": {"members": user_id}}
    )
    
    return {"message": "Joined team successfully"}


# ============================================
# LEADERBOARD
# ============================================

@advanced_router.get("/leaderboard")
async def get_leaderboard(
    scope: str = "global",  # global or team_id
    db: AsyncIOMotorDatabase = Depends(lambda: db),
    current_user: dict = Depends(get_current_user)
):
    """Get leaderboard"""
    
    # Get all users if global or team members if team scope
    if scope == "global":
        users = await db.users.find({}).to_list(1000)
    else:
        # Team leaderboard
        team = await db.teams.find_one({"_id": ObjectId(scope)})
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        user_ids = [ObjectId(uid) for uid in team["members"]]
        users = await db.users.find({"_id": {"$in": user_ids}}).to_list(1000)
    
    leaderboard = []
    for user in users:
        stats = await calculate_user_stats(db, str(user["_id"]))
        leaderboard.append({
            "user_id": str(user["_id"]),
            "user_name": user["name"],
            "total_sessions": stats["total_sessions"],
            "total_time": stats["total_practice_time"],
            "current_streak": stats["current_streak"]
        })
    
    # Sort by total sessions
    leaderboard.sort(key=lambda x: (x["total_sessions"], x["total_time"]), reverse=True)
    
    # Add ranks
    for i, entry in enumerate(leaderboard):
        entry["rank"] = i + 1
    
    return leaderboard[:50]  # Top 50


# ============================================
# SESSION COMMENTS
# ============================================

@advanced_router.post("/sessions/{session_id}/comments")
async def add_comment(
    session_id: str,
    comment_data: SessionCommentCreate,
    db: AsyncIOMotorDatabase = Depends(lambda: db),
    current_user: dict = Depends(get_current_user)
):
    """Add comment to session"""
    comment_doc = {
        "session_id": session_id,
        "user_id": str(current_user["_id"]),
        "user_name": current_user["name"],
        "comment": comment_data.comment,
        "created_at": datetime.utcnow()
    }
    
    result = await db.session_comments.insert_one(comment_doc)
    
    return SessionCommentResponse(
        id=str(result.inserted_id),
        session_id=session_id,
        user_id=comment_doc["user_id"],
        user_name=comment_doc["user_name"],
        comment=comment_doc["comment"],
        created_at=comment_doc["created_at"]
    )


@advanced_router.get("/sessions/{session_id}/comments")
async def get_comments(
    session_id: str,
    db: AsyncIOMotorDatabase = Depends(lambda: db),
    current_user: dict = Depends(get_current_user)
):
    """Get session comments"""
    comments = await db.session_comments.find({"session_id": session_id}).sort("created_at", -1).to_list(100)
    
    return [
        SessionCommentResponse(
            id=str(c["_id"]),
            session_id=c["session_id"],
            user_id=c["user_id"],
            user_name=c["user_name"],
            comment=c["comment"],
            created_at=c["created_at"]
        )
        for c in comments
    ]


# ============================================
# VIDEO COMPARISONS
# ============================================

@advanced_router.post("/video-comparisons")
async def create_video_comparison(
    comparison_data: VideoComparisonCreate,
    db: AsyncIOMotorDatabase = Depends(lambda: db),
    current_user: dict = Depends(get_current_user)
):
    """Create side-by-side video comparison"""
    comparison_doc = {
        "user_video_id": comparison_data.media_id,
        "user_id": str(current_user["_id"]),
        "pro_video_url": comparison_data.pro_video_url,
        "comparison_notes": comparison_data.comparison_notes or "",
        "created_at": datetime.utcnow()
    }
    
    result = await db.video_comparisons.insert_one(comparison_doc)
    
    return VideoComparisonResponse(
        id=str(result.inserted_id),
        user_video_id=comparison_doc["user_video_id"],
        pro_video_url=comparison_doc["pro_video_url"],
        comparison_notes=comparison_doc["comparison_notes"],
        created_at=comparison_doc["created_at"]
    )


@advanced_router.get("/video-comparisons")
async def get_video_comparisons(
    db: AsyncIOMotorDatabase = Depends(lambda: db),
    current_user: dict = Depends(get_current_user)
):
    """Get user's video comparisons"""
    comparisons = await db.video_comparisons.find({"user_id": str(current_user["_id"])}).to_list(100)
    
    return [
        VideoComparisonResponse(
            id=str(c["_id"]),
            user_video_id=c["user_video_id"],
            pro_video_url=c["pro_video_url"],
            comparison_notes=c.get("comparison_notes", ""),
            created_at=c["created_at"]
        )
        for c in comparisons
    ]


# ============================================
# NOTIFICATIONS
# ============================================

@advanced_router.get("/notifications")
async def get_notifications(
    db: AsyncIOMotorDatabase = Depends(lambda: db),
    current_user: dict = Depends(get_current_user)
):
    """Get user notifications"""
    notifications = await db.notifications.find({
        "user_id": str(current_user["_id"])
    }).sort("created_at", -1).limit(50).to_list(50)
    
    return [
        NotificationResponse(
            id=str(n["_id"]),
            title=n["title"],
            message=n["message"],
            type=n["type"],
            is_read=n["is_read"],
            created_at=n["created_at"],
            action_url=n.get("action_url")
        )
        for n in notifications
    ]


@advanced_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    db: AsyncIOMotorDatabase = Depends(lambda: db),
    current_user: dict = Depends(get_current_user)
):
    """Mark notification as read"""
    await db.notifications.update_one(
        {"_id": ObjectId(notification_id), "user_id": str(current_user["_id"])},
        {"$set": {"is_read": True}}
    )
    return {"message": "Notification marked as read"}


# ============================================
# USER PREFERENCES
# ============================================

@advanced_router.get("/preferences")
async def get_preferences(
    db: AsyncIOMotorDatabase = Depends(lambda: db),
    current_user: dict = Depends(get_current_user)
):
    """Get user preferences"""
    prefs = await db.user_preferences.find_one({"user_id": str(current_user["_id"])})
    
    if not prefs:
        # Return defaults
        return {
            "theme": "dark",
            "notifications_enabled": True,
            "offline_mode": True
        }
    
    return prefs


@advanced_router.put("/preferences")
async def update_preferences(
    preferences: dict,
    db: AsyncIOMotorDatabase = Depends(lambda: db),
    current_user: dict = Depends(get_current_user)
):
    """Update user preferences"""
    await db.user_preferences.update_one(
        {"user_id": str(current_user["_id"])},
        {"$set": {**preferences, "user_id": str(current_user["_id"])}},
        upsert=True
    )
    return {"message": "Preferences updated"}
