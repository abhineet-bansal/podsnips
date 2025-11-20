"""
Snipd to Notion Database Parser
Automatically extracts snips from Snipd-generated Notion pages and creates individual database entries.
"""

import os
from typing import List, Dict, Any
from dotenv import load_dotenv
from notion_client import NotionClient

# Load environment variables
load_dotenv()

# Configuration
NOTION_API_KEY = os.getenv("NOTION_API_KEY")
SOURCE_DATABASE_ID = os.getenv("SOURCE_DATABASE_ID")  # DB1 - Where Snipd creates pages
TARGET_DATABASE_ID = os.getenv("TARGET_DATABASE_ID")  # DB2 - Your curated snips database


def extract_snip_data(notion_api: NotionClient, toggle_block: Dict, children: List[Dict]) -> Dict[str, str]:
    """Extract relevant data from a toggle heading and its children."""
    # Get the toggle heading title
    toggle_title = ""
    if toggle_block.get("type") == "heading_3":
        toggle_title = notion_api.extract_text_from_rich_text(toggle_block["heading_3"].get("rich_text", []))

    # Initialize data structure
    snip_data = {
        "title": toggle_title,
        "summary": "",
        "transcript": "",
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
    transcript_toggle_id = None

    # First pass: find the transcript toggle and collect summary
    for child in children:
        block_type = child.get("type")

        # Check if this is the transcript toggle list
        if block_type == "toggle":
            toggle_text = notion_api.extract_text_from_rich_text(child["toggle"].get("rich_text", []))
            if "📚 Transcript" in toggle_text:
                transcript_toggle_id = child["id"]
                continue

        # Collect summary content (everything before transcript toggle)
        if block_type == "paragraph":
            text = notion_api.extract_text_from_rich_text(child["paragraph"].get("rich_text", []))
            # Skip play snip links and empty lines
            if text.strip() and "🎧 Play snip" not in text:
                summary_parts.append(text.strip())

        elif block_type == "bulleted_list_item":
            text = notion_api.extract_text_from_rich_text(child["bulleted_list_item"].get("rich_text", []))
            summary_parts.append(text.strip())

    # Get transcript from the toggle's children
    if transcript_toggle_id:
        snip_data["transcript"] = notion_api.get_toggle_children(transcript_toggle_id)

    # Compile summary
    if summary_parts:
        snip_data["summary"] = "\n".join(summary_parts)

    return snip_data


def create_database_entry(notion_api: NotionClient, database_id: str, snip_data: Dict, episode_info: Dict):
    """Create a new entry in the target database."""
    try:
        # Get data source ID for the target database
        data_source_id = notion_api.get_data_source_id(database_id)
        if not data_source_id:
            print(f"  ✗ Could not get data source ID for target database")
            return False

        properties = {
            "Title": {
                "title": [
                    {
                        "text": {
                            "content": snip_data["title"] or "Untitled Snip"
                        }
                    }
                ]
            },
            "Summary": {
                "rich_text": [
                    {
                        "text": {
                            "content": snip_data["summary"][:2000]  # Notion limit
                        }
                    }
                ]
            },
            "Episode": {
                "rich_text": [
                    {
                        "text": {
                            "content": episode_info.get("title", "Unknown Episode")
                        }
                    }
                ]
            },
            "Date Created": {
                "date": {
                    "start": episode_info.get("last_snip_date", "")
                }
            },
            "Status": {
                "status": {
                    "name": "To Review"
                }
            },
            "Timestamp": {
                "rich_text": [
                    {
                        "text": {
                            "content": snip_data["timestamp"]
                        }
                    }
                ]
            },
            "Podcast Show": {
                "rich_text": [
                    {
                        "text": {
                            "content": episode_info["podcast_show"]
                        }
                    }
                ]
            }
        }

        # Create the page with transcript as body content
        success = notion_api.create_page(
            data_source_id=data_source_id,
            properties=properties,
            children=snip_data["transcript"] if snip_data["transcript"] else None
        )

        if success:
            print(f"  ✓ Created entry: {snip_data['title']}")
        return success

    except Exception as e:
        print(f"  ✗ Error creating database entry: {e}")
        return False


def process_page(notion_api: NotionClient, page: Dict) -> int:
    """Process a single page and create database entries for each snip."""
    page_id = page["id"]

    # Episode info for context
    episode_info = {
        "title": "Untitled",
        "podcast_show": "Untitled",
        "last_snip_date": "",
    }

    try:
        properties = page.get("properties", {})
        for prop_name, prop_data in properties.items():
            if prop_data.get("type") == "title":
                episode_info["title"] = notion_api.extract_text_from_rich_text(prop_data["title"])
            if prop_name == "Show":
                episode_info["podcast_show"] = notion_api.extract_text_from_rich_text(prop_data["rich_text"])
            if prop_name == "Last snip date":
                episode_info["last_snip_date"] = prop_data["date"]["start"]
    except Exception as e:
        print(f"Error getting page properties: {e}")

    print(f"\nProcessing page: {episode_info['title']}")

    # Get page content
    blocks = notion_api.get_page_content(page_id)

    # Find all Toggle Heading 3 blocks
    toggle_headings = [block for block in blocks if block.get("type") == "heading_3" and block["heading_3"].get("is_toggleable")]

    print(f"  Found {len(toggle_headings)} toggle headings (snips)")

    created_count = 0

    # Process each toggle heading
    for toggle in toggle_headings:
        # Get children of toggle
        children = notion_api.get_toggle_children(toggle["id"])

        # Extract snip data
        snip_data = extract_snip_data(notion_api, toggle, children)

        # Create database entry
        if create_database_entry(notion_api, TARGET_DATABASE_ID, snip_data, episode_info):
            created_count += 1

    print("\n" + "=" * 60)
    print(f"Processing complete!")
    print(f"  Snips created: {created_count}")

    new_status = "Done"
    if (created_count == len(toggle_headings)):
        print(f"  Marking page as Done")
    else:
        new_status = "In progress"
        print(f"  Toggle headings found: {len(toggle_headings)}")
        print(f"  Marking page as In progress, review errors and complete manually...")

    print("=" * 60)
    notion_api.update_page_status(page_id, new_status)

    return created_count


def main():
    """Main execution function."""
    print("=" * 60)
    print("Snipd to Notion Database Parser")
    print("=" * 60)

    # Validate configuration
    if not NOTION_API_KEY or not SOURCE_DATABASE_ID or not TARGET_DATABASE_ID:
        print("ERROR: environment variables not set")
        return

    # Initialize Notion API client
    notion_api = NotionClient(NOTION_API_KEY)

    # Get pages with status "Not started"
    print(f"\nChecking for pages with status 'Not started'...")
    new_pages = notion_api.get_pages_with_status(SOURCE_DATABASE_ID, "Not started")
    print(f"Found {len(new_pages)} page(s) to process")

    if not new_pages:
        print("\nNo new pages to process. Exiting.")
        return

    # Process each new page
    total_snips = 0
    for page in new_pages:
        snips_created = process_page(notion_api, page)
        total_snips += snips_created

    print("\n" + "=" * 60)
    print(f"Processing complete!")
    print(f"  Pages processed: {len(new_pages)}")
    print(f"  Snips created: {total_snips}")
    print("=" * 60)


if __name__ == "__main__":
    main()