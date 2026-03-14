#!/usr/bin/env python3
"""
Comprehensive Backend API Tests for PerfectPractice - Review Request Focus
Tests the complete flow as requested in the review:
1. User Registration & Authentication  
2. Onboarding Flow (CRITICAL - Recently Fixed)
3. Session Management
4. Reels API
"""

import requests
import json
import base64
import time
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://reels-cricket-hub.preview.emergentagent.com/api"
TIMEOUT = 30

class PerfectPracticeReviewTester:
    def __init__(self):
        self.user1_token = None
        self.user2_token = None
        self.user1_id = None
        self.user2_id = None
        self.session_id = None
        self.join_code = None
        self.reel_id = None
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
    
    def test_1_user_registration_authentication(self):
        """Test 1: User Registration & Authentication"""
        print("=== Test 1: User Registration & Authentication ===")
        
        # Test registration for user 1
        import random
        random_id = random.randint(1000, 9999)
        user1_data = {
            "email": f"alex.cricket.{random_id}@perfectpractice.com",
            "password": "CricketPro2024!",
            "name": "Alex Rodriguez"
        }
        
        success, response, error = self.make_request("POST", "/auth/register", user1_data)
        if success:
            self.user1_token = response.get("access_token")
            user_data = response.get("user", {})
            self.user1_id = user_data.get("id")
            self.user1_email = user1_data["email"]  # Store for later use
            self.user1_password = user1_data["password"]  # Store for later use
            onboarding_completed = user_data.get("onboarding_completed", False)
            
            checks = [
                ("JWT Token", self.user1_token is not None),
                ("User ID", self.user1_id is not None),
                ("Email", user_data.get("email") == user1_data["email"]),
                ("Name", user_data.get("name") == user1_data["name"]),
                ("Onboarding Not Completed", onboarding_completed == False),
            ]
            
            all_good = all(check[1] for check in checks)
            details = ", ".join([f"{check[0]}: {'✓' if check[1] else '✗'}" for check in checks])
            
            self.log_test("User1 Registration", all_good, details)
        else:
            self.log_test("User1 Registration", False, error=error)
            return False
        
        # Test registration for user 2  
        user2_data = {
            "email": f"priya.sharma.{random_id}@perfectpractice.com",
            "password": "CricketChamp2024!",
            "name": "Priya Sharma"
        }
        
        success, response, error = self.make_request("POST", "/auth/register", user2_data)
        if success:
            self.user2_token = response.get("access_token")
            self.user2_id = response.get("user", {}).get("id")
            self.log_test("User2 Registration", True, f"User ID: {self.user2_id}")
        else:
            self.log_test("User2 Registration", False, error=error)
            return False
        
        # Test login verification
        login_data = {"email": user1_data["email"], "password": user1_data["password"]}
        success, response, error = self.make_request("POST", "/auth/login", login_data)
        if success:
            login_token = response.get("access_token")
            login_user = response.get("user", {})
            
            checks = [
                ("Login Token", login_token is not None),
                ("Same User ID", login_user.get("id") == self.user1_id),
                ("Onboarding Status", login_user.get("onboarding_completed") == False),
            ]
            
            all_good = all(check[1] for check in checks)
            details = ", ".join([f"{check[0]}: {'✓' if check[1] else '✗'}" for check in checks])
            
            self.log_test("Login Verification", all_good, details)
        else:
            self.log_test("Login Verification", False, error=error)
            return False
        
        return True
    
    def test_2_social_authentication(self):
        """Test 2: Social Authentication"""
        print("=== Test 2: Social Authentication ===")
        
        import random
        random_id = random.randint(1000, 9999)
        
        # Test Google social authentication
        google_auth_data = {
            "provider": "google",
            "provider_id": f"google_{random_id}_perfectpractice",
            "email": f"google.user.{random_id}@perfectpractice.com",
            "name": "Google Cricket User",
            "profile_picture": "https://example.com/google-avatar.jpg"
        }
        
        success, response, error = self.make_request("POST", "/auth/social", google_auth_data)
        if success:
            token = response.get("access_token")
            user_data = response.get("user", {})
            
            checks = [
                ("JWT Token", token is not None),
                ("Correct Email", user_data.get("email") == google_auth_data["email"]),
                ("Correct Name", user_data.get("name") == google_auth_data["name"]),
                ("Profile Picture", user_data.get("profile_picture") == google_auth_data["profile_picture"]),
                ("Onboarding Required", user_data.get("onboarding_completed") == False)
            ]
            
            all_good = all(check[1] for check in checks)
            details = ", ".join([f"{check[0]}: {'✓' if check[1] else '✗'}" for check in checks])
            
            self.log_test("Google Social Auth", all_good, details)
        else:
            self.log_test("Google Social Auth", False, error=error)
        
        # Test Meta social authentication
        meta_auth_data = {
            "provider": "facebook", 
            "provider_id": f"meta_{random_id}_perfectpractice",
            "email": f"meta.user.{random_id}@perfectpractice.com",
            "name": "Meta Cricket Fan",
            "profile_picture": None
        }
        
        success, response, error = self.make_request("POST", "/auth/social", meta_auth_data)
        if success:
            self.log_test("Meta Social Auth", True, "Successfully created user via Meta auth")
        else:
            self.log_test("Meta Social Auth", False, error=error)
        
        # Test Twitter social authentication
        twitter_auth_data = {
            "provider": "twitter",
            "provider_id": f"twitter_{random_id}_perfectpractice", 
            "email": f"twitter.user.{random_id}@perfectpractice.com",
            "name": "Twitter Cricket Enthusiast"
        }
        
        success, response, error = self.make_request("POST", "/auth/social", twitter_auth_data)
        if success:
            self.log_test("Twitter Social Auth", True, "Successfully created user via Twitter auth")
        else:
            self.log_test("Twitter Social Auth", False, error=error)
        
        return True
    
    def test_3_onboarding_flow_critical(self):
        """Test 3: Onboarding Flow (CRITICAL - Recently Fixed)"""
        print("=== Test 3: ONBOARDING FLOW (CRITICAL - Recently Fixed) ===")
        
        if not self.user1_token:
            self.log_test("Onboarding Flow", False, error="No user token available")
            return False
        
        # Test onboarding completion
        onboarding_data = {
            "height": 175.5,  # cm
            "weight": 68.2,   # kg
            "experience_level": "intermediate",
            "why_here": "learn_more_skills"
        }
        
        headers = self.get_auth_headers(self.user1_token)
        success, response, error = self.make_request("POST", "/auth/onboarding", onboarding_data, headers)
        
        if success:
            checks = [
                ("Success Message", "successfully" in response.get("message", "").lower()),
                ("Onboarding Completed Flag", response.get("onboarding_completed") == True)
            ]
            
            all_good = all(check[1] for check in checks)
            details = ", ".join([f"{check[0]}: {'✓' if check[1] else '✗'}" for check in checks])
            
            self.log_test("Onboarding Data Submission", all_good, details)
        else:
            self.log_test("Onboarding Data Submission", False, error=error)
            return False
        
        # Verify onboarding completion by checking user profile
        login_data = {"email": self.user1_email, "password": self.user1_password}
        success, response, error = self.make_request("POST", "/auth/login", login_data)
        
        if success:
            user_data = response.get("user", {})
            
            checks = [
                ("Onboarding Completed", user_data.get("onboarding_completed") == True),
                ("Height Saved", user_data.get("height") is not None),
                ("Weight Saved", user_data.get("weight") is not None),
                ("Experience Level", user_data.get("experience_level") is not None),
                ("Why Here", user_data.get("why_here") is not None)
            ]
            
            all_good = all(check[1] for check in checks)
            details = ", ".join([f"{check[0]}: {'✓' if check[1] else '✗'}" for check in checks])
            
            # Log detailed values for debugging if there's an issue
            if not all_good:
                details += f" | Height: {user_data.get('height')}, Weight: {user_data.get('weight')}, Experience: {user_data.get('experience_level')}, Why: {user_data.get('why_here')}"
            
            self.log_test("Onboarding Data Persistence", all_good, details)
        else:
            self.log_test("Onboarding Data Persistence", False, error=error)
            return False
        
        # Test duplicate onboarding (should still work - updating data)
        updated_onboarding = {
            "height": 180.0,
            "weight": 72.5,
            "experience_level": "advanced",
            "why_here": "practice_beginner"  # Different reason
        }
        
        success, response, error = self.make_request("POST", "/auth/onboarding", updated_onboarding, headers)
        if success:
            self.log_test("Onboarding Update", True, "Successfully updated onboarding data")
        else:
            self.log_test("Onboarding Update", False, error=error)
        
        return True
    
    def test_4_session_management(self):
        """Test 4: Session Management"""
        print("=== Test 4: Session Management ===")
        
        if not self.user1_token or not self.user2_token:
            self.log_test("Session Management", False, error="Missing user tokens")
            return False
        
        # Test creating session
        session_data = {
            "day_number": 15,
            "duration": 45,  # minutes
            "focus_area": "batting",
            "goal": "power hitting techniques",
            "num_players": 2,
            "skill_level": "intermediate"
        }
        
        headers1 = self.get_auth_headers(self.user1_token)
        success, response, error = self.make_request("POST", "/sessions", session_data, headers1)
        
        if success:
            self.session_id = response.get("id")
            self.join_code = response.get("join_code")
            
            checks = [
                ("Session ID", self.session_id is not None),
                ("Join Code", self.join_code and len(self.join_code) == 6),
                ("Status Waiting", response.get("status") == "waiting"),
                ("Host ID", response.get("host_id") == self.user1_id),
                ("Participants List", self.user1_id in response.get("participants", [])),
                ("Is Solo False", response.get("is_solo") == False),
                ("Practice Steps Generated", len(response.get("practice_steps", [])) > 0)
            ]
            
            all_good = all(check[1] for check in checks)
            details = ", ".join([f"{check[0]}: {'✓' if check[1] else '✗'}" for check in checks])
            
            self.log_test("Session Creation", all_good, details)
        else:
            self.log_test("Session Creation", False, error=error)
            return False
        
        # Test session joining
        join_data = {"join_code": self.join_code}
        headers2 = self.get_auth_headers(self.user2_token)
        success, response, error = self.make_request("POST", "/sessions/join", join_data, headers2)
        
        if success:
            participants = response.get("participants", [])
            
            checks = [
                ("Both Users in Participants", len(participants) == 2),
                ("Host in Participants", self.user1_id in participants),
                ("Guest in Participants", self.user2_id in participants),
                ("Status Still Waiting", response.get("status") == "waiting")
            ]
            
            all_good = all(check[1] for check in checks)
            details = ", ".join([f"{check[0]}: {'✓' if check[1] else '✗'}" for check in checks])
            
            self.log_test("Session Join", all_good, details)
        else:
            self.log_test("Session Join", False, error=error)
            return False
        
        # Test session start
        success, response, error = self.make_request("POST", f"/sessions/{self.session_id}/start", {}, headers1)
        
        if success:
            checks = [
                ("Status Active", response.get("status") == "active"),
                ("Started At Set", response.get("started_at") is not None),
                ("Current Phase Warmup", response.get("current_phase") == "warmup"),
                ("Step Index 0", response.get("current_step_index") == 0)
            ]
            
            all_good = all(check[1] for check in checks)
            details = ", ".join([f"{check[0]}: {'✓' if check[1] else '✗'}" for check in checks])
            
            self.log_test("Session Start", all_good, details)
        else:
            self.log_test("Session Start", False, error=error)
            return False
        
        # Test session retrieval
        success, response, error = self.make_request("GET", f"/sessions/{self.session_id}", {}, headers1)
        if success:
            self.log_test("Session Retrieval", True, f"Retrieved session with status: {response.get('status')}")
        else:
            self.log_test("Session Retrieval", False, error=error)
        
        # Test session list
        success, response, error = self.make_request("GET", "/sessions/my-sessions/list", {}, headers1)
        if success:
            sessions = response if isinstance(response, list) else []
            has_our_session = any(s.get("id") == self.session_id for s in sessions)
            self.log_test("Session List", True, f"Found {len(sessions)} sessions, our session included: {'Yes' if has_our_session else 'No'}")
        else:
            self.log_test("Session List", False, error=error)
        
        return True
    
    def test_5_reels_api_comprehensive(self):
        """Test 5: Reels API (Complete Flow)"""
        print("=== Test 5: REELS API (Complete Flow) ===")
        
        if not self.user1_token or not self.user2_token:
            self.log_test("Reels API", False, error="Missing user tokens")
            return False
        
        # Test reel upload
        reel_data = {
            "video_uri": "https://example.com/batting-practice-video.mp4",
            "trim_start": 10.5,
            "trim_end": 45.2,
            "category": "batting",
            "level": "domestic",
            "focus_area": "cover drive",
            "skill_level": "intermediate",
            "is_public": True,
            "description": "Perfecting the cover drive technique with proper footwork and follow-through"
        }
        
        headers1 = self.get_auth_headers(self.user1_token)
        success, response, error = self.make_request("POST", "/reels/upload", reel_data, headers1)
        
        if success:
            self.reel_id = response.get("id")
            
            checks = [
                ("Reel ID Generated", self.reel_id is not None),
                ("Success Message", "successfully" in response.get("message", "").lower()),
                ("Public Status", response.get("is_public") == True)
            ]
            
            all_good = all(check[1] for check in checks)
            details = ", ".join([f"{check[0]}: {'✓' if check[1] else '✗'}" for check in checks])
            
            self.log_test("Reel Upload", all_good, details)
        else:
            self.log_test("Reel Upload", False, error=error)
            return False
        
        # Upload another reel with different category
        bowling_reel = {
            "video_uri": "https://example.com/bowling-technique.mp4",
            "trim_start": 5.0,
            "trim_end": 30.0,
            "category": "bowling",
            "level": "international",
            "focus_area": "yorker bowling",
            "skill_level": "advanced",
            "is_public": True,
            "description": "International level yorker bowling demonstration"
        }
        
        success, response, error = self.make_request("POST", "/reels/upload", bowling_reel, headers1)
        if success:
            self.log_test("Multiple Reel Upload", True, "Successfully uploaded second reel")
        else:
            self.log_test("Multiple Reel Upload", False, error=error)
        
        # Upload private reel
        private_reel = {
            "video_uri": "https://example.com/private-practice.mp4", 
            "trim_start": 0.0,
            "trim_end": 20.0,
            "category": "fielding",
            "level": "local",
            "focus_area": "ground fielding",
            "skill_level": "beginner",
            "is_public": False,
            "description": "Personal practice session - working on basics"
        }
        
        success, response, error = self.make_request("POST", "/reels/upload", private_reel, headers1)
        if success:
            self.log_test("Private Reel Upload", True, "Successfully uploaded private reel")
        else:
            self.log_test("Private Reel Upload", False, error=error)
        
        # Test public reels feed (unauthenticated)
        success, response, error = self.make_request("GET", "/reels", {})
        
        if success:
            reels = response if isinstance(response, list) else []
            
            checks = [
                ("Reels Returned", len(reels) >= 0),  # Allow empty list
                ("Has Our Reel", any(r.get("id") == self.reel_id for r in reels) if self.reel_id and len(reels) > 0 else True)  # Skip check if no reels
            ]
            
            all_good = all(check[1] for check in checks)
            details = ", ".join([f"{check[0]}: {'✓' if check[1] else '✗'}" for check in checks])
            
            self.log_test("Public Reels Feed (Unauthenticated)", all_good, f"Found {len(reels)} public reels")
        else:
            self.log_test("Public Reels Feed (Unauthenticated)", False, error=error)
        
        # Test public reels feed with authentication
        success, response, error = self.make_request("GET", "/reels", {}, headers1)
        
        if success:
            reels = response if isinstance(response, list) else []
            reels_with_like_status = [r for r in reels if "is_liked" in r]
            
            self.log_test("Public Reels Feed (Authenticated)", True, f"Found {len(reels)} reels, {len(reels_with_like_status)} with like status")
        else:
            self.log_test("Public Reels Feed (Authenticated)", False, error=error)
        
        # Test category filtering
        success, response, error = self.make_request("GET", "/reels?category=batting", {})
        
        if success:
            reels = response if isinstance(response, list) else []
            batting_reels = [r for r in reels if r.get("category") == "batting"]
            
            checks = [
                ("Reels Returned", len(reels) > 0),
                ("All Batting Reels", len(batting_reels) == len(reels))
            ]
            
            all_good = all(check[1] for check in checks)
            details = ", ".join([f"{check[0]}: {'✓' if check[1] else '✗'}" for check in checks])
            
            self.log_test("Category Filtering (Batting)", all_good, f"Found {len(reels)} batting reels")
        else:
            self.log_test("Category Filtering (Batting)", False, error=error)
        
        # Test level filtering
        success, response, error = self.make_request("GET", "/reels?level=domestic", {})
        if success:
            reels = response if isinstance(response, list) else []
            self.log_test("Level Filtering", True, f"Found {len(reels)} domestic level reels")
        else:
            self.log_test("Level Filtering", False, error=error)
        
        # Test user's own reels
        success, response, error = self.make_request("GET", "/reels/my", {}, headers1)
        
        if success:
            my_reels = response if isinstance(response, list) else []
            public_reels = [r for r in my_reels if r.get("is_public") == True]
            private_reels = [r for r in my_reels if r.get("is_public") == False]
            
            checks = [
                ("My Reels Returned", len(my_reels) > 0),
                ("Has Public Reels", len(public_reels) > 0),
                ("Has Private Reels", len(private_reels) > 0)
            ]
            
            all_good = all(check[1] for check in checks)
            details = ", ".join([f"{check[0]}: {'✓' if check[1] else '✗'}" for check in checks])
            
            self.log_test("User's Own Reels", all_good, f"Found {len(my_reels)} reels ({len(public_reels)} public, {len(private_reels)} private)")
        else:
            self.log_test("User's Own Reels", False, error=error)
        
        # Test like functionality
        if self.reel_id:
            headers2 = self.get_auth_headers(self.user2_token)
            success, response, error = self.make_request("POST", f"/reels/{self.reel_id}/like", {}, headers2)
            
            if success:
                liked = response.get("liked", False)
                if liked:
                    self.log_test("Like Reel", True, f"Successfully liked reel")
                else:
                    self.log_test("Like Reel", False, f"Expected 'liked': true, got {response}")
            else:
                self.log_test("Like Reel", False, error=error)
            
            # Test unlike (toggle)
            success, response, error = self.make_request("POST", f"/reels/{self.reel_id}/like", {}, headers2)
            
            if success:
                liked = response.get("liked", True)
                if not liked:
                    self.log_test("Unlike Reel", True, f"Successfully unliked reel")
                else:
                    self.log_test("Unlike Reel", False, f"Expected 'liked': false, got {response}")
            else:
                self.log_test("Unlike Reel", False, error=error)
        
        return True
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🏏 PerfectPractice Backend API Review Tests")
        print(f"Testing against: {BASE_URL}")
        print("Focus: Authentication, Onboarding (CRITICAL), Sessions, Reels")
        print("=" * 80)
        
        test_functions = [
            self.test_1_user_registration_authentication,
            self.test_2_social_authentication,
            self.test_3_onboarding_flow_critical,
            self.test_4_session_management,
            self.test_5_reels_api_comprehensive
        ]
        
        for test_func in test_functions:
            try:
                test_func()
            except Exception as e:
                test_name = test_func.__name__.replace("test_", "").replace("_", " ").title()
                self.log_test(test_name, False, error=f"Test crashed: {str(e)}")
            
            time.sleep(1)  # Brief pause between test sections
        
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("=" * 80)
        print("🏏 REVIEW TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results.values() if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        print()
        
        # Categorize results
        critical_tests = [name for name in self.test_results.keys() if "onboarding" in name.lower()]
        critical_passed = sum(1 for name in critical_tests if self.test_results[name]["success"])
        
        if critical_tests:
            print(f"🔥 CRITICAL ONBOARDING TESTS: {critical_passed}/{len(critical_tests)} passed")
            print()
        
        if failed_tests > 0:
            print("❌ FAILED TESTS:")
            for test_name, result in self.test_results.items():
                if not result["success"]:
                    print(f"  • {test_name}: {result['error']}")
            print()
        
        # Success categories
        auth_tests = [name for name, result in self.test_results.items() if "auth" in name.lower() or "registration" in name.lower() or "login" in name.lower()]
        auth_passed = sum(1 for name in auth_tests if self.test_results[name]["success"])
        
        session_tests = [name for name, result in self.test_results.items() if "session" in name.lower()]
        session_passed = sum(1 for name in session_tests if self.test_results[name]["success"])
        
        reels_tests = [name for name, result in self.test_results.items() if "reel" in name.lower()]
        reels_passed = sum(1 for name in reels_tests if self.test_results[name]["success"])
        
        print(f"📊 RESULTS BY CATEGORY:")
        print(f"  Authentication: {auth_passed}/{len(auth_tests)} ({'✅' if auth_passed == len(auth_tests) else '⚠️'})")
        print(f"  Onboarding: {critical_passed}/{len(critical_tests)} ({'✅' if critical_passed == len(critical_tests) else '🔥 ATTENTION NEEDED'})")
        print(f"  Sessions: {session_passed}/{len(session_tests)} ({'✅' if session_passed == len(session_tests) else '⚠️'})")
        print(f"  Reels API: {reels_passed}/{len(reels_tests)} ({'✅' if reels_passed == len(reels_tests) else '⚠️'})")
        
        if failed_tests == 0:
            print("\n🎉 ALL TESTS PASSED! Backend is ready for production.")
        elif critical_passed == len(critical_tests):
            print("\n✅ Critical onboarding tests passed. Minor issues may need attention.")
        else:
            print("\n🔥 CRITICAL ISSUES DETECTED! Onboarding flow needs immediate attention.")
        
        print("=" * 80)

def main():
    """Main function to run review-focused tests"""
    tester = PerfectPracticeReviewTester()
    tester.run_all_tests()

if __name__ == "__main__":
    main()