#!/usr/bin/env python3
import subprocess
import json
import sys
from datetime import datetime
import time

def run_curl(method, endpoint, data=None, token=None):
    """Helper to run curl commands"""
    cmd = ['curl', '-s', '-X', method, f'http://localhost:8000{endpoint}']
    cmd.extend(['-H', 'Content-Type: application/json'])
    if token:
        cmd.extend(['-H', f'Authorization: Bearer {token}'])
    if data:
        cmd.extend(['-d', json.dumps(data)])
    
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
    try:
        return json.loads(result.stdout)
    except:
        print(f"Error parsing response: {result.stdout}", file=sys.stderr)
        return None

print("=== Testing Analytics Pipeline ===\n")

# 1. Register
print("1. Registering test user...")
username = f"testuser_{int(time.time())}"
reg_response = run_curl('POST', '/api/v1/auth/register', {
    'username': username,
    'password': 'password123'
})
if not reg_response or 'id' not in reg_response:
    print(f"❌ Register failed: {reg_response}")
    sys.exit(1)

user_id = str(reg_response['id'])
print(f"✅ Registered: {username} (ID: {user_id[:8]}...)")

# 2. Login
print("\n2. Logging in...")
login_response = run_curl('POST', '/api/v1/auth/login', {
    'username': username,
    'password': 'password123'
})
if not login_response or 'access_token' not in login_response:
    print(f"❌ Login failed: {login_response}")
    sys.exit(1)

token = login_response['access_token']
print(f"✅ Logged in")

# 3. Start session
print("\n3. Starting game session...")
session_response = run_curl('POST', '/api/v1/sessions/start', {
    'user_id': user_id,
    'device_info': {'os': 'test'},
    'platform': 'web'
}, token)
if not session_response or 'id' not in session_response:
    print(f"❌ Session start failed: {session_response}")
    sys.exit(1)

session_id = str(session_response['id'])
print(f"✅ Session started")

# 4. Post events
print("\n4. Posting game events with game_over...")
now_iso = datetime.utcnow().isoformat() + "Z"
events_response = run_curl('POST', '/api/v1/events', {
    'events': [
        {
            'user_id': user_id,
            'session_id': session_id,
            'event_type': 'gameplay',
            'event_name': 'player_jump',
            'event_category': 'gameplay',
            'payload': {'height': 100},
            'timestamp': now_iso
        },
        {
            'user_id': user_id,
            'session_id': session_id,
            'event_type': 'gameplay',
            'event_name': 'score_update',
            'event_category': 'gameplay',
            'payload': {'score': 5},
            'timestamp': now_iso
        },
        {
            'user_id': user_id,
            'session_id': session_id,
            'event_type': 'collision',
            'event_name': 'pipe_collision',
            'event_category': 'gameplay',
            'payload': {'pipe_x': 400},
            'timestamp': now_iso
        },
        {
            'user_id': user_id,
            'session_id': session_id,
            'event_type': 'collision',
            'event_name': 'game_over',
            'event_category': 'gameplay',
            'payload': {'final_score': 42},
            'timestamp': now_iso
        }
    ]
}, token)

if not events_response:
    print(f"❌ Events post failed")
    sys.exit(1)

print(f"✅ Posted {events_response.get('inserted_count', 0)} events")
if events_response.get('validation_errors'):
    print(f"⚠️ Errors: {events_response['validation_errors']}")

# 5. Test getSummary
print("\n5. Testing getSummary endpoint...")
time.sleep(1)
summary_response = run_curl('GET', f'/api/v1/analytics/summary?user_id={user_id}', token=token)
if not summary_response:
    print(f"❌ Summary failed")
else:
    print(f"✅ Summary retrieved:")
    print(f"   From: {summary_response.get('from')}")
    print(f"   To: {summary_response.get('to')}")
    data = summary_response.get('data', [])
    print(f"   Data points: {len(data)}")
    for point in data:
        print(f"     {point['day']}: {point['games_played']} games, avg score: {point['avg_score']}")

print("\n=== Test Complete ===")
