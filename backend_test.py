#!/usr/bin/env python3
"""
Comprehensive Backend API Tests for PerfectPractice
Tests all endpoints according to the review requirements
"""

import requests
import json
import base64
import time
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://perfect-drills.preview.emergentagent.com/api"
TIMEOUT = 30

class PerfectPracticeAPITester:
    def __init__(self):
        self.host_token = None
        self.guest_token = None
        self.host_user_id = None
        self.guest_user_id = None
        self.session_id = None
        self.join_code = None
        self.media_id = None
        self.test_results = {}
        
    def log_test(self, test_name: str, success: bool, details: str = "", error: str = ""):
        """Log test results"""
        self.test_results[test_name] = {
            "success": success,
            "details": details,
            "error": error
        }
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"    Details: {details}")
        if error:
            print(f"    Error: {error}")
        print()
    
    def make_request(self, method: str, endpoint: str, data: dict = None, headers: dict = None) -> tuple:
        """Make HTTP request and return (success, response_data, error)"""
        url = f"{BASE_URL}{endpoint}"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, timeout=TIMEOUT)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, headers=headers, timeout=TIMEOUT)
            elif method.upper() == "PUT":
                response = requests.put(url, json=data, headers=headers, timeout=TIMEOUT)
            else:
                return False, None, f"Unsupported method: {method}"
            
            if response.status_code >= 200 and response.status_code < 300:
                try:
                    return True, response.json(), ""
                except:
                    return True, response.text, ""
            else:
                try:
                    error_data = response.json()
                    return False, None, f"HTTP {response.status_code}: {error_data.get('detail', 'Unknown error')}"
                except:
                    return False, None, f"HTTP {response.status_code}: {response.text}"
                    
        except requests.exceptions.Timeout:
            return False, None, "Request timed out"
        except requests.exceptions.ConnectionError:
            return False, None, "Connection error - backend may be down"
        except Exception as e:
            return False, None, f"Unexpected error: {str(e)}"
    
    def get_auth_headers(self, token: str) -> dict:
        """Get authorization headers"""
        return {"Authorization": f"Bearer {token}"}
    
    def test_1_authentication(self):
        """Test 1: Authentication (Register and Login)"""
        print("=== Test 1: Authentication ===")
        
        # Test registration for host
        host_data = {
            "email": "host.cricket@example.com",
            "password": "SecurePass123!",
            "name": "Alex Cricket Host"
        }
        
        success, response, error = self.make_request("POST", "/auth/register", host_data)
        if success:
            self.host_token = response.get("access_token")
            self.host_user_id = response.get("user", {}).get("id")
            self.log_test("Host Registration", True, f"User ID: {self.host_user_id}")
        else:
            self.log_test("Host Registration", False, error=error)
            return False
        
        # Test registration for guest
        guest_data = {
            "email": "guest.cricket@example.com", 
            "password": "SecurePass123!",
            "name": "Sam Cricket Guest"
        }
        
        success, response, error = self.make_request("POST", "/auth/register", guest_data)
        if success:
            self.guest_token = response.get("access_token")
            self.guest_user_id = response.get("user", {}).get("id")
            self.log_test("Guest Registration", True, f"User ID: {self.guest_user_id}")
        else:
            self.log_test("Guest Registration", False, error=error)
            return False
        
        # Test login with host credentials
        login_data = {"email": host_data["email"], "password": host_data["password"]}
        success, response, error = self.make_request("POST", "/auth/login", login_data)
        if success:
            self.log_test("Host Login", True, "JWT token received")
        else:
            self.log_test("Host Login", False, error=error)
            return False
        
        # Test login with guest credentials  
        login_data = {"email": guest_data["email"], "password": guest_data["password"]}
        success, response, error = self.make_request("POST", "/auth/login", login_data)
        if success:
            self.log_test("Guest Login", True, "JWT token received")
        else:
            self.log_test("Guest Login", False, error=error)
            return False
        
        # Test duplicate registration
        success, response, error = self.make_request("POST", "/auth/register", host_data)
        if not success and "already registered" in error.lower():
            self.log_test("Duplicate Registration Protection", True, "Correctly rejected duplicate email")
        else:
            self.log_test("Duplicate Registration Protection", False, "Should reject duplicate email")
        
        # Test invalid login
        invalid_login = {"email": host_data["email"], "password": "wrongpassword"}
        success, response, error = self.make_request("POST", "/auth/login", invalid_login)
        if not success:
            self.log_test("Invalid Login Protection", True, "Correctly rejected wrong password")
        else:
            self.log_test("Invalid Login Protection", False, "Should reject wrong password")
            
        return True
    
    def test_2_session_creation(self):
        """Test 2: Session Creation"""
        print("=== Test 2: Session Creation ===")
        
        if not self.host_token:
            self.log_test("Session Creation", False, error="No host token available")
            return False
        
        # Test creating session as host
        session_data = {
            "day_number": 1,
            "duration": 60,
            "focus_area": "batting",
            "goal": "cover drive"
        }
        
        headers = self.get_auth_headers(self.host_token)
        success, response, error = self.make_request("POST", "/sessions", session_data, headers)
        
        if success:
            self.session_id = response.get("id")
            self.join_code = response.get("join_code")
            
            # Verify all required fields
            checks = [
                ("Session ID", self.session_id is not None),
                ("Join Code", self.join_code is not None and len(self.join_code) == 6),
                ("Status", response.get("status") == "waiting"),
                ("Current Phase", response.get("current_phase") == "warmup"),
                ("Warmup Steps", len(response.get("warmup_steps", [])) > 0),
                ("Practice Steps", len(response.get("practice_steps", [])) > 0),
                ("Cooldown Steps", len(response.get("cooldown_steps", [])) > 0),
                ("Host ID", response.get("host_id") == self.host_user_id),
                ("Guest ID", response.get("guest_id") is None)
            ]
            
            all_good = all(check[1] for check in checks)
            details = ", ".join([f"{check[0]}: {'✓' if check[1] else '✗'}" for check in checks])
            
            self.log_test("Session Creation", all_good, details)
        else:
            self.log_test("Session Creation", False, error=error)
            return False
        
        # Test minimum duration validation
        invalid_session = session_data.copy()
        invalid_session["duration"] = 25  # Less than 30 minutes
        
        success, response, error = self.make_request("POST", "/sessions", invalid_session, headers)
        if not success and "30 minutes" in error:
            self.log_test("Minimum Duration Validation", True, "Correctly rejected session < 30 minutes")
        else:
            self.log_test("Minimum Duration Validation", False, "Should reject sessions < 30 minutes")
        
        return True
    
    def test_3_session_join(self):
        """Test 3: Session Join"""
        print("=== Test 3: Session Join ===")
        
        if not self.guest_token or not self.join_code:
            self.log_test("Session Join", False, error="No guest token or join code available")
            return False
        
        # Test guest joining session
        join_data = {"join_code": self.join_code}
        headers = self.get_auth_headers(self.guest_token)
        
        success, response, error = self.make_request("POST", "/sessions/join", join_data, headers)
        
        if success:
            checks = [
                ("Guest ID Set", response.get("guest_id") == self.guest_user_id),
                ("Status Still Waiting", response.get("status") == "waiting"),
                ("Same Session ID", response.get("id") == self.session_id)
            ]
            
            all_good = all(check[1] for check in checks)
            details = ", ".join([f"{check[0]}: {'✓' if check[1] else '✗'}" for check in checks])
            
            self.log_test("Guest Join Session", all_good, details)
        else:
            self.log_test("Guest Join Session", False, error=error)
            return False
        
        # Test host trying to join own session (should fail)
        host_headers = self.get_auth_headers(self.host_token)
        success, response, error = self.make_request("POST", "/sessions/join", join_data, host_headers)
        
        if not success and "own session" in error.lower():
            self.log_test("Prevent Self-Join", True, "Correctly prevented host from joining own session")
        else:
            self.log_test("Prevent Self-Join", False, "Should prevent host from joining own session")
        
        # Test joining with invalid code
        invalid_join = {"join_code": "999999"}
        success, response, error = self.make_request("POST", "/sessions/join", invalid_join, headers)
        
        if not success:
            self.log_test("Invalid Join Code Protection", True, "Correctly rejected invalid join code")
        else:
            self.log_test("Invalid Join Code Protection", False, "Should reject invalid join code")
        
        return True
    
    def test_4_session_start_progression(self):
        """Test 4: Session Start & Progression"""
        print("=== Test 4: Session Start & Progression ===")
        
        if not self.host_token or not self.session_id:
            self.log_test("Session Start", False, error="No host token or session ID available")
            return False
        
        # Test starting session as host
        headers = self.get_auth_headers(self.host_token)
        success, response, error = self.make_request("POST", f"/sessions/{self.session_id}/start", {}, headers)
        
        if success:
            checks = [
                ("Status Active", response.get("status") == "active"),
                ("Started At Set", response.get("started_at") is not None),
                ("Still in Warmup", response.get("current_phase") == "warmup"),
                ("Step Index 0", response.get("current_step_index") == 0)
            ]
            
            all_good = all(check[1] for check in checks)
            details = ", ".join([f"{check[0]}: {'✓' if check[1] else '✗'}" for check in checks])
            
            self.log_test("Session Start", all_good, details)
        else:
            self.log_test("Session Start", False, error=error)
            return False
        
        # Test guest trying to start (should fail)
        guest_headers = self.get_auth_headers(self.guest_token)
        success, response, error = self.make_request("POST", f"/sessions/{self.session_id}/start", {}, guest_headers)
        
        if not success and "host" in error.lower():
            self.log_test("Only Host Can Start", True, "Correctly prevented guest from starting session")
        else:
            self.log_test("Only Host Can Start", False, "Should prevent guest from starting session")
        
        # Get session details to count steps
        success, session_data, error = self.make_request("GET", f"/sessions/{self.session_id}", {}, headers)
        if not success:
            self.log_test("Session Progression", False, error="Could not fetch session data")
            return False
        
        warmup_steps = len(session_data.get("warmup_steps", []))
        practice_steps = len(session_data.get("practice_steps", []))
        cooldown_steps = len(session_data.get("cooldown_steps", []))
        
        total_steps = warmup_steps + practice_steps + cooldown_steps
        current_phase = "warmup"
        
        # Progress through all steps
        step_count = 0
        for phase, phase_steps in [("warmup", warmup_steps), ("practice", practice_steps), ("cooldown", cooldown_steps)]:
            for i in range(phase_steps):
                success, response, error = self.make_request("POST", f"/sessions/{self.session_id}/next-step", {}, headers)
                
                if success:
                    step_count += 1
                    expected_phase = phase if i < phase_steps - 1 else ("practice" if phase == "warmup" else ("cooldown" if phase == "practice" else "cooldown"))
                    
                    if step_count < total_steps:  # Not the last step
                        actual_phase = response.get("current_phase")
                        if actual_phase != expected_phase and step_count < warmup_steps:
                            expected_phase = "warmup"  # Still in warmup
                        elif actual_phase != expected_phase and step_count < warmup_steps + practice_steps:
                            expected_phase = "practice"  # In practice
                else:
                    self.log_test(f"Step Progression #{step_count + 1}", False, error=error)
                    return False
        
        # Try to advance past the last step (should fail)
        success, response, error = self.make_request("POST", f"/sessions/{self.session_id}/next-step", {}, headers)
        if not success and "complete" in error.lower():
            self.log_test("Prevent Over-Advancement", True, "Correctly prevented advancing past final step")
        else:
            self.log_test("Prevent Over-Advancement", False, "Should prevent advancing past final step")
        
        self.log_test("Session Progression", True, f"Successfully progressed through all {total_steps} steps")
        return True
    
    def test_5_session_completion(self):
        """Test 5: Session Completion"""
        print("=== Test 5: Session Completion ===")
        
        if not self.host_token or not self.session_id:
            self.log_test("Session Completion", False, error="No host token or session ID available")
            return False
        
        headers = self.get_auth_headers(self.host_token)
        
        # Test completing session (should work now that cooldown is done)
        success, response, error = self.make_request("POST", f"/sessions/{self.session_id}/complete", {}, headers)
        
        if success:
            checks = [
                ("Status Completed", response.get("status") == "completed"),
                ("Completed At Set", response.get("completed_at") is not None)
            ]
            
            all_good = all(check[1] for check in checks)
            details = ", ".join([f"{check[0]}: {'✓' if check[1] else '✗'}" for check in checks])
            
            self.log_test("Session Completion", all_good, details)
        else:
            self.log_test("Session Completion", False, error=error)
            return False
        
        # Test guest trying to complete (should fail)
        guest_headers = self.get_auth_headers(self.guest_token)
        success, response, error = self.make_request("POST", f"/sessions/{self.session_id}/complete", {}, guest_headers)
        
        if not success and "host" in error.lower():
            self.log_test("Only Host Can Complete", True, "Correctly prevented guest from completing session")
        else:
            self.log_test("Only Host Can Complete", False, "Should prevent guest from completing session")
        
        return True
    
    def test_6_activity_logging(self):
        """Test 6: Activity Logging"""
        print("=== Test 6: Activity Logging ===")
        
        # Create a new session for activity testing
        session_data = {
            "day_number": 2,
            "duration": 45,
            "focus_area": "bowling",
            "goal": "yorker delivery"
        }
        
        headers = self.get_auth_headers(self.host_token)
        success, response, error = self.make_request("POST", "/sessions", session_data, headers)
        
        if not success:
            self.log_test("Activity Test Setup", False, error=error)
            return False
        
        activity_session_id = response.get("id")
        join_code = response.get("join_code")
        
        # Guest joins
        join_data = {"join_code": join_code}
        guest_headers = self.get_auth_headers(self.guest_token)
        success, response, error = self.make_request("POST", "/sessions/join", join_data, guest_headers)
        
        if not success:
            self.log_test("Activity Test Setup", False, error=f"Guest join failed: {error}")
            return False
        
        # Start session
        success, response, error = self.make_request("POST", f"/sessions/{activity_session_id}/start", {}, headers)
        
        if not success:
            self.log_test("Activity Test Setup", False, error=f"Session start failed: {error}")
            return False
        
        self.log_test("Activity Test Setup", True, "New session created and started")
        
        # Test logging activity as host
        activity_data = {"calories": 150.5}
        success, response, error = self.make_request("POST", f"/sessions/{activity_session_id}/activities", activity_data, headers)
        
        if success:
            checks = [
                ("Activity ID", response.get("id") is not None),
                ("Correct Session", response.get("session_id") == activity_session_id),
                ("Correct User", response.get("user_id") == self.host_user_id),
                ("Correct Calories", response.get("calories") == 150.5),
                ("Logged At", response.get("logged_at") is not None)
            ]
            
            all_good = all(check[1] for check in checks)
            details = ", ".join([f"{check[0]}: {'✓' if check[1] else '✗'}" for check in checks])
            
            self.log_test("Host Activity Logging", all_good, details)
        else:
            self.log_test("Host Activity Logging", False, error=error)
        
        # Test logging activity as guest
        activity_data = {"calories": 125.0}
        success, response, error = self.make_request("POST", f"/sessions/{activity_session_id}/activities", activity_data, guest_headers)
        
        if success:
            self.log_test("Guest Activity Logging", True, f"Guest calories logged: {response.get('calories')}")
        else:
            self.log_test("Guest Activity Logging", False, error=error)
        
        # Test retrieving activities
        success, response, error = self.make_request("GET", f"/sessions/{activity_session_id}/activities", {}, headers)
        
        if success:
            activities = response if isinstance(response, list) else []
            activity_count = len(activities)
            total_calories = sum(activity.get("calories", 0) for activity in activities)
            
            self.log_test("Retrieve Activities", True, f"Found {activity_count} activities, Total calories: {total_calories}")
        else:
            self.log_test("Retrieve Activities", False, error=error)
        
        # Test logging activity on completed session (should fail)
        # First complete the session
        # Progress through all steps quickly for testing
        for _ in range(10):  # Generous number to get through all phases
            success, response, error = self.make_request("POST", f"/sessions/{activity_session_id}/next-step", {}, headers)
            if not success:
                break
        
        # Complete session
        success, response, error = self.make_request("POST", f"/sessions/{activity_session_id}/complete", {}, headers)
        
        # Try to log activity on completed session
        activity_data = {"calories": 50.0}
        success, response, error = self.make_request("POST", f"/sessions/{activity_session_id}/activities", activity_data, headers)
        
        if not success and "active" in error.lower():
            self.log_test("Prevent Activity on Completed Session", True, "Correctly prevented activity logging on completed session")
        else:
            self.log_test("Prevent Activity on Completed Session", False, "Should prevent activity logging on completed session")
        
        return True
    
    def test_7_media_upload_ai_feedback(self):
        """Test 7: Media Upload & AI Feedback"""
        print("=== Test 7: Media Upload & AI Feedback ===")
        
        if not self.session_id:
            self.log_test("Media Upload", False, error="No session ID available")
            return False
        
        # Create sample base64 image data (1x1 pixel PNG)
        sample_image_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        
        media_data = {
            "file_data": sample_image_b64,
            "file_type": "image"
        }
        
        headers = self.get_auth_headers(self.host_token)
        success, response, error = self.make_request("POST", f"/sessions/{self.session_id}/media", media_data, headers)
        
        if success:
            self.media_id = response.get("id")
            ai_feedback = response.get("ai_feedback", {})
            
            checks = [
                ("Media ID", self.media_id is not None),
                ("Correct Session", response.get("session_id") == self.session_id),
                ("Correct User", response.get("user_id") == self.host_user_id),
                ("File Type", response.get("file_type") == "image"),
                ("AI Feedback Present", ai_feedback is not None),
                ("Doing Right", isinstance(ai_feedback.get("doing_right"), list)),
                ("Needs Improvement", isinstance(ai_feedback.get("needs_improvement"), list)),
                ("Correction Tip", isinstance(ai_feedback.get("correction_tip"), str))
            ]
            
            all_good = all(check[1] for check in checks)
            details = ", ".join([f"{check[0]}: {'✓' if check[1] else '✗'}" for check in checks])
            
            self.log_test("Media Upload & AI Feedback", all_good, details)
        else:
            self.log_test("Media Upload & AI Feedback", False, error=error)
            return False
        
        # Test retrieving session media
        success, response, error = self.make_request("GET", f"/sessions/{self.session_id}/media", {}, headers)
        
        if success:
            media_list = response if isinstance(response, list) else []
            media_count = len(media_list)
            
            if media_count > 0:
                first_media = media_list[0]
                has_ai_feedback = first_media.get("ai_feedback") is not None
                self.log_test("Retrieve Session Media", True, f"Found {media_count} media items, AI feedback: {'Yes' if has_ai_feedback else 'No'}")
            else:
                self.log_test("Retrieve Session Media", False, "No media found")
        else:
            self.log_test("Retrieve Session Media", False, error=error)
        
        # Test retrieving full media data
        if self.media_id:
            success, response, error = self.make_request("GET", f"/media/{self.media_id}/full", {}, headers)
            
            if success:
                has_file_data = "file_data" in response
                self.log_test("Retrieve Full Media", True, f"File data included: {'Yes' if has_file_data else 'No'}")
            else:
                self.log_test("Retrieve Full Media", False, error=error)
        
        return True
    
    def test_8_session_retrieval(self):
        """Test 8: Session Retrieval"""
        print("=== Test 8: Session Retrieval ===")
        
        if not self.session_id:
            self.log_test("Session Retrieval", False, error="No session ID available")
            return False
        
        # Test host retrieving session
        headers = self.get_auth_headers(self.host_token)
        success, response, error = self.make_request("GET", f"/sessions/{self.session_id}", {}, headers)
        
        if success:
            checks = [
                ("Session ID Match", response.get("id") == self.session_id),
                ("Host Access", response.get("host_id") == self.host_user_id),
                ("Guest Present", response.get("guest_id") == self.guest_user_id),
                ("Status", response.get("status") == "completed")
            ]
            
            all_good = all(check[1] for check in checks)
            details = ", ".join([f"{check[0]}: {'✓' if check[1] else '✗'}" for check in checks])
            
            self.log_test("Host Session Retrieval", all_good, details)
        else:
            self.log_test("Host Session Retrieval", False, error=error)
        
        # Test guest retrieving session
        guest_headers = self.get_auth_headers(self.guest_token)
        success, response, error = self.make_request("GET", f"/sessions/{self.session_id}", {}, guest_headers)
        
        if success:
            self.log_test("Guest Session Retrieval", True, "Guest can access session details")
        else:
            self.log_test("Guest Session Retrieval", False, error=error)
        
        # Test host retrieving session list
        success, response, error = self.make_request("GET", "/sessions/my-sessions/list", {}, headers)
        
        if success:
            sessions = response if isinstance(response, list) else []
            session_count = len(sessions)
            has_our_session = any(session.get("id") == self.session_id for session in sessions)
            
            self.log_test("Host Session List", True, f"Found {session_count} sessions, Our session included: {'Yes' if has_our_session else 'No'}")
        else:
            self.log_test("Host Session List", False, error=error)
        
        # Test guest retrieving session list
        success, response, error = self.make_request("GET", "/sessions/my-sessions/list", {}, guest_headers)
        
        if success:
            sessions = response if isinstance(response, list) else []
            session_count = len(sessions)
            has_our_session = any(session.get("id") == self.session_id for session in sessions)
            
            self.log_test("Guest Session List", True, f"Found {session_count} sessions, Our session included: {'Yes' if has_our_session else 'No'}")
        else:
            self.log_test("Guest Session List", False, error=error)
        
        return True
    
    def test_9_business_logic_validation(self):
        """Test 9: Business Logic Validation"""
        print("=== Test 9: Business Logic Validation ===")
        
        # Test starting session without guest
        session_data = {
            "day_number": 3,
            "duration": 30,
            "focus_area": "fielding", 
            "goal": "close catching"
        }
        
        headers = self.get_auth_headers(self.host_token)
        success, response, error = self.make_request("POST", "/sessions", session_data, headers)
        
        if success:
            solo_session_id = response.get("id")
            
            # Try to start without guest
            success, response, error = self.make_request("POST", f"/sessions/{solo_session_id}/start", {}, headers)
            
            if not success and "guest" in error.lower():
                self.log_test("Cannot Start Without Guest", True, "Correctly prevented starting session without guest")
            else:
                self.log_test("Cannot Start Without Guest", False, "Should prevent starting session without guest")
        else:
            self.log_test("Cannot Start Without Guest", False, error=f"Setup failed: {error}")
        
        # Test unauthorized access to different session
        # Create session with different user (we'll create a new user quickly)
        other_user_data = {
            "email": "other.cricket@example.com",
            "password": "SecurePass123!",
            "name": "Other Cricket User"
        }
        
        success, response, error = self.make_request("POST", "/auth/register", other_user_data)
        if success:
            other_token = response.get("access_token")
            other_headers = self.get_auth_headers(other_token)
            
            # Try to access our session with other user
            success, response, error = self.make_request("GET", f"/sessions/{self.session_id}", {}, other_headers)
            
            if not success and ("authorized" in error.lower() or "forbidden" in error.lower()):
                self.log_test("Unauthorized Session Access Prevention", True, "Correctly prevented unauthorized access to session")
            else:
                self.log_test("Unauthorized Session Access Prevention", False, "Should prevent unauthorized access to session")
        else:
            self.log_test("Unauthorized Session Access Prevention", False, error=f"Setup failed: {error}")
        
        return True
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🏏 Starting PerfectPractice Backend API Tests")
        print(f"Testing against: {BASE_URL}")
        print("=" * 60)
        
        test_functions = [
            self.test_1_authentication,
            self.test_2_session_creation, 
            self.test_3_session_join,
            self.test_4_session_start_progression,
            self.test_5_session_completion,
            self.test_6_activity_logging,
            self.test_7_media_upload_ai_feedback,
            self.test_8_session_retrieval,
            self.test_9_business_logic_validation
        ]
        
        for test_func in test_functions:
            try:
                test_func()
            except Exception as e:
                test_name = test_func.__name__.replace("test_", "").replace("_", " ").title()
                self.log_test(test_name, False, error=f"Test crashed: {str(e)}")
            
            time.sleep(0.5)  # Brief pause between tests
        
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("=" * 60)
        print("🏏 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results.values() if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        print()
        
        if failed_tests > 0:
            print("FAILED TESTS:")
            for test_name, result in self.test_results.items():
                if not result["success"]:
                    print(f"❌ {test_name}: {result['error']}")
        else:
            print("🎉 ALL TESTS PASSED!")
        
        print("=" * 60)

def main():
    """Main function to run tests"""
    tester = PerfectPracticeAPITester()
    tester.run_all_tests()

if __name__ == "__main__":
    main()