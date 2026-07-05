import { useState, useEffect, FormEvent } from 'react';
import { motion } from 'motion/react';
import { Bug, AlertTriangle, Play, HelpCircle, CheckCircle, Trash2, ShieldAlert, Sparkles, Plus, X } from 'lucide-react';
import { BugTicket, User } from '../types';

interface BugTrackerProps {
  user: User | null;
}

export default function BugTracker({ user }: BugTrackerProps) {
  const [bugs, setBugs] = useState<BugTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Ticket Form State
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');

  // Selected Bug Detail View
  const [selectedBug, setSelectedBug] = useState<BugTicket | null>(null);

  useEffect(() => {
    fetchBugs();
  }, []);

  const fetchBugs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/bugs');
      if (res.ok) {
        const data = await res.json();
        setBugs(data);
        if (data.length > 0 && !selectedBug) {
          setSelectedBug(data[0]);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBug = async (e: FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/bugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          codeSnippet,
          userId: user?.id
        })
      });

      if (res.ok) {
        const newBug = await res.json();
        setBugs([newBug, ...bugs]);
        setSelectedBug(newBug);
        setTitle('');
        setDescription('');
        setCodeSnippet('');
        setShowForm(false);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'Open' | 'In Progress' | 'Resolved') => {
    try {
      const res = await fetch(`/api/bugs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        const updated = await res.json();
        setBugs(bugs.map(b => b.id === id ? updated : b));
        if (selectedBug?.id === id) {
          setSelectedBug(updated);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBug = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bug ticket?')) return;
    try {
      const res = await fetch(`/api/bugs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const updated = bugs.filter(b => b.id !== id);
        setBugs(updated);
        if (selectedBug?.id === id) {
          setSelectedBug(updated.length > 0 ? updated[0] : null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getPriorityColor = (prio: string) => {
    switch (prio) {
      case 'Critical': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'High': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'Medium': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      default: return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'In Progress': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      default: return 'text-zinc-400 bg-zinc-800 border-zinc-700';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-140px)]" id="bug-tracker-root">
      {/* Left Column: Tickets List */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 flex flex-col h-full overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-semibold uppercase text-zinc-400 tracking-wider font-mono">
            Bug Backlog ({bugs.length})
          </h3>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-xs px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg border border-zinc-700 font-mono flex items-center gap-1 transition-colors"
          >
            {showForm ? <X size={12} /> : <Plus size={12} />}
            {showForm ? 'CANCEL' : 'REPORT BUG'}
          </button>
        </div>

        {/* Tickets List Area */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <div className="text-center py-12 text-zinc-500 text-xs font-mono">Fetching tickets...</div>
          ) : bugs.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-xs font-mono">No bugs reported. Stable release!</div>
          ) : (
            bugs.map((bug) => (
              <div
                key={bug.id}
                onClick={() => {
                  setSelectedBug(bug);
                  setShowForm(false);
                }}
                className={`p-3.5 rounded-xl cursor-pointer border text-left transition-all space-y-2.5 ${
                  selectedBug?.id === bug.id
                    ? 'bg-zinc-800/80 border-zinc-700'
                    : 'bg-zinc-900/20 hover:bg-zinc-900/50 border-transparent'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <h4 className="text-xs font-semibold text-white font-sans truncate flex-1">{bug.title}</h4>
                  <span className={`text-[9px] font-bold font-mono uppercase px-1.5 py-0.5 rounded border flex-shrink-0 ${getPriorityColor(bug.priority)}`}>
                    {bug.priority}
                  </span>
                </div>
                
                <p className="text-[11px] text-zinc-400 font-sans line-clamp-2 leading-relaxed">
                  {bug.description}
                </p>

                <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500">
                  <span className={`px-2 py-0.5 rounded-full border ${getStatusColor(bug.status)}`}>
                    {bug.status}
                  </span>
                  <span>{new Date(bug.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Column: Ticket Viewer & Form Creator */}
      <div className="md:col-span-2 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl flex flex-col h-full overflow-hidden relative">
        
        {/* FORM CREATOR OVERLAY */}
        {showForm ? (
          <form onSubmit={handleCreateBug} className="p-6 space-y-4 h-full overflow-y-auto">
            <h3 className="text-sm font-semibold text-white uppercase font-mono tracking-wider flex items-center gap-2">
              <Bug size={16} className="text-rose-500" />
              Report System Defect / AI Analyzer
            </h3>
            <p className="text-zinc-400 text-xs font-sans">
              Log a ticket. Gemini will automatically analyze your code to predict bug priority, detect memory leaks or logical errors, and suggest a correction strategy.
            </p>

            <div className="space-y-1">
              <label className="text-zinc-400 text-xs font-mono block">BUG TITLE / TICKET NAME</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. NullPointerException in auth token parsing loop"
                className="w-full bg-zinc-950 text-white border border-zinc-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-zinc-700 font-sans"
              />
            </div>

            <div className="space-y-1">
              <label className="text-zinc-400 text-xs font-mono block">BUG DESCRIPTION</label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what occurs, steps to reproduce, or runtime environments."
                className="w-full bg-zinc-950 text-white border border-zinc-800 rounded-xl p-3.5 text-xs focus:outline-none focus:border-zinc-700 font-sans leading-relaxed"
              />
            </div>

            <div className="space-y-1">
              <label className="text-zinc-400 text-xs font-mono block">VULNERABLE CODE BLOCK (OPTIONAL)</label>
              <textarea
                rows={5}
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                placeholder="Paste code snippet causing the exception or bug..."
                className="w-full bg-zinc-950 text-zinc-300 border border-zinc-800 rounded-xl p-3 text-xs focus:outline-none focus:border-zinc-700 font-mono leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-white hover:bg-zinc-100 text-zinc-950 font-medium text-sm rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {submitting ? 'Generating AI Analysis...' : 'Submit Defect Log'}
            </button>
          </form>
        ) : selectedBug ? (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Ticket Header Controls */}
            <div className="bg-zinc-900/60 border-b border-zinc-800 px-6 py-4 flex justify-between items-center flex-wrap gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase font-bold ${getPriorityColor(selectedBug.priority)}`}>
                    {selectedBug.priority} Priority
                  </span>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border uppercase ${getStatusColor(selectedBug.status)}`}>
                    {selectedBug.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white font-sans mt-1">{selectedBug.title}</h3>
              </div>

              {/* Modify State buttons */}
              <div className="flex items-center gap-1.5 text-xs">
                {selectedBug.status !== 'In Progress' && selectedBug.status !== 'Resolved' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedBug.id, 'In Progress')}
                    className="px-2.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg font-mono text-[10px] transition-colors"
                  >
                    START WORK
                  </button>
                )}
                {selectedBug.status !== 'Resolved' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedBug.id, 'Resolved')}
                    className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg font-mono text-[10px] transition-colors"
                  >
                    RESOLVED
                  </button>
                )}
                <button
                  onClick={() => handleDeleteBug(selectedBug.id)}
                  className="p-1.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 rounded-lg border border-zinc-750 transition-colors"
                  title="Delete ticket"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Ticket Body scroll */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Description */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Description</span>
                <p className="text-sm text-zinc-300 font-sans leading-relaxed whitespace-pre-wrap bg-zinc-900/20 p-4 rounded-xl border border-zinc-800/50">
                  {selectedBug.description}
                </p>
              </div>

              {/* Code Snippet */}
              {selectedBug.codeSnippet && (
                <div className="space-y-1.5">
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Logged Code Snippet</span>
                  <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 font-mono text-xs text-zinc-300">
                    <pre className="p-4 overflow-x-auto"><code>{selectedBug.codeSnippet}</code></pre>
                  </div>
                </div>
              )}

              {/* Gemini AI Analysis Panel */}
              <div className="bg-gradient-to-r from-blue-500/5 to-purple-500/5 p-5 rounded-xl border border-blue-500/10 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-semibold text-white uppercase font-mono tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} className="text-blue-400" />
                    Gemini AI Defect Analysis
                  </h4>
                  <span className="text-[9px] font-mono text-blue-400/80 bg-blue-400/5 border border-blue-400/10 px-1.5 py-0.5 rounded">
                    AUTO ANALYZED
                  </span>
                </div>

                <div className="space-y-3 text-xs leading-relaxed font-sans text-zinc-300">
                  <div>
                    <span className="font-semibold text-zinc-400 block mb-1">Root Cause Diagnostics:</span>
                    <p className="bg-zinc-950/30 p-3 rounded-lg border border-zinc-800/40 text-zinc-300 font-sans leading-relaxed">
                      {selectedBug.aiAnalysis}
                    </p>
                  </div>
                  
                  <div>
                    <span className="font-semibold text-zinc-400 block mb-1">Recommended Resolution Strategy:</span>
                    <pre className="bg-zinc-950/80 p-4 rounded-lg border border-zinc-800/80 text-zinc-200 overflow-x-auto font-mono text-xs">
                      <code>{selectedBug.resolutionSuggestion}</code>
                    </pre>
                  </div>
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto space-y-4">
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-500">
              <Bug size={32} />
            </div>
            <h3 className="text-zinc-400 font-medium text-sm">Select a Bug Ticket</h3>
            <p className="text-zinc-500 text-xs leading-relaxed font-mono">
              Retrieve automated code audits, security analysis, and repair code templates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
