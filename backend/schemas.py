from pydantic import BaseModel
from typing import List, Optional


class AgentResponse(BaseModel):
    user_id: str
    friction_type: str
    proposed_action: str
    draft_content: str
    system_alert: Optional[str] = None
