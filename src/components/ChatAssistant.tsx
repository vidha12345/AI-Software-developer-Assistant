import { useState, useEffect, useRef, FormEvent, MouseEvent } from 'react';
import { motion } from 'motion/react';
import { Send, Terminal, Cpu, Play, Trash2, Sparkles, MessageSquare } from 'lucide-react';
import { ChatSession, User } from '../types';

interface ChatAssistantProps {
  user: User | null;
  activeChatId: string | null;
  onChatSelected: (id: string) => void;
}

export default function ChatAssistant({ user, activeChatId, onChatSelected }: ChatAssistantProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (activeChatId) {
      fetchSessionDetails(activeChatId);
    } else {
      setCurrentSession(null);
    }
  }, [activeChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages, loading]);

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      const res = await fetch('/api/chats');
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
        if (data.length > 0 && !activeChatId) {
          onChatSelected(data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchSessionDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/chats/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentSession(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const createNewChat = async () => {
    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Chat Session', userId: user?.id })
      });
      if (res.ok) {
        const data = await res.json();
        setSessions([data, ...sessions]);
        onChatSelected(data.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteChat = async (id: string, e: MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this chat session?')) return;
    try {
      const res = await fetch(`/api/chats/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const updated = sessions.filter(s => s.id !== id);
        setSessions(updated);
        if (activeChatId === id) {
          if (updated.length > 0) {
            onChatSelected(updated[0].id);
          } else {
            setCurrentSession(null);
            onChatSelected('');
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentSession || loading) return;

    const userText = inputText;
    setInputText('');
    setLoading(true);

    try {
      const res = await fetch(`/api/chats/${currentSession.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: userText, sender: 'user' })
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentSession(data.chatSession);
        // Update session title in side list if it changed
        setSessions(prev => prev.map(s => s.id === data.chatSession.id ? data.chatSession : s));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Basic code block formatting highlight
  const renderMessageContent = (text: string) => {
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, i) => {
      if (part.startsWith('```')) {
        const match = part.match(/```(\w*)\n([\s\S]*?)```/);
        const lang = match ? match[1] : '';
        const code = match ? match[2] : part.slice(3, -3);
        return (
          <div key={i} className="my-3 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 font-mono text-xs text-zinc-300">
            {lang && (
              <div className="bg-zinc-900 px-4 py-1.5 border-b border-zinc-800 text-zinc-400 text-[10px] flex justify-between items-center">
                <span>{lang.toUpperCase()}</span>
                <button 
                  onClick={() => navigator.clipboard.writeText(code)}
                  className="hover:text-white transition-colors"
                >
                  Copy Code
                </button>
              </div>
            )}
            <pre className="p-4 overflow-x-auto">
              <code>{code}</code>
            </pre>
          </div>
        );
      }
      return <p key={i} className="whitespace-pre-wrap leading-relaxed font-sans">{part}</p>;
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-140px)]" id="chat-assistant-root">
      {/* Session List Sidebar */}
      <div className="md:col-span-1 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 flex flex-col justify-between h-full">
        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase text-zinc-400 tracking-wider font-mono">
              Chats Directory
            </h3>
            <button 
              onClick={createNewChat}
              className="text-xs px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg border border-zinc-700 font-mono transition-colors"
            >
              + NEW CHAT
            </button>
          </div>

          <div className="space-y-2 overflow-y-auto flex-1 pr-1">
            {loadingSessions ? (
              <div className="text-center py-8 text-zinc-500 text-xs font-mono">Loading chats...</div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-xs font-mono">No sessions yet.</div>
            ) : (
              sessions.map((sess) => (
                <div
                  key={sess.id}
                  onClick={() => onChatSelected(sess.id)}
                  className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer border text-left transition-all ${
                    activeChatId === sess.id 
                      ? 'bg-zinc-800 border-zinc-700 text-white' 
                      : 'bg-zinc-900/20 hover:bg-zinc-900/50 border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageSquare size={14} className="flex-shrink-0" />
                    <span className="text-xs font-medium truncate font-sans block">
                      {sess.title}
                    </span>
                  </div>
                  <button
                    onClick={(e) => deleteChat(sess.id, e)}
                    className="text-zinc-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="md:col-span-3 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl flex flex-col h-full overflow-hidden relative">
        {currentSession ? (
          <>
            {/* Active Session Header */}
            <div className="bg-zinc-900/60 border-b border-zinc-800 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2.5 min-w-0">
                <Terminal size={16} className="text-blue-400" />
                <h3 className="text-sm font-semibold text-white truncate font-sans">
                  {currentSession.title}
                </h3>
              </div>
              <div className="text-[10px] font-mono text-zinc-500">
                SESSION ID: {currentSession.id}
              </div>
            </div>

            {/* Conversation Flow */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {currentSession.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto space-y-3">
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400">
                    <Sparkles size={24} />
                  </div>
                  <h4 className="text-sm font-semibold text-white">Ask anything to your AI Architect</h4>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    Query design patterns, generate scalable microservices, debug concurrency bugs, or explain clean architecture.
                  </p>
                </div>
              ) : (
                currentSession.messages.map((msg) => (
                  <div 
                    key={msg.id}
                    className={`flex gap-4 p-4 rounded-2xl border ${
                      msg.sender === 'user' 
                        ? 'bg-zinc-900/80 border-zinc-800 ml-12' 
                        : 'bg-zinc-900/20 border-zinc-800/30 mr-12'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {msg.sender === 'user' ? (
                        <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-300">
                          DEV
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-400">
                          AI
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1 text-sm text-zinc-200">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                          {msg.sender === 'user' ? 'Developer' : 'Architect Agent'}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-600">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-zinc-300 font-sans">
                        {renderMessageContent(msg.text)}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {loading && (
                <div className="flex gap-4 p-4 rounded-2xl bg-zinc-900/20 border border-zinc-800/30 mr-12 animate-pulse">
                  <div className="flex-shrink-0">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-400">
                      AI
                    </div>
                  </div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-2.5 bg-zinc-800 rounded-full w-1/4"></div>
                    <div className="space-y-1.5">
                      <div className="h-2 bg-zinc-800 rounded-full"></div>
                      <div className="h-2 bg-zinc-800 rounded-full w-5/6"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-4 bg-zinc-900/40 border-t border-zinc-800 flex gap-3">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about system design, code blocks, or algorithms..."
                className="flex-1 bg-zinc-950 text-white border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-700 font-sans"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !inputText.trim()}
                className="px-5 bg-white text-zinc-950 hover:bg-zinc-100 font-medium rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:hover:bg-white"
              >
                <Send size={16} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto space-y-4">
            <div className="p-4 bg-zinc-800/50 border border-zinc-700/60 rounded-2xl text-zinc-400">
              <Terminal size={32} />
            </div>
            <h3 className="text-white font-medium text-sm">Select or Create a Chat Session</h3>
            <p className="text-zinc-500 text-xs leading-relaxed font-mono">
              Initialize a compiler context to query programming questions.
            </p>
            <button
              onClick={createNewChat}
              className="py-2.5 px-5 bg-white text-zinc-950 hover:bg-zinc-100 font-medium text-xs rounded-xl transition-colors"
            >
              Launch Chat Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
