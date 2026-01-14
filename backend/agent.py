from typing import TypedDict, List, Optional
from langgraph.graph import StateGraph, END
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate


# State definition
class AgentState(TypedDict):
    user_id: str
    user_name: str
    session_events: List[str]
    friction_diagnosis: Optional[str]  # e.g., "Technical Error", "Confusion"
    action_plan: Optional[str]  # e.g., "Send Email", "Slack Alert"
    email_draft: Optional[str]
    system_alert: Optional[str]  # For Step 4 (Engineering Alert)


# Global Memory
# In a real app use Redis
ERROR_COUNTER = {
    "error_file_format": 0,
    "mic_permission_denied": 0
}
ALERT_THRESHOLD = 2  # If error happens 2 times then trigger system alert

# Local LLM
llm = ChatOllama(model="qwen2.5:3b", temperature=0)


# Nodes

def analyze_friction_node(state: AgentState):
    """Diagnoses WHY the user dropped off based on logs."""
    logs = "\n".join(state["session_events"])

    prompt = ChatPromptTemplate.from_template(
        """
        Analyze the following user session logs:
        {logs}

        Classify the primary friction point into ONE of these categories:
        - TECHNICAL_ERROR (User hit a bug or format issue)
        - CONFUSION (User clicked around but didn't succeed)
        - PERMISSION_ISSUE (Mic/Camera blocked)
        - NO_ISSUE (Normal session)

        Return ONLY the category name.
        """
    )
    chain = prompt | llm
    result = chain.invoke({"logs": logs})
    diagnosis = result.content.strip()

    return {"friction_diagnosis": diagnosis}


def update_system_health_node(state: AgentState):
    """Tracks errors globally to detect outages."""
    logs = state["session_events"]
    diagnosis = state["friction_diagnosis"]
    system_alert = None

    # Simple keyword matching to update counters
    if any("mic_permission" in log for log in logs):
        ERROR_COUNTER["mic_permission_denied"] += 1

    if any("file_format" in log for log in logs):
        ERROR_COUNTER["error_file_format"] += 1

    # Check thresholds
    if diagnosis == "PERMISSION_ISSUE" and ERROR_COUNTER["mic_permission_denied"] >= ALERT_THRESHOLD:
        system_alert = "URGENT: Multiple users failing at Mic Permissions. Potential browser compatibility issue."

    elif diagnosis == "TECHNICAL_ERROR" and ERROR_COUNTER["error_file_format"] >= ALERT_THRESHOLD:
        system_alert = "WARNING: Spike in unsupported file format errors. Review upload validation logic."

    return {"system_alert": system_alert}


def strategy_selector_node(state: AgentState):
    """Decides the action based on diagnosis."""
    diagnosis = state["friction_diagnosis"]

    if diagnosis == "TECHNICAL_ERROR":
        return {"action_plan": "SEND_SUPPORT_EMAIL"}
    elif diagnosis == "CONFUSION":
        return {"action_plan": "SEND_TUTORIAL_EMAIL"}
    elif diagnosis == "PERMISSION_ISSUE":
        return {"action_plan": "SEND_SETUP_GUIDE"}
    else:
        return {"action_plan": "DO_NOTHING"}


def draft_content_node(state: AgentState):
    """
    Drafts a hyper-personalized recovery email.
    The goal is to solve the SPECIFIC blocker, not just say 'come back'.
    """
    if state["action_plan"] == "DO_NOTHING":
        return {"email_draft": None}

    prompt = ChatPromptTemplate.from_template(
        """
        You are a Senior Customer Success Manager at Heidi.

        CONTEXT:
        A user ({name}) just abandoned the app. 
        Analysis shows they left because of: {diagnosis}.
        Recent Logs: {logs}

        TASK:
        Write a 1-to-1 personal email to unblock them.

        GUIDELINES FOR "{diagnosis}":
        - If TECHNICAL_ERROR: Be apologetic. Acknowledge the specific error (e.g., file format). Offer a workaround or a direct fix.
        - If CONFUSION: Be a guide. Suggest a specific high-converting template or feature they missed.
        - If PERMISSION_ISSUE: Be technical but simple. Give the 1-click instruction to unblock the microphone/camera.

        TONE RULES:
        - Subject Line: Short, lowercase, feels like it's from a colleague (e.g., "quick fix for the upload", "the mic setting").
        - Body: Max 3 sentences. No marketing fluff. No "I hope this email finds you well."
        - Sign-off: "Best, Heidi"

        OUTPUT FORMAT:
        Subject: [Subject Line]

        [Body]
        """
    )
    chain = prompt | llm
    res = chain.invoke({
        "name": state["user_name"],
        "diagnosis": state["friction_diagnosis"],
        "logs": state["session_events"]
    })
    return {"email_draft": res.content}


# Graph Construction

workflow = StateGraph(AgentState)

# Add Nodes
workflow.add_node("analyze", analyze_friction_node)
workflow.add_node("check_health", update_system_health_node)  # The "Self-Healing" step
workflow.add_node("decide_strategy", strategy_selector_node)
workflow.add_node("draft_email", draft_content_node)

# Add Edges
workflow.set_entry_point("analyze")
workflow.add_edge("analyze", "check_health")
workflow.add_edge("check_health", "decide_strategy")
workflow.add_edge("decide_strategy", "draft_email")
workflow.add_edge("draft_email", END)

# Compile
app_graph = workflow.compile()
