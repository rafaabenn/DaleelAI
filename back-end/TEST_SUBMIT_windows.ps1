# PowerShell test submit examples
$token = 'YOUR_JWT_HERE'
$api = 'http://localhost:3000/api/tools/submit'

$body = @{
  name = 'MyTool'
  short_description = 'A useful AI tool for X.'
  long_description = 'A longer description that fully explains features, pricing and integrations.'
  website_url = 'https://example.com'
  logo_url = 'https://example.com/logo.png'
  gdpr_compliant = 1
  has_api = 1
  has_mobile_app = 0
} | ConvertTo-Json

Invoke-RestMethod -Uri $api -Method Post -Headers @{Authorization = "Bearer $token"; 'Content-Type' = 'application/json'} -Body $body | ConvertTo-Json -Depth 5
