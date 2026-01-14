"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Mail,
  User,
  Terminal,
  ShieldAlert,
  Play,
  Check,
} from "lucide-react";

// --- Types ---
type AgentResponse = {
  user_id: string;
  friction_type: string;
  proposed_action: string;
  draft_content: string;
  system_alert: string | null;
};

type SystemHealth = {
  active_alerts: string[];
  current_error_counts: {
    mic_permission_denied: number;
    error_file_format: number;
  };
};

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgentResponse | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // Simulate "Streaming" logs for effect
  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `> ${message}`]);
  };

  const fetchHealth = async () => {
    try {
      const res = await axios.get("http://localhost:8000/system-alerts");
      setHealth(res.data);
    } catch (e) {
      console.error("Health check failed", e);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  const runSimulation = async (userId: string, label: string) => {
    setLoading(true);
    setResult(null);
    setLogs([]);
    addLog(`Initializing Session for ${label}...`);
    addLog(`Fetching Logs for ${userId}...`);

    try {
      // 1. Simulate "Thinking" time for the Agent
      await new Promise((r) => setTimeout(r, 800));
      addLog("Agent: Analyzing Friction Patterns...");

      const res = await axios.post(
        `http://localhost:8000/process-session?user_id=${userId}`
      );

      await new Promise((r) => setTimeout(r, 800));
      addLog(`Agent: Friction Identified -> ${res.data.friction_type}`);

      if (res.data.proposed_action !== "DO_NOTHING") {
        addLog(`Agent: Drafting Content...`);
      }

      setResult(res.data);
      addLog("Workflow Complete.");

      // Refresh health to see if counters went up
      fetchHealth();
    } catch (error) {
      addLog("Error: Failed to contact Agent API.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200">
                <Bot className="text-white w-6 h-6" />
              </div>
              Heidi Growth Agent
            </h1>
            <p className="text-slate-500 mt-1 ml-14">
              Autonomous Lifecycle & Retention System
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white px-4 py-2 rounded-full border border-slate-200 flex items-center gap-2 shadow-sm">
              <div
                className={`w-2 h-2 rounded-full ${
                  health?.active_alerts.length
                    ? "bg-red-500 animate-pulse"
                    : "bg-emerald-500"
                }`}
              />
              <span className="text-sm font-medium text-slate-600">
                {health?.active_alerts.length
                  ? "System Alert Active"
                  : "System Healthy"}
              </span>
            </div>
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Controls & Logs (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Simulation Controls */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Simulate Traffic
              </h2>
              <div className="space-y-3">
                <SimulationButton
                  onClick={() =>
                    runSimulation("user_101", "Dr. Sarah (File Error)")
                  }
                  label="User 101: Dr. Sarah"
                  desc="Fails at File Upload (Technical)"
                  color="bg-red-50 hover:bg-red-100 border-red-200 text-red-700"
                  icon={<AlertTriangle className="w-4 h-4" />}
                  loading={loading}
                />
                <SimulationButton
                  onClick={() =>
                    runSimulation("user_102", "Dr. James (Confused)")
                  }
                  label="User 102: Dr. James"
                  desc="Gets lost in Templates (Confusion)"
                  color="bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700"
                  icon={<User className="w-4 h-4" />}
                  loading={loading}
                />
                <SimulationButton
                  onClick={() => runSimulation("user_103", "Dr. Emily (Perms)")}
                  label="User 103: Dr. Emily"
                  desc="Mic Permission Denied (Permission)"
                  color="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                  icon={<ShieldAlert className="w-4 h-4" />}
                  loading={loading}
                />
              </div>
            </div>

            {/* Live Logs Terminal */}
            <div className="bg-slate-900 rounded-2xl p-6 shadow-lg min-h-[300px] flex flex-col font-mono text-sm">
              <div className="flex items-center gap-2 text-slate-400 mb-4 border-b border-slate-800 pb-2">
                <Terminal className="w-4 h-4" />
                <span>Agent Logs</span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto max-h-[250px] scrollbar-hide">
                <AnimatePresence>
                  {logs.map((log, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-emerald-400"
                    >
                      {log}
                    </motion.div>
                  ))}
                  {logs.length === 0 && (
                    <span className="text-slate-600 italic">
                      Waiting for event stream...
                    </span>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Right Column: Results & Visualization (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* System Health Dashboard */}
            <div className="grid grid-cols-2 gap-4">
              <HealthCard
                label="File Format Errors"
                count={health?.current_error_counts.error_file_format || 0}
                threshold={2}
              />
              <HealthCard
                label="Mic Permission Failures"
                count={health?.current_error_counts.mic_permission_denied || 0}
                threshold={2}
              />
            </div>

            {/* System Alert Banner */}
            <AnimatePresence>
              {health?.active_alerts.map((alert, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"
                >
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-900">
                      System Alert Triggered
                    </h4>
                    <p className="text-red-700 text-sm">{alert}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Agent Result Display */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
              >
                {/* Result Header */}
                <div className="bg-indigo-600 p-6 text-white flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold opacity-90">
                      Analysis Complete
                    </h2>
                    <p className="text-2xl font-bold mt-1">
                      {result.friction_type.replace("_", " ")}
                    </p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-sm font-medium">
                    UserID: {result.user_id}
                  </div>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Strategy Column */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                      Action Plan
                    </h3>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div className="text-lg font-medium text-slate-800">
                        {result.proposed_action}
                      </div>
                    </div>
                  </div>

                  {/* Email Draft Column */}
                  <div className="col-span-2 md:col-span-1 md:row-span-2">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                      Generated Content
                    </h3>
                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 relative group">
                      <div className="absolute top-4 right-4">
                        <Mail className="w-5 h-5 text-slate-300" />
                      </div>
                      {result.draft_content ? (
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <div className="h-2 w-16 bg-slate-200 rounded" />
                            <div className="h-2 w-24 bg-slate-200 rounded" />
                          </div>
                          <p className="text-slate-700 leading-relaxed font-medium">
                            "{result.draft_content}"
                          </p>
                          <ActionButtons />
                        </div>
                      ) : (
                        <div className="text-slate-400 italic text-sm">
                          No action required for this session.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {!result && !loading && (
              <div className="h-[300px] border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-400">
                Select a user on the left to start the agent
              </div>
            )}

            {loading && (
              <div className="h-[300px] flex flex-col items-center justify-center text-slate-400 space-y-4">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="animate-pulse">Agent is thinking...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Components ---

function ActionButtons() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const handleApprove = async () => {
    setStatus("sending");
    // Simulate API delay
    await new Promise((r) => setTimeout(r, 800));
    setStatus("sent");
  };

  return (
    <div className="flex gap-2 mt-4">
      <button
        onClick={handleApprove}
        disabled={status === "sent" || status === "sending"}
        className={`text-white text-xs px-3 py-1.5 rounded-md transition-all shadow-sm flex items-center gap-2 ${
          status === "sent"
            ? "bg-emerald-500 hover:bg-emerald-500 cursor-default"
            : "bg-indigo-600 hover:bg-indigo-700"
        }`}
      >
        {status === "idle" && "Approve & Send"}
        {status === "sending" && (
          <>
            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Sending...
          </>
        )}
        {status === "sent" && (
          <>
            <Check className="w-3 h-3" />
            Sent!
          </>
        )}
      </button>

      {status !== "sent" && (
        <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs px-3 py-1.5 rounded-md transition-colors">
          Edit Draft
        </button>
      )}
    </div>
  );
}

function SimulationButton({ onClick, label, desc, color, icon, loading }: any) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 group relative overflow-hidden ${color} ${
        loading
          ? "opacity-50 cursor-not-allowed"
          : "hover:shadow-md hover:-translate-y-0.5"
      }`}
    >
      <div className="flex items-start gap-3 relative z-10">
        <div className="mt-1">{icon}</div>
        <div>
          <div className="font-semibold">{label}</div>
          <div className="text-xs opacity-80 mt-0.5">{desc}</div>
        </div>
        <div className="ml-auto mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Play className="w-4 h-4 fill-current" />
        </div>
      </div>
    </button>
  );
}

function HealthCard({ label, count, threshold }: any) {
  const isCritical = count >= threshold;
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
      <div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
          {label}
        </div>
        <div
          className={`text-2xl font-bold ${
            isCritical ? "text-red-600" : "text-slate-700"
          }`}
        >
          {count}{" "}
          <span className="text-sm font-normal text-slate-400">events</span>
        </div>
      </div>
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isCritical
            ? "bg-red-100 text-red-600"
            : "bg-emerald-100 text-emerald-600"
        }`}
      >
        {isCritical ? (
          <AlertTriangle className="w-5 h-5" />
        ) : (
          <CheckCircle2 className="w-5 h-5" />
        )}
      </div>
    </div>
  );
}
