# PerfectPractice - Comprehensive Test Scenarios
## Cricket Coaching Mobile App

**Version:** 1.0.0  
**Last Updated:** March 2025  
**Platform:** iOS, Android, Web (Expo)

---

## Table of Contents
1. [Authentication Tests](#1-authentication-tests)
2. [Onboarding Tests](#2-onboarding-tests)
3. [Home Screen Tests](#3-home-screen-tests)
4. [Session Management Tests](#4-session-management-tests)
5. [Camera & Recording Tests](#5-camera--recording-tests)
6. [Video Trimmer Tests](#6-video-trimmer-tests)
7. [Reels Feed Tests](#7-reels-feed-tests)
8. [ICC Guidelines Tests](#8-icc-guidelines-tests)
9. [Profile Tests](#9-profile-tests)
10. [API Integration Tests](#10-api-integration-tests)

---

## 1. Authentication Tests

### 1.1 Email Registration
| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| AUTH-001 | Valid registration | Enter valid name, email, password, confirm password → Click "Create Account" | User registered, redirected to welcome screen |
| AUTH-002 | Duplicate email | Register with existing email | Error: "User already exists" |
| AUTH-003 | Invalid email format | Enter "invalid-email" | Error: "Please enter valid email" |
| AUTH-004 | Password mismatch | Password and confirm password don't match | Error: "Passwords do not match" |
| AUTH-005 | Empty fields | Submit with empty fields | Error: "Please fill in all fields" |
| AUTH-006 | Weak password | Enter password less than 6 characters | Error: "Password too short" |

### 1.2 Email Login
| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| AUTH-007 | Valid login | Enter registered email/password → Click "Login with Email" | Login successful, redirected to home |
| AUTH-008 | Wrong password | Enter correct email, wrong password | Error: "Invalid credentials" |
| AUTH-009 | Non-existent user | Enter unregistered email | Error: "User not found" |
| AUTH-010 | Empty credentials | Submit with empty fields | Error: "Please fill in all fields" |

### 1.3 Social Login (Demo Mode)
| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| AUTH-011 | Google login | Click "Continue with Google" → Enter name/email in modal → Click Continue | User created/logged in, redirected appropriately |
| AUTH-012 | Meta/Facebook login | Click "Continue with Meta" → Enter name/email → Continue | User created/logged in |
| AUTH-013 | Twitter login | Click "Continue with Twitter" → Enter name/email → Continue | User created/logged in |
| AUTH-014 | Demo mode banner | Open login screen | "Demo Mode - Social login simulated" banner visible |
| AUTH-015 | Cancel social login | Open social modal → Click "Cancel" | Modal closes, returns to login |
| AUTH-016 | Empty name in social | Open Google modal → Leave name empty → Continue | Error: "Please enter your name" |
| AUTH-017 | Invalid email in social | Enter invalid email format | Error: "Please enter a valid email" |

### 1.4 Session Persistence
| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| AUTH-018 | Token storage | Login → Close app → Reopen | User remains logged in |
| AUTH-019 | Logout | Go to Profile → Logout | Token cleared, redirected to login |

---

## 2. Onboarding Tests

### 2.1 Welcome Screen
| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| ONB-001 | Welcome display | New user login | Welcome screen with features shown |
| ONB-002 | Features visible | View welcome screen | Shows: Structured Training, AI-Powered Feedback, Track Progress |
| ONB-003 | Start onboarding | Click "Let's Get Started" | Navigate to Profile step |

### 2.2 Profile Step (Step 1 of 2)
| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| ONB-004 | Metric units | Select Metric → Enter height/weight | Values accepted in cm/kg |
| ONB-005 | Imperial units | Toggle to Imperial → Enter values | Values accepted in ft/lbs |
| ONB-006 | Valid height/weight | Enter height: 175, weight: 70 | Continue button enabled |
| ONB-007 | Empty fields | Leave height/weight empty → Continue | Error or validation message |
| ONB-008 | Unit toggle | Switch between Metric/Imperial | Input placeholders update accordingly |

### 2.3 Experience Step (Step 2 of 2)
| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| ONB-009 | Select Beginner | Click "Practice as a Beginner" | Option highlighted with checkmark |
| ONB-010 | Select Intermediate | Click "Learn More Skills" | Option highlighted |
| ONB-011 | Select Advanced | Click "Advanced Training" | Option highlighted |
| ONB-012 | Complete setup | Select option → Click "Complete Setup" | Profile saved, navigate to Home |
| ONB-013 | Skip onboarding | Return user (onboarding_completed=true) | Goes directly to Home |

---

## 3. Home Screen Tests

### 3.1 Layout & Display
| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| HOME-001 | User greeting | Login and view Home | "Hello, [FirstName]!" displayed |
| HOME-002 | Side-by-side cards | View practice options | Solo and Team cards displayed horizontally |
| HOME-003 | Solo card styling | View Solo Practice card | Green border, "Instant Start" badge |
| HOME-004 | Team card styling | View Team Practice card | Shows "2-10 players" |
| HOME-005 | Join Session card | Scroll down | Full-width Join Session card visible |
| HOME-006 | Features grid | View features section | 4 features in 2x2 grid |
| HOME-007 | ICC Guidelines card | Scroll down | "ICC Guidelines 2025" card with NEW badge |

### 3.2 Navigation
| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| HOME-008 | Tab bar display | View bottom navigation | 4 tabs: Home, Reels, Sessions, Profile |
| HOME-009 | Home tab active | On Home screen | Home tab highlighted green |
| HOME-010 | Navigate to Reels | Tap Reels tab | Reels screen opens |
| HOME-011 | Navigate to Sessions | Tap Sessions tab | Sessions list opens |
| HOME-012 | Navigate to Profile | Tap Profile tab | Profile screen opens |

### 3.3 Practice Selection
| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| HOME-013 | Open Solo config | Tap Solo Practice card | Configuration modal opens |
| HOME-014 | Open Team config | Tap Team Practice card | Configuration modal with player count |
| HOME-015 | Open Join modal | Tap Join Session | Join code modal opens |

---

## 4. Session Management Tests

### 4.1 Session Configuration Modal
| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| SESS-001 | Solo modal title | Open Solo Practice | Title shows "Solo Practice" |
| SESS-002 | Team modal title | Open Team Practice | Title shows "Team Practice" |
| SESS-003 | Player count (Team) | Open Team modal | Player count selector (2-6) visible |
| SESS-004 | Select skill level | Tap Beginner/Intermediate/Advanced | Selected option highlighted |
| SESS-005 | Set duration | Enter 60 in duration field | Value accepted |
| SESS-006 | Min duration validation | Enter 20 → Proceed | Error: "Duration must be at least 30 minutes" |
| SESS-007 | Select focus area | Tap Batting/Bowling/Fielding | Selected option highlighted |
| SESS-008 | Optional goal | Leave goal empty | Shows "AI will create personalized plan" hint |
| SESS-009 | Custom goal | Enter "Improve cover drive" | Goal text saved |
| SESS-010 | Proceed to camera | Click "Next: Check Camera Area" | Navigate to camera setup |
| SESS-011 | Close modal | Tap X button | Modal closes |

### 4.2 Join Session
| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| SESS-012 | Enter join code | Enter 6-digit code | Code accepted |
| SESS-013 | Valid join code | Enter valid session code → Join | Joined session, navigate to camera |
| SESS-014 | Invalid join code | Enter non-existent code | Error: "Session not found" |
| SESS-015 | Empty join code | Click Join with empty field | Error: "Please enter a join code" |

### 4.3 Session List
| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| SESS-016 | View sessions | Go to Sessions tab | List of user's sessions displayed |
| SESS-017 | Session card info | View session card | Shows focus area, status, date |
| SESS-018 | Open session detail | Tap on session | Session detail screen opens |
| SESS-019 | Empty state | User with no sessions | "No sessions yet" message |
| SESS-020 | Pull to refresh | Pull down on list | Sessions refreshed |

### 4.4 Session Detail
| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| SESS-021 | View session info | Open session detail | Shows all session details |
| SESS-022 | Join code display | View team session | Join code visible for sharing |
| SESS-023 | Participant list | View team session | List of participants shown |
| SESS-024 | Delete session | Host clicks Delete | Confirmation → Session deleted |
| SESS-025 | Non-host delete | Non-host views session | Delete option not visible |

---

## 5. Camera & Recording Tests

### 5.1 Camera Permission
| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| CAM-001 | Permission request | Open camera screen (no permission) | Permission request UI shown |
| CAM-002 | Grant permission | Click "Grant Permission" | Camera preview activates |
| CAM-003 | Skip camera | Click "Skip & Start Without Camera" | Session starts without camera |
| CAM-004 | Camera icon | View permission screen | Camera icon displayed |

### 5.2 Arena Marking (4-Point System)
| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| CAM-005 | Mark first point | Tap on camera view | Point 1 marker appears with "1" |
| CAM-006 | Mark second point | Tap another location | Point 2 marker appears |
| CAM-007 | Mark third point | Tap third location | Point 3 marker appears |
| CAM-008 | Mark fourth point | Tap fourth location | Point 4 marker, auto-proceed to position |
| CAM-009 | Progress dots | Mark points | Progress dots fill (1-4) |
| CAM-010 | Reset points | Click "Reset Points" | All markers cleared |
| CAM-011 | Instructions | View arena step | "Tap to mark 4 corners" instruction |

### 5.3 Player Position Marking
| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| CAM-012 | Position marker | Complete arena marking | Draggable marker appears |
| CAM-013 | Drag marker | Drag marker to new position | Marker moves with finger |
| CAM-014 | Batting position label | Focus area = batting | Shows "batting crease" |
| CAM-015 | Bowling position label | Focus area = bowling | Shows "bowling mark" |
| CAM-016 | Fielding position label | Focus area = fielding | Shows "fielding position" |
| CAM-017 | Confirm position | Click "Confirm Position" | Proceed to ready state |

### 5.4 Video Recording
| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| CAM-018 | Ready state | Confirm position | "Ready to Record!" message |
| CAM-019 | Recording tip | View ready state | Tip about 30-second trim shown |
| CAM-020 | Start recording | Tap record button | Recording starts, timer begins |
| CAM-021 | Recording indicator | During recording | Red dot + timer visible |
| CAM-022 | Timer increment | Wait during recording | Timer counts up (MM:SS) |
| CAM-023 | Stop recording | Tap stop button | Recording stops, preview state |
| CAM-024 | Camera flip | Tap flip button | Switch front/back camera |
| CAM-025 | Max duration | Record for 20+ minutes | Recording auto-stops at limit |

### 5.5 Recording Preview
| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| CAM-026 | Preview state | Stop recording | "Recording Complete!" message |
| CAM-027 | Duration display | View preview | Shows recorded duration |
| CAM-028 | Retake option | Click "Retake" | Reset to ready state |
| CAM-029 | Trim option | Click "Trim & Upload" | Navigate to video trimmer |

---

## 6. Video Trimmer Tests

### 6.1 Video Loading
| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| TRIM-001 | Video preview | Open trimmer | Video preview displayed |
| TRIM-002 | Loading state | Video loading | Loading spinner shown |
| TRIM-003 | Play/pause | Tap video | Toggle play/pause |

### 6.2 Trim Selection
| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| TRIM-004 | Trim slider | View trimmer | Slider for 30-second selection |
| TRIM-005 | Time display | Adjust slider | Shows start-end time (e.g., "00:10 - 00:40") |
| TRIM-006 | Slider range | Move slider | Limited to video duration - 30 sec |
| TRIM-007 | Preview clip | Click "Preview Selected Clip" | Plays 30-second segment |
| TRIM-008 | Seek to position | Adjust slider | Video seeks to position |

### 6.3 Category Selection
| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| TRIM-009 | Category chips | View category section | 5 categories displayed |
| TRIM-010 | Select Batting | Tap Batting chip | Batting selected, highlighted |
| TRIM-011 | Select Bowling | Tap Bowling chip | Bowling selected |
| TRIM-012 | Select Fielding | Tap Fielding chip | Fielding selected |
| TRIM-013 | Select Workouts | Tap Workouts chip | Workouts selected |
| TRIM-014 | Select Coach Tips | Tap Coach Tips chip | Coach Tips selected |
| TRIM-015 | Default category | Open trimmer | Focus area pre-selected |

### 6.4 Level Selection
| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| TRIM-016 | Level options | View level section | Local, Domestic, International |
| TRIM-017 | Select Local | Tap Local | Local selected |
| TRIM-018 | Select Domestic | Tap Domestic | Domestic selected |
| TRIM-019 | Select International | Tap International | International selected |

### 6.5 Share & Upload
| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| TRIM-020 | Share toggle | View share section | Toggle switch visible |
| TRIM-021 | Enable sharing | Toggle ON | "Share as Public Reel" enabled |
| TRIM-022 | Disable sharing | Toggle OFF | Private upload only |
| TRIM-023 | Upload button text (public) | Sharing ON | "Upload & Share" button |
| TRIM-024 | Upload button text (private) | Sharing OFF | "Upload for AI Analysis" button |
| TRIM-025 | Upload success | Click Upload | Success message, navigate home |
| TRIM-026 | Upload loading | During upload | Loading spinner shown |

---

## 7. Reels Feed Tests

### 7.1 Reels Tab
| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| REEL-001 | Tab icon | View tab bar | Play circle icon for Reels |
| REEL-002 | Tab navigation | Tap Reels tab | Reels feed opens |
| REEL-003 | Full screen video | View reel | Video fills screen (minus tab bar) |

### 7.2 Category Filters
| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| REEL-004 | Filter bar | Open Reels | Category filters at top |
| REEL-005 | All filter | Tap "All" | Shows all public reels |
| REEL-006 | Batting filter | Tap "Batting" | Shows only batting reels |
| REEL-007 | Bowling filter | Tap "Bowling" | Shows only bowling reels |
| REEL-008 | Fielding filter | Tap "Fielding" | Shows only fielding reels |
| REEL-009 | Workouts filter | Tap "Workouts" | Shows only workout reels |
| REEL-010 | Tips filter | Tap "Tips" | Shows only coach tips reels |
| REEL-011 | Filter highlight | Select filter | Selected filter highlighted |

### 7.3 Video Playback
| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| REEL-012 | Auto-play | Scroll to reel | Video auto-plays |
| REEL-013 | Auto-pause | Scroll away | Previous video pauses |
| REEL-014 | Tap to pause | Tap video | Video pauses, play icon shown |
| REEL-015 | Tap to play | Tap paused video | Video resumes |
| REEL-016 | Loop playback | Video ends | Video loops from start |
| REEL-017 | Mute toggle | Tap mute button | Sound toggles on/off |

### 7.4 Vertical Scrolling
| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| REEL-018 | Swipe up | Swipe up on video | Next reel loads |
| REEL-019 | Swipe down | Swipe down | Previous reel loads |
| REEL-020 | Snap to video | Partial swipe | Snaps to nearest video |
| REEL-021 | Scroll momentum | Fast swipe | Smooth scrolling with snap |

### 7.5 Reel Interactions
| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| REEL-022 | Like button | View reel | Heart icon visible |
| REEL-023 | Like reel | Tap heart | Heart fills red, count increases |
| REEL-024 | Unlike reel | Tap filled heart | Heart unfills, count decreases |
| REEL-025 | Like count | View reel | Shows like count |
| REEL-026 | Comment button | View reel | Comment icon with count |
| REEL-027 | Share button | View reel | Share icon visible |

### 7.6 Reel Info Display
| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| REEL-028 | User avatar | View reel | User initial in circle |
| REEL-029 | Username | View reel | Username displayed |
| REEL-030 | Level badge | View reel | Local/Domestic/International badge |
| REEL-031 | Description | View reel | Description text (if any) |
| REEL-032 | Category tag | View reel | Category pill shown |

### 7.7 Empty & Loading States
| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| REEL-033 | Empty state | No reels available | "No Reels Yet" message |
| REEL-034 | Loading state | Fetching reels | Loading spinner |
| REEL-035 | Pull to refresh | Pull down on feed | Reels refreshed |

---

## 8. ICC Guidelines Tests

### 8.1 Access & Navigation
| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| ICC-001 | Access from Home | Tap "ICC Guidelines 2025" card | ICC screen opens |
| ICC-002 | Header display | View ICC screen | "ICC Guidelines" title, 2025 badge |
| ICC-003 | Back button | Tap back arrow | Returns to previous screen |

### 8.2 Tab Navigation
| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| ICC-004 | Default tab | Open ICC screen | "Rules 2025" tab active |
| ICC-005 | Switch to Techniques | Tap "Techniques" tab | Techniques content shown |
| ICC-006 | Switch to Safety | Tap "Safety" tab | Safety content shown |
| ICC-007 | Switch to Warm-up | Tap "Warm-up" tab | Warm-up content shown |
| ICC-008 | Tab highlight | Select tab | Active tab highlighted green |

### 8.3 Rules 2025 Tab
| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| ICC-009 | Rule changes list | View Rules tab | 6+ rule changes displayed |
| ICC-010 | Stop Clock rule | View rule card | Title, description, format badge |
| ICC-011 | Expand rule | Tap rule card | Details expand with more info |
| ICC-012 | Collapse rule | Tap expanded rule | Details collapse |
| ICC-013 | Effective date | Expand rule | Shows effective date |
| ICC-014 | Format conditions | Scroll down | TEST, ODI, T20 format cards |
| ICC-015 | Expand format | Tap format card | Shows overs, innings, DRS info |

### 8.4 Techniques Tab
| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| ICC-016 | Batting section | View Techniques | "Batting Techniques" header |
| ICC-017 | Stance card | View batting section | Batting Stance expandable card |
| ICC-018 | Stance key points | Expand Stance | Shows 7 key points |
| ICC-019 | Stance faults | Expand Stance | Shows common faults in red |
| ICC-020 | Shots card | View batting section | Cricket Shots expandable card |
| ICC-021 | Defensive shots | Expand Shots | Forward Defense, Back Foot Defense |
| ICC-022 | Attacking shots | Expand Shots | Cover Drive, Straight Drive, Pull, Cut |
| ICC-023 | Bowling section | Scroll down | "Bowling Techniques" header |
| ICC-024 | Fast bowling | View bowling | Fast Bowling Action card |
| ICC-025 | Legal requirements | Expand bowling | Shows 15° arm flexion limit |
| ICC-026 | Fielding section | Scroll down | "Fielding Techniques" header |
| ICC-027 | Catching card | View fielding | Catching expandable card |

### 8.5 Safety Tab
| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| ICC-028 | Batting equipment | View Safety | Batting Equipment card |
| ICC-029 | Equipment list | Expand batting | 8 equipment items listed |
| ICC-030 | Helmet mandatory | View list | "Helmet mandatory" highlighted |
| ICC-031 | Fielding equipment | View Safety | Fielding Equipment card |
| ICC-032 | Practice area | View Safety | Practice Area card |
| ICC-033 | Heat guidelines | View Safety | Heat Guidelines card |
| ICC-034 | Hydration reminder | Expand heat | "Regular hydration breaks" listed |

### 8.6 Warm-up Tab
| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| ICC-035 | Warm-up protocol | View Warm-up | "ICC Warm-up Protocol" header |
| ICC-036 | Duration display | View header | "10 minute structured warm-up" |
| ICC-037 | Phase 1 | View warm-up | Light Cardio (3 min) |
| ICC-038 | Phase 2 | View warm-up | Dynamic Stretching (4 min) |
| ICC-039 | Phase 3 | View warm-up | Cricket-Specific Activation (3 min) |
| ICC-040 | Exercise list | View phase | Specific exercises listed |
| ICC-041 | Cool-down section | Scroll down | "Cool-down Protocol" header |
| ICC-042 | Cool-down phases | View cool-down | 3 phases with exercises |

---

## 9. Profile Tests

### 9.1 Profile Display
| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| PROF-001 | User name | View Profile | Full name displayed |
| PROF-002 | User email | View Profile | Email address shown |
| PROF-003 | Avatar | View Profile | User avatar or initial |
| PROF-004 | Experience level | View Profile | Beginner/Intermediate/Advanced |
| PROF-005 | Physical stats | View Profile | Height and weight displayed |

### 9.2 Profile Actions
| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| PROF-006 | Edit profile | Tap Edit button | Edit mode enabled |
| PROF-007 | Save changes | Edit → Save | Changes persisted |
| PROF-008 | Logout | Tap Logout | Confirm → Return to login |
| PROF-009 | Logout confirmation | Tap Logout | Confirmation dialog shown |

---

## 10. API Integration Tests

### 10.1 Authentication APIs
| Test ID | Endpoint | Method | Test |
|---------|----------|--------|------|
| API-001 | /api/auth/register | POST | Valid registration returns JWT |
| API-002 | /api/auth/login | POST | Valid login returns JWT |
| API-003 | /api/auth/social | POST | Social auth creates user |
| API-004 | /api/auth/onboarding | POST | Updates user profile |
| API-005 | /api/auth/me | GET | Returns current user |

### 10.2 Session APIs
| Test ID | Endpoint | Method | Test |
|---------|----------|--------|------|
| API-006 | /api/sessions | POST | Creates new session |
| API-007 | /api/sessions/my-sessions/list | GET | Returns user's sessions |
| API-008 | /api/sessions/{id} | GET | Returns session details |
| API-009 | /api/sessions/{id} | DELETE | Deletes session (host only) |
| API-010 | /api/sessions/join | POST | Joins session with code |

### 10.3 Reels APIs
| Test ID | Endpoint | Method | Test |
|---------|----------|--------|------|
| API-011 | /api/reels/upload | POST | Uploads new reel |
| API-012 | /api/reels | GET | Returns public reels |
| API-013 | /api/reels?category=batting | GET | Filters by category |
| API-014 | /api/reels/{id}/like | POST | Toggles like |
| API-015 | /api/reels/my | GET | Returns user's reels |

### 10.4 Error Handling
| Test ID | Scenario | Expected |
|---------|----------|----------|
| API-016 | Invalid JWT | 401 Unauthorized |
| API-017 | Missing required field | 422 Validation Error |
| API-018 | Resource not found | 404 Not Found |
| API-019 | Server error | 500 with error message |

---

## Test Environment

### Devices Tested
- iPhone 14 (390x844)
- Samsung Galaxy S21 (360x800)
- Web Browser (Desktop)

### Test URLs
- **Frontend:** https://reels-cricket-hub.preview.emergentagent.com
- **Backend API:** https://reels-cricket-hub.preview.emergentagent.com/api

### Test Credentials
- Create new account via registration
- Or use social login (Demo Mode)

---

## Test Summary

| Module | Total Tests | 
|--------|-------------|
| Authentication | 19 |
| Onboarding | 13 |
| Home Screen | 15 |
| Session Management | 25 |
| Camera & Recording | 29 |
| Video Trimmer | 26 |
| Reels Feed | 35 |
| ICC Guidelines | 42 |
| Profile | 9 |
| API Integration | 19 |
| **TOTAL** | **232** |

---

*Document maintained by PerfectPractice Development Team*
