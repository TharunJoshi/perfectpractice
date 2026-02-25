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
    goal: Optional[str] = None  # Optional - can be AI-generated
    num_players: int = 1  # 1 for solo, 2+ for multi-player
    skill_level: str = "intermediate"  # beginner, intermediate, advanced

class SessionJoin(BaseModel):
    join_code: str

class SessionResponse(BaseModel):
    id: str
    host_id: str
    participants: List[str]  # Multiple players support
    join_code: str
    day_number: int
    duration: int
    focus_area: str
    goal: str
    num_players: int
    skill_level: str
    is_solo: bool
    status: str  # waiting, active, completed
    warmup_steps: List[dict]
    practice_steps: List[dict]
    cooldown_steps: List[dict]
    current_step_index: int
    current_phase: str  # warmup, practice, cooldown
    ai_practice_plan: Optional[dict] = None
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

class InstructionalVideoCreate(BaseModel):
    title: str
    url: str
    video_type: str  # youtube, custom
    focus_area: str
    technique: str
    description: Optional[str] = None

class InstructionalVideoResponse(BaseModel):
    id: str
    title: str
    url: str
    video_type: str
    focus_area: str
    technique: str
    description: Optional[str] = None
    created_at: datetime


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
        {
            "name": "Shoulder Rotations",
            "duration": 2,
            "description": "Gentle circular movements to warm up shoulders",
            "videos": [
                {
                    "title": "Shoulder Warm-up for Cricket",
                    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    "type": "youtube"
                }
            ]
        },
        {
            "name": "Hip Mobility",
            "duration": 2,
            "description": "Hip circles and dynamic stretches",
            "videos": [
                {
                    "title": "Hip Mobility Drills",
                    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    "type": "youtube"
                }
            ]
        },
        {
            "name": "Light Jogging",
            "duration": 3,
            "description": "In place or small area jogging to raise heart rate",
            "videos": []
        },
        {
            "name": "Shadow Practice",
            "duration": 3,
            "description": "Simulate movements without equipment",
            "videos": [
                {
                    "title": "Shadow Practice Technique",
                    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    "type": "youtube"
                }
            ]
        }
    ]

def generate_practice_steps(focus_area: str, goal: str, duration: int):
    """Generate practice steps with instructional videos"""
    practice_duration = duration - 20  # Subtract warmup and cooldown
    
    if focus_area.lower() == "batting":
        return [
            {
                "name": "Grip & Stance Foundation",
                "duration": practice_duration // 4,
                "description": f"Master the fundamentals for {goal}",
                "videos": [
                    {
                        "title": "Perfect Batting Grip",
                        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                        "type": "youtube"
                    },
                    {
                        "title": "Correct Batting Stance",
                        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                        "type": "youtube"
                    },
                    {
                        "title": "Head Position & Balance",
                        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                        "type": "youtube"
                    }
                ]
            },
            {
                "name": f"{goal.title()} Technique",
                "duration": practice_duration // 2,
                "description": f"Learn and practice {goal} shot",
                "videos": [
                    {
                        "title": f"How to Play {goal.title()}",
                        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                        "type": "youtube"
                    },
                    {
                        "title": f"{goal.title()} - Step by Step",
                        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                        "type": "youtube"
                    },
                    {
                        "title": f"Common {goal.title()} Mistakes",
                        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                        "type": "youtube"
                    }
                ]
            },
            {
                "name": "Match Simulation",
                "duration": practice_duration // 4,
                "description": f"Apply {goal} in realistic scenarios",
                "videos": [
                    {
                        "title": "Game Situation Practice",
                        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                        "type": "youtube"
                    }
                ]
            }
        ]
    elif focus_area.lower() == "bowling":
        return [
            {
                "name": "Grip & Run-up Basics",
                "duration": practice_duration // 3,
                "description": f"Master bowling fundamentals for {goal}",
                "videos": [
                    {
                        "title": "Perfect Bowling Grip",
                        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                        "type": "youtube"
                    },
                    {
                        "title": "Run-up Technique",
                        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                        "type": "youtube"
                    }
                ]
            },
            {
                "name": f"{goal.title()} Delivery",
                "duration": practice_duration // 3,
                "description": f"Learn {goal} bowling technique",
                "videos": [
                    {
                        "title": f"How to Bowl {goal.title()}",
                        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                        "type": "youtube"
                    },
                    {
                        "title": "Bowling Action Breakdown",
                        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                        "type": "youtube"
                    }
                ]
            },
            {
                "name": "Target Bowling",
                "duration": practice_duration // 3,
                "description": "Accuracy and consistency drills",
                "videos": []
            }
        ]
    elif focus_area.lower() == "fielding":
        return [
            {
                "name": "Ground Fielding Technique",
                "duration": practice_duration // 3,
                "description": f"Perfect {goal} fundamentals",
                "videos": [
                    {
                        "title": "Ground Fielding Basics",
                        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                        "type": "youtube"
                    },
                    {
                        "title": "Body Position & Technique",
                        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                        "type": "youtube"
                    }
                ]
            },
            {
                "name": "Catching Drills",
                "duration": practice_duration // 3,
                "description": f"Practice {goal} with variations",
                "videos": [
                    {
                        "title": "Safe Catching Technique",
                        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                        "type": "youtube"
                    }
                ]
            },
            {
                "name": "Throw & Accuracy",
                "duration": practice_duration // 3,
                "description": "Throwing at stumps with precision",
                "videos": []
            }
        ]
    else:
        return [
            {
                "name": "Basic Drills",
                "duration": practice_duration // 2,
                "description": f"Focus on {goal}",
                "videos": []
            },
            {
                "name": "Advanced Practice",
                "duration": practice_duration // 2,
                "description": f"Apply {goal} techniques",
                "videos": []
            }
        ]

