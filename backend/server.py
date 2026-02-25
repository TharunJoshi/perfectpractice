from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timedelta
from passlib.context import CryptContext
import jwt
from bson import ObjectId
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security
security = HTTPBearer()

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ============================================
# PYDANTIC MODELS
# ============================================

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class SessionCreate(BaseModel):
    day_number: int
    duration: int  # in minutes
    focus_area: str  # batting, bowling, fielding
    goal: Optional[str] = None  # e.g., "cover drive" - optional, can be AI-generated
    num_players: int = 2  # 1 for solo, 2+ for multi-player
    skill_level: Optional[str] = "intermediate"  # beginner, intermediate, advanced

class SessionJoin(BaseModel):
    join_code: str

class SessionResponse(BaseModel):
    id: str
    host_id: str
    guest_id: Optional[str] = None
    join_code: str
    day_number: int
    duration: int
    focus_area: str
    goal: str
    status: str  # waiting, active, completed
    warmup_steps: List[dict]
    practice_steps: List[dict]
    cooldown_steps: List[dict]
    current_step_index: int
    current_phase: str  # warmup, practice, cooldown
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime

class ActivityCreate(BaseModel):
    calories: float

class ActivityResponse(BaseModel):
    id: str
    session_id: str
    user_id: str
    calories: float
    logged_at: datetime

class MediaUpload(BaseModel):
    file_data: str  # base64 encoded
    file_type: str  # image or video

class MediaResponse(BaseModel):
    id: str
    session_id: str
    user_id: str
    file_type: str
    ai_feedback: Optional[dict] = None
    uploaded_at: datetime


# ============================================
# HELPER FUNCTIONS
# ============================================

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def generate_join_code():
    """Generate a unique 6-digit join code"""
    return str(random.randint(100000, 999999))

def generate_warmup_steps():
    """Generate warmup steps for 10 minutes"""
    return [
        {"name": "Shoulder Rotations", "duration": 2, "description": "Gentle circular movements"},
        {"name": "Hip Mobility", "duration": 2, "description": "Hip circles and stretches"},
        {"name": "Light Jogging", "duration": 3, "description": "In place or small area"},
        {"name": "Shadow Practice", "duration": 3, "description": "Simulate movements without equipment"}
    ]

