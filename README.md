
# Autonomous Lifecycle Agent

An autonomous AI agent that monitors user friction in real-time and intervenes to fix activation drop-offs.

Traditional lifecycle marketing is rigid. It relies on "time-based" triggers (e.g., "Send Email 1 on Day 3"). It doesn't know why a user dropped off, so it sends generic "Come back!" emails that get ignored.

Build an AI Agent that monitors user session logs in real-time, diagnoses the specific friction point that caused the user to leave, and generates a hyper-personalized intervention to bring them back.

Metric: Activation Rate (Time to First Successful Note)

## The Stack
- **Backend:** Python, FastAPI, LangGraph
- **Frontend:** Next.js
- **AI:** Ollama running **Qwen 2.5 (3B)** locally

## How to Run

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python main.py

```
## Prerequisite: Setup Ollama
Ensure you have [Ollama](https://ollama.com/) installed and running.
```bash
ollama pull qwen2.5:3b
````

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev

```

### 3. Usage

Open http://localhost:3000 to view the Live Command Center.
