import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

// Initialize Express app
const app = express();
const PORT = 3000;

app.use(express.json());

// Path to the file-based JSON database
const DB_FILE = path.join(process.cwd(), 'db.json');

// Initialize Gemini SDK lazily
let aiInstance: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured. Please add it in Settings > Secrets.');
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

// Default Prompt Templates
const DEFAULT_PROMPTS = [
  {
    id: 'chat',
    name: 'Standard AI Chat Assistant',
    systemInstruction: 'You are an elite, highly experienced senior software developer and systems architect. Help the user answer programming questions, design algorithms, explain patterns, and write clean, scalable, secure, and production-ready code. Use Markdown for formatting and wrap code blocks in standard triple-backticks with the correct programming language tag.',
    temperature: 0.7,
  },
  {
    id: 'generate',
    name: 'Advanced Code Generator',
    systemInstruction: 'You are an automated code generator. Your job is to generate full, syntactically correct, pristine, and well-structured code snippets or complete files based on the developer prompt. You support Java, JavaScript, TypeScript, HTML, CSS, SQL, and others. Focus solely on code generation, providing high-quality inline comments, proper error handling, and separation of concerns. Minimize conversational chatter; prioritize delivering the complete code.',
    temperature: 0.2,
  },
  {
    id: 'debug',
    name: 'Intelligent Code Debugger',
    systemInstruction: 'You are an advanced software debugging engine. Read the provided buggy code and the developer\'s error explanation. Your response must first clearly pinpoint the precise lines where errors exist, explain the root cause of the bug (syntax, runtime, or logical), and finally provide optimized, fully corrected, and verified replacement code. Explain optimizations like complexity reduction or edge cases handled.',
    temperature: 0.1,
  },
  {
    id: 'review',
    name: 'Production-Grade Code Reviewer',
    systemInstruction: 'You are a rigorous, world-class code reviewer and security auditor. Analyze the provided code for: 1. Code Quality & Clean Code principles (S.O.L.I.D, DRY), 2. Performance bottlenecks (unnecessary loops, inefficient memory usage), 3. Security vulnerabilities (SQL Injection, XSS, insecure state, hardcoded keys), 4. Maintainability. Present your review in structured sections with concrete examples of "Current Code" versus "Recommended Code" and provide an overall score from 1-10.',
    temperature: 0.3,
  },
  {
    id: 'docs',
    name: 'README & API Docs Generator',
    systemInstruction: 'You are a technical writer specializing in clean, intuitive software documentation. Generate professional Markdown README documents, comprehensive JSDoc/Javadoc/Docstrings, or complete REST API specifications based on code snippets or project descriptions. Format beautifully with headers, code examples, badges, installation directions, and clear parameter descriptions.',
    temperature: 0.5,
  },
  {
    id: 'tests',
    name: 'Robust Unit Test Generator',
    systemInstruction: 'You are an automated unit testing suite writer. Write extensive, highly reliable unit tests for the provided code. Suggest and write test cases for positive flows, negative flows, empty inputs, null pointers, array overflows, and boundary conditions. Use popular testing libraries: JUnit for Java, Jest/Vitest for JavaScript/TypeScript, or PyTest for Python. Aim for high test coverage.',
    temperature: 0.2,
  },
  {
    id: 'project',
    name: 'System Architecture Recommender',
    systemInstruction: 'You are an enterprise software architect. Recommend optimal tech stacks, full project folder structures, software architecture patterns (e.g. MVC, microservices, clean architecture), and precise package dependencies for any proposed project. Give a concrete directory tree visualization using text graphics.',
    temperature: 0.4,
  },
];

