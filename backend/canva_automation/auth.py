import os
import base64
import hashlib
import secrets
import requests
from flask import Flask, request, redirect
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configuration
CLIENT_ID = os.getenv('CANVA_CLIENT_ID')
CLIENT_SECRET = os.getenv('CANVA_CLIENT_SECRET')
REDIRECT_URI = os.getenv('CANVA_REDIRECT_URI')

# OAuth endpoints
AUTHORIZE_URL = "https://www.canva.com/api/oauth/authorize"
TOKEN_URL = "https://api.canva.com/rest/v1/oauth/token"

# Store these temporarily (in production, use proper session management)
code_verifier = None
access_token = None

def generate_code_verifier():
    """Generate a code verifier for PKCE"""
    return secrets.token_urlsafe(64)


def generate_code_challenge(verifier):
    """Generate code challenge from verifier"""
    digest = hashlib.sha256(verifier.encode()).digest()
    return base64.urlsafe_b64encode(digest).decode().rstrip('=')


@app.route('/')
def index():
    """Start the OAuth flow"""
    global code_verifier
    
    # Generate PKCE parameters
    code_verifier = generate_code_verifier()
    code_challenge = generate_code_challenge(code_verifier)
    
    # Build authorization URL
    params = {
        'code_challenge': code_challenge,
        'code_challenge_method': 'S256',
        'scope': 'asset:read asset:write design:content:read design:content:write design:meta:read folder:write',
        'response_type': 'code',
        'client_id': CLIENT_ID,
        'redirect_uri': REDIRECT_URI
    }
    
    auth_url = f"{AUTHORIZE_URL}?{'&'.join([f'{k}={v}' for k, v in params.items()])}"
    
    print(f"\n🔐 Opening authorization URL...")
    print(f"If browser doesn't open automatically, visit:\n{auth_url}\n")
    
    return redirect(auth_url)


@app.route('/callback')
def callback():
    """Handle OAuth callback"""
    global access_token, code_verifier
    
    # Get authorization code from callback
    auth_code = request.args.get('code')
    
    if not auth_code:
        return "❌ Error: No authorization code received", 400
    
    print(f"\n✅ Authorization code received!")
    
    # Exchange authorization code for access token
    auth_string = f"{CLIENT_ID}:{CLIENT_SECRET}"
    auth_b64 = base64.b64encode(auth_string.encode()).decode()
    
    headers = {
        'Authorization': f'Basic {auth_b64}',
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    
    data = {
        'grant_type': 'authorization_code',
        'code_verifier': code_verifier,
        'code': auth_code,
        'redirect_uri': REDIRECT_URI
    }
    
    print("🔄 Exchanging code for access token...")
    
    response = requests.post(TOKEN_URL, headers=headers, data=data)
    
    if response.status_code == 200:
        token_data = response.json()
        access_token = token_data['access_token']
        refresh_token = token_data.get('refresh_token')
        expires_in = token_data.get('expires_in')
        
        print(f"\n✅ Access token obtained!")
        print(f"   Expires in: {expires_in} seconds ({expires_in/3600:.1f} hours)")
        print(f"\n🎉 Authentication successful!")
        
        # Save tokens to file for later use
        script_dir = os.path.dirname(os.path.abspath(__file__))
        tokens_file = os.path.join(script_dir, '.tokens')
        
        with open(tokens_file, 'w') as f:
            f.write(f"ACCESS_TOKEN={access_token}\n")
            f.write(f"REFRESH_TOKEN={refresh_token}\n")
        
        print(f"💾 Tokens saved to: {tokens_file}")
        
        return """
        <h1>✅ Authentication Successful!</h1>
        <p>Your access token has been saved to .tokens file.</p>
        <p>You can now close this window and run test_api() in your script.</p>
        <p><a href="/test">Click here to test the API</a></p>
        """
    else:
        print(f"\n❌ Error getting access token: {response.status_code}")
        print(f"Response: {response.text}")
        return f"❌ Error: {response.text}", 400


@app.route('/test')
def test():
    """Test API call to get user profile"""
    global access_token
    
    if not access_token:
        return "❌ No access token. Please authenticate first at /", 400
    
    # Test API call - Get user profile
    headers = {
        'Authorization': f'Bearer {access_token}'
    }
    
    response = requests.get('https://api.canva.com/rest/v1/users/me', headers=headers)
    
    if response.status_code == 200:
        user_data = response.json()
        return f"""
        <h1>✅ API Test Successful!</h1>
        <h2>User Profile:</h2>
        <pre>{response.json()}</pre>
        <p><strong>User ID:</strong> {user_data.get('id')}</p>
        <p><strong>Display Name:</strong> {user_data.get('display_name', 'N/A')}</p>
        <p><strong>Email:</strong> {user_data.get('email', 'N/A')}</p>
        """
    else:
        return f"""
        <h1>❌ API Test Failed</h1>
        <p>Status: {response.status_code}</p>
        <pre>{response.text}</pre>
        """, response.status_code


if __name__ == '__main__':
    print("\n" + "="*50)
    print("🚀 Canva OAuth Authentication Server")
    print("="*50)
    print("\n1. Starting server on http://127.0.0.1:8000")
    print("2. Visit http://127.0.0.1:8000 to start authentication")
    print("3. After auth, visit http://127.0.0.1:8000/test to test API\n")
    
    app.run(host='127.0.0.1', port=8000, debug=True)