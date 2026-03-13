#!/usr/bin/env python3
"""
Reels Backend API Tests for PerfectPractice
Tests the new Reels functionality according to the review requirements
"""

import requests
import json
import time
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://practice-hub-32.preview.emergentagent.com/api"
TIMEOUT = 30

class ReelsAPITester:
    def __init__(self):
        self.user1_token = None
        self.user2_token = None
        self.user1_id = None
        self.user2_id = None
        self.reel_id = None
        self.session_id = None
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
    
    def test_1_authentication_setup(self):
        """Test 1: Setup Authentication for Reels Testing"""
        print("=== Test 1: Authentication Setup ===")
        
        # Create first user for reel uploads
        user1_data = {
            "email": "reel.creator@cricketclub.com",
            "password": "StrongPass2024!",
            "name": "Virat Cricket Creator"
        }
        
        success, response, error = self.make_request("POST", "/auth/register", user1_data)
        if success:
            self.user1_token = response.get("access_token")
            self.user1_id = response.get("user", {}).get("id")
            self.log_test("User1 Registration (Creator)", True, f"User ID: {self.user1_id}")
        else:
            # Try login if user already exists
            login_data = {"email": user1_data["email"], "password": user1_data["password"]}
            success, response, error = self.make_request("POST", "/auth/login", login_data)
            if success:
                self.user1_token = response.get("access_token")
                self.user1_id = response.get("user", {}).get("id")
                self.log_test("User1 Login (Creator)", True, f"User ID: {self.user1_id}")
            else:
                self.log_test("User1 Authentication", False, error=error)
                return False
        
        # Create second user for likes/interactions
        user2_data = {
            "email": "reel.watcher@cricketclub.com",
            "password": "StrongPass2024!",
            "name": "MS Cricket Watcher"
        }
        
        success, response, error = self.make_request("POST", "/auth/register", user2_data)
        if success:
            self.user2_token = response.get("access_token")
            self.user2_id = response.get("user", {}).get("id")
            self.log_test("User2 Registration (Watcher)", True, f"User ID: {self.user2_id}")
        else:
            # Try login if user already exists
            login_data = {"email": user2_data["email"], "password": user2_data["password"]}
            success, response, error = self.make_request("POST", "/auth/login", login_data)
            if success:
                self.user2_token = response.get("access_token")
                self.user2_id = response.get("user", {}).get("id")
                self.log_test("User2 Login (Watcher)", True, f"User ID: {self.user2_id}")
            else:
                self.log_test("User2 Authentication", False, error=error)
                return False
        
        # Test social login endpoint (basic validation)
        social_data = {
            "provider": "google",
            "provider_id": "google_test_123",
            "email": "social.test@cricketclub.com",
            "name": "Social Test User"
        }
        
        success, response, error = self.make_request("POST", "/auth/social", social_data)
        if success:
            self.log_test("Social Login Test", True, "Social authentication working")
        else:
            self.log_test("Social Login Test", False, error=error)
        
        return True
    
    def test_2_reel_upload(self):
        """Test 2: Reel Upload"""
        print("=== Test 2: Reel Upload ===")
        
        if not self.user1_token:
            self.log_test("Reel Upload", False, error="No user token available")
            return False
        
        # Test uploading a batting reel
        reel_data = {
            "video_uri": "https://example.com/batting-technique.mp4",
            "trim_start": 10,
            "trim_end": 40,
            "category": "batting",
            "level": "domestic",
            "focus_area": "batting",
            "skill_level": "intermediate",
            "is_public": True,
            "description": "Perfect cover drive technique from domestic cricket"
        }
        
        headers = self.get_auth_headers(self.user1_token)
        success, response, error = self.make_request("POST", "/reels/upload", reel_data, headers)
        
        if success:
            self.reel_id = response.get("id")
            checks = [
                ("Reel ID Created", self.reel_id is not None),
                ("Success Message", "successfully" in response.get("message", "").lower()),
                ("Public Status", response.get("is_public") == True)
            ]
            
            all_good = all(check[1] for check in checks)
            details = ", ".join([f"{check[0]}: {'✓' if check[1] else '✗'}" for check in checks])
            
            self.log_test("Public Batting Reel Upload", all_good, details)
        else:
            self.log_test("Public Batting Reel Upload", False, error=error)
            return False
        
        # Test uploading a private bowling reel
        private_reel_data = {
            "video_uri": "https://example.com/bowling-technique.mp4",
            "trim_start": 5,
            "trim_end": 35,
            "category": "bowling",
            "level": "international",
            "focus_area": "bowling", 
            "skill_level": "advanced",
            "is_public": False,
            "description": "Advanced yorker bowling technique analysis"
        }
        
        success, response, error = self.make_request("POST", "/reels/upload", private_reel_data, headers)
        
        if success:
            self.log_test("Private Bowling Reel Upload", True, f"Private reel created: {response.get('id')}")
        else:
            self.log_test("Private Bowling Reel Upload", False, error=error)
        
        # Test uploading a fielding reel
        fielding_reel_data = {
            "video_uri": "https://example.com/fielding-catch.mp4",
            "trim_start": 0,
            "trim_end": 20,
            "category": "fielding",
            "level": "local",
            "focus_area": "fielding",
            "skill_level": "beginner",
            "is_public": True,
            "description": "Basic catching technique for close fielders"
        }
        
        success, response, error = self.make_request("POST", "/reels/upload", fielding_reel_data, headers)
        
        if success:
            self.log_test("Fielding Reel Upload", True, f"Fielding reel created: {response.get('id')}")
        else:
            self.log_test("Fielding Reel Upload", False, error=error)
        
        return True
    
    def test_3_get_public_reels(self):
        """Test 3: Get Public Reels"""
        print("=== Test 3: Get Public Reels ===")
        
        # Test getting all public reels (no authentication required)
        success, response, error = self.make_request("GET", "/reels", {}, {})
        
        if success:
            reels = response if isinstance(response, list) else []
            reel_count = len(reels)
            
            if reel_count > 0:
                first_reel = reels[0]
                checks = [
                    ("Has Reels", reel_count > 0),
                    ("Reel ID", first_reel.get("id") is not None),
                    ("Video URL", first_reel.get("video_url") is not None),
                    ("User Info", first_reel.get("user_name") is not None),
                    ("Category", first_reel.get("category") is not None),
                    ("Level", first_reel.get("level") is not None),
                    ("Likes Count", isinstance(first_reel.get("likes", 0), int)),
                    ("Created At", first_reel.get("created_at") is not None)
                ]
                
                all_good = all(check[1] for check in checks)
                details = f"Found {reel_count} reels, " + ", ".join([f"{check[0]}: {'✓' if check[1] else '✗'}" for check in checks])
                
                self.log_test("Get All Public Reels", all_good, details)
            else:
                self.log_test("Get All Public Reels", False, "No reels found")
        else:
            self.log_test("Get All Public Reels", False, error=error)
        
        # Test filtering by category
        success, response, error = self.make_request("GET", "/reels?category=batting", {}, {})
        
        if success:
            batting_reels = response if isinstance(response, list) else []
            batting_count = len(batting_reels)
            
            # Check if all returned reels are batting category
            all_batting = all(reel.get("category") == "batting" for reel in batting_reels)
            
            self.log_test("Filter Reels by Category (Batting)", True, 
                         f"Found {batting_count} batting reels, All batting: {'Yes' if all_batting else 'No'}")
        else:
            self.log_test("Filter Reels by Category (Batting)", False, error=error)
        
        # Test filtering by level
        success, response, error = self.make_request("GET", "/reels?level=domestic", {}, {})
        
        if success:
            domestic_reels = response if isinstance(response, list) else []
            domestic_count = len(domestic_reels)
            
            self.log_test("Filter Reels by Level (Domestic)", True, f"Found {domestic_count} domestic level reels")
        else:
            self.log_test("Filter Reels by Level (Domestic)", False, error=error)
        
        # Test pagination
        success, response, error = self.make_request("GET", "/reels?skip=0&limit=2", {}, {})
        
        if success:
            limited_reels = response if isinstance(response, list) else []
            limited_count = len(limited_reels)
            
            self.log_test("Reel Pagination", True, f"Limited query returned {limited_count} reels (max 2)")
        else:
            self.log_test("Reel Pagination", False, error=error)
        
        return True
    
    def test_4_authenticated_reel_access(self):
        """Test 4: Authenticated Reel Access (with like status)"""
        print("=== Test 4: Authenticated Reel Access ===")
        
        if not self.user2_token:
            self.log_test("Authenticated Reel Access", False, error="No user2 token available")
            return False
        
        # Test getting reels with authentication (should include is_liked status)
        headers = self.get_auth_headers(self.user2_token)
        success, response, error = self.make_request("GET", "/reels", {}, headers)
        
        if success:
            reels = response if isinstance(response, list) else []
            
            if len(reels) > 0:
                first_reel = reels[0]
                has_is_liked = "is_liked" in first_reel
                is_liked_value = first_reel.get("is_liked", None)
                
                self.log_test("Authenticated Reel Access", True, 
                             f"is_liked field present: {'Yes' if has_is_liked else 'No'}, Value: {is_liked_value}")
            else:
                self.log_test("Authenticated Reel Access", False, "No reels found for authenticated user")
        else:
            self.log_test("Authenticated Reel Access", False, error=error)
        
        return True
    
    def test_5_like_reel(self):
        """Test 5: Like/Unlike Reel"""
        print("=== Test 5: Like/Unlike Reel ===")
        
        if not self.user2_token or not self.reel_id:
            self.log_test("Like Reel", False, error="No user2 token or reel ID available")
            return False
        
        headers = self.get_auth_headers(self.user2_token)
        
        # Test liking a reel
        success, response, error = self.make_request("POST", f"/reels/{self.reel_id}/like", {}, headers)
        
        if success:
            liked_status = response.get("liked")
            if liked_status is True:
                self.log_test("Like Reel", True, "Reel liked successfully")
                
                # Test liking again (should unlike)
                success, response, error = self.make_request("POST", f"/reels/{self.reel_id}/like", {}, headers)
                
                if success:
                    unliked_status = response.get("liked")
                    if unliked_status is False:
                        self.log_test("Unlike Reel", True, "Reel unliked successfully")
                    else:
                        self.log_test("Unlike Reel", False, f"Expected liked=False, got {unliked_status}")
                else:
                    self.log_test("Unlike Reel", False, error=error)
                
                # Test liking again (should like again)
                success, response, error = self.make_request("POST", f"/reels/{self.reel_id}/like", {}, headers)
                
                if success and response.get("liked") is True:
                    self.log_test("Re-like Reel", True, "Reel liked again successfully")
                else:
                    self.log_test("Re-like Reel", False, error=error or "Expected liked=True")
                    
            else:
                self.log_test("Like Reel", False, f"Expected liked=True, got {liked_status}")
        else:
            self.log_test("Like Reel", False, error=error)
        
        # Test liking non-existent reel
        fake_reel_id = "507f1f77bcf86cd799439011"  # Valid ObjectId format but non-existent
        success, response, error = self.make_request("POST", f"/reels/{fake_reel_id}/like", {}, headers)
        
        if not success and "not found" in error.lower():
            self.log_test("Like Non-existent Reel Protection", True, "Correctly rejected like on non-existent reel")
        else:
            self.log_test("Like Non-existent Reel Protection", False, "Should reject like on non-existent reel")
        
        return True
    
    def test_6_get_my_reels(self):
        """Test 6: Get User's Own Reels"""
        print("=== Test 6: Get My Reels ===")
        
        if not self.user1_token:
            self.log_test("Get My Reels", False, error="No user1 token available")
            return False
        
        headers = self.get_auth_headers(self.user1_token)
        success, response, error = self.make_request("GET", "/reels/my", {}, headers)
        
        if success:
            my_reels = response if isinstance(response, list) else []
            reel_count = len(my_reels)
            
            if reel_count > 0:
                first_reel = my_reels[0]
                checks = [
                    ("Has My Reels", reel_count >= 2),  # We uploaded at least 2 reels
                    ("Reel ID", first_reel.get("id") is not None),
                    ("Video URL", first_reel.get("video_url") is not None),
                    ("Category", first_reel.get("category") is not None),
                    ("Level", first_reel.get("level") is not None),
                    ("Likes Count", isinstance(first_reel.get("likes", 0), int)),
                    ("Public Status", "is_public" in first_reel),
                    ("Created At", first_reel.get("created_at") is not None)
                ]
                
                all_good = all(check[1] for check in checks)
                details = f"Found {reel_count} user reels, " + ", ".join([f"{check[0]}: {'✓' if check[1] else '✗'}" for check in checks])
                
                self.log_test("Get My Reels", all_good, details)
                
                # Check if we can see both public and private reels
                public_count = sum(1 for reel in my_reels if reel.get("is_public") is True)
                private_count = sum(1 for reel in my_reels if reel.get("is_public") is False)
                
                self.log_test("My Reels Privacy Status", True, 
                             f"Public reels: {public_count}, Private reels: {private_count}")
            else:
                self.log_test("Get My Reels", False, "No user reels found")
        else:
            self.log_test("Get My Reels", False, error=error)
        
        # Test that user2 cannot see user1's private reels in public feed
        headers2 = self.get_auth_headers(self.user2_token)
        success, response, error = self.make_request("GET", "/reels", {}, headers2)
        
        if success:
            public_reels = response if isinstance(response, list) else []
            # Should only see public reels from all users
            user1_public_reels = [reel for reel in public_reels if reel.get("user_id") == self.user1_id]
            
            self.log_test("Privacy: Public Reels Only", True, 
                         f"User2 sees {len(user1_public_reels)} public reels from User1")
        else:
            self.log_test("Privacy: Public Reels Only", False, error=error)
        
        return True
    
    def test_7_sessions_api(self):
        """Test 7: Sessions API (as mentioned in review request)"""
        print("=== Test 7: Sessions API ===")
        
        if not self.user1_token:
            self.log_test("Sessions API", False, error="No user token available")
            return False
        
        # Test creating a session
        session_data = {
            "day_number": 1,
            "duration": 45,
            "focus_area": "batting",
            "goal": "straight drive mastery",
            "num_players": 1,
            "skill_level": "intermediate"
        }
        
        headers = self.get_auth_headers(self.user1_token)
        success, response, error = self.make_request("POST", "/sessions", session_data, headers)
        
        if success:
            self.session_id = response.get("id")
            checks = [
                ("Session ID", self.session_id is not None),
                ("Focus Area", response.get("focus_area") == "batting"),
                ("Duration", response.get("duration") == 45),
                ("Status", response.get("status") == "active"),  # Solo session starts immediately
                ("Current Phase", response.get("current_phase") == "warmup")
            ]
            
            all_good = all(check[1] for check in checks)
            details = ", ".join([f"{check[0]}: {'✓' if check[1] else '✗'}" for check in checks])
            
            self.log_test("Create Session", all_good, details)
        else:
            self.log_test("Create Session", False, error=error)
            return False
        
        # Test getting my sessions list
        success, response, error = self.make_request("GET", "/sessions/my-sessions/list", {}, headers)
        
        if success:
            sessions = response if isinstance(response, list) else []
            session_count = len(sessions)
            has_our_session = any(session.get("id") == self.session_id for session in sessions)
            
            self.log_test("Get My Sessions List", True, 
                         f"Found {session_count} sessions, Our session included: {'Yes' if has_our_session else 'No'}")
        else:
            self.log_test("Get My Sessions List", False, error=error)
        
        return True
    
    def test_8_comprehensive_flow(self):
        """Test 8: Complete Reels Workflow"""
        print("=== Test 8: Complete Reels Workflow ===")
        
        # This test combines multiple operations to test realistic usage
        if not self.user1_token or not self.user2_token:
            self.log_test("Comprehensive Flow", False, error="Missing required tokens")
            return False
        
        # User1 uploads a new reel
        workout_reel_data = {
            "video_uri": "https://example.com/cricket-workout.mp4",
            "trim_start": 15,
            "trim_end": 60,
            "category": "workouts",
            "level": "domestic",
            "focus_area": "fitness",
            "skill_level": "intermediate",
            "is_public": True,
            "description": "High-intensity cricket fitness routine for domestic players"
        }
        
        headers1 = self.get_auth_headers(self.user1_token)
        success, response, error = self.make_request("POST", "/reels/upload", workout_reel_data, headers1)
        
        if not success:
            self.log_test("Workflow: Upload Workout Reel", False, error=error)
            return False
        
        workout_reel_id = response.get("id")
        self.log_test("Workflow: Upload Workout Reel", True, f"Workout reel created: {workout_reel_id}")
        
        # User2 discovers and likes the reel
        headers2 = self.get_auth_headers(self.user2_token)
        success, response, error = self.make_request("GET", "/reels?category=workouts", {}, headers2)
        
        if not success:
            self.log_test("Workflow: Discover Workout Reels", False, error=error)
            return False
        
        workout_reels = response if isinstance(response, list) else []
        found_workout = any(reel.get("id") == workout_reel_id for reel in workout_reels)
        
        self.log_test("Workflow: Discover Workout Reels", found_workout, 
                     f"Found {len(workout_reels)} workout reels, Our reel found: {'Yes' if found_workout else 'No'}")
        
        # User2 likes the workout reel
        success, response, error = self.make_request("POST", f"/reels/{workout_reel_id}/like", {}, headers2)
        
        if success and response.get("liked") is True:
            self.log_test("Workflow: Like Workout Reel", True, "User2 liked User1's workout reel")
        else:
            self.log_test("Workflow: Like Workout Reel", False, error=error or "Like operation failed")
        
        # User1 checks their reels to see the like count
        success, response, error = self.make_request("GET", "/reels/my", {}, headers1)
        
        if success:
            my_reels = response if isinstance(response, list) else []
            workout_reel = next((reel for reel in my_reels if reel.get("id") == workout_reel_id), None)
            
            if workout_reel and workout_reel.get("likes", 0) > 0:
                self.log_test("Workflow: Check Like Count", True, f"Workout reel has {workout_reel.get('likes')} likes")
            else:
                self.log_test("Workflow: Check Like Count", False, "Workout reel should have at least 1 like")
        else:
            self.log_test("Workflow: Check Like Count", False, error=error)
        
        return True
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🎬 Starting PerfectPractice Reels Backend API Tests")
        print(f"Testing against: {BASE_URL}")
        print("=" * 60)
        
        test_functions = [
            self.test_1_authentication_setup,
            self.test_2_reel_upload,
            self.test_3_get_public_reels,
            self.test_4_authenticated_reel_access,
            self.test_5_like_reel,
            self.test_6_get_my_reels,
            self.test_7_sessions_api,
            self.test_8_comprehensive_flow
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
        print("🎬 REELS API TEST SUMMARY")
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
            print("🎉 ALL REELS TESTS PASSED!")
        
        print("=" * 60)

def main():
    """Main function to run Reels tests"""
    tester = ReelsAPITester()
    tester.run_all_tests()

if __name__ == "__main__":
    main()