// Helper to read database
function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initialDB = {
      users: [
        { id: 'usr-1', email: 'admin@devai.com', name: 'Lead Architect', role: 'admin' },
        { id: 'usr-2', email: 'developer@devai.com', name: 'Junior Dev', role: 'user' }
      ],
      chats: [
        {
          id: 'chat-1',
          userId: 'usr-1',
          title: 'Understanding React 19 State Managers',
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          messages: [
            { id: 'm-1', sender: 'user', text: 'How should I handle state management in React 19 with Server Actions?', timestamp: new Date(Date.now() - 3600000 * 2).toISOString() },
            { id: 'm-2', sender: 'ai', text: 'In React 19, the state management model shifts slightly due to Server Actions. You can leverage the new `useActionState` hook for managing form actions, states, and pending indicators natively without needing external Redux/Zustand boilerplate for simple CRUD. For global client-side state, standard Context or Zustand is still perfectly modern and recommended.', timestamp: new Date(Date.now() - 3600000 * 1.95).toISOString() }
          ]
        },
        {
          id: 'chat-2',
          userId: 'usr-1',
          title: 'Optimizing PostgreSQL JSONB Queries',
          timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
          messages: [
            { id: 'm-3', sender: 'user', text: 'How do I index nested JSONB fields in Postgres for fast retrieval?', timestamp: new Date(Date.now() - 3600000 * 24).toISOString() },
            { id: 'm-4', sender: 'ai', text: 'You can create a GIN index over the jsonb column using either the default jsonb_ops or the jsonb_path_ops operator class. For specific nested keys, you can also use expression indexes, like:\n```sql\nCREATE INDEX idx_user_settings_theme ON users ((settings->>\'theme\'));\n```', timestamp: new Date(Date.now() - 3600000 * 23.95).toISOString() }
          ]
        }
      ],
      snippets: [
        {
          id: 'snip-1',
          userId: 'usr-1',
          title: 'Fast API Proxy Wrapper',
          code: `const express = require('express');\nconst axios = require('axios');\nconst app = express();\n\napp.post('/api/proxy', async (req, res) => {\n  try {\n    const response = await axios.post('https://api.external.com', req.body, {\n      headers: { 'Authorization': \`Bearer \${process.env.API_KEY}\` }\n    });\n    res.json(response.data);\n  } catch (error) {\n    res.status(500).json({ error: error.message });\n  }\n});`,
          language: 'javascript',
          description: 'Hides API secrets and proxies calls safely to prevent CORS errors on frontend.',
          timestamp: new Date(Date.now() - 3600000 * 4).toISOString()
        },
        {
          id: 'snip-2',
          userId: 'usr-2',
          title: 'Generic Binary Search Tree',
          code: `public class BST<T extends Comparable<T>> {\n    private Node root;\n    private class Node {\n        T data;\n        Node left, right;\n        Node(T val) { data = val; }\n    }\n    public void insert(T val) {\n        root = insert(root, val);\n    }\n    private Node insert(Node node, T val) {\n        if (node == null) return new Node(val);\n        int cmp = val.compareTo(node.data);\n        if (cmp < 0) node.left = insert(node.left, val);\n        else if (cmp > 0) node.right = insert(node.right, val);\n        return node;\n    }\n}`,
          language: 'java',
          description: 'Fully recursive generic BST in Java supporting standard comparable objects.',
          timestamp: new Date(Date.now() - 3600000 * 48).toISOString()
        }
      ],
      bugs: [
        {
          id: 'bug-1',
          userId: 'usr-1',
          title: 'Memory Leak in WebSocket Connection Pool',
          description: 'Connections remain in CLOSE_WAIT state. Array of active clients is not cleared when socket terminates.',
          codeSnippet: 'ws.on("close", () => {\n  console.log("Client left");\n  // missing connection removal from global pool array\n});',
          priority: 'High',
          status: 'Open',
          aiAnalysis: 'The ws server is keeping reference pointers to closed socket objects in the heap. Garbage collector cannot clean these up, resulting in memory consumption increasing over time.',
          resolutionSuggestion: 'Surgical addition of `connectionPool = connectionPool.filter(c => c.id !== ws.id);` in the close callback.',
          timestamp: new Date(Date.now() - 3600000 * 10).toISOString()
        },
        {
          id: 'bug-2',
          userId: 'usr-2',
          title: 'SQL Injection on Login Input Field',
          description: 'User authentication parses credentials using basic raw text concatenation.',
          codeSnippet: 'const q = "SELECT * FROM users WHERE email=\'" + email + "\' AND password=\'" + password + "\'";\ndb.query(q);',
          priority: 'Critical',
          status: 'In Progress',
          aiAnalysis: 'Vulnerable to authentication bypass via passing custom single quotes (e.g. `\' OR \'1\'=\'1`). Leads to complete user account breach.',
          resolutionSuggestion: 'Replace query string with parameterized queries:\n`db.query("SELECT * FROM users WHERE email = ? AND password = ?", [email, password]);`',
          timestamp: new Date(Date.now() - 3600000 * 36).toISOString()
        }
      ],
      analytics: {
        totalAIOperations: 42,
        categoryCounts: {
          'chat': 15,
          'generate': 12,
          'debug': 8,
          'review': 5,
          'docs': 1,
          'tests': 1
        }
      },
      prompts: DEFAULT_PROMPTS
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDB, null, 2));
    return initialDB;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDB(data: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Ensure database is bootstrapped on startup
readDB();

// --- Auth Endpoints ---

app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: 'Name and Email are required' });
  }

  const db = readDB();
  const exists = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  const newUser = {
    id: 'usr-' + Math.random().toString(36).substring(2, 9),
    email: email.toLowerCase(),
    name: name,
    role: email.toLowerCase().includes('admin') ? 'admin' : 'user'
  };

  db.users.push(newUser);
  writeDB(db);

  res.status(201).json({ user: newUser, token: 'jwt-simulated-' + newUser.id });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const db = readDB();
  const user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    // If it's a new email, let's auto-register to make the UX seamless
    const name = email.split('@')[0].toUpperCase();
    const newUser = {
      id: 'usr-' + Math.random().toString(36).substring(2, 9),
      email: email.toLowerCase(),
      name: name,
      role: email.toLowerCase().includes('admin') ? 'admin' : 'user'
    };
    db.users.push(newUser);
    writeDB(db);
    return res.status(200).json({ user: newUser, token: 'jwt-simulated-' + newUser.id, isAutoCreated: true });
  }

  res.status(200).json({ user, token: 'jwt-simulated-' + user.id });
});


