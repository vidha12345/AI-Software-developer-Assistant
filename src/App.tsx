import { useState, useEffect } from 'react';
import { 
  Terminal, Code, Bug, Settings, Shield, Cpu, 
  Activity, LogOut, ChevronRight, Menu, X, FileText 
} from 'lucide-react';
import { User } from './types';
import Dashboard from './components/Dashboard';
import AuthModal from './components/AuthModal';
import ChatAssistant from './components/ChatAssistant';
import CodeWorkbench from './components/CodeWorkbench';
import SavedSnippets from './components/SavedSnippets';
import BugTracker from './components/BugTracker';
import AdminPanel from './components/AdminPanel';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [currentModule, setCurrentModule] = useState<string>('dashboard');
  
  // Navigation cross-pipelines state
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [workbenchTab, setWorkbenchTab] = useState<string>('generate');
  const [snippetRefresh, setSnippetRefresh] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Auto load simulated session from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('devai_user');
    const savedToken = localStorage.getItem('devai_token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
  }, []);

  const handleAuthSuccess = (newUser: User, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
    localStorage.setItem('devai_user', JSON.stringify(newUser));
    localStorage.setItem('devai_token', newToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('devai_user');
    localStorage.removeItem('devai_token');
    setCurrentModule('dashboard');
  };

  const handleSendToWorkbench = (code: string, tab: string) => {
    // Force active tab
    setWorkbenchTab(tab);
    // Put code block inside the correct text area
    if (tab === 'debug') {
      // Find the input element or let state handle it.
      // We will mount CodeWorkbench with the active tab and it handles selection
    }
    setCurrentModule('workbench');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'chat', label: 'AI Chat Assistant', icon: Terminal },
    { id: 'workbench', label: 'Code Workbench', icon: Code },
    { id: 'snippets', label: 'Saved Snippets', icon: FileText },
    { id: 'bugs', label: 'Bug Tracker', icon: Bug },
    { id: 'admin', label: 'Admin Panel', icon: Shield, adminOnly: true },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white font-sans flex items-center justify-center">
        <AuthModal onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col md:flex-row">
      
      {/* Sidebar navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col justify-between transform transition-transform duration-300 md:relative md:transform-none ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="p-6 space-y-8 flex-1 overflow-hidden flex flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/5 border border-white/10 text-white rounded-xl">
                <Cpu size={20} />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-white font-sans">
                  DevAI Workbench
                </h1>
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block">
                  v3.5 Compiler Node
                </span>
              </div>
            </div>
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden text-zinc-400 hover:text-white p-1"
            >
              <X size={18} />
            </button>
          </div>

          {/* Nav list */}
          <nav className="space-y-1.5 overflow-y-auto flex-1 pr-1">
            {menuItems.map((item) => {
              if (item.adminOnly && user.role !== 'admin') return null;
              const Icon = item.icon;
              const isActive = currentModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentModule(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-xs font-medium cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-zinc-800 border-zinc-700 text-white' 
                      : 'bg-transparent border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                  }`}
                >
                  <Icon size={16} />
                  <span className="flex-1">{item.label}</span>
                  {isActive && <ChevronRight size={12} className="text-zinc-500" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card / Logout */}
        <div className="p-6 border-t border-zinc-800 space-y-4 bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-850 border border-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-white block truncate">{user.name}</span>
              <span className="text-[10px] font-mono text-zinc-500 block truncate">{user.role.toUpperCase()} LEVEL</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2.5 bg-zinc-850 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 border border-zinc-800 hover:border-rose-500/20 text-[10px] font-mono rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <LogOut size={12} />
            TERMINATE SESSION
          </button>
        </div>
      </aside>

      {/* Main viewport */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Mobile Header bar */}
        <header className="md:hidden flex items-center justify-between px-6 py-4 bg-zinc-900 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-white/5 border border-white/10 text-white rounded-lg">
              <Cpu size={16} />
            </div>
            <h1 className="text-xs font-bold tracking-tight text-white font-sans">
              DevAI Workbench
            </h1>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="text-zinc-400 hover:text-white p-1"
          >
            <Menu size={20} />
          </button>
        </header>

        {/* Dynamic component routing viewport */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {currentModule === 'dashboard' && (
            <Dashboard 
              user={user} 
              onNavigate={(module) => {
                // If it's specific code modules, we redirect inside Code Workbench
                if (['generate', 'debug', 'review', 'docs', 'tests', 'project'].includes(module)) {
                  setWorkbenchTab(module);
                  setCurrentModule('workbench');
                } else if (module === 'bugs') {
                  setCurrentModule('bugs');
                } else {
                  setCurrentModule(module);
                }
              }} 
            />
          )}

          {currentModule === 'chat' && (
            <ChatAssistant 
              user={user} 
              activeChatId={activeChatId} 
              onChatSelected={(id) => setActiveChatId(id)} 
            />
          )}

          {currentModule === 'workbench' && (
            <CodeWorkbench 
              userId={user.id} 
              defaultTab={workbenchTab} 
              onSnippetSaved={() => setSnippetRefresh(prev => prev + 1)} 
            />
          )}

          {currentModule === 'snippets' && (
            <SavedSnippets 
              userId={user.id} 
              refreshTrigger={snippetRefresh} 
              onSendToWorkbench={handleSendToWorkbench} 
            />
          )}

          {currentModule === 'bugs' && (
            <BugTracker user={user} />
          )}

          {currentModule === 'admin' && (
            <AdminPanel currentUser={user} />
          )}
        </div>
      </main>

    </div>
  );
}
