#!/usr/bin/env bash
# Quick submit tests (bash/curl)
# Replace TOKEN and URL as needed
TOKEN="YOUR_JWT_HERE"
API="http://localhost:3000/api/tools/submit"

curl -s -X POST "$API" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"MyTool","short_description":"A useful AI tool for X.","long_description":"A longer description that fully explains features, pricing and integrations.","website_url":"https://example.com","logo_url":"https://example.com/logo.png","gdpr_compliant":1,"has_api":1,"has_mobile_app":0}' | jq .

# Pending example
curl -s -X POST "$API" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"ToolPending","short_description":"Short but valid desc.","long_description":"Sufficient long description to pass length checks.","website_url":"http://example.org","gdpr_compliant":0,"has_api":0}' | jq .

# Reject example
curl -s -X POST "$API" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"SpamTool","short_description":"Buy bitcoin now porn casino","long_description":"spam spam","website_url":"http://bad.example"}' | jq .