// --- Snippets Endpoints ---

app.get('/api/snippets', (req, res) => {
  const db = readDB();
  res.json(db.snippets);
});

app.post('/api/snippets', (req, res) => {
  const { title, code, language, description, userId } = req.body;
  if (!title || !code) {
    return res.status(400).json({ error: 'Title and Code content are required' });
  }

  const db = readDB();
  const newSnippet = {
    id: 'snip-' + Math.random().toString(36).substring(2, 9),
    userId: userId || 'usr-1',
    title,
    code,
    language: language || 'plaintext',
    description: description || '',
    timestamp: new Date().toISOString()
  };

  db.snippets.unshift(newSnippet);
  writeDB(db);

  res.status(201).json(newSnippet);
});

app.delete('/api/snippets/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.snippets.findIndex((s: any) => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Snippet not found' });
  }

  db.snippets.splice(index, 1);
  writeDB(db);
  res.json({ success: true, message: 'Snippet deleted' });
});


// --- Bug Tickets Endpoints ---

app.get('/api/bugs', (req, res) => {
  const db = readDB();
  res.json(db.bugs);
});

app.post('/api/bugs', async (req, res) => {
  const { title, description, codeSnippet, userId } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: 'Title and Description are required' });
  }

  const db = readDB();

  // Run AI analysis to predict priority and suggest a resolution
  let priority: 'Low' | 'Medium' | 'High' | 'Critical' = 'Medium';
  let aiAnalysis = 'AI analysis was skipped due to API key absence.';
  let resolutionSuggestion = 'Check syntax and verify error logs manually.';

  try {
    const ai = getGemini();
    const prompt = `You are a bug analyst. Review this bug report and code snippet:
    Title: ${title}
    Description: ${description}
    Code Snippet: ${codeSnippet || 'None provided'}
    
    Predict the priority ('Low' | 'Medium' | 'High' | 'Critical'). Provide a quick analysis and resolution suggestion.
    Format your response STRICTLY as a JSON object matching this TypeScript interface:
    {
      "priority": "Low" | "Medium" | "High" | "Critical",
      "analysis": "string explaining what is causing this bug",
      "resolution": "string showing instructions or code to fix it"
    }`;

    const aiRes = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    if (aiRes.text) {
      const parsed = JSON.parse(aiRes.text.trim());
      priority = parsed.priority || 'Medium';
      aiAnalysis = parsed.analysis || 'Completed AI analysis.';
      resolutionSuggestion = parsed.resolution || 'Check logic parameters.';
    }
  } catch (error: any) {
    console.error('AI Bug Analyzer Error:', error);
    aiAnalysis = `AI analysis failed: ${error.message}`;
  }

  const newBug = {
    id: 'bug-' + Math.random().toString(36).substring(2, 9),
    userId: userId || 'usr-1',
    title,
    description,
    codeSnippet: codeSnippet || '',
    priority,
    status: 'Open' as const,
    aiAnalysis,
    resolutionSuggestion,
    timestamp: new Date().toISOString()
  };

  db.bugs.unshift(newBug);
  
  // Track metrics
  db.analytics.totalAIOperations += 1;
  db.analytics.categoryCounts['debug'] = (db.analytics.categoryCounts['debug'] || 0) + 1;
  
  writeDB(db);

  res.status(201).json(newBug);
});