def generate_cooldown_steps():
    """Generate cooldown steps for 10 minutes"""
    return [
        {
            "name": "Hamstring Stretch",
            "duration": 3,
            "description": "Hold each stretch for 30 seconds",
            "videos": [
                {
                    "title": "Proper Hamstring Stretching",
                    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    "type": "youtube"
                }
            ]
        },
        {
            "name": "Shoulder Stretch",
            "duration": 3,
            "description": "Upper body recovery stretches",
            "videos": []
        },
        {
            "name": "Breathing & Recovery",
            "duration": 4,
            "description": "Deep breathing and full body relaxation",
            "videos": [
                {
                    "title": "Recovery Breathing Techniques",
                    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    "type": "youtube"
                }
            ]
        }
    ]

def generate_ai_practice_plan(focus_area: str, skill_level: str, previous_weaknesses: List[str] = None):
    """Generate AI-powered practice plan (Rule-based templates for now)"""
    
    plans = {
        "batting": {
            "beginner": {
                "goal": "Build fundamental batting technique",
                "focus_points": [
                    "Proper grip on the bat handle",
                    "Balanced batting stance",
                    "Head position and eye level",
                    "Straight bat defensive shots",
                    "Basic footwork patterns"
                ],
                "recommended_drills": [
                    "Shadow batting without ball - 10 minutes",
                    "Straight drive against stationary ball - 15 minutes",
                    "Defense technique practice - 15 minutes",
                    "Basic footwork drills - 10 minutes"
                ],
                "key_techniques": [
                    "Hold bat with V-grip between thumb and forefinger",
                    "Stand side-on to bowler with feet shoulder-width apart",
                    "Keep head still and eyes level",
                    "Play with full face of bat for straight shots"
                ]
            },
            "intermediate": {
                "goal": "Develop shot variety and timing",
                "focus_points": [
                    "Cover drive execution",
                    "Pull shot technique",
                    "Advanced footwork (front/back foot)",
                    "Shot selection based on line and length",
                    "Power generation through timing"
                ],
                "recommended_drills": [
                    "Cover drive repetition - 15 minutes",
                    "Pull shot practice - 10 minutes",
                    "Footwork ladder drills - 10 minutes",
                    "Match simulation with shot selection - 15 minutes"
                ],
                "key_techniques": [
                    "Transfer weight onto front foot for drives",
                    "Rotate hips and shoulders for power",
                    "Watch ball onto bat",
                    "Complete full follow-through"
                ]
            },
            "advanced": {
                "goal": "Master advanced techniques and consistency",
                "focus_points": [
                    "Late cut and upper cut shots",
                    "Sweep and reverse sweep",
                    "Power hitting with control",
                    "Spin bowling strategies",
                    "Mental game and concentration"
                ],
                "recommended_drills": [
                    "Advanced shot repertoire practice - 20 minutes",
                    "Spin bowling variations - 10 minutes",
                    "Pressure situation batting - 10 minutes",
                    "Power hitting with placement - 10 minutes"
                ],
                "key_techniques": [
                    "Use wrists for late cuts and glances",
                    "Open bat face for placement",
                    "Read bowler's variations early",
                    "Maintain composure under pressure"
                ]
            }
        },
        "bowling": {
            "beginner": {
                "goal": "Build bowling fundamentals",
                "focus_points": [
                    "Proper bowling grip",
                    "Smooth run-up and approach",
                    "Consistent line and length",
                    "Arm action and release point",
                    "Follow-through technique"
                ],
                "recommended_drills": [
                    "Run-up practice without ball - 10 minutes",
                    "Target bowling at single stump - 20 minutes",
                    "Yorker length practice - 10 minutes",
                    "Rhythm and consistency drills - 10 minutes"
                ],
                "key_techniques": [
                    "Hold ball with first two fingers on seam",
                    "Build rhythm in run-up (6-8 paces)",
                    "Aim for top of off stump",
                    "Complete full arm rotation"
                ]
            },
            "intermediate": {
                "goal": "Develop bowling variations",
                "focus_points": [
                    "Swing bowling (inswing/outswing)",
                    "Slower ball variations",
                    "Yorker and bouncer execution",
                    "Line and length consistency",
                    "Reading batsman's weakness"
                ],
                "recommended_drills": [
                    "Swing bowling with shiny/rough ball - 15 minutes",
                    "Yorker and bouncer practice - 15 minutes",
                    "Slower ball variations - 10 minutes",
                    "Match scenario bowling - 10 minutes"
                ],
                "key_techniques": [
                    "Angle seam for swing",
                    "Vary grip for slower balls",
                    "Perfect yorker length (base of stumps)",
                    "Use field placements strategically"
                ]
            },
            "advanced": {
                "goal": "Master variations and strategy",
                "focus_points": [
                    "Reverse swing technique",
                    "Leg cutter and off cutter",
                    "Strategic field placements",
                    "Death bowling skills",
                    "Psychological warfare"
                ],
                "recommended_drills": [
                    "Advanced variation practice - 20 minutes",
                    "Death bowling scenarios - 10 minutes",
                    "Strategic bowling with field changes - 10 minutes",
                    "Pressure situation bowling - 10 minutes"
                ],
                "key_techniques": [
                    "Create reverse swing with old ball",
                    "Cut fingers across seam for variations",
                    "Study batsman's patterns",
                    "Maintain composure in pressure"
                ]
            }
        },
        "fielding": {
            "beginner": {
                "goal": "Build fielding fundamentals",
                "focus_points": [
                    "Ground fielding technique",
                    "Basic catching mechanics",
                    "Proper throwing form",
                    "Body positioning",
                    "Staying alert and ready"
                ],
                "recommended_drills": [
                    "Ground ball pickups - 15 minutes",
                    "Catching practice (chest height) - 15 minutes",
                    "Throwing accuracy at stumps - 10 minutes",
                    "Ready position practice - 10 minutes"
                ],
                "key_techniques": [
                    "Get low and behind the ball",
                    "Soft hands for catching",
                    "Step and throw with full arm",
                    "Stay on toes, ready to move"
                ]
            },
            "intermediate": {
                "goal": "Improve agility and catching",
                "focus_points": [
                    "Diving and sliding techniques",
                    "High catches and timing",
                    "Quick release throwing",
                    "Agility and speed",
                    "Anticipation skills"
                ],
                "recommended_drills": [
                    "Diving practice on both sides - 10 minutes",
                    "High catch judgement - 15 minutes",
                    "Quick release drills - 15 minutes",
                    "Agility ladder work - 10 minutes"
                ],
                "key_techniques": [
                    "Dive forward with arms extended",
                    "Judge high catches by watching ball",
                    "Transfer and release in one motion",
                    "React quickly to ball direction"
                ]
            },
            "advanced": {
                "goal": "Master match-winning fielding",
                "focus_points": [
                    "Boundary fielding and athleticism",
                    "Direct hit run-outs",
                    "Pressure catching situations",
                    "Strategic positioning",
                    "Team coordination"
                ],
                "recommended_drills": [
                    "Boundary chase and relay throws - 15 minutes",
                    "Direct hit practice from various positions - 15 minutes",
                    "Pressure catch scenarios - 10 minutes",
                    "Positional awareness drills - 10 minutes"
                ],
                "key_techniques": [
                    "Sprint to boundary and slide",
                    "Hit stumps with one motion",
                    "Stay calm for crucial catches",
                    "Communicate with teammates"
                ]
            }
        }
    }
    
    plan = plans.get(focus_area.lower(), {}).get(skill_level.lower(), {
        "goal": f"Improve {focus_area} skills",
        "focus_points": ["Technique", "Consistency", "Match awareness"],
        "recommended_drills": ["Practice drills - 40 minutes"],
        "key_techniques": ["Focus on fundamentals"]
    })
    
    # Add weakness-based adjustments
    if previous_weaknesses:
        plan["areas_to_improve"] = previous_weaknesses
        plan["personalized_note"] = f"⚠️ Based on your previous sessions, give extra attention to: {', '.join(previous_weaknesses[:3])}"
    
    return plan

