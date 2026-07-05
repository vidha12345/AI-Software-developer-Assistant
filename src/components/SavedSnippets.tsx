import { useState, useEffect, MouseEvent } from 'react';
import { motion } from 'motion/react';
import { Code, Trash2, Copy, Check, Terminal, ExternalLink, Cpu, Play } from 'lucide-react';
import { SavedSnippet } from '../types';

interface SavedSnippetsProps {
  userId: string;
  onSendToWorkbench: (code: string, tab: string) => void;
  // Trigger update from external saves
  refreshTrigger: number;
}

export default function SavedSnippets({ userId, onSendToWorkbench, refreshTrigger }: SavedSnippetsProps) {
  const [snippets, setSnippets] = useState<SavedSnippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSnippet, setSelectedSnippet] = useState<SavedSnippet | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchSnippets();
  }, [refreshTrigger]);

  const fetchSnippets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/snippets');
      if (res.ok) {
        const data = await res.json();
        setSnippets(data);
        if (data.length > 0 && !selectedSnippet) {
          setSelectedSnippet(data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteSnippet = async (id: string, e: MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this saved snippet?')) return;
    try {
      const res = await fetch(`/api/snippets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const updated = snippets.filter(s => s.id !== id);
        setSnippets(updated);
        if (selectedSnippet?.id === id) {
          setSelectedSnippet(updated.length > 0 ? updated[0] : null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-140px)]" id="saved-snippets-root">
      {/* Left Column: Snippet Catalog */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 flex flex-col h-full overflow-hidden">
        <h3 className="text-xs font-semibold uppercase text-zinc-400 tracking-wider font-mono mb-4">
          Snippet Vault ({snippets.length})
        </h3>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <div className="text-center py-12 text-zinc-500 text-xs font-mono">Unlocking vault...</div>
          ) : snippets.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-xs font-mono">Your snippet vault is currently empty.</div>
          ) : (
            snippets.map((snip) => (
              <div
                key={snip.id}
                onClick={() => setSelectedSnippet(snip)}
                className={`p-3.5 rounded-xl cursor-pointer border text-left transition-all space-y-2 group ${
                  selectedSnippet?.id === snip.id
                    ? 'bg-zinc-800/80 border-zinc-700'
                    : 'bg-zinc-900/20 hover:bg-zinc-900/50 border-transparent'
                }`}
              >
                <div className="flex justify-between items-start">
                  <h4 className="text-xs font-semibold text-white font-sans truncate flex-1">{snip.title}</h4>
                  <button
                    onClick={(e) => deleteSnippet(snip.id, e)}
                    className="text-zinc-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                {snip.description && (
                  <p className="text-[11px] text-zinc-400 font-sans line-clamp-2 leading-relaxed">
                    {snip.description}
                  </p>
                )}

                <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500">
                  <span className="uppercase text-blue-400">{snip.language}</span>
                  <span>{new Date(snip.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Column: Code Viewer & Pipeline Dispatcher */}
      <div className="md:col-span-2 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl flex flex-col h-full overflow-hidden relative">
        {selectedSnippet ? (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header with Title and Copy */}
            <div className="bg-zinc-900/60 border-b border-zinc-800 px-6 py-4 flex justify-between items-center flex-wrap gap-2">
              <div>
                <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider bg-blue-400/5 px-2 py-0.5 border border-blue-400/10 rounded">
                  {selectedSnippet.language}
                </span>
                <h3 className="text-sm font-bold text-white font-sans mt-2">{selectedSnippet.title}</h3>
                {selectedSnippet.description && (
                  <p className="text-xs text-zinc-400 font-sans mt-1">{selectedSnippet.description}</p>
                )}
              </div>

              <button
                onClick={() => handleCopy(selectedSnippet.code, selectedSnippet.id)}
                className="text-xs p-1.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 rounded-lg border border-zinc-750 flex items-center gap-1.5 transition-colors font-mono"
              >
                {copiedId === selectedSnippet.id ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                {copiedId === selectedSnippet.id ? 'Copied' : 'Copy Code'}
              </button>
            </div>

            {/* Code Body */}
            <div className="flex-1 p-6 overflow-y-auto font-mono text-xs text-zinc-300 bg-zinc-950/80">
              <pre className="whitespace-pre-wrap leading-relaxed">
                <code>{selectedSnippet.code}</code>
              </pre>
            </div>

            {/* Pipeline Dispatcher Panel */}
            <div className="p-5 bg-zinc-900 border-t border-zinc-800 space-y-3">
              <h4 className="text-xs font-semibold text-white uppercase font-mono tracking-wider flex items-center gap-1.5">
                <ExternalLink size={13} className="text-blue-400" />
                Pipeline Dispatch Channels
              </h4>
              <p className="text-[11px] text-zinc-400 font-sans">
                Pipe this code directly into your active AI developer workbench modules.
              </p>

              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => onSendToWorkbench(selectedSnippet.code, 'debug')}
                  className="p-3 bg-zinc-950 hover:bg-zinc-850 border border-zinc-800/80 hover:border-zinc-700 rounded-xl text-left space-y-1 cursor-pointer transition-all"
                >
                  <span className="text-xs font-bold text-amber-400 font-mono block">Code Debugger</span>
                  <span className="text-[10px] text-zinc-500 block">Detect syntax & logical errors</span>
                </button>

                <button
                  onClick={() => onSendToWorkbench(selectedSnippet.code, 'review')}
                  className="p-3 bg-zinc-950 hover:bg-zinc-850 border border-zinc-800/80 hover:border-zinc-700 rounded-xl text-left space-y-1 cursor-pointer transition-all"
                >
                  <span className="text-xs font-bold text-purple-400 font-mono block">Code Reviewer</span>
                  <span className="text-[10px] text-zinc-500 block">Audit S.O.L.I.D & metrics</span>
                </button>

                <button
                  onClick={() => onSendToWorkbench(selectedSnippet.code, 'tests')}
                  className="p-3 bg-zinc-950 hover:bg-zinc-850 border border-zinc-800/80 hover:border-zinc-700 rounded-xl text-left space-y-1 cursor-pointer transition-all"
                >
                  <span className="text-xs font-bold text-indigo-400 font-mono block">Test Generator</span>
                  <span className="text-[10px] text-zinc-500 block">Create testing suites</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto space-y-4">
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-500">
              <Code size={32} />
            </div>
            <h3 className="text-zinc-400 font-medium text-sm">Select a Saved Snippet</h3>
            <p className="text-zinc-500 text-xs leading-relaxed font-mono">
              Open modular code snippets from your secure file-based storage database.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
