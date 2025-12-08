#!/bin/bash

API_BASE="http://localhost:8000"
USER_ID=""
SESSION_ID=""
TOKEN=""

echo "=== Testing Analytics Pipeline ==="

# 1. Register
echo -e "\n1. Registering test user..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"testuser_$(date +%s)\", \"password\": \"password123\"}")

USER_ID=$(echo $REGISTER_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
USERNAME=$(echo $REGISTER_RESPONSE | grep -o '"username":"[^"]*' | cut -d'"' -f4)

if [ -z "$USER_ID" ]; then
  echo "❌ Register failed: $REGISTER_RESPONSE"
  exit 1
fi

echo "✅ Registered: $USERNAME (ID: $USER_ID)"

# 2. Login
echo -e "\n2. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$USERNAME\", \"password\": \"password123\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Logged in, token: ${TOKEN:0:20}..."

# 3. Start session
echo -e "\n3. Starting game session..."
SESSION_RESPONSE=$(curl -s -X POST "$API_BASE/api/v1/sessions/start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"user_id\": \"$USER_ID\", \"device_info\": {\"os\": \"test\"}, \"platform\": \"web\"}")

SESSION_ID=$(echo $SESSION_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$SESSION_ID" ]; then
  echo "❌ Session start failed: $SESSION_RESPONSE"
  exit 1
fi

echo "✅ Session started: $SESSION_ID"

# 4. Post events with game_over
echo -e "\n4. Posting game events with game_over..."
EVENTS_JSON="{
  \"events\": [
    {\"user_id\": \"$USER_ID\", \"session_id\": \"$SESSION_ID\", \"event_type\": \"gameplay\", \"event_name\": \"player_jump\", \"event_category\": \"gameplay\", \"payload\": {\"height\": 100}, \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%S)Z\"},
    {\"user_id\": \"$USER_ID\", \"session_id\": \"$SESSION_ID\", \"event_type\": \"gameplay\", \"event_name\": \"score_update\", \"event_category\": \"gameplay\", \"payload\": {\"score\": 5}, \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%S)Z\"},
    {\"user_id\": \"$USER_ID\", \"session_id\": \"$SESSION_ID\", \"event_type\": \"collision\", \"event_name\": \"pipe_collision\", \"event_category\": \"gameplay\", \"payload\": {\"pipe_x\": 400}, \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%S)Z\"},
    {\"user_id\": \"$USER_ID\", \"session_id\": \"$SESSION_ID\", \"event_type\": \"collision\", \"event_name\": \"game_over\", \"event_category\": \"gameplay\", \"payload\": {\"final_score\": 42, \"high_score\": 42}, \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%S)Z\"}
  ]
}"

EVENTS_RESPONSE=$(curl -s -X POST "$API_BASE/api/v1/events" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$EVENTS_JSON")

echo "Response: $EVENTS_RESPONSE"

echo -e "\n=== Test Complete ==="