def generate_ai_feedback(focus_area: str, goal: str):
    """Generate AI feedback from uploaded media (Rule-based for Phase 1)"""
    if focus_area.lower() == "batting":
        return {
            "doing_right": [
                "Bat face is straight at impact",
                "Head position stays relatively still",
                "Good grip on bat handle"
            ],
            "needs_improvement": [
                "Front foot is landing too closed",
                "Bat swing is slightly across the line",
                "Weight transfer could be earlier",
                "Follow-through not complete"
            ],
            "correction_tip": f"💡 For {goal}: Open your front foot 10-15 degrees towards target before downswing. This will help you play straighter and generate more power.",
            "practice_focus": ["Footwork drills", "Weight transfer", "Complete follow-through"]
        }
    elif focus_area.lower() == "bowling":
        return {
            "doing_right": [
                "Arm speed is consistent",
                "Follow-through is complete",
                "Good run-up rhythm"
            ],
            "needs_improvement": [
                "Release point varies by 6 inches",
                "Front arm pulls away too early",
                "Landing position inconsistent"
            ],
            "correction_tip": f"💡 For {goal}: Keep front arm up longer and aim to release at the same point each delivery. Mark your landing spot for consistency.",
            "practice_focus": ["Release consistency", "Front arm discipline", "Landing alignment"]
        }
    else:
        return {
            "doing_right": [
                "Body positioning is good",
                "Eyes tracking the ball"
            ],
            "needs_improvement": [
                "Movement could be faster",
                "Hand positioning needs work"
            ],
            "correction_tip": f"💡 For {goal}: Stay low, keep your eyes on the ball at all times, and move your feet quickly.",
            "practice_focus": ["Agility drills", "Hand-eye coordination"]
        }


