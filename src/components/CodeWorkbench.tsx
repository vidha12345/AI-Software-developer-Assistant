import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Code, Cpu, Settings, FileText, CheckSquare, Layers, 
  Play, Copy, Save, Check, Sparkles, Terminal 
} from 'lucide-react';

interface CodeWorkbenchProps {
  userId: string;
  defaultTab?: string;
  onSnippetSaved?: () => void;
}

export default function CodeWorkbench({ userId, defaultTab = 'generate', onSnippetSaved }: CodeWorkbenchProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form States
  const [language, setLanguage] = useState('typescript');
  const [snippetTitle, setSnippetTitle] = useState('');
  const [snippetDesc, setSnippetDesc] = useState('');

  // 1. Code Generator Inputs
  const [genPrompt, setGenPrompt] = useState('');
  
  // 2. Debugger Inputs
  const [bugCode, setBugCode] = useState('');
  const [errorDesc, setErrorDesc] = useState('');

  // 3. Reviewer Inputs
  const [reviewCode, setReviewCode] = useState('');

  // 4. Docs Inputs
  const [docsCode, setDocsCode] = useState('');
  const [docType, setDocType] = useState('README.md');

  // 5. Test Inputs
  const [testCode, setTestCode] = useState('');
  const [testFramework, setTestFramework] = useState('Jest / Vitest');

  // 6. Project Inputs
  const [projectPrompt, setProjectPrompt] = useState('');

  // Combined Output Area
  const [workbenchOutput, setWorkbenchOutput] = useState('');

  const handleCopy = () => {
    if (!workbenchOutput) return;
    navigator.clipboard.writeText(workbenchOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSnippet = async () => {
    if (!workbenchOutput) return;
    try {
      setSaved(true);
      const finalTitle = snippetTitle || `${activeTab.toUpperCase()} Output - ${new Date().toLocaleDateString()}`;
      const res = await fetch('/api/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title: finalTitle,
          code: workbenchOutput,
          language,
          description: snippetDesc || `Generated via AI Developer Assistant - ${activeTab} tool.`
        })
      });

      if (res.ok) {
        if (onSnippetSaved) onSnippetSaved();
        setSnippetTitle('');
        setSnippetDesc('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const executeAIAction = async () => {
    setLoading(true);
    setWorkbenchOutput('');
    try {
      let endpoint = '';
      let payload = {};

      switch (activeTab) {
        case 'generate':
          endpoint = '/api/ai/generate-code';
          payload = { prompt: genPrompt, language };
          break;
        case 'debug':
          endpoint = '/api/ai/debug';
          payload = { code: bugCode, errorDescription: errorDesc };
          break;
        case 'review':
          endpoint = '/api/ai/review';
          payload = { code: reviewCode, language };
          break;
        case 'docs':
          endpoint = '/api/ai/generate-docs';
          payload = { code: docsCode, docType };
          break;
        case 'tests':
          endpoint = '/api/ai/generate-tests';
          payload = { code: testCode, framework: testFramework };
          break;
        case 'project':
          endpoint = '/api/ai/project-assistant';
          payload = { prompt: projectPrompt };
          break;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Operation failed');
      setWorkbenchOutput(data.result);
    } catch (err: any) {
      setWorkbenchOutput(`Error executing workbench process: ${err.message}\n\nPlease check your GEMINI_API_KEY inside Settings > Secrets.`);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'generate', label: 'Code Gen', icon: Code, color: 'text-emerald-500' },
    { id: 'debug', label: 'Debugger', icon: Cpu, color: 'text-amber-500' },
    { id: 'review', label: 'Reviewer', icon: Settings, color: 'text-purple-500' },
    { id: 'docs', label: 'Docs Gen', icon: FileText, color: 'text-cyan-500' },
    { id: 'tests', label: 'Test Gen', icon: CheckSquare, color: 'text-indigo-500' },
    { id: 'project', label: 'Architecture', icon: Layers, color: 'text-rose-500' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6" id="code-workbench-root">
      {/* Left Column: Module Inputs & Configurations */}
      <div className="lg:col-span-2 space-y-5 flex flex-col justify-between">
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase text-zinc-400 tracking-wider font-mono">
            Workbench Modules
          </h3>

          {/* Module Select Grid */}
          <div className="grid grid-cols-3 gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setWorkbenchOutput('');
                  }}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                    isActive 
                      ? 'bg-zinc-800 border-zinc-700 text-white' 
                      : 'bg-zinc-900/40 border-zinc-800/60 hover:bg-zinc-900/80 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Icon size={16} className={tab.color} />
                  <span className="text-[10px] font-medium font-mono truncate max-w-full">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tab Specific Form Content */}
          <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl space-y-4 flex-1">
            
            {/* Common Lang Selector for relevant tabs */}
            {['generate', 'review'].includes(activeTab) && (
              <div className="space-y-1">
                <label className="text-zinc-400 text-xs font-mono block">TARGET PROGRAMMING LANGUAGE</label>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-zinc-950 text-white border border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-zinc-700 font-mono"
                >
                  <option value="typescript">TypeScript</option>
                  <option value="javascript">JavaScript</option>
                  <option value="java">Java (Spring Boot)</option>
                  <option value="sql">SQL / PostgreSQL</option>
                  <option value="html">HTML5</option>
                  <option value="css">CSS3 (Tailwind)</option>
                  <option value="python">Python</option>
                </select>
              </div>
            )}

            {/* TAB: GENERATOR */}
            {activeTab === 'generate' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-zinc-400 text-xs font-mono block">DEVELOPER INTENT PROMPT</label>
                  <textarea
                    rows={6}
                    value={genPrompt}
                    onChange={(e) => setGenPrompt(e.target.value)}
                    placeholder="Describe the function, API controller, or CRUD model you want. E.g. 'Generate a REST controller for managing books with title, isbn, author, and Spring Boot validation annotations.'"
                    className="w-full bg-zinc-950 text-white border border-zinc-800 rounded-xl p-3.5 text-xs focus:outline-none focus:border-zinc-700 font-sans leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* TAB: DEBUGGER */}
            {activeTab === 'debug' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-zinc-400 text-xs font-mono block">BUGGY CODE BLOCK</label>
                  <textarea
                    rows={5}
                    value={bugCode}
                    onChange={(e) => setBugCode(e.target.value)}
                    placeholder="Paste the code block experiencing errors here..."
                    className="w-full bg-zinc-950 text-zinc-300 border border-zinc-800 rounded-xl p-3 text-xs focus:outline-none focus:border-zinc-700 font-mono leading-relaxed"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 text-xs font-mono block">ERROR DESCRIPTION / LOGS (OPTIONAL)</label>
                  <textarea
                    rows={2}
                    value={errorDesc}
                    onChange={(e) => setErrorDesc(e.target.value)}
                    placeholder="E.g., 'Throws NullPointerException on line 12 inside loops' or compiler stack traces."
                    className="w-full bg-zinc-950 text-white border border-zinc-800 rounded-xl p-3 text-xs focus:outline-none focus:border-zinc-700 font-sans leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* TAB: REVIEWER */}
            {activeTab === 'review' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-zinc-400 text-xs font-mono block">CODE TO AUDIT / REFACTOR</label>
                  <textarea
                    rows={8}
                    value={reviewCode}
                    onChange={(e) => setReviewCode(e.target.value)}
                    placeholder="Paste code containing suspect styling, performance bottlenecks, or security flows..."
                    className="w-full bg-zinc-950 text-zinc-300 border border-zinc-800 rounded-xl p-3 text-xs focus:outline-none focus:border-zinc-700 font-mono leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* TAB: DOCS */}
            {activeTab === 'docs' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-zinc-400 text-xs font-mono block">DOCUMENTATION SCHEME</label>
                  <select 
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full bg-zinc-950 text-white border border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-zinc-700 font-mono"
                  >
                    <option value="README.md">Professional README.md</option>
                    <option value="JSDocs / Javadocs">Code Inline Comments (JSDoc/Javadoc)</option>
                    <option value="REST API Specification">REST API Endpoint Guide</option>
                    <option value="Architecture Guide">System Architecture Documentation</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 text-xs font-mono block">SOURCE CODE OR COMPONENT DESCRIPTION</label>
                  <textarea
                    rows={5}
                    value={docsCode}
                    onChange={(e) => setDocsCode(e.target.value)}
                    placeholder="Paste code or type component design properties to generate manuals..."
                    className="w-full bg-zinc-950 text-zinc-300 border border-zinc-800 rounded-xl p-3 text-xs focus:outline-none focus:border-zinc-700 font-mono leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* TAB: TESTS */}
            {activeTab === 'tests' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-zinc-400 text-xs font-mono block">TESTING FRAMEWORK</label>
                  <select 
                    value={testFramework}
                    onChange={(e) => setTestFramework(e.target.value)}
                    className="w-full bg-zinc-950 text-white border border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-zinc-700 font-mono"
                  >
                    <option value="Jest / Vitest">Jest / Vitest (JS/TS)</option>
                    <option value="JUnit / Mockito">JUnit / Mockito (Java)</option>
                    <option value="PyTest">PyTest (Python)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 text-xs font-mono block">SOURCE CODE TO GENERATE SUITES FOR</label>
                  <textarea
                    rows={5}
                    value={testCode}
                    onChange={(e) => setTestCode(e.target.value)}
                    placeholder="Paste functions, handlers, or classes requiring coverage..."
                    className="w-full bg-zinc-950 text-zinc-300 border border-zinc-800 rounded-xl p-3 text-xs focus:outline-none focus:border-zinc-700 font-mono leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* TAB: PROJECT */}
            {activeTab === 'project' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-zinc-400 text-xs font-mono block">PROJECT SCOPE DESCRIPTION</label>
                  <textarea
                    rows={7}
                    value={projectPrompt}
                    onChange={(e) => setProjectPrompt(e.target.value)}
                    placeholder="E.g., 'An online collaborative coding environment supporting real-time compilers, folder workspaces, and PostgreSQL audit schemas.'"
                    className="w-full bg-zinc-950 text-white border border-zinc-800 rounded-xl p-3.5 text-xs focus:outline-none focus:border-zinc-700 font-sans leading-relaxed"
                  />
                </div>
              </div>
            )}

          </div>
        </div>

        <button
          onClick={executeAIAction}
          disabled={loading}
          className="w-full py-3 bg-white hover:bg-zinc-100 text-zinc-950 font-medium text-sm rounded-xl flex items-center justify-center gap-2 transition-colors duration-150 shadow-md"
        >
          {loading ? 'Executing AI Compiler...' : 'Compile Workbench Prompt'}
          <Play size={14} fill="currentColor" />
        </button>
      </div>

      {/* Right Column: Compiled AI Outputs & Custom Snippet Saving */}
      <div className="lg:col-span-3 flex flex-col h-[calc(100vh-140px)] bg-zinc-900/40 border border-zinc-800/80 rounded-2xl overflow-hidden">
        
        {/* Terminal Header */}
        <div className="bg-zinc-900/60 border-b border-zinc-800 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5 min-w-0">
            <Terminal size={16} className="text-emerald-400" />
            <h3 className="text-sm font-semibold text-white truncate font-sans">
              AI Compilation Console
            </h3>
          </div>

          {workbenchOutput && (
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="text-xs p-1.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700/50 flex items-center gap-1.5 transition-colors font-mono"
                title="Copy output to clipboard"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          )}
        </div>

        {/* Content Panel */}
        <div className="flex-1 p-6 overflow-y-auto font-mono text-xs text-zinc-300 bg-zinc-950/80">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-8 h-8 border-4 border-zinc-800 border-t-emerald-500 rounded-full animate-spin"></div>
              <p className="text-zinc-500 font-mono text-xs">Querying Gemini 3.5 LLM context...</p>
            </div>
          ) : workbenchOutput ? (
            <pre className="whitespace-pre-wrap leading-relaxed">{workbenchOutput}</pre>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto space-y-4 font-sans">
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-500">
                <Sparkles size={32} />
              </div>
              <h3 className="text-zinc-400 font-medium text-sm">Interactive Output Terminal</h3>
              <p className="text-zinc-500 text-xs leading-relaxed font-mono">
                Compile your inputs from the left panel to generate production-ready code modules.
              </p>
            </div>
          )}
        </div>

        {/* Save to Snippet Library drawer */}
        {workbenchOutput && !loading && (
          <div className="p-5 bg-zinc-900 border-t border-zinc-800 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-semibold text-white uppercase font-mono tracking-wider flex items-center gap-1.5">
                <Save size={13} className="text-emerald-400" />
                Commit to Snippet Library
              </h4>
              <span className="text-[10px] text-zinc-500 font-mono">OPTIONAL STATE COMMITTED</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                value={snippetTitle}
                onChange={(e) => setSnippetTitle(e.target.value)}
                placeholder="Snippet title (e.g. Fast JWT Filter)"
                className="bg-zinc-950 text-white border border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-zinc-700 font-sans"
              />
              <input
                type="text"
                value={snippetDesc}
                onChange={(e) => setSnippetDesc(e.target.value)}
                placeholder="Description / note (optional)"
                className="bg-zinc-950 text-white border border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-zinc-700 font-sans"
              />
            </div>

            <button
              onClick={handleSaveSnippet}
              disabled={saved}
              className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              {saved ? <Check size={14} /> : <Save size={14} />}
              {saved ? 'Committed Successfully!' : 'Commit Snippet to Database'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
