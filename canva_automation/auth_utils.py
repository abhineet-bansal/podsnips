import os
import requests


# Load tokens
def load_tokens():
    """Load access token from .tokens file"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    tokens_file = os.path.join(script_dir, '.tokens')

    if not os.path.exists(tokens_file):
        print("❌ No .tokens file found. Please run auth.py first!")
        exit(1)

    with open(tokens_file, 'r') as f:
        lines = f.readlines()
        for line in lines:
            if line.startswith('ACCESS_TOKEN='):
                return line.strip().split('=', 1)[1]

    print("❌ No access token found in .tokens file")
    exit(1)


def check_tokens():
    """Check if .tokens file exists and contains valid access token."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    tokens_file = os.path.join(script_dir, '.tokens')

    if not os.path.exists(tokens_file):
        print("✗ No .tokens file found in canva-automation/")
        print("   Please run canva-automation/auth.py first!")
        return False

    # Try to load token
    try:
        access_token = load_tokens()
        if not access_token:
            print("✗ No valid access token found in .tokens file")
            return False
    except Exception as e:
        print(f"✗ Error reading .tokens file: {e}")
        return False

    # Validate token using the introspect API endpoint
    print("= Validating Canva access token...")
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }

    try:
        response = requests.post(
            "https://api.canva.com/rest/v1/oauth/introspect",
            headers=headers,
            timeout=10
        )

        if response.status_code == 200:
            token_data = response.json()
            is_active = token_data.get('active', False)

            if is_active:
                print(f"✓ Token is valid!")
                return True
            else:
                print(f"✗ Token is not active")
                return False
        else:
            print(f"✗ Token validation failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"✗ Error validating token: {e}")
        return False