def generate_practice_steps(focus_area: str, goal: str, duration: int):
    """Generate practice steps based on focus area and goal"""
    # Subtract warmup (10) and cooldown (10) minutes
    practice_duration = duration - 20
    
    if focus_area.lower() == "batting":
        return [
            {"name": "Defensive & Timing", "duration": practice_duration // 4, "description": f"Focus on {goal} - soft practice"},
            {"name": f"{goal.title()} Technique", "duration": practice_duration // 2, "description": f"Main {goal} drills"},
            {"name": "Match Simulation", "duration": practice_duration // 4, "description": f"Apply {goal} in game scenarios"}
        ]
    elif focus_area.lower() == "bowling":
        return [
            {"name": "Line & Length", "duration": practice_duration // 3, "description": f"Focus on {goal}"},
            {"name": f"{goal.title()} Practice", "duration": practice_duration // 3, "description": f"Main {goal} drills"},
            {"name": "Target Bowling", "duration": practice_duration // 3, "description": "Accuracy practice"}
        ]
    elif focus_area.lower() == "fielding":
        return [
            {"name": "Ground Fielding", "duration": practice_duration // 3, "description": f"Focus on {goal}"},
            {"name": "Catching Drills", "duration": practice_duration // 3, "description": f"{goal} practice"},
            {"name": "Throw & Accuracy", "duration": practice_duration // 3, "description": "Throwing at stumps"}
        ]
    else:
        return [
            {"name": "Basic Drills", "duration": practice_duration // 2, "description": f"Focus on {goal}"},
            {"name": "Advanced Practice", "duration": practice_duration // 2, "description": f"Apply {goal}"}
        ]

def generate_cooldown_steps():
    """Generate cooldown steps for 10 minutes"""
    return [
        {"name": "Hamstring Stretch", "duration": 3, "description": "Hold each stretch for 30 seconds"},
        {"name": "Shoulder Stretch", "duration": 3, "description": "Upper body recovery"},
        {"name": "Breathing & Recovery", "duration": 4, "description": "Deep breathing and relaxation"}
    ]

def generate_ai_feedback(focus_area: str, goal: str):
    """Generate AI feedback (Phase 1: Rule-based placeholders)"""
    if focus_area.lower() == "batting":
        return {
            "doing_right": [
                "Bat face is straight at impact",
                "Head stays relatively still"
            ],
            "needs_improvement": [
                "Front foot is landing too closed",
                "Bat swing is slightly across the line",
                "Weight transfer is late"
            ],
            "correction_tip": f"For {goal}: Open your front foot 10-15 degrees towards target before downswing."
        }
    elif focus_area.lower() == "bowling":
        return {
            "doing_right": [
                "Arm speed is consistent",
                "Follow-through is complete"
            ],
            "needs_improvement": [
                "Release point varies",
                "Front arm pulls away too early"
            ],
            "correction_tip": f"For {goal}: Keep front arm up longer and release at the same point each time."
        }
    else:
        return {
            "doing_right": [
                "Body positioning is good"
            ],
            "needs_improvement": [
                "Movement could be faster"
            ],
            "correction_tip": f"For {goal}: Stay low and keep eyes on the ball."
        }


# ============================================
# AUTH ROUTES
# ============================================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password and create user
    hashed_password = get_password_hash(user_data.password)
    user_doc = {
        "email": user_data.email,
        "password": hashed_password,
        "name": user_data.name,
        "created_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    # Create access token
    access_token = create_access_token(data={"sub": user_id})
    
    user_response = UserResponse(
        id=user_id,
        email=user_data.email,
        name=user_data.name,
        created_at=user_doc["created_at"]
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    # Find user
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    user_id = str(user["_id"])
    
    # Create access token
    access_token = create_access_token(data={"sub": user_id})
    
    user_response = UserResponse(
        id=user_id,
        email=user["email"],
        name=user["name"],
        created_at=user["created_at"]
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )


# ============================================
# SESSION ROUTES
# ============================================

@api_router.post("/sessions", response_model=SessionResponse)
async def create_session(session_data: SessionCreate, current_user: dict = Depends(get_current_user)):
    # Validate duration (must be at least 30 minutes for warmup + cooldown + practice)
    if session_data.duration < 30:
        raise HTTPException(status_code=400, detail="Session duration must be at least 30 minutes")
    
    # Generate unique join code
    join_code = generate_join_code()
    while await db.sessions.find_one({"join_code": join_code, "status": {"$ne": "completed"}}):
        join_code = generate_join_code()
    
    # Generate practice plan
    warmup_steps = generate_warmup_steps()
    practice_steps = generate_practice_steps(session_data.focus_area, session_data.goal, session_data.duration)
    cooldown_steps = generate_cooldown_steps()
    
    session_doc = {
        "host_id": str(current_user["_id"]),
        "guest_id": None,
        "join_code": join_code,
        "day_number": session_data.day_number,
        "duration": session_data.duration,
        "focus_area": session_data.focus_area,
        "goal": session_data.goal,
        "status": "waiting",
        "warmup_steps": warmup_steps,
        "practice_steps": practice_steps,
        "cooldown_steps": cooldown_steps,
        "current_step_index": 0,
        "current_phase": "warmup",
        "started_at": None,
        "completed_at": None,
        "created_at": datetime.utcnow()
    }
    
    result = await db.sessions.insert_one(session_doc)
    session_doc["_id"] = result.inserted_id
    
    return SessionResponse(
        id=str(session_doc["_id"]),
        host_id=session_doc["host_id"],
        guest_id=session_doc["guest_id"],
        join_code=session_doc["join_code"],
        day_number=session_doc["day_number"],
        duration=session_doc["duration"],
        focus_area=session_doc["focus_area"],
        goal=session_doc["goal"],
        status=session_doc["status"],
        warmup_steps=session_doc["warmup_steps"],
        practice_steps=session_doc["practice_steps"],
        cooldown_steps=session_doc["cooldown_steps"],
        current_step_index=session_doc["current_step_index"],
        current_phase=session_doc["current_phase"],
        started_at=session_doc["started_at"],
        completed_at=session_doc["completed_at"],
        created_at=session_doc["created_at"]
    )

@api_router.post("/sessions/join", response_model=SessionResponse)
async def join_session(join_data: SessionJoin, current_user: dict = Depends(get_current_user)):
    # Find session by join code
    session = await db.sessions.find_one({"join_code": join_data.join_code, "status": "waiting"})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or already started")
    
    # Check if user is trying to join their own session
    if str(session["host_id"]) == str(current_user["_id"]):
        raise HTTPException(status_code=400, detail="Cannot join your own session")
    
    # Check if session already has a guest
    if session["guest_id"] is not None:
        raise HTTPException(status_code=400, detail="Session already has a guest")
    
    # Add user as guest
    await db.sessions.update_one(
        {"_id": session["_id"]},
        {"$set": {"guest_id": str(current_user["_id"])}}
    )
    
    session["guest_id"] = str(current_user["_id"])
    
    return SessionResponse(
        id=str(session["_id"]),
        host_id=session["host_id"],
        guest_id=session["guest_id"],
        join_code=session["join_code"],
        day_number=session["day_number"],
        duration=session["duration"],
        focus_area=session["focus_area"],
        goal=session["goal"],
        status=session["status"],
        warmup_steps=session["warmup_steps"],
        practice_steps=session["practice_steps"],
        cooldown_steps=session["cooldown_steps"],
        current_step_index=session["current_step_index"],
        current_phase=session["current_phase"],
        started_at=session["started_at"],
        completed_at=session["completed_at"],
        created_at=session["created_at"]
    )

@api_router.post("/sessions/{session_id}/start", response_model=SessionResponse)
async def start_session(session_id: str, current_user: dict = Depends(get_current_user)):
    # Find session
    try:
        session = await db.sessions.find_one({"_id": ObjectId(session_id)})
    except:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Only host can start the session
    if str(session["host_id"]) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Only host can start the session")
    
    # Check if session is in waiting status
    if session["status"] != "waiting":
        raise HTTPException(status_code=400, detail="Session already started or completed")
    
    # Check if guest has joined
    if session["guest_id"] is None:
        raise HTTPException(status_code=400, detail="Cannot start session without a guest")
    
    # Start the session
    await db.sessions.update_one(
        {"_id": session["_id"]},
        {"$set": {"status": "active", "started_at": datetime.utcnow()}}
    )
    
    session["status"] = "active"
    session["started_at"] = datetime.utcnow()
    
    return SessionResponse(
        id=str(session["_id"]),
        host_id=session["host_id"],
        guest_id=session["guest_id"],
        join_code=session["join_code"],
        day_number=session["day_number"],
        duration=session["duration"],
        focus_area=session["focus_area"],
        goal=session["goal"],
        status=session["status"],
        warmup_steps=session["warmup_steps"],
        practice_steps=session["practice_steps"],
        cooldown_steps=session["cooldown_steps"],
        current_step_index=session["current_step_index"],
        current_phase=session["current_phase"],
        started_at=session["started_at"],
        completed_at=session["completed_at"],
        created_at=session["created_at"]
    )

@api_router.post("/sessions/{session_id}/next-step", response_model=SessionResponse)
async def next_step(session_id: str, current_user: dict = Depends(get_current_user)):
    # Find session
    try:
        session = await db.sessions.find_one({"_id": ObjectId(session_id)})
    except:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Only host can advance steps
    if str(session["host_id"]) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Only host can advance steps")
    
    # Check if session is active
    if session["status"] != "active":
        raise HTTPException(status_code=400, detail="Session is not active")
    
    current_phase = session["current_phase"]
    current_step_index = session["current_step_index"]
    
    # Determine next step
    if current_phase == "warmup":
        if current_step_index < len(session["warmup_steps"]) - 1:
            new_step_index = current_step_index + 1
            new_phase = "warmup"
        else:
            # Move to practice phase
            new_step_index = 0
            new_phase = "practice"
    elif current_phase == "practice":
        if current_step_index < len(session["practice_steps"]) - 1:
            new_step_index = current_step_index + 1
            new_phase = "practice"
        else:
            # Move to cooldown phase
            new_step_index = 0
            new_phase = "cooldown"
    elif current_phase == "cooldown":
        if current_step_index < len(session["cooldown_steps"]) - 1:
            new_step_index = current_step_index + 1
            new_phase = "cooldown"
        else:
            raise HTTPException(status_code=400, detail="All steps completed. Please complete the session.")
    else:
        raise HTTPException(status_code=400, detail="Invalid session phase")
    
    # Update session
    await db.sessions.update_one(
        {"_id": session["_id"]},
        {"$set": {"current_step_index": new_step_index, "current_phase": new_phase}}
    )
    
    session["current_step_index"] = new_step_index
    session["current_phase"] = new_phase
    
    return SessionResponse(
        id=str(session["_id"]),
        host_id=session["host_id"],
        guest_id=session["guest_id"],
        join_code=session["join_code"],
        day_number=session["day_number"],
        duration=session["duration"],
        focus_area=session["focus_area"],
        goal=session["goal"],
        status=session["status"],
        warmup_steps=session["warmup_steps"],
        practice_steps=session["practice_steps"],
        cooldown_steps=session["cooldown_steps"],
        current_step_index=session["current_step_index"],
        current_phase=session["current_phase"],
        started_at=session["started_at"],
        completed_at=session["completed_at"],
        created_at=session["created_at"]
    )

@api_router.post("/sessions/{session_id}/complete", response_model=SessionResponse)
async def complete_session(session_id: str, current_user: dict = Depends(get_current_user)):
    # Find session
    try:
        session = await db.sessions.find_one({"_id": ObjectId(session_id)})
    except:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Only host can complete the session
    if str(session["host_id"]) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Only host can complete the session")
    
    # Check if session is active
    if session["status"] != "active":
        raise HTTPException(status_code=400, detail="Session is not active")
    
    # Enforce cooldown completion
    if session["current_phase"] != "cooldown" or session["current_step_index"] != len(session["cooldown_steps"]) - 1:
        raise HTTPException(status_code=400, detail="Must complete all cooldown steps before finishing session")
    
    # Complete the session
    await db.sessions.update_one(
        {"_id": session["_id"]},
        {"$set": {"status": "completed", "completed_at": datetime.utcnow()}}
    )
    
    session["status"] = "completed"
    session["completed_at"] = datetime.utcnow()
    
    return SessionResponse(
        id=str(session["_id"]),
        host_id=session["host_id"],
        guest_id=session["guest_id"],
        join_code=session["join_code"],
        day_number=session["day_number"],
        duration=session["duration"],
        focus_area=session["focus_area"],
        goal=session["goal"],
        status=session["status"],
        warmup_steps=session["warmup_steps"],
        practice_steps=session["practice_steps"],
        cooldown_steps=session["cooldown_steps"],
        current_step_index=session["current_step_index"],
        current_phase=session["current_phase"],
        started_at=session["started_at"],
        completed_at=session["completed_at"],
        created_at=session["created_at"]
    )

@api_router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str, current_user: dict = Depends(get_current_user)):
    # Find session
    try:
        session = await db.sessions.find_one({"_id": ObjectId(session_id)})
    except:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check if user is host or guest
    user_id = str(current_user["_id"])
    if session["host_id"] != user_id and session["guest_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this session")
    
    return SessionResponse(
        id=str(session["_id"]),
        host_id=session["host_id"],
        guest_id=session["guest_id"],
        join_code=session["join_code"],
        day_number=session["day_number"],
        duration=session["duration"],
        focus_area=session["focus_area"],
        goal=session["goal"],
        status=session["status"],
        warmup_steps=session["warmup_steps"],
        practice_steps=session["practice_steps"],
        cooldown_steps=session["cooldown_steps"],
        current_step_index=session["current_step_index"],
        current_phase=session["current_phase"],
        started_at=session["started_at"],
        completed_at=session["completed_at"],
        created_at=session["created_at"]
    )

@api_router.get("/sessions/my-sessions/list", response_model=List[SessionResponse])
async def get_my_sessions(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    # Find all sessions where user is host or guest
    sessions = await db.sessions.find({
        "$or": [
            {"host_id": user_id},
            {"guest_id": user_id}
        ]
    }).sort("created_at", -1).to_list(100)
    
    return [
        SessionResponse(
            id=str(session["_id"]),
            host_id=session["host_id"],
            guest_id=session["guest_id"],
            join_code=session["join_code"],
            day_number=session["day_number"],
            duration=session["duration"],
            focus_area=session["focus_area"],
            goal=session["goal"],
            status=session["status"],
            warmup_steps=session["warmup_steps"],
            practice_steps=session["practice_steps"],
            cooldown_steps=session["cooldown_steps"],
            current_step_index=session["current_step_index"],
            current_phase=session["current_phase"],
            started_at=session["started_at"],
            completed_at=session["completed_at"],
            created_at=session["created_at"]
        )
        for session in sessions
    ]


# ============================================
# ACTIVITY ROUTES
# ============================================

@api_router.post("/sessions/{session_id}/activities", response_model=ActivityResponse)
async def log_activity(session_id: str, activity_data: ActivityCreate, current_user: dict = Depends(get_current_user)):
    # Find session
    try:
        session = await db.sessions.find_one({"_id": ObjectId(session_id)})
    except:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check if user is host or guest
    user_id = str(current_user["_id"])
    if session["host_id"] != user_id and session["guest_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to log activity for this session")
    
    # Can only log activity if session is active
    if session["status"] != "active":
        raise HTTPException(status_code=400, detail="Can only log activity for active sessions")
    
    activity_doc = {
        "session_id": session_id,
        "user_id": user_id,
        "calories": activity_data.calories,
        "logged_at": datetime.utcnow()
    }
    
    result = await db.activities.insert_one(activity_doc)
    
    return ActivityResponse(
        id=str(result.inserted_id),
        session_id=session_id,
        user_id=user_id,
        calories=activity_data.calories,
        logged_at=activity_doc["logged_at"]
    )

@api_router.get("/sessions/{session_id}/activities", response_model=List[ActivityResponse])
async def get_session_activities(session_id: str, current_user: dict = Depends(get_current_user)):
    # Find session
    try:
        session = await db.sessions.find_one({"_id": ObjectId(session_id)})
    except:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check if user is host or guest
    user_id = str(current_user["_id"])
    if session["host_id"] != user_id and session["guest_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view activities for this session")
    
    activities = await db.activities.find({"session_id": session_id}).to_list(100)
    
    return [
        ActivityResponse(
            id=str(activity["_id"]),
            session_id=activity["session_id"],
            user_id=activity["user_id"],
            calories=activity["calories"],
            logged_at=activity["logged_at"]
        )
        for activity in activities
    ]


# ============================================
# MEDIA ROUTES
# ============================================

@api_router.post("/sessions/{session_id}/media", response_model=MediaResponse)
async def upload_media(session_id: str, media_data: MediaUpload, current_user: dict = Depends(get_current_user)):
    # Find session
    try:
        session = await db.sessions.find_one({"_id": ObjectId(session_id)})
    except:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check if user is host or guest
    user_id = str(current_user["_id"])
    if session["host_id"] != user_id and session["guest_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to upload media for this session")
    
    # Can upload during active session or after completion
    if session["status"] not in ["active", "completed"]:
        raise HTTPException(status_code=400, detail="Can only upload media for active or completed sessions")
    
    # Generate AI feedback
    ai_feedback = generate_ai_feedback(session["focus_area"], session["goal"])
    
    media_doc = {
        "session_id": session_id,
        "user_id": user_id,
        "file_data": media_data.file_data,
        "file_type": media_data.file_type,
        "ai_feedback": ai_feedback,
        "uploaded_at": datetime.utcnow()
    }
    
    result = await db.media.insert_one(media_doc)
    
    return MediaResponse(
        id=str(result.inserted_id),
        session_id=session_id,
        user_id=user_id,
        file_type=media_data.file_type,
        ai_feedback=ai_feedback,
        uploaded_at=media_doc["uploaded_at"]
    )

@api_router.get("/sessions/{session_id}/media", response_model=List[MediaResponse])
async def get_session_media(session_id: str, current_user: dict = Depends(get_current_user)):
    # Find session
    try:
        session = await db.sessions.find_one({"_id": ObjectId(session_id)})
    except:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check if user is host or guest
    user_id = str(current_user["_id"])
    if session["host_id"] != user_id and session["guest_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view media for this session")
    
    # Get media without file_data to reduce response size
    media_list = await db.media.find(
        {"session_id": session_id},
        {"file_data": 0}  # Exclude base64 data in list view
    ).to_list(100)
    
    return [
        MediaResponse(
            id=str(media["_id"]),
            session_id=media["session_id"],
            user_id=media["user_id"],
            file_type=media["file_type"],
            ai_feedback=media.get("ai_feedback"),
            uploaded_at=media["uploaded_at"]
        )
        for media in media_list
    ]

@api_router.get("/media/{media_id}/full")
async def get_media_full(media_id: str, current_user: dict = Depends(get_current_user)):
    # Find media
    try:
        media = await db.media.find_one({"_id": ObjectId(media_id)})
    except:
        raise HTTPException(status_code=404, detail="Media not found")
    
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    
    # Find session to check authorization
    session = await db.sessions.find_one({"_id": ObjectId(media["session_id"])})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    user_id = str(current_user["_id"])
    if session["host_id"] != user_id and session["guest_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this media")
    
    return {
        "id": str(media["_id"]),
        "session_id": media["session_id"],
        "user_id": media["user_id"],
        "file_data": media["file_data"],
        "file_type": media["file_type"],
        "ai_feedback": media.get("ai_feedback"),
        "uploaded_at": media["uploaded_at"]
    }


# ============================================
# INCLUDE ROUTER & MIDDLEWARE
# ============================================

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