# ============================================
# AUTH ROUTES
# ============================================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user_data.password)
    user_doc = {
        "email": user_data.email,
        "password": hashed_password,
        "name": user_data.name,
        "created_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
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
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    user_id = str(user["_id"])
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
    # Validate duration
    if session_data.duration < 30:
        raise HTTPException(status_code=400, detail="Session duration must be at least 30 minutes")
    
    # Validate number of players
    if session_data.num_players < 1 or session_data.num_players > 10:
        raise HTTPException(status_code=400, detail="Number of players must be between 1 and 10")
    
    is_solo = session_data.num_players == 1
    
    # Generate AI practice plan if no goal specified
    goal = session_data.goal
    ai_practice_plan = None
    
    if not goal or goal.strip() == "":
        ai_practice_plan = generate_ai_practice_plan(
            session_data.focus_area,
            session_data.skill_level
        )
        # Use first focus point as goal
        goal = ai_practice_plan["focus_points"][0] if ai_practice_plan["focus_points"] else f"{session_data.focus_area} practice"
    
    # Generate unique join code (only for multi-player)
    join_code = ""
    if not is_solo:
        join_code = generate_join_code()
        while await db.sessions.find_one({"join_code": join_code, "status": {"$ne": "completed"}}):
            join_code = generate_join_code()
    
    # Generate practice plan with videos
    warmup_steps = generate_warmup_steps()
    practice_steps = generate_practice_steps(session_data.focus_area, goal, session_data.duration)
    cooldown_steps = generate_cooldown_steps()
    
    session_doc = {
        "host_id": str(current_user["_id"]),
        "participants": [str(current_user["_id"])],  # Host is first participant
        "join_code": join_code,
        "day_number": session_data.day_number,
        "duration": session_data.duration,
        "focus_area": session_data.focus_area,
        "goal": goal,
        "num_players": session_data.num_players,
        "skill_level": session_data.skill_level,
        "is_solo": is_solo,
        "status": "active" if is_solo else "waiting",  # Solo starts immediately
        "warmup_steps": warmup_steps,
        "practice_steps": practice_steps,
        "cooldown_steps": cooldown_steps,
        "current_step_index": 0,
        "current_phase": "warmup",
        "ai_practice_plan": ai_practice_plan,
        "started_at": datetime.utcnow() if is_solo else None,
        "completed_at": None,
        "created_at": datetime.utcnow()
    }
    
    result = await db.sessions.insert_one(session_doc)
    session_doc["_id"] = result.inserted_id
    
    return SessionResponse(
        id=str(session_doc["_id"]),
        host_id=session_doc["host_id"],
        participants=session_doc["participants"],
        join_code=session_doc["join_code"],
        day_number=session_doc["day_number"],
        duration=session_doc["duration"],
        focus_area=session_doc["focus_area"],
        goal=session_doc["goal"],
        num_players=session_doc["num_players"],
        skill_level=session_doc["skill_level"],
        is_solo=session_doc["is_solo"],
        status=session_doc["status"],
        warmup_steps=session_doc["warmup_steps"],
        practice_steps=session_doc["practice_steps"],
        cooldown_steps=session_doc["cooldown_steps"],
        current_step_index=session_doc["current_step_index"],
        current_phase=session_doc["current_phase"],
        ai_practice_plan=session_doc["ai_practice_plan"],
        started_at=session_doc["started_at"],
        completed_at=session_doc["completed_at"],
        created_at=session_doc["created_at"]
    )

@api_router.post("/sessions/join", response_model=SessionResponse)
async def join_session(join_data: SessionJoin, current_user: dict = Depends(get_current_user)):
    session = await db.sessions.find_one({"join_code": join_data.join_code, "status": "waiting"})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or already started")
    
    user_id = str(current_user["_id"])
    
    # Check if user is host
    if str(session["host_id"]) == user_id:
        raise HTTPException(status_code=400, detail="Cannot join your own session")
    
    # Check if user already in session
    if user_id in session["participants"]:
        raise HTTPException(status_code=400, detail="Already joined this session")
    
    # Check if session is full
    if len(session["participants"]) >= session["num_players"]:
        raise HTTPException(status_code=400, detail="Session is full")
    
    # Add user to participants
    await db.sessions.update_one(
        {"_id": session["_id"]},
        {"$push": {"participants": user_id}}
    )
    
    session["participants"].append(user_id)
    
    return SessionResponse(
        id=str(session["_id"]),
        host_id=session["host_id"],
        participants=session["participants"],
        join_code=session["join_code"],
        day_number=session["day_number"],
        duration=session["duration"],
        focus_area=session["focus_area"],
        goal=session["goal"],
        num_players=session["num_players"],
        skill_level=session["skill_level"],
        is_solo=session["is_solo"],
        status=session["status"],
        warmup_steps=session["warmup_steps"],
        practice_steps=session["practice_steps"],
        cooldown_steps=session["cooldown_steps"],
        current_step_index=session["current_step_index"],
        current_phase=session["current_phase"],
        ai_practice_plan=session.get("ai_practice_plan"),
        started_at=session["started_at"],
        completed_at=session["completed_at"],
        created_at=session["created_at"]
    )

@api_router.post("/sessions/{session_id}/start", response_model=SessionResponse)
async def start_session(session_id: str, current_user: dict = Depends(get_current_user)):
    try:
        session = await db.sessions.find_one({"_id": ObjectId(session_id)})
    except:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Only host can start
    if str(session["host_id"]) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Only host can start the session")
    
    if session["status"] != "waiting":
        raise HTTPException(status_code=400, detail="Session already started or completed")
    
    # Check if enough players joined
    if len(session["participants"]) < session["num_players"]:
        raise HTTPException(
            status_code=400,
            detail=f"Need {session['num_players'] - len(session['participants'])} more player(s) to start"
        )
    
    await db.sessions.update_one(
        {"_id": session["_id"]},
        {"$set": {"status": "active", "started_at": datetime.utcnow()}}
    )
    
    session["status"] = "active"
    session["started_at"] = datetime.utcnow()
    
    return SessionResponse(
        id=str(session["_id"]),
        host_id=session["host_id"],
        participants=session["participants"],
        join_code=session["join_code"],
        day_number=session["day_number"],
        duration=session["duration"],
        focus_area=session["focus_area"],
        goal=session["goal"],
        num_players=session["num_players"],
        skill_level=session["skill_level"],
        is_solo=session["is_solo"],
        status=session["status"],
        warmup_steps=session["warmup_steps"],
        practice_steps=session["practice_steps"],
        cooldown_steps=session["cooldown_steps"],
        current_step_index=session["current_step_index"],
        current_phase=session["current_phase"],
        ai_practice_plan=session.get("ai_practice_plan"),
        started_at=session["started_at"],
        completed_at=session["completed_at"],
        created_at=session["created_at"]
    )

@api_router.post("/sessions/{session_id}/next-step", response_model=SessionResponse)
async def next_step(session_id: str, current_user: dict = Depends(get_current_user)):
    try:
        session = await db.sessions.find_one({"_id": ObjectId(session_id)})
    except:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Only host can advance steps
    if str(session["host_id"]) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Only host can advance steps")
    
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
            new_step_index = 0
            new_phase = "practice"
    elif current_phase == "practice":
        if current_step_index < len(session["practice_steps"]) - 1:
            new_step_index = current_step_index + 1
            new_phase = "practice"
        else:
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
    
    await db.sessions.update_one(
        {"_id": session["_id"]},
        {"$set": {"current_step_index": new_step_index, "current_phase": new_phase}}
    )
    
    session["current_step_index"] = new_step_index
    session["current_phase"] = new_phase
    
    return SessionResponse(
        id=str(session["_id"]),
        host_id=session["host_id"],
        participants=session["participants"],
        join_code=session["join_code"],
        day_number=session["day_number"],
        duration=session["duration"],
        focus_area=session["focus_area"],
        goal=session["goal"],
        num_players=session["num_players"],
        skill_level=session["skill_level"],
        is_solo=session["is_solo"],
        status=session["status"],
        warmup_steps=session["warmup_steps"],
        practice_steps=session["practice_steps"],
        cooldown_steps=session["cooldown_steps"],
        current_step_index=session["current_step_index"],
        current_phase=session["current_phase"],
        ai_practice_plan=session.get("ai_practice_plan"),
        started_at=session["started_at"],
        completed_at=session["completed_at"],
        created_at=session["created_at"]
    )

@api_router.post("/sessions/{session_id}/complete", response_model=SessionResponse)
async def complete_session(session_id: str, current_user: dict = Depends(get_current_user)):
    try:
        session = await db.sessions.find_one({"_id": ObjectId(session_id)})
    except:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Only host can complete
    if str(session["host_id"]) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Only host can complete the session")
    
    if session["status"] != "active":
        raise HTTPException(status_code=400, detail="Session is not active")
    
    # Enforce cooldown completion
    if session["current_phase"] != "cooldown" or session["current_step_index"] != len(session["cooldown_steps"]) - 1:
        raise HTTPException(status_code=400, detail="Must complete all cooldown steps before finishing session")
    
    await db.sessions.update_one(
        {"_id": session["_id"]},
        {"$set": {"status": "completed", "completed_at": datetime.utcnow()}}
    )
    
    session["status"] = "completed"
    session["completed_at"] = datetime.utcnow()
    
    return SessionResponse(
        id=str(session["_id"]),
        host_id=session["host_id"],
        participants=session["participants"],
        join_code=session["join_code"],
        day_number=session["day_number"],
        duration=session["duration"],
        focus_area=session["focus_area"],
        goal=session["goal"],
        num_players=session["num_players"],
        skill_level=session["skill_level"],
        is_solo=session["is_solo"],
        status=session["status"],
        warmup_steps=session["warmup_steps"],
        practice_steps=session["practice_steps"],
        cooldown_steps=session["cooldown_steps"],
        current_step_index=session["current_step_index"],
        current_phase=session["current_phase"],
        ai_practice_plan=session.get("ai_practice_plan"),
        started_at=session["started_at"],
        completed_at=session["completed_at"],
        created_at=session["created_at"]
    )

@api_router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str, current_user: dict = Depends(get_current_user)):
    try:
        session = await db.sessions.find_one({"_id": ObjectId(session_id)})
    except:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Handle backward compatibility
    participants = session.get("participants", [])
    if not participants:
        participants = [session["host_id"]]
        if session.get("guest_id"):
            participants.append(session["guest_id"])
    
    # Check if user is participant
    user_id = str(current_user["_id"])
    if user_id not in participants:
        raise HTTPException(status_code=403, detail="Not authorized to view this session")
    
    return SessionResponse(
        id=str(session["_id"]),
        host_id=session["host_id"],
        participants=participants,
        join_code=session.get("join_code", ""),
        day_number=session["day_number"],
        duration=session["duration"],
        focus_area=session["focus_area"],
        goal=session["goal"],
        num_players=session.get("num_players", len(participants)),
        skill_level=session.get("skill_level", "intermediate"),
        is_solo=session.get("is_solo", len(participants) == 1),
        status=session["status"],
        warmup_steps=session["warmup_steps"],
        practice_steps=session["practice_steps"],
        cooldown_steps=session["cooldown_steps"],
        current_step_index=session["current_step_index"],
        current_phase=session["current_phase"],
        ai_practice_plan=session.get("ai_practice_plan"),
        started_at=session.get("started_at"),
        completed_at=session.get("completed_at"),
        created_at=session["created_at"]
    )

