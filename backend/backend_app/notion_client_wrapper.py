"""
Notion Client Wrapper
Provides a clean interface for interacting with the Notion API.
"""

from typing import List, Dict, Any, Optional
from notion_client import Client


class NotionClient:
    """Wrapper class for Notion API interactions."""

    def __init__(self, api_key: str, version: str = "2025-09-03"):
        """Initialize Notion client with API key and version."""
        self.client = Client(auth=api_key, notion_version=version)

    def get_data_source_id(self, database_id: str) -> Optional[str]:
        """Get the data source ID for a database."""
        try:
            # Use the new Get Database API to retrieve data sources
            response = self.client.request(
                method="GET",
                path=f"databases/{database_id}",
            )
            data_sources = response.get("data_sources", [])
            if not data_sources:
                raise ValueError("No data sources found for this database")
            # For now, use the first data source (most databases have only one)
            return data_sources[0]["id"]
        except Exception as e:
            print(f"Error getting data source ID: {e}")
            return None

    def get_pages_with_status(self, database_id: str, status: str) -> List[Dict[str, Any]]:
        """Query database for pages with a specific status."""
        try:
            # First, get the data source ID
            data_source_id = self.get_data_source_id(database_id)
            if not data_source_id:
                print("Could not retrieve data source ID")
                return []

            # Query using the new data source endpoint with status filter
            response = self.client.request(
                method="POST",
                path=f"data_sources/{data_source_id}/query",
                body={
                    "filter": {
                        "property": "Status",
                        "status": {
                            "equals": status
                        }
                    },
                    "sorts": [
                        {
                            "timestamp": "created_time",
                            "direction": "ascending"
                        }
                    ]
                }
            )
            return response.get("results", [])
        except Exception as e:
            print(f"Error querying database: {e}")
            return []

    def get_page_content(self, page_id: str) -> List[Dict[str, Any]]:
        """Retrieve all blocks (content) from a page."""
        try:
            blocks = []
            has_more = True
            start_cursor = None

            while has_more:
                query = {"start_cursor": start_cursor} if start_cursor else {}
                response = self.client.request(
                    method="GET",
                    path=f"blocks/{page_id}/children",
                    query=query
                )
                blocks.extend(response.get("results", []))
                has_more = response.get("has_more", False)
                start_cursor = response.get("next_cursor")

            return blocks
        except Exception as e:
            print(f"Error retrieving page content: {e}")
            return []

    def get_toggle_children(self, block_id: str) -> List[Dict[str, Any]]:
        """Get children blocks of a toggle heading."""
        try:
            response = self.client.request(
                method="GET",
                path=f"blocks/{block_id}/children"
            )
            return response.get("results", [])
        except Exception as e:
            print(f"Error getting toggle children: {e}")
            return []

    def update_page_status(self, page_id: str, status: str) -> bool:
        """Update the Status property of a page."""
        try:
            self.client.request(
                method="PATCH",
                path=f"pages/{page_id}",
                body={
                    "properties": {
                        "Status": {
                            "status": {
                                "name": status
                            }
                        }
                    }
                }
            )
            return True
        except Exception as e:
            print(f"  ✗ Error updating page status: {e}")
            return False

    def create_page(self, data_source_id: str, properties: Dict, children: Optional[List] = None) -> bool:
        """Create a new page in the database."""
        try:
            page_data = {
                "parent": {
                    "type": "data_source_id",
                    "data_source_id": data_source_id
                },
                "properties": properties
            }

            # Only add children if provided
            if children:
                page_data["children"] = children

            # Create page with data_source_id parent (new API)
            self.client.request(
                method="POST",
                path="pages",
                body=page_data
            )
            return True
        except Exception as e:
            print(f"  ✗ Error creating page: {e}")
            return False


def extract_text_from_rich_text(rich_text_array: List[Dict]) -> str:
    """Extract plain text from Notion's rich text format."""
    if not rich_text_array:
        return ""
    return "".join([text.get("plain_text", "") for text in rich_text_array])