app.put('/api/bugs/:id', (req, res) => {
  const { id } = req.params;
  const { status, priority, title, description, codeSnippet } = req.body;
  const db = readDB();
  const bug = db.bugs.find((b: any) => b.id === id);
  if (!bug) {
    return res.status(404).json({ error: 'Bug ticket not found' });
  }

  if (status) bug.status = status;
  if (priority) bug.priority = priority;
  if (title) bug.title = title;
  if (description) bug.description = description;
  if (codeSnippet !== undefined) bug.codeSnippet = codeSnippet;

  writeDB(db);
  res.json(bug);
});

app.delete('/api/bugs/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.bugs.findIndex((b: any) => b.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Bug not found' });
  }

  db.bugs.splice(index, 1);
  writeDB(db);
  res.json({ success: true, message: 'Bug ticket deleted' });
});


// --- Chat History Endpoints ---

app.get('/api/chats', (req, res) => {
  const db = readDB();
  res.json(db.chats);
});

app.post('/api/chats', (req, res) => {
  const { title, userId } = req.body;
  const db = readDB();
  const newChat = {
    id: 'chat-' + Math.random().toString(36).substring(2, 9),
    userId: userId || 'usr-1',
    title: title || 'New Chat Session',
    timestamp: new Date().toISOString(),
    messages: []
  };

  db.chats.unshift(newChat);
  writeDB(db);
  res.status(201).json(newChat);
});

app.get('/api/chats/:id', (req, res) => {
  const db = readDB();
  const chat = db.chats.find((c: any) => c.id === req.params.id);
  if (!chat) return res.status(404).json({ error: 'Chat not found' });
  res.json(chat);
});

app.delete('/api/chats/:id', (req, res) => {
  const db = readDB();
  const index = db.chats.findIndex((c: any) => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Chat not found' });

  db.chats.splice(index, 1);
  writeDB(db);
  res.json({ success: true });
});

// Appending message to chat session AND getting Gemini response
app.post('/api/chats/:id/messages', async (req, res) => {
  const { id } = req.params;
  const { text, sender } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Message text is required' });
  }

  const db = readDB();
  const chat = db.chats.find((c: any) => c.id === id);
  if (!chat) return res.status(404).json({ error: 'Chat session not found' });

  // Add the user message
  const userMsg = {
    id: 'm-' + Math.random().toString(36).substring(2, 9),
    sender: sender || 'user',
    text,
    timestamp: new Date().toISOString()
  };
  chat.messages.push(userMsg);

  // If sender is 'user', let's ask Gemini to reply
  if (sender === 'user' || !sender) {
    try {
      const ai = getGemini();
      const chatPromptConfig = db.prompts.find((p: any) => p.id === 'chat') || DEFAULT_PROMPTS[0];

      // Form historical contexts
      const history = chat.messages.map((m: any) => {
        return `${m.sender === 'user' ? 'Developer' : 'AI Assistant'}: ${m.text}`;
      }).join('\n\n');

      const systemInstruction = chatPromptConfig.systemInstruction;
      const temperature = chatPromptConfig.temperature;

      const aiRes = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `${systemInstruction}\n\nHere is the active conversation history:\n${history}\n\nAI Assistant:`,
        config: {
          temperature: temperature
        }
      });

      const aiText = aiRes.text || "I processed your request but didn't generate any response.";

      // Add the AI response
      const aiMsg = {
        id: 'm-' + Math.random().toString(36).substring(2, 9),
        sender: 'ai' as const,
        text: aiText,
        timestamp: new Date().toISOString()
      };
      chat.messages.push(aiMsg);

      // Auto-rename chat session based on first message if title is still default
      if (chat.title === 'New Chat Session' && chat.messages.length <= 3) {
        chat.title = text.length > 35 ? text.substring(0, 35) + '...' : text;
      }

      // Track metrics
      db.analytics.totalAIOperations += 1;
      db.analytics.categoryCounts['chat'] = (db.analytics.categoryCounts['chat'] || 0) + 1;

      writeDB(db);
      res.json({ userMessage: userMsg, aiMessage: aiMsg, chatSession: chat });
    } catch (error: any) {
      console.error('Gemini Chat Error:', error);
      
      const aiMsg = {
        id: 'm-' + Math.random().toString(36).substring(2, 9),
        sender: 'ai' as const,
        text: `Error connecting to Gemini API: ${error.message}. Make sure your GEMINI_API_KEY is defined in Settings > Secrets.`,
        timestamp: new Date().toISOString()
      };
      chat.messages.push(aiMsg);
      writeDB(db);
      res.status(200).json({ userMessage: userMsg, aiMessage: aiMsg, chatSession: chat });
    }
  } else {
    writeDB(db);
    res.json({ userMessage: userMsg, chatSession: chat });
  }
});