@api_router.get("/sessions/my-sessions/list", response_model=List[SessionResponse])
async def get_my_sessions(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    # Find all sessions where user is participant (handle old guest_id format)
    sessions = await db.sessions.find({
        "$or": [
            {"participants": user_id},
            {"host_id": user_id},
            {"guest_id": user_id}
        ]
    }).sort("created_at", -1).to_list(100)
    
    result = []
    for session in sessions:
        # Handle backward compatibility with old sessions
        participants = session.get("participants", [])
        if not participants:
            # Old format with guest_id
            participants = [session["host_id"]]
            if session.get("guest_id"):
                participants.append(session["guest_id"])
        
        result.append(SessionResponse(
            id=str(session["_id"]),
            host_id=session["host_id"],
            participants=participants,
            join_code=session.get("join_code", ""),
            day_number=session["day_number"],
            duration=session["duration"],
            focus_area=session["focus_area"],
            goal=session["goal"],
            num_players=session.get("num_players", len(participants)),
            skill_level=session.get("skill_level", "intermediate"),
            is_solo=session.get("is_solo", len(participants) == 1),
            status=session["status"],
            warmup_steps=session["warmup_steps"],
            practice_steps=session["practice_steps"],
            cooldown_steps=session["cooldown_steps"],
            current_step_index=session["current_step_index"],
            current_phase=session["current_phase"],
            ai_practice_plan=session.get("ai_practice_plan"),
            started_at=session.get("started_at"),
            completed_at=session.get("completed_at"),
            created_at=session["created_at"]
        ))
    
    return result


@api_router.delete("/sessions/{session_id}")
async def delete_session(session_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a session (only host can delete)"""
    try:
        session = await db.sessions.find_one({"_id": ObjectId(session_id)})
    except:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Only host can delete the session
    if str(session["host_id"]) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Only the host can delete this session")
    
    # Delete the session
    await db.sessions.delete_one({"_id": ObjectId(session_id)})
    
    # Also delete related data (optional - could keep for history)
    # Delete activities
    await db.activities.delete_many({"session_id": session_id})
    
    # Delete media
    await db.media.delete_many({"session_id": session_id})
    
    # Delete comments
    await db.session_comments.delete_many({"session_id": session_id})
    
    return {"message": "Session deleted successfully"}


# ============================================
# ACTIVITY ROUTES
# ============================================

@api_router.post("/sessions/{session_id}/activities", response_model=ActivityResponse)
async def log_activity(session_id: str, activity_data: ActivityCreate, current_user: dict = Depends(get_current_user)):
    try:
        session = await db.sessions.find_one({"_id": ObjectId(session_id)})
    except:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    user_id = str(current_user["_id"])
    
    # Handle backward compatibility
    participants = session.get("participants", [])
    if not participants:
        participants = [session["host_id"]]
        if session.get("guest_id"):
            participants.append(session["guest_id"])
    
    if user_id not in participants:
        raise HTTPException(status_code=403, detail="Not authorized to log activity for this session")
    
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
    try:
        session = await db.sessions.find_one({"_id": ObjectId(session_id)})
    except:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    user_id = str(current_user["_id"])
    
    # Handle backward compatibility
    participants = session.get("participants", [])
    if not participants:
        participants = [session["host_id"]]
        if session.get("guest_id"):
            participants.append(session["guest_id"])
    
    if user_id not in participants:
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
    try:
        session = await db.sessions.find_one({"_id": ObjectId(session_id)})
    except:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    user_id = str(current_user["_id"])
    
    # Handle backward compatibility
    participants = session.get("participants", [])
    if not participants:
        participants = [session["host_id"]]
        if session.get("guest_id"):
            participants.append(session["guest_id"])
    
    if user_id not in participants:
        raise HTTPException(status_code=403, detail="Not authorized to upload media for this session")
    
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
    try:
        session = await db.sessions.find_one({"_id": ObjectId(session_id)})
    except:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    user_id = str(current_user["_id"])
    
    # Handle backward compatibility
    participants = session.get("participants", [])
    if not participants:
        participants = [session["host_id"]]
        if session.get("guest_id"):
            participants.append(session["guest_id"])
    
    if user_id not in participants:
        raise HTTPException(status_code=403, detail="Not authorized to view media for this session")
    
    media_list = await db.media.find(
        {"session_id": session_id},
        {"file_data": 0}
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
    try:
        media = await db.media.find_one({"_id": ObjectId(media_id)})
    except:
        raise HTTPException(status_code=404, detail="Media not found")
    
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    
    session = await db.sessions.find_one({"_id": ObjectId(media["session_id"])})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    user_id = str(current_user["_id"])
    
    # Handle backward compatibility
    participants = session.get("participants", [])
    if not participants:
        participants = [session["host_id"]]
        if session.get("guest_id"):
            participants.append(session["guest_id"])
    
    if user_id not in participants:
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
# PRACTICE PLAN ROUTES
# ============================================

@api_router.get("/practice-plans/{focus_area}/{skill_level}")
async def get_practice_plan(
    focus_area: str,
    skill_level: str,
    current_user: dict = Depends(get_current_user)
):
    """Get AI-generated practice plan"""
    
    # Get user's previous session weaknesses
    user_id = str(current_user["_id"])
    previous_sessions = await db.sessions.find({
        "participants": user_id,
        "status": "completed",
        "focus_area": focus_area
    }).sort("created_at", -1).limit(5).to_list(5)
    
    # Aggregate weaknesses from previous media feedback
    weaknesses = []
    for session in previous_sessions:
        session_id = str(session["_id"])
        media_list = await db.media.find(
            {"session_id": session_id, "user_id": user_id}
        ).to_list(10)
        
        for media in media_list:
            if media.get("ai_feedback") and media["ai_feedback"].get("needs_improvement"):
                weaknesses.extend(media["ai_feedback"]["needs_improvement"])
    
    # Get unique weaknesses (top 3)
    unique_weaknesses = list(set(weaknesses))[:3]
    
    # Generate personalized plan
    plan = generate_ai_practice_plan(focus_area, skill_level, unique_weaknesses if unique_weaknesses else None)
    
    return {
        "focus_area": focus_area,
        "skill_level": skill_level,
        "plan": plan,
        "based_on_sessions": len(previous_sessions)
    }


# ============================================
# INSTRUCTIONAL VIDEO ROUTES
# ============================================

@api_router.post("/videos", response_model=InstructionalVideoResponse)
async def create_instructional_video(
    video_data: InstructionalVideoCreate,
    current_user: dict = Depends(get_current_user)
):
    """Upload/link instructional video"""
    video_doc = {
        "title": video_data.title,
        "url": video_data.url,
        "video_type": video_data.video_type,
        "focus_area": video_data.focus_area,
        "technique": video_data.technique,
        "description": video_data.description,
        "created_by": str(current_user["_id"]),
        "created_at": datetime.utcnow()
    }
    
    result = await db.instructional_videos.insert_one(video_doc)
    
    return InstructionalVideoResponse(
        id=str(result.inserted_id),
        title=video_doc["title"],
        url=video_doc["url"],
        video_type=video_doc["video_type"],
        focus_area=video_doc["focus_area"],
        technique=video_doc["technique"],
        description=video_doc["description"],
        created_at=video_doc["created_at"]
    )

@api_router.get("/videos/{focus_area}", response_model=List[InstructionalVideoResponse])
async def get_instructional_videos(focus_area: str, current_user: dict = Depends(get_current_user)):
    """Get all instructional videos for a focus area"""
    videos = await db.instructional_videos.find(
        {"focus_area": focus_area}
    ).sort("created_at", -1).to_list(100)
    
    return [
        InstructionalVideoResponse(
            id=str(video["_id"]),
            title=video["title"],
            url=video["url"],
            video_type=video["video_type"],
            focus_area=video["focus_area"],
            technique=video["technique"],
            description=video.get("description"),
            created_at=video["created_at"]
        )
        for video in videos
    ]


# ============================================
# INCLUDE ROUTERS & MIDDLEWARE
# ============================================

app.include_router(api_router)

# Include advanced features router
try:
    from advanced_routes import advanced_router, get_current_user as adv_get_current_user
    app.include_router(advanced_router)
    logger.info("✅ Advanced features routes loaded successfully")
except Exception as e:
    logger.warning(f"⚠️  Advanced routes not loaded: {e}")

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
