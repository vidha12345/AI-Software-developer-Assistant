import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Activity, Code, Bug, Terminal, Cpu, FileText, 
  Settings, CheckCircle, Clock, AlertTriangle, Play, ArrowRight 
} from 'lucide-react';
import { AnalyticsData, User } from '../types';

interface DashboardProps {
  user: User | null;
  onNavigate: (module: string) => void;
}

export default function Dashboard({ user, onNavigate }: DashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/analytics');
      if (!res.ok) throw new Error('Failed to load metrics');
      const json = await res.ok ? await res.json() : null;
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'chat', label: 'AI Chat Session', desc: 'Ask programming questions', icon: Terminal, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
    { id: 'generate', label: 'Code Generator', desc: 'Convert prompts to clean code', icon: Code, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
    { id: 'debug', label: 'Code Debugger', desc: 'Locate bugs and optimize logic', icon: Cpu, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
    { id: 'review', label: 'Code Reviewer', desc: 'Audit security & clean code metrics', icon: Settings, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
    { id: 'docs', label: 'Docs Generator', desc: 'Create README & JSDocs', icon: FileText, color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20' },
    { id: 'bugs', label: 'Bug Tracker', desc: 'Predict priorities and manage tickets', icon: Bug, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-zinc-300 border-t-zinc-900 rounded-full animate-spin"></div>
          <p className="text-zinc-500 text-sm font-mono">Compiling workbench logs...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
      id="dashboard-root"
    >
      {/* Header and Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white font-sans">
            Welcome back, {user?.name || 'Developer'}!
          </h2>
          <p className="text-zinc-400 text-sm mt-1">
            Your production AI software engineering workspace is fully optimized and online.
          </p>
        </div>
        <div className="flex gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 text-emerald-400 rounded-lg border border-zinc-700/50">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            AI AGENT ACTIVE
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg border border-zinc-700/50">
            MODEL: GEMINI-3.5-FLASH
          </div>
        </div>
      </div>

      {/* Metrics Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-zinc-400 uppercase font-mono tracking-wider">AI Operations Run</span>
            <div className="text-3xl font-bold text-white font-mono">{data?.totalAIOperations ?? 0}</div>
          </div>
          <div className="p-3 bg-zinc-800/80 rounded-xl text-blue-400 border border-zinc-700/50">
            <Activity size={24} />
          </div>
        </div>

        <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-zinc-400 uppercase font-mono tracking-wider">Saved Code Snippets</span>
            <div className="text-3xl font-bold text-white font-mono">{data?.snippetCount ?? 0}</div>
          </div>
          <div className="p-3 bg-zinc-800/80 rounded-xl text-emerald-400 border border-zinc-700/50">
            <Code size={24} />
          </div>
        </div>

        <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-zinc-400 uppercase font-mono tracking-wider">Active Bug Tickets</span>
            <div className="text-3xl font-bold text-white font-mono">{data?.bugCount ?? 0}</div>
          </div>
          <div className="p-3 bg-zinc-800/80 rounded-xl text-rose-400 border border-zinc-700/50">
            <Bug size={24} />
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Modular Launchers */}
        <div className="lg:col-span-2 space-y-5">
          <h3 className="text-sm font-semibold uppercase text-zinc-400 tracking-wider font-mono">
            Workbench Tools
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <motion.div
                  key={cat.id}
                  whileHover={{ scale: 1.02, y: -2 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  onClick={() => onNavigate(cat.id)}
                  className="bg-zinc-900/30 hover:bg-zinc-900/60 p-5 rounded-2xl border border-zinc-800/80 cursor-pointer flex flex-col justify-between h-40 transition-colors group"
                >
                  <div className="flex justify-between items-start">
                    <div className={`p-2.5 rounded-xl border ${cat.color}`}>
                      <Icon size={20} />
                    </div>
                    <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors">
                      <ArrowRight size={18} />
                    </span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium text-sm group-hover:text-blue-400 transition-colors">
                      {cat.label}
                    </h4>
                    <p className="text-zinc-400 text-xs mt-1">
                      {cat.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Activity Streams & Analytics breakdown */}
        <div className="space-y-6">
          
          {/* Recent Activity Log */}
          <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800 space-y-4">
            <h3 className="text-xs font-semibold uppercase text-zinc-400 tracking-wider font-mono flex items-center gap-2">
              <Clock size={14} className="text-zinc-500" />
              Dynamic Activity Feed
            </h3>
            
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {data?.recentActivity && data.recentActivity.length > 0 ? (
                data.recentActivity.map((act) => (
                  <div key={act.id} className="text-xs flex gap-2.5 items-start p-2.5 bg-zinc-900/50 rounded-xl border border-zinc-800/60">
                    <div className="mt-0.5">
                      {act.type === 'bug' && <span className="w-2 h-2 rounded-full bg-rose-500 block"></span>}
                      {act.type === 'snippet' && <span className="w-2 h-2 rounded-full bg-emerald-500 block"></span>}
                      {act.type === 'chat' && <span className="w-2 h-2 rounded-full bg-blue-500 block"></span>}
                      {!['bug', 'snippet', 'chat'].includes(act.type) && <span className="w-2 h-2 rounded-full bg-zinc-500 block"></span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-zinc-300 font-sans truncate">{act.description}</p>
                      <span className="text-zinc-500 font-mono mt-0.5 block">
                        {new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-zinc-500 font-mono text-xs">
                  No active engineering logs logged yet.
                </div>
              )}
            </div>
          </div>

          {/* AI Usage stats */}
          <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800 space-y-4">
            <h3 className="text-xs font-semibold uppercase text-zinc-400 tracking-wider font-mono">
              AI Command Breakdowns
            </h3>
            
            <div className="space-y-3">
              {data?.categoryBreakdown && data.categoryBreakdown.map((item) => {
                const total = data.totalAIOperations || 1;
                const pct = Math.round((item.count / total) * 100);
                return (
                  <div key={item.category} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-zinc-400">{item.category}</span>
                      <span className="text-zinc-300 font-semibold">{item.count}</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-500 h-full rounded-full" 
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </motion.div>
  );
}