// --- AI Specific Assistants (Modular Features) ---

// 1. Code Generator API
app.post('/api/ai/generate-code', async (req, res) => {
  const { prompt, language } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

  const db = readDB();
  const configObj = db.prompts.find((p: any) => p.id === 'generate') || DEFAULT_PROMPTS[1];

  try {
    const ai = getGemini();
    const result = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Generate code for language: ${language || 'any'}. Prompt: ${prompt}`,
      config: {
        systemInstruction: configObj.systemInstruction,
        temperature: configObj.temperature,
      }
    });

    // Track metrics
    db.analytics.totalAIOperations += 1;
    db.analytics.categoryCounts['generate'] = (db.analytics.categoryCounts['generate'] || 0) + 1;
    writeDB(db);

    res.json({ result: result.text || '' });
  } catch (error: any) {
    res.status(500).json({ error: `AI Generation failed: ${error.message}` });
  }
});

// 2. Code Debugger API
app.post('/api/ai/debug', async (req, res) => {
  const { code, errorDescription } = req.body;
  if (!code) return res.status(400).json({ error: 'Code block is required' });

  const db = readDB();
  const configObj = db.prompts.find((p: any) => p.id === 'debug') || DEFAULT_PROMPTS[2];

  try {
    const ai = getGemini();
    const prompt = `BUGGY CODE:\n\`\`\`\n${code}\n\`\`\`\n\nERROR OR EXPECTED BEHAVIOR:\n${errorDescription || 'Not specified'}`;
    const result = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: configObj.systemInstruction,
        temperature: configObj.temperature,
      }
    });

    db.analytics.totalAIOperations += 1;
    db.analytics.categoryCounts['debug'] = (db.analytics.categoryCounts['debug'] || 0) + 1;
    writeDB(db);

    res.json({ result: result.text || '' });
  } catch (error: any) {
    res.status(500).json({ error: `AI Debugging failed: ${error.message}` });
  }
});

// 3. Code Reviewer API
app.post('/api/ai/review', async (req, res) => {
  const { code, language } = req.body;
  if (!code) return res.status(400).json({ error: 'Code to review is required' });

  const db = readDB();
  const configObj = db.prompts.find((p: any) => p.id === 'review') || DEFAULT_PROMPTS[3];

  try {
    const ai = getGemini();
    const prompt = `Review the following ${language || ''} code:\n\`\`\`\n${code}\n\`\`\``;
    const result = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: configObj.systemInstruction,
        temperature: configObj.temperature,
      }
    });

    db.analytics.totalAIOperations += 1;
    db.analytics.categoryCounts['review'] = (db.analytics.categoryCounts['review'] || 0) + 1;
    writeDB(db);

    res.json({ result: result.text || '' });
  } catch (error: any) {
    res.status(500).json({ error: `AI Review failed: ${error.message}` });
  }
});

// 4. Documentation Generator API
app.post('/api/ai/generate-docs', async (req, res) => {
  const { code, docType } = req.body;
  if (!code) return res.status(400).json({ error: 'Code or content is required' });

  const db = readDB();
  const configObj = db.prompts.find((p: any) => p.id === 'docs') || DEFAULT_PROMPTS[4];

  try {
    const ai = getGemini();
    const prompt = `Generate ${docType || 'documentation'} for this code:\n\`\`\`\n${code}\n\`\`\``;
    const result = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: configObj.systemInstruction,
        temperature: configObj.temperature,
      }
    });

    db.analytics.totalAIOperations += 1;
    db.analytics.categoryCounts['docs'] = (db.analytics.categoryCounts['docs'] || 0) + 1;
    writeDB(db);

    res.json({ result: result.text || '' });
  } catch (error: any) {
    res.status(500).json({ error: `AI Documentation failed: ${error.message}` });
  }
});

