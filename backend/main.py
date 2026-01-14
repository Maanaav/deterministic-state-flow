from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json

from schemas import AgentResponse
from agent import app_graph, ERROR_COUNTER

app = FastAPI(title="Heidi Growth Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Mock Data for the Demo
with open("mock_data.json", "r") as f:
    MOCK_DB = json.load(f)


@app.get("/")
def health_check():
    return {"status": "active", "system_health": ERROR_COUNTER}


@app.post("/process-session", response_model=AgentResponse)
async def process_user_session(user_id: str):
    """
    Trigger the agent for a specific user ID from the mock DB.
    """
    # Fetch User Data
    user_data = next((u for u in MOCK_DB if u["user_id"] == user_id), None)
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")

    # Initialize Agent State
    initial_state = {
        "user_id": user_data["user_id"],
        "user_name": user_data["name"],
        "session_events": user_data["session_events"],
        "friction_diagnosis": None,
        "action_plan": None,
        "email_draft": None,
        "system_alert": None
    }

    # LangGraph Workflow
    final_state = await app_graph.ainvoke(initial_state)
    print(final_state)

    return AgentResponse(
        user_id=final_state["user_id"],
        friction_type=final_state["friction_diagnosis"],
        proposed_action=final_state["action_plan"],
        draft_content=final_state["email_draft"] or "No action needed",
        system_alert=final_state["system_alert"]
    )


@app.get("/system-alerts")
def get_system_alerts():
    """
    Simulates the 'Self-Healing' Dashboard view.
    """
    alerts = []
    if ERROR_COUNTER["mic_permission_denied"] >= 2:
        alerts.append("CRITICAL: Mic Permission Spike Detected. Auto-ticket created for Engineering.")
    if ERROR_COUNTER["error_file_format"] >= 2:
        alerts.append("WARNING: File Format Errors Rising.")

    return {
        "current_error_counts": ERROR_COUNTER,
        "active_alerts": alerts
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
