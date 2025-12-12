import os
from typing import List, Dict
from dotenv import load_dotenv
from .notion_client_wrapper import NotionClient, extract_text_from_rich_text

# Load environment variables
load_dotenv()

# Configuration
NOTION_API_KEY = os.getenv("NOTION_API_KEY")
SOURCE_DATABASE_ID = os.getenv("SOURCE_DATABASE_ID")  # DB1 - Where Snipd creates pages


def get_pending_projects() -> List[Dict]:
    """
    Get all pages with status "Not started" from the SOURCE database.

    Returns:
        List of page objects with status "Not started"
    """
    # Validate configuration
    if not NOTION_API_KEY or not SOURCE_DATABASE_ID:
        print("ERROR: NOTION_API_KEY or SOURCE_DATABASE_ID not set")
        return []

    # Initialize Notion API client
    notion_api = NotionClient(NOTION_API_KEY)

    # Get pages with status "Not started"
    pages = notion_api.get_pages_with_status(SOURCE_DATABASE_ID, "Not started")

    # Parse properties of each page into a project structure
    projects = []

    for page in pages:
        page_id = page["id"]
        properties = page.get("properties", {})
        
        # Extract relevant properties
        project_data = extract_project_data(page_id, properties)
        projects.append(project_data)
    
    return projects


def get_project_details(project_id) -> Dict:
    """
    Get properties of a page
    """
    # Validate configuration
    if not NOTION_API_KEY or not SOURCE_DATABASE_ID:
        print("ERROR: NOTION_API_KEY or SOURCE_DATABASE_ID not set")
        return []

    # Initialize Notion API client
    notion_api = NotionClient(NOTION_API_KEY)

    properties = notion_api.get_page_properties(project_id)
    return extract_project_data(project_id, properties)


def get_project_tasks(project_id, page: int = 1, page_size: int = 10) -> Dict:
    """
    Get Toggle Heading 3 from the specified page, as tasks (paginated)

    Args:
        project_id: The Notion page ID
        page: Page number (1-indexed)
        page_size: Number of tasks per page

    Returns:
        Dict containing paginated tasks and metadata
    """
    # Validate configuration
    if not NOTION_API_KEY or not SOURCE_DATABASE_ID:
        print("ERROR: NOTION_API_KEY or SOURCE_DATABASE_ID not set")
        return {
            "page": page,
            "page_size": page_size,
            "total_count": 0,
            "total_pages": 0,
            "has_next": False,
            "has_previous": False,
            "tasks": []
        }

    # Initialize Notion API client
    notion_api = NotionClient(NOTION_API_KEY)

    # Get page content - fetch all blocks
    blocks = notion_api.get_page_content(project_id)

    # Find all Toggle Heading 3 blocks
    toggle_headings = [block for block in blocks if block.get("type") == "heading_3" and block["heading_3"].get("is_toggleable")]

    total_count = len(toggle_headings)
    total_pages = (total_count + page_size - 1) // page_size  # Ceiling division

    print(f"  Found {total_count} toggle headings (snips)")
    print(f"  Pagination: page {page}/{total_pages}, page_size={page_size}")

    # Calculate pagination slice
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size

    # Get only the toggles for the current page
    paginated_toggles = toggle_headings[start_idx:end_idx]

    print(f"  Processing {len(paginated_toggles)} toggles for this page")

    # Process only the toggles in the current page
    tasks = []
    for toggle in paginated_toggles:
        # Get children of toggle - only for tasks in this page
        children = notion_api.get_toggle_children(toggle["id"])

        # Extract snip data
        snip_data = extract_snip_data(toggle, children)

        tasks.append(snip_data)

    return {
        "page": page,
        "page_size": page_size,
        "total_count": total_count,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_previous": page > 1,
        "tasks": tasks
    }





"""
PRIVATE METHODS
"""


def extract_snip_data(toggle_block: Dict, children: List[Dict]) -> Dict[str, str]:
    """Extract relevant data from a toggle heading and its children."""
    # Get the toggle heading title
    toggle_title = ""
    if toggle_block.get("type") == "heading_3":
        toggle_title = extract_text_from_rich_text(toggle_block["heading_3"].get("rich_text", []))

    # Initialize data structure
    snip_data = {
        "title": toggle_title,
        "summary": "",
        "timestamp": "",
    }

    # Extract timestamp - find first [ and first ] and take what's between them
    first_bracket = toggle_title.find('[')
    first_close = toggle_title.find(']')
    if first_bracket != -1 and first_close != -1 and first_close > first_bracket:
        # Remove the [ and ] characters
        timestamp_raw = toggle_title[first_bracket+1:first_close]
        # Remove any extra [ if it's [[
        snip_data["timestamp"] = timestamp_raw.strip('[').strip(']')

    # Parse children blocks
    summary_parts = []

    # First pass: find the transcript toggle and collect summary
    for child in children:
        block_type = child.get("type")

        # Check if this is the transcript toggle list
        if block_type == "toggle":
            continue

        # Collect summary content (everything before transcript toggle)
        if block_type == "paragraph":
            text = extract_text_from_rich_text(child["paragraph"].get("rich_text", []))
            # Skip play snip links and empty lines
            if text.strip() and "🎧 Play snip" not in text:
                summary_parts.append(text.strip())

        elif block_type == "bulleted_list_item":
            text = extract_text_from_rich_text(child["bulleted_list_item"].get("rich_text", []))
            summary_parts.append(text.strip())

    # Compile summary
    if summary_parts:
        snip_data["summary"] = "\n".join(summary_parts)

    return snip_data


def extract_project_data(page_id, properties):
    # Extract relevant properties
    project_data = {
        "id": page_id,
        "status": "",
        "episode": "",
        "podcast_show": "",
        "snips": ""
    }
    
    # Parse properties
    for prop_name, prop_data in properties.items():
        prop_type = prop_data.get("type")
        
        if prop_type == "title":
            project_data["episode"] = extract_text_from_rich_text(
                prop_data.get("title", [])
            )
        elif prop_name == "Status" and prop_type == "status":
            project_data["status"] = prop_data.get("status", {}).get("name", "")
        elif prop_name == "Show" and prop_type == "rich_text":
            project_data["podcast_show"] = extract_text_from_rich_text(
                prop_data.get("rich_text", [])
            )
        elif prop_name == "Snips" and prop_type == "number":
            project_data["snips"] = prop_data.get("number", 0)
    
    return project_data