// 5. Unit Test Generator API
app.post('/api/ai/generate-tests', async (req, res) => {
  const { code, framework } = req.body;
  if (!code) return res.status(400).json({ error: 'Code to test is required' });

  const db = readDB();
  const configObj = db.prompts.find((p: any) => p.id === 'tests') || DEFAULT_PROMPTS[5];

  try {
    const ai = getGemini();
    const prompt = `Write unit tests using ${framework || 'the recommended library'} for this code:\n\`\`\`\n${code}\n\`\`\``;
    const result = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: configObj.systemInstruction,
        temperature: configObj.temperature,
      }
    });

    db.analytics.totalAIOperations += 1;
    db.analytics.categoryCounts['tests'] = (db.analytics.categoryCounts['tests'] || 0) + 1;
    writeDB(db);

    res.json({ result: result.text || '' });
  } catch (error: any) {
    res.status(500).json({ error: `AI Test Generation failed: ${error.message}` });
  }
});

// 6. Project Architecture Assistant API
app.post('/api/ai/project-assistant', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Project description prompt is required' });

  const db = readDB();
  const configObj = db.prompts.find((p: any) => p.id === 'project') || DEFAULT_PROMPTS[6];

  try {
    const ai = getGemini();
    const result = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Recommend architectural components, folder layouts, and dependencies for:\n${prompt}`,
      config: {
        systemInstruction: configObj.systemInstruction,
        temperature: configObj.temperature,
      }
    });

    db.analytics.totalAIOperations += 1;
    db.analytics.categoryCounts['project'] = (db.analytics.categoryCounts['project'] || 0) + 1;
    writeDB(db);

    res.json({ result: result.text || '' });
  } catch (error: any) {
    res.status(500).json({ error: `AI Project Design failed: ${error.message}` });
  }
});


// --- Global Analytics API ---

app.get('/api/analytics', (req, res) => {
  const db = readDB();
  const snippetCount = db.snippets.length;
  const bugCount = db.bugs.length;
  const totalAIOperations = db.analytics.totalAIOperations;

  const categories = ['chat', 'generate', 'debug', 'review', 'docs', 'tests', 'project'];
  const categoryBreakdown = categories.map(cat => ({
    category: cat.toUpperCase(),
    count: db.analytics.categoryCounts[cat] || 0
  }));

  // Create real activity feed list dynamically
  const recentActivity: any[] = [];
  
  // Mix chat, snippets, bugs together chronologically
  db.chats.slice(0, 3).forEach((c: any) => {
    recentActivity.push({
      id: c.id,
      description: `Opened chat: "${c.title}"`,
      time: c.timestamp,
      type: 'chat'
    });
  });

  db.snippets.slice(0, 3).forEach((s: any) => {
    recentActivity.push({
      id: s.id,
      description: `Saved code snippet: "${s.title}" (${s.language})`,
      time: s.timestamp,
      type: 'snippet'
    });
  });

  db.bugs.slice(0, 3).forEach((b: any) => {
    recentActivity.push({
      id: b.id,
      description: `Logged bug ticket: "${b.title}" [Priority: ${b.priority}]`,
      time: b.timestamp,
      type: 'bug'
    });
  });

  // Sort activities by timestamp descending
  recentActivity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  res.json({
    totalAIOperations,
    snippetCount,
    bugCount,
    categoryBreakdown,
    recentActivity: recentActivity.slice(0, 6)
  });
});


// --- Admin Prompts Management API ---

app.get('/api/admin/prompts', (req, res) => {
  const db = readDB();
  res.json(db.prompts);
});

app.put('/api/admin/prompts/:id', (req, res) => {
  const { id } = req.params;
  const { systemInstruction, temperature, name } = req.body;
  const db = readDB();
  const prompt = db.prompts.find((p: any) => p.id === id);
  if (!prompt) {
    return res.status(404).json({ error: 'Prompt template not found' });
  }

  if (systemInstruction !== undefined) prompt.systemInstruction = systemInstruction;
  if (temperature !== undefined) prompt.temperature = Number(temperature);
  if (name !== undefined) prompt.name = name;

  writeDB(db);
  res.json(prompt);
});


// --- Serve Web App / Vite Server Setup ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Software Developer Assistant Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
