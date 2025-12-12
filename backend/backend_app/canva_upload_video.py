import os
import requests
import time
from .canva_auth_utils import load_tokens


API_BASE = "https://api.canva.com/rest/v1"
FOLDER_ID = "FAF5Hqk8gT8"


def upload_video(video_path):
    """Upload video file to Canva"""

    access_token = load_tokens()

    # Expand path if it contains ~
    video_path = os.path.expanduser(video_path)

    print(f"\n📤 Uploading video: {video_path}...")
    
    if not os.path.exists(video_path):
        print(f"❌ Video file not found: {video_path}")
        return None
    
    # Get file size
    file_size = os.path.getsize(video_path)
    print(f"   File size: {file_size / (1024*1024):.2f} MB")
    
    # Get filename and encode it in base64
    import base64
    filename = os.path.basename(video_path)
    name_base64 = base64.b64encode(filename.encode('utf-8')).decode('utf-8')
    
    # Step 1: Upload the video file directly with metadata in header
    print(f"⏫ Uploading file to Canva...")
    
    upload_headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/octet-stream',
        'Asset-Upload-Metadata': f'{{"name_base64": "{name_base64}"}}'
    }
    
    # Read and upload file
    with open(video_path, 'rb') as video_file:
        response = requests.post(
            f"{API_BASE}/asset-uploads",
            headers=upload_headers,
            data=video_file
        )
    
    if response.status_code != 200:
        print(f"❌ Error uploading file: {response.status_code}")
        print(f"Response: {response.text}")
        return None
    
    upload_data = response.json()
    job_id = upload_data['job']['id']
    status = upload_data['job']['status']
    
    print(f"✅ Upload initiated! Job ID: {job_id}")
    print(f"   Initial status: {status}")
    
    # Step 2: Poll for upload completion and get asset ID
    print(f"⏳ Processing upload...")
    
    max_attempts = 60  # 5 minutes max
    attempt = 0
    
    while attempt < max_attempts:
        time.sleep(5)  # Wait before checking
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }

        response = requests.get(
            f"{API_BASE}/asset-uploads/{job_id}",
            headers=headers
        )
        
        if response.status_code == 200:
            job_status = response.json()['job']
            status = job_status['status']
            
            if status == 'success':
                asset_id = job_status['asset']['id']
                asset_name = job_status['asset']['name']
                print(f"✅ Upload complete!")
                print(f"   Asset ID: {asset_id}")
                print(f"   Asset name: {asset_name}")

                move_asset_to_folder(asset_id)

                return asset_id
            elif status == 'failed':
                error = job_status.get('error', {})
                print(f"❌ Upload failed: {error.get('message', 'Unknown error')}")
                print(f"   Error code: {error.get('code', 'unknown')}")
                return None
            elif status == 'in_progress':
                print(f"   Processing... ({attempt + 1}/{max_attempts})")
                attempt += 1
            else:
                print(f"   Status: {status}")
                attempt += 1
        else:
            print(f"❌ Error checking upload status: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    
    print(f"❌ Upload timeout - exceeded {max_attempts * 5} seconds")
    return None


def move_asset_to_folder(asset_id):
    """Move an asset to a specific folder

    Args:
        asset_id: The ID of the asset to move
        folder_id: The ID of the destination folder

    Returns:
        bool: True if successful, False otherwise
    """
    access_token = load_tokens()

    print(f"\n📁 Moving asset {asset_id} to folder {FOLDER_ID}...")

    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }

    payload = {
        'item_id': asset_id,
        'to_folder_id': FOLDER_ID
    }

    response = requests.post(
        f"{API_BASE}/folders/move",
        headers=headers,
        json=payload
    )

    if response.status_code in [200, 204]:
        print(f"✅ Asset moved to folder successfully!")
        return True
    else:
        print(f"❌ Error moving asset: {response.status_code}")
        print(f"Response: {response.text}")
        return False
