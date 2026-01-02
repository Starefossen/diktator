#!/bin/bash

# Test script to verify mock auth user has access to data

echo "🧪 Testing Mock Auth User Access"
echo "=================================="
echo ""

BASE_URL="http://localhost:8080"

# Test health endpoint (no auth required)
echo "1. Testing health endpoint..."
curl -s "$BASE_URL/health" | jq -r '.status // "ERROR"'
echo ""

# Test authentication with mock user
echo "2. Testing mock user authentication..."
RESPONSE=$(curl -s -H "Authorization: Bearer mock-token" "$BASE_URL/api/v1/users/me")
echo "$RESPONSE" | jq '.'
echo ""

# Test family access
echo "3. Testing family access..."
FAMILY_RESPONSE=$(curl -s -H "Authorization: Bearer mock-token" "$BASE_URL/api/v1/families/current")
echo "$FAMILY_RESPONSE" | jq '.'
echo ""

# Test word sets
echo "4. Testing word sets access..."
WORDSETS_RESPONSE=$(curl -s -H "Authorization: Bearer mock-token" "$BASE_URL/api/v1/wordsets")
echo "$WORDSETS_RESPONSE" | jq '.data // . | length' 2>/dev/null || echo "ERROR"
echo ""

# Test children
echo "5. Testing children access..."
CHILDREN_RESPONSE=$(curl -s -H "Authorization: Bearer mock-token" "$BASE_URL/api/v1/children")
echo "$CHILDREN_RESPONSE" | jq '.data // . | length' 2>/dev/null || echo "ERROR"
echo ""

echo "=================================="
echo "✅ Test complete!"
