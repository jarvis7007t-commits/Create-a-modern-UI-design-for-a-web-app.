
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// Import GenerateContentResponse to fix type errors
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

import { Artifact, Session, ComponentVariation, User, SavedArtifact, HistoryItem } from './types';
import { INITIAL_PLACEHOLDERS } from './constants';
import { generateId, withRetry } from './utils';

import DottedGlowBackground from './components/DottedGlowBackground';
import ArtifactCard from './components/ArtifactCard';
import SideDrawer from './components/SideDrawer';
import SystemEditor from './components/SystemEditor';
import ThemeCustomizerModal from './components/ThemeCustomizerModal';
import ProjectsModal from './components/ProjectsModal';
import TemplateDiscovery from './components/TemplateDiscovery';
import DiscoverModal from './components/DiscoverModal';
import { 
    ThinkingIcon, 
    CodeIcon, 
    SparklesIcon, 
    ArrowLeftIcon, 
    ArrowRightIcon, 
    ArrowUpIcon, 
    GridIcon,
    ImageIcon,
    XIcon,
    UserIcon,
    TrashIcon,
    StarIcon,
    EyeIcon,
    FolderIcon,
    BookmarkIcon,
    CopyIcon,
    CheckIcon,
    CursorMagicIcon,
    PaletteIcon,
    PlusIcon,
    PaperclipIcon,
    MailIcon,
    LockIcon,
    PencilIcon
} from './components/Icons';

// Preset list kept for initialization, but app now supports custom colors
const ACCENT_COLORS = [
    { name: 'Indigo', color: '#4f46e5' },
    { name: 'Rose', color: '#e11d48' },
    { name: 'Emerald', color: '#10b981' },
    { name: 'Sky', color: '#0ea5e9' },
    { name: 'Default', color: '#ffffff' },
];


function App() {
  const [sessions, setSessions] = useState<Session[]>(() => {
    const saved = localStorage.getItem('flash-ui-sessions');
    try {
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
  });
  const [currentSessionIndex, setCurrentSessionIndex] = useState<number>(() => {
      const saved = localStorage.getItem('flash-ui-current-session');
      return saved ? JSON.parse(saved) : -1;
  });
  const [focusedArtifactIndex, setFocusedArtifactIndex] = useState<number | null>(null);
  
  const [inputValue, setInputValue] = useState<string>('');
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<{ data: string; mimeType: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [isClearing, setIsClearing] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholders, setPlaceholders] = useState<string[]>(INITIAL_PLACEHOLDERS);
  
  const [user, setUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<'login' | 'signup' | 'profile' | null>(null);
  const [publicViewHtml, setPublicViewHtml] = useState<string | null>(null);
  
  const [drawerState, setDrawerState] = useState<{
      isOpen: boolean;
      mode: 'code' | 'variations' | 'projects' | null;
      title: string;
      data: any; 
  }>({ isOpen: false, mode: null, title: '', data: null });

  const [componentVariations, setComponentVariations] = useState<ComponentVariation[]>([]);
  const [savedArtifacts, setSavedArtifacts] = useState<SavedArtifact[]>([]);
  const [hasCopied, setHasCopied] = useState(false);
  const [isInputMenuOpen, setIsInputMenuOpen] = useState(false);
  
  // Theme state
  const [theme, setTheme] = useState(() => localStorage.getItem('flash-ui-theme') || 'dark');
  const [accent, setAccent] = useState(() => localStorage.getItem('flash-ui-accent') || '#4f46e5');
  const [font, setFont] = useState(() => localStorage.getItem('flash-ui-font') || 'Inter');
  const [density, setDensity] = useState(() => localStorage.getItem('flash-ui-density') || 'comfortable');
  const [backgroundFx, setBackgroundFx] = useState(() => (localStorage.getItem('flash-ui-bg-fx') || 'true') === 'true');
  
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isDiscoverModalOpen, setIsDiscoverModalOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const gridScrollRef = useRef<HTMLDivElement>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const inputMenuRef = useRef<HTMLDivElement>(null);

  const hasStarted = sessions.length > 0 || isLoading;

  useEffect(() => {
    document.body.classList.toggle('dark-theme', theme === 'dark');
    document.body.classList.toggle('light-theme', theme === 'light');
    localStorage.setItem('flash-ui-theme', theme);
  }, [theme]);

  // Handle dynamic custom accent colors
  useEffect(() => {
    // 1. Convert hex to RGB
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(accent);
    const rgb = result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 79, g: 70, b: 229 }; // Fallback indigo

    // 2. Generate Dark Variant (simple darken by 20%)
    const darkFactor = 0.8;
    const darkRgb = {
        r: Math.floor(rgb.r * darkFactor),
        g: Math.floor(rgb.g * darkFactor),
        b: Math.floor(rgb.b * darkFactor)
    };
    const darkHex = "#" + ((1 << 24) + (darkRgb.r << 16) + (darkRgb.g << 8) + darkRgb.b).toString(16).slice(1);

    // 3. Generate Secondary Variant (lighten/desaturate mix for soft UI)
    // A simple approach is just increasing brightness or mixing with white
    const mixWhite = (val: number) => Math.floor(val + (255 - val) * 0.3);
    const secRgb = {
        r: mixWhite(rgb.r),
        g: mixWhite(rgb.g),
        b: mixWhite(rgb.b)
    };
    const secHex = "#" + ((1 << 24) + (secRgb.r << 16) + (secRgb.g << 8) + secRgb.b).toString(16).slice(1);

    // 4. Apply Variables
    document.documentElement.style.setProperty('--accent-primary', accent);
    document.documentElement.style.setProperty('--accent-primary-dark', darkHex);
    document.documentElement.style.setProperty('--accent-secondary', secHex);
    document.documentElement.style.setProperty('--accent-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    
    localStorage.setItem('flash-ui-accent', accent);
  }, [accent]);

  useEffect(() => {
    document.body.classList.remove('font-inter', 'font-roboto-mono', 'font-space-grotesk', 'font-sora');
    document.body.classList.add(`font-${font.toLowerCase().replace(' ', '-')}`);
    localStorage.setItem('flash-ui-font', font);
  }, [font]);
  
  useEffect(() => {
    document.body.classList.remove('density-comfortable', 'density-compact');
    document.body.classList.add(`density-${density}`);
    localStorage.setItem('flash-ui-density', density);
  }, [density]);
  
  useEffect(() => {
    document.body.classList.toggle('no-bg-fx', !backgroundFx);
    localStorage.setItem('flash-ui-bg-fx', String(backgroundFx));
  }, [backgroundFx]);
  
  useEffect(() => {
      // Check for public view routing
      const handleHashChange = () => {
          const hash = window.location.hash;
          if (hash.startsWith('#view=')) {
              try {
                  const encoded = hash.substring(6);
                  const decoded = decodeURIComponent(escape(atob(encoded)));
                  setPublicViewHtml(decoded);
              } catch (e) {
                  console.error("Failed to parse public view URL", e);
              }
          } else {
              setPublicViewHtml(null);
          }
      };

      handleHashChange();
      window.addEventListener('hashchange', handleHashChange);
      return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
      if (!publicViewHtml) inputRef.current?.focus();
      const saved = localStorage.getItem('flash-ui-saved-artifacts');
      if (saved) {
          try {
              setSavedArtifacts(JSON.parse(saved));
          } catch (e) {
              console.warn("Failed to load saved artifacts");
          }
      }
  }, [publicViewHtml]);

  useEffect(() => {
      localStorage.setItem('flash-ui-saved-artifacts', JSON.stringify(savedArtifacts));
  }, [savedArtifacts]);

  // Persist session state
  useEffect(() => {
    try {
        localStorage.setItem('flash-ui-sessions', JSON.stringify(sessions));
        localStorage.setItem('flash-ui-current-session', JSON.stringify(currentSessionIndex));
    } catch (e) {
        console.warn('Failed to save session state to localStorage', e);
    }
  }, [sessions, currentSessionIndex]);

  // Reset copied state when drawer closes or mode changes
  useEffect(() => {
    if (!drawerState.isOpen) setHasCopied(false);
  }, [drawerState.isOpen, drawerState.mode]);

  // Initialize Google Sign-In
  useEffect(() => {
      if (authView === 'login' || authView === 'signup') {
          /* global google */
          // @ts-ignore
          google.accounts.id.initialize({
              client_id: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com", // Placeholder
              callback: (response: any) => {
                  const base64Url = response.credential.split('.')[1];
                  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                  const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
                      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                  }).join(''));
                  const decoded = JSON.parse(jsonPayload);
                  
                  const newUser = {
                      id: decoded.sub,
                      name: decoded.name,
                      email: decoded.email,
                      picture: decoded.picture
                  };
                  setUser(newUser);
                  setAuthView(null);
                  localStorage.setItem('flash-ui-user', JSON.stringify(newUser));
              }
          });

          // @ts-ignore
          google.accounts.id.renderButton(
              googleBtnRef.current,
              { theme: "outline", size: "large", width: "354" }
          );
      }
  }, [authView]);

  // Persistent User State
  useEffect(() => {
      const savedUser = localStorage.getItem('flash-ui-user');
      if (savedUser) {
          setUser(JSON.parse(savedUser));
      }
  }, []);

  useEffect(() => {
    if (focusedArtifactIndex !== null && window.innerWidth <= 1024) {
        if (gridScrollRef.current) {
            gridScrollRef.current.scrollTop = 0;
        }
        window.scrollTo(0, 0);
    }
  }, [focusedArtifactIndex]);

  useEffect(() => {
      const interval = setInterval(() => {
          setPlaceholderIndex(prev => (prev + 1) % placeholders.length);
      }, 3000);
      return () => clearInterval(interval);
  }, [placeholders.length]);

  useEffect(() => {
      const fetchDynamicPlaceholders = async () => {
          try {
              const apiKey = process.env.API_KEY;
              if (!apiKey) return;
              const ai = new GoogleGenAI({ apiKey });
              const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
                  model: 'gemini-3-flash-preview',
                  contents: 'Generate 20 creative, short, diverse UI component prompts (e.g. "bioluminescent task list").Return ONLY a raw JSON array of strings. IP SAFEGUARD: Avoid referencing specific famous artists, movies, or brands.'
              }));
              const text = response.text || '[]';
              const jsonMatch = text.match(/\[[\s\S]*\]/);
              if (jsonMatch) {
                  const newPlaceholders = JSON.parse(jsonMatch[0]);
                  if (Array.isArray(newPlaceholders) && newPlaceholders.length > 0) {
                      const shuffled = newPlaceholders.sort(() => 0.5 - Math.random()).slice(0, 10);
                      setPlaceholders(prev => [...prev, ...shuffled]);
                  }
              }
          } catch (e) {
              console.warn("Silently failed to fetch dynamic placeholders", e);
          }
      };
      setTimeout(fetchDynamicPlaceholders, 1000);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (inputMenuRef.current && !inputMenuRef.current.contains(event.target as Node)) {
            setIsInputMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNewProject = () => {
    setIsInputMenuOpen(false); // Close menu immediately
    if (sessions.length > 0) {
        setIsClearing(true);
        setTimeout(() => {
            setSessions([]);
            setCurrentSessionIndex(-1);
            setFocusedArtifactIndex(null);
            setInputValue('');
            setSelectedImage(null);
            setIsClearing(false);
            inputRef.current?.focus();
        }, 500); // Match animation duration
    } else {
        // If no sessions, just clear input and focus
        setInputValue('');
        setSelectedImage(null);
        inputRef.current?.focus();
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          setSelectedImage({
              data: base64,
              mimeType: file.type
          });
          inputRef.current?.focus();
      };
      reader.readAsDataURL(file);
  };

  const clearSelectedImage = (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      inputRef.current?.focus();
  };

  const handleEnhancePrompt = async () => {
      if (!inputValue.trim() || isEnhancing) return;
      setIsEnhancing(true);
      try {
          const apiKey = process.env.API_KEY;
          if (!apiKey) return;
          const ai = new GoogleGenAI({ apiKey });
          
          await withRetry(async () => {
              const responseStream = await ai.models.generateContentStream({
                  model: 'gemini-3-flash-preview',
                  contents: `Rewrite this UI component prompt to be professional, descriptive, creative and specific for high-fidelity code generation. Keep it under 25 words: "${inputValue}"`
              });

              let newText = '';
              for await (const chunk of responseStream) {
                  if (chunk.text) {
                      newText += chunk.text;
                      setInputValue(newText.replace(/["\n]/g, '').trim());
                  }
              }
          });
      } catch (e) {
          console.error("Enhancement failed", e);
      } finally {
          setIsEnhancing(false);
      }
  };

  const parseJsonStream = async function* (responseStream: AsyncGenerator<GenerateContentResponse>) {
      let buffer = '';
      for await (const chunk of responseStream) {
          const text = chunk.text;
          if (typeof text !== 'string') continue;
          buffer += text;
          let braceCount = 0;
          let start = buffer.indexOf('{');
          while (start !== -1) {
              braceCount = 0;
              let end = -1;
              for (let i = start; i < buffer.length; i++) {
                  if (buffer[i] === '{') braceCount++;
                  else if (buffer[i] === '}') braceCount--;
                  if (braceCount === 0 && i > start) {
                      end = i;
                      break;
                  }
              }
              if (end !== -1) {
                  const jsonString = buffer.substring(start, end + 1);
                  try {
                      yield JSON.parse(jsonString);
                      buffer = buffer.substring(end + 1);
                      start = buffer.indexOf('{');
                  } catch (e) {
                      start = buffer.indexOf('{', start + 1);
                  }
              } else {
                  break; 
              }
          }
      }
  };

  const handleGenerateVariations = useCallback(async (style?: string) => {
    const currentSession = sessions[currentSessionIndex];
    if (!currentSession || focusedArtifactIndex === null) return;
    const currentArtifact = currentSession.artifacts[focusedArtifactIndex];

    setIsLoading(true);
    setComponentVariations([]);
    setDrawerState({ isOpen: true, mode: 'variations', title: 'Variations', data: currentArtifact.id });

    try {
        const apiKey = process.env.API_KEY;
        if (!apiKey) throw new Error("API_KEY is not configured.");
        const ai = new GoogleGenAI({ apiKey });

        await withRetry(async () => {
            const styleInstruction = style ? ` in the style of ${style}` : '';
            const nameInstruction = style ? ` The "name" should reflect the style, like "${style} Concept".` : '';
            const prompt = `
You are a master UI/UX designer. Generate 3 RADICAL CONCEPTUAL VARIATIONS of: "${currentSession.prompt}"${styleInstruction}.
${nameInstruction}
Return ONLY a raw JSON array of objects in format: \`{ "name": "Persona Name", "html": "..." }\`
            `.trim();

            const responseStream = await ai.models.generateContentStream({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: { temperature: 1.2 }
            });

            setComponentVariations([]); // Reset for retry attempt
            for await (const variation of parseJsonStream(responseStream)) {
                if (variation.name && variation.html) {
                    setComponentVariations(prev => [...prev, variation]);
                }
            }
        });
    } catch (e: any) {
        console.error("Error generating variations:", e);
    } finally {
        setIsLoading(false);
    }
  }, [sessions, currentSessionIndex, focusedArtifactIndex]);

  const applyVariation = (html: string) => {
      if (focusedArtifactIndex === null) return;
      setSessions(prev => prev.map((sess, i) => 
          i === currentSessionIndex ? {
              ...sess,
              artifacts: sess.artifacts.map((art, j) => 
                j === focusedArtifactIndex ? { ...art, html, status: 'complete' } : art
              )
          } : sess
      ));
      setDrawerState(s => ({ ...s, isOpen: false }));
  };

  const handleShowCode = () => {
      const currentSession = sessions[currentSessionIndex];
      if (currentSession && focusedArtifactIndex !== null) {
          const artifact = currentSession.artifacts[focusedArtifactIndex];
          setDrawerState({ isOpen: true, mode: 'code', title: 'Source Code', data: artifact.html });
      }
  };

  const handleCopyCode = async () => {
      if (drawerState.data) {
          try {
              await navigator.clipboard.writeText(drawerState.data);
              setHasCopied(true);
              setTimeout(() => setHasCopied(false), 2000);
          } catch (err) {
              console.error("Failed to copy!", err);
          }
      }
  };

  const handleOpenPreview = (sIndex: number, aIndex: number, e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentSessionIndex(sIndex);
      setFocusedArtifactIndex(aIndex);
      setIsEditorOpen(true);
  };

  const handleSaveProject = (artifact: Artifact) => {
      const currentSession = sessions[currentSessionIndex];
      if (!currentSession) return;
      
      const exists = savedArtifacts.some(a => a.id === artifact.id);
      if (exists) return;

      const newSaved: SavedArtifact = {
          ...artifact,
          prompt: currentSession.prompt,
          timestamp: Date.now()
      };
      setSavedArtifacts(prev => [newSaved, ...prev]);
  };

  const handleRemoveSaved = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setSavedArtifacts(prev => prev.filter(a => a.id !== id));
  };

  const handleViewSaved = (saved: SavedArtifact) => {
      const mockSession: Session = {
          id: `saved_${saved.id}`,
          prompt: saved.prompt,
          timestamp: saved.timestamp,
          artifacts: [{ ...saved, status: 'complete' }, ...Array(2).fill(null).map((_, i) => ({
              id: `dummy_${i}`,
              styleName: 'Related Style',
              html: '',
              status: 'complete' as const
          }))]
      };
      
      setSessions(prev => [...prev, mockSession]);
      setCurrentSessionIndex(sessions.length);
      setFocusedArtifactIndex(0);
      setIsEditorOpen(false);
      setDrawerState(s => ({ ...s, isOpen: false }));
  };

  const handleRefine = useCallback(async (instruction: string, images?: { data: string; mimeType: string }[] | null) => {
      const currentSession = sessions[currentSessionIndex];
      if (!currentSession || focusedArtifactIndex === null || (!instruction.trim() && (!images || images.length === 0))) return;
      
      const currentArtifact = currentSession.artifacts[focusedArtifactIndex];
      setIsLoading(true);

      // Create a history item for the current refinement
      const newHistoryItem: HistoryItem = {
          id: generateId(),
          prompt: instruction || (images ? "Visual Reference Provided" : "Untitled Refinement"),
          timestamp: Date.now(),
          version: (currentArtifact.history?.length || 0) + 1
      };

      try {
          const apiKey = process.env.API_KEY;
          if (!apiKey) throw new Error("API_KEY is not configured.");
          const ai = new GoogleGenAI({ apiKey });

          await withRetry(async () => {
              const promptParts: any[] = [];
              if (images && images.length > 0) {
                  images.forEach(img => {
                    promptParts.push({ inlineData: { data: img.data, mimeType: img.mimeType } });
                  });
              }
              
              const promptText = `
You are a world-class Senior UI Architect. You have been task to update a running application.
CRITICAL INSTRUCTIONS:
1. INTERNAL MEMORY & CONTEXT: Carefully analyze the provided code. DO NOT DELETE existing features or sections unless explicitly requested.
2. EVOLUTIONARY DESIGN: Meticulously merge the new instructions with the current implementation. 
3. PRESERVE DESIGN INTEGRITY: You MUST maintain the existing visual language, layout logic, colors, and established patterns. The goal is evolution, not replacement.

**CURRENT CODE STATE**: 
${currentArtifact.html}

**NEW SPECIFICATION**: 
"${instruction}"

Return ONLY the complete, raw RAW HTML of the updated application. Do not include markdown headers or explanations.
              `.trim();
              promptParts.push({ text: promptText });

              setSessions(prev => prev.map((sess, i) => 
                i === currentSessionIndex ? {
                    ...sess,
                    artifacts: sess.artifacts.map((art, j) => 
                      j === focusedArtifactIndex ? { 
                        ...art, 
                        status: 'streaming', 
                        html: '',
                        history: [...(art.history || []), newHistoryItem]
                      } : art
                    )
                } : sess
              ));

              const responseStream = await ai.models.generateContentStream({
                  model: 'gemini-3-pro-preview',
                  contents: { parts: promptParts },
                  config: {
                      thinkingConfig: { thinkingBudget: 32768 }
                  }
              });

              let accumulatedHtml = '';
              for await (const chunk of responseStream) {
                  const text = chunk.text;
                  if (typeof text === 'string') {
                      accumulatedHtml += text;
                      setSessions(prev => prev.map(sess => 
                          sess.id === currentSession.id ? {
                              ...sess,
                              artifacts: sess.artifacts.map(art => 
                                  art.id === currentArtifact.id ? { ...art, html: accumulatedHtml } : art
                              )
                          } : sess
                      ));
                  }
              }

              let finalHtml = accumulatedHtml.trim();
              if (finalHtml.startsWith('```html')) finalHtml = finalHtml.substring(7).trimStart();
              if (finalHtml.startsWith('```')) finalHtml = finalHtml.substring(3).trimStart();
              if (finalHtml.endsWith('```')) finalHtml = finalHtml.substring(0, finalHtml.length - 3).trimEnd();

              setSessions(prev => prev.map(sess => 
                  sess.id === currentSession.id ? {
                      ...sess,
                      artifacts: sess.artifacts.map(art => 
                          art.id === currentArtifact.id ? { ...art, html: finalHtml, status: 'complete' } : art
                      )
                  } : sess
              ));
          }, (attempt) => {
              setSessions(prev => prev.map(sess => 
                  sess.id === currentSession.id ? {
                      ...sess,
                      artifacts: sess.artifacts.map(art => 
                          art.id === currentArtifact.id ? { ...art, styleName: `Quota Cooling... (${attempt})` } : art
                      )
                  } : sess
              ));
          });

      } catch (e: any) {
          console.error("Refinement failed after retries:", e);
          const errorMessage = e?.message || "An unknown error occurred during refinement.";
          setSessions(prev => prev.map(sess => 
            sess.id === currentSession.id ? {
                ...sess,
                artifacts: sess.artifacts.map(art => 
                    art.id === currentArtifact.id ? { ...art, status: 'error', html: '', errorMessage } : art
                )
            } : sess
          ));
      } finally {
          setIsLoading(false);
      }
  }, [sessions, currentSessionIndex, focusedArtifactIndex]);

  const handleCodeUpdate = (sessionId: string, artifactId: string, newHtml: string) => {
    setSessions(prevSessions =>
        prevSessions.map(session =>
            session.id === sessionId
                ? {
                      ...session,
                      artifacts: session.artifacts.map(artifact =>
                          artifact.id === artifactId
                              ? { ...artifact, html: newHtml }
                              : artifact
                      ),
                  }
                : session
        )
    );
  };

  const handleSendMessage = useCallback(async (manualPrompt?: string) => {
    const promptToUse = manualPrompt || inputValue;
    const trimmedInput = promptToUse.trim();
    const currentImg = selectedImage;
    
    if (!trimmedInput && !currentImg) return;
    if (isLoading) return;
    if (!manualPrompt) setInputValue('');
    setSelectedImage(null);

    setIsLoading(true);
    const baseTime = Date.now();
    const sessionId = generateId();

    const placeholderArtifacts: Artifact[] = Array(3).fill(null).map((_, i) => ({
        id: `${sessionId}_${i}`,
        styleName: 'Designing...',
        html: '',
        status: 'streaming',
        history: [{
            id: generateId(),
            prompt: trimmedInput || "Initial Generation",
            timestamp: baseTime,
            version: 1
        }]
    }));

    const newSession: Session = {
        id: sessionId,
        prompt: trimmedInput || "Visual Inspiration UI",
        timestamp: baseTime,
        artifacts: placeholderArtifacts
    };

    setSessions(prev => [...prev, newSession]);
    setCurrentSessionIndex(sessions.length); 
    setFocusedArtifactIndex(null); 

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        const errorMessage = "API_KEY is not configured.";
        console.error(errorMessage);
        setSessions(prev => prev.map(s => s.id === sessionId ? {
          ...s,
          artifacts: s.artifacts.map(art => ({ ...art, status: 'error' as const, errorMessage }))
        } : s));
        setIsLoading(false);
        return;
    }
    const ai = new GoogleGenAI({ apiKey });

    const generateArtifact = async (artifact: Artifact, styleInstruction: string, index: number) => {
        try {
            await withRetry(async () => {
                const artParts: any[] = [];
                if (currentImg) artParts.push({ inlineData: { data: currentImg.data, mimeType: currentImg.mimeType } });
                
                const isBuildModeActive = trimmedInput.includes('[PROFESSIONAL BUILD MODE ACTIVE]');
                
                const prompt = isBuildModeActive 
                    ? `Develop a full-scale, professional application architecture for: "${trimmedInput}". Include advanced logic structures, comprehensive styling, and production-ready UX flows. DIRECTION: ${styleInstruction}. Return ONLY complete RAW HTML.`
                    : `Create a high-fidelity UI component for: "${trimmedInput}". DIRECTION: ${styleInstruction}. Return ONLY RAW HTML.`.trim();
                
                artParts.push({ text: prompt });

                const responseStream = await ai.models.generateContentStream({
                    model: 'gemini-3-pro-preview',
                    contents: { parts: artParts },
                    config: {
                        thinkingConfig: { thinkingBudget: 32768 }
                    }
                });

                let accumulatedHtml = '';
                for await (const chunk of responseStream) {
                    const text = chunk.text;
                    if (typeof text === 'string') {
                        accumulatedHtml += text;
                        setSessions(prev => prev.map(sess => 
                            sess.id === sessionId ? {
                                ...sess,
                                artifacts: sess.artifacts.map(art => 
                                    art.id === artifact.id ? { ...art, html: accumulatedHtml } : art
                                )
                            } : sess
                        ));
                    }
                }
                
                let finalHtml = accumulatedHtml.trim();
                if (finalHtml.startsWith('```html')) finalHtml = finalHtml.substring(7).trimStart();
                if (finalHtml.startsWith('```')) finalHtml = finalHtml.substring(3).trimStart();
                if (finalHtml.endsWith('```')) finalHtml = finalHtml.substring(0, finalHtml.length - 3).trimEnd();

                setSessions(prev => prev.map(sess => 
                    sess.id === sessionId ? {
                        ...sess,
                        artifacts: sess.artifacts.map(art => 
                            art.id === artifact.id ? { ...art, html: finalHtml, status: finalHtml ? 'complete' : 'error', styleName: styleInstruction } : art
                        )
                    } : sess
                ));
            }, (attempt) => {
                setSessions(prev => prev.map(sess => 
                    sess.id === sessionId ? {
                        ...sess,
                        artifacts: sess.artifacts.map(art => 
                            art.id === artifact.id ? { ...art, styleName: `Quota Waiting... (${attempt})` } : art
                        )
                    } : sess
                ));
            });
        } catch (e: any) {
            console.error('Error generating artifact after retries:', e);
            const errorMessage = e?.message || 'An unknown error occurred during generation.';
            setSessions(prev => prev.map(sess => 
                sess.id === sessionId ? {
                    ...sess,
                    artifacts: sess.artifacts.map(art => 
                        art.id === artifact.id ? { ...art, status: 'error', html: '', errorMessage } : art
                    )
                } : sess
            ));
        }
    };

    try {
        const stylePrompt = `Generate 3 distinct creative names for UI design directions for: "${trimmedInput}". Return ONLY a raw JSON array of 3 strings.`.trim();
        const styleResponse = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: stylePrompt
        }));

        let generatedStyles: string[] = ["Primary Grid", "Soft Glass", "Cyber Minimalism"];
        const styleText = styleResponse.text || '[]';
        const jsonMatch = styleText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            try { generatedStyles = JSON.parse(jsonMatch[0]); } catch (e) {}
        }
        generatedStyles = generatedStyles.slice(0, 3);

        setSessions(prev => prev.map(s => s.id === sessionId ? {
            ...s,
            artifacts: s.artifacts.map((art, i) => ({ ...art, styleName: generatedStyles[i] }))
        } : s));

        for (const [i, art] of placeholderArtifacts.entries()) {
            await generateArtifact(art, generatedStyles[i], i);
        }

    } catch (e) {
        console.error("Fatal error in generation process", e);
        setSessions(prev => prev.map(s => s.id === sessionId ? {
          ...s,
          artifacts: s.artifacts.map(art => ({ ...art, status: 'error' as const, errorMessage: (e as Error).message }))
        } : s));
    } finally {
        setIsLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [inputValue, selectedImage, isLoading, sessions.length]);

  const handleSurpriseMe = () => {
    const randomPrompt = placeholders[Math.floor(Math.random() * placeholders.length)];
    if(randomPrompt === "Ask for anything") {
        inputRef.current?.focus();
        return;
    }
    handleSendMessage(randomPrompt);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !isLoading) {
      event.preventDefault();
      handleSendMessage();
    } else if (event.key === 'Tab' && !inputValue && !isLoading) {
        event.preventDefault();
        setInputValue(placeholders[placeholderIndex]);
    }
  };

  if (publicViewHtml) {
      return (
          <div className="public-preview-mode">
              <button className="close-public-view" onClick={() => { window.location.hash = ''; setPublicViewHtml(null); }}>
                  <XIcon /> Exit Preview
              </button>
              <iframe 
                srcDoc={publicViewHtml} 
                title="Public Preview" 
                sandbox="allow-scripts allow-forms allow-modals allow-popups allow-presentation allow-same-origin"
                className="full-iframe"
              />
          </div>
      );
  }

  const isLoadingDrawer = isLoading && drawerState.mode === 'variations' && componentVariations.length === 0;
  const currentSession = sessions[currentSessionIndex];

  // Logic to handle item switching (sessions or artifacts) with cross-session navigation
  const prevItem = () => {
    if (focusedArtifactIndex !== null) {
      if (focusedArtifactIndex > 0) {
        setFocusedArtifactIndex(focusedArtifactIndex - 1);
      } else if (currentSessionIndex > 0) {
        // Go to previous session's last artifact
        const prevSessIndex = currentSessionIndex - 1;
        setCurrentSessionIndex(prevSessIndex);
        setFocusedArtifactIndex(sessions[prevSessIndex].artifacts.length - 1);
      }
    } else {
      setCurrentSessionIndex(prev => Math.max(0, prev - 1));
    }
  };

  const nextItem = () => {
    if (focusedArtifactIndex !== null) {
      const maxArt = (currentSession?.artifacts.length || 0) - 1;
      if (focusedArtifactIndex < maxArt) {
        setFocusedArtifactIndex(focusedArtifactIndex + 1);
      } else if (currentSessionIndex < sessions.length - 1) {
        // Go to next session's first artifact
        setCurrentSessionIndex(currentSessionIndex + 1);
        setFocusedArtifactIndex(0);
      }
    } else {
      setCurrentSessionIndex(prev => Math.min(sessions.length - 1, prev + 1));
    }
  };

  let canGoBack = false;
  let canGoForward = false;
  if (hasStarted) {
      if (focusedArtifactIndex !== null) {
          canGoBack = focusedArtifactIndex > 0 || currentSessionIndex > 0;
          canGoForward = focusedArtifactIndex < (currentSession?.artifacts.length || 0) - 1 || currentSessionIndex < sessions.length - 1;
      } else {
          canGoBack = currentSessionIndex > 0;
          canGoForward = currentSessionIndex < sessions.length - 1;
      }
  }

  const authOverlay = authView && (
    <div className="auth-overlay" onClick={() => setAuthView(null)}>
        <div className="auth-card" onClick={e => e.stopPropagation()}>
            <button className="auth-close" onClick={() => setAuthView(null)}><XIcon /></button>
            {authView === 'login' || authView === 'signup' ? (
                <div className="auth-content">
                    <div className="auth-header">
                        <div className="auth-header-icon"><SparklesIcon /></div>
                        <h2>{authView === 'login' ? 'Welcome Back' : 'Create an Account'}</h2>
                        <p className="auth-subtitle">{authView === 'login' ? 'Sign in to continue to Flash UI.' : 'Get started in seconds.'}</p>
                    </div>

                    <div className="auth-actions">
                        <div ref={googleBtnRef} className="google-btn-container"></div>
                    </div>
                    
                    <div className="auth-divider"><span>OR CONTINUE WITH EMAIL</span></div>
                    
                    <div className="form-group">
                        <div className="input-with-icon">
                            <MailIcon />
                            <input type="email" placeholder="Email Address" />
                        </div>
                        <div className="input-with-icon">
                            <LockIcon />
                            <input type="password" placeholder="Password" />
                        </div>
                        <button className="primary-auth-btn" onClick={() => {
                            const mockUser = { id: 'mock', name: 'Creative User', email: 'test@example.com', picture: '' };
                            setUser(mockUser);
                            setAuthView(null);
                            localStorage.setItem('flash-ui-user', JSON.stringify(mockUser));
                        }}>
                            {authView === 'login' ? 'Sign In' : 'Create Account'}
                        </button>
                    </div>

                    <div className="auth-switch">
                      {authView === 'login' ? "Don't have an account?" : "Already have an account?"}
                      <button onClick={() => setAuthView(authView === 'login' ? 'signup' : 'login')}>
                        {authView === 'login' ? 'Sign Up' : 'Sign In'}
                      </button>
                    </div>
                </div>
            ) : (
                <div className="profile-content">
                    <div className="profile-header">
                        <div className="profile-avatar large">
                            {user?.picture ? <img src={user.picture} alt={user.name} /> : <UserIcon />}
                        </div>
                        <h2>{user?.name}</h2>
                        <p>{user?.email}</p>
                    </div>
                    <div className="profile-stats">
                        <div className="stat-item">
                            <span className="stat-value">{sessions.length}</span>
                            <span className="stat-label">Projects</span>
                        </div>
                    </div>
                    <div className="profile-actions">
                        <button className="logout-btn" onClick={() => {
                             setUser(null);
                             localStorage.removeItem('flash-ui-user');
                             setAuthView(null);
                        }}>Sign Out</button>
                    </div>
                </div>
            )}
        </div>
    </div>
  );

  if (isEditorOpen && currentSession && focusedArtifactIndex !== null) {
      return (
        <>
            {authOverlay}
            <ProjectsModal 
                isOpen={drawerState.isOpen && drawerState.mode === 'projects'}
                onClose={() => setDrawerState(s => ({...s, isOpen: false}))}
                artifacts={savedArtifacts}
                onSelect={handleViewSaved}
                onDelete={handleRemoveSaved}
            />
            
            <SystemEditor 
                artifact={currentSession.artifacts[focusedArtifactIndex]}
                sessionPrompt={currentSession.prompt}
                sessionId={currentSession.id}
                user={user}
                onProfileClick={() => setAuthView('profile')}
                onSignInClick={() => setAuthView('login')}
                onOpenProjects={() => setDrawerState({ isOpen: true, mode: 'projects', title: 'Projects', data: null })}
                onClose={() => setIsEditorOpen(false)}
                onUpdate={handleRefine}
                onCodeUpdate={handleCodeUpdate}
                isLoading={isLoading}
            />
        </>
      );
  }

  return (
    <>
        <div className="top-nav">
             <button className="nav-projects-btn theme-btn" onClick={() => setIsThemeModalOpen(true)}>
                <PaletteIcon /> Theme
            </button>
            <button className="nav-projects-btn" onClick={() => setDrawerState({ isOpen: true, mode: 'projects', title: 'Projects', data: null })}>
                <FolderIcon /> Projects
            </button>
            {!user ? (
                <button className="auth-trigger" onClick={() => setAuthView('login')}>
                    <UserIcon /> Sign In
                </button>
            ) : (
                <button className="profile-trigger" onClick={() => setAuthView('profile')}>
                    {user.picture ? <img src={user.picture} alt={user.name} /> : <UserIcon />}
                    <span className="user-name">{user.name.split(' ')[0]}</span>
                </button>
            )}
        </div>

        {isThemeModalOpen && (
            <ThemeCustomizerModal
                onClose={() => setIsThemeModalOpen(false)}
                theme={theme}
                setTheme={setTheme}
                accent={accent}
                setAccent={setAccent}
            />
        )}
        
        <DiscoverModal 
            isOpen={isDiscoverModalOpen}
            onClose={() => setIsDiscoverModalOpen(false)}
            onSelectTemplate={handleSendMessage}
        />

        {drawerState.isOpen && drawerState.mode === 'projects' && (
            <ProjectsModal 
                isOpen={true}
                onClose={() => setDrawerState(s => ({...s, isOpen: false}))}
                artifacts={savedArtifacts}
                onSelect={handleViewSaved}
                onDelete={handleRemoveSaved}
            />
        )}

        {authOverlay}

        <SideDrawer isOpen={drawerState.isOpen && drawerState.mode !== 'projects'} onClose={() => setDrawerState(s => ({...s, isOpen: false}))} title={drawerState.title}>
            {isLoadingDrawer && <div className="loading-state"><ThinkingIcon /> Designing variations...</div>}
            {drawerState.mode === 'code' && (
                <div className="code-drawer-container">
                    <button 
                        className={`copy-code-btn ${hasCopied ? 'copied' : ''}`} 
                        onClick={handleCopyCode}
                    >
                        {hasCopied ? <><CheckIcon /> Copied</> : <><CopyIcon /> Copy Code</>}
                    </button>
                    <pre className="code-block"><code>{drawerState.data}</code></pre>
                </div>
            )}
            {drawerState.mode === 'variations' && (
                <div className="sexy-grid">
                    {componentVariations.map((v, i) => (
                         <div key={i} className="sexy-card" onClick={() => applyVariation(v.html)}>
                             <div className="sexy-preview"><iframe srcDoc={v.html} title={v.name} sandbox="allow-scripts allow-same-origin" /></div>
                             <div className="sexy-label">{v.name}</div>
                         </div>
                    ))}
                </div>
            )}
        </SideDrawer>

        <div className="immersive-app">
            <DottedGlowBackground gap={24} radius={1.5} color="rgba(255, 255, 255, 0.02)" glowColor="rgba(255, 255, 255, 0.15)" speedScale={0.5} />
            
            <div className={`stage-container ${focusedArtifactIndex !== null ? 'mode-focus' : 'mode-split'}`}>
                <div className={`initial-view-container ${hasStarted ? 'fade-out' : ''}`}>
                    <div className="empty-content">
                        <h1 className="main-title">Flash UI</h1>
                        <p className="main-subtitle">Creative UI generation in a flash</p>
                        <button className="surprise-button" onClick={handleSurpriseMe}>
                            <StarIcon /> Surprise Me
                        </button>
                    </div>
                </div>

                {hasStarted && sessions.map((session, sIndex) => {
                    let pos = 'hidden';
                    if (sIndex === currentSessionIndex) pos = 'active-session';
                    else if (sIndex < currentSessionIndex) pos = 'past-session';
                    else if (sIndex > currentSessionIndex) pos = 'future-session';
                    return (
                        <div key={session.id} className={`session-group ${pos} ${isClearing ? 'clearing-out' : ''}`}>
                            <div className="artifact-grid" ref={sIndex === currentSessionIndex ? gridScrollRef : null}>
                                {session.artifacts.map((artifact, aIndex) => (
                                    <ArtifactCard 
                                        key={artifact.id}
                                        artifact={artifact}
                                        isFocused={focusedArtifactIndex === aIndex}
                                        onClick={() => setFocusedArtifactIndex(aIndex)}
                                        onSave={(e) => { e.stopPropagation(); handleSaveProject(artifact); }}
                                        onPreview={(e) => handleOpenPreview(sIndex, aIndex, e)}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="floating-input-container">
                <div className={`input-wrapper ${isLoading ? 'loading' : ''} ${selectedImage ? 'has-image' : ''}`}>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
                    <div className="input-left-controls">
                        <div ref={inputMenuRef} style={{ position: 'relative' }}>
                            {!selectedImage ? (
                                <button
                                    className="image-upload-button"
                                    onClick={
                                        hasStarted 
                                            ? () => setIsInputMenuOpen(p => !p) 
                                            : () => fileInputRef.current?.click()
                                    }
                                    title={hasStarted ? "Actions" : "Upload inspiration image"}
                                    disabled={isLoading}
                                >
                                    {hasStarted ? <PlusIcon /> : <ImageIcon />}
                                </button>
                            ) : (
                                <div className="image-preview-thumb">
                                    <img src={`data:${selectedImage.mimeType};base64,${selectedImage.data}`} alt="preview" />
                                    <button className="remove-image-btn" onClick={clearSelectedImage}><XIcon /></button>
                                </div>
                            )}

                            {isInputMenuOpen && (
                                <div className="input-menu-popover">
                                    <div className="input-menu-header">Ask Gemini 3</div>
                                    <button className="input-menu-button" onClick={() => {
                                        fileInputRef.current?.click();
                                        setIsInputMenuOpen(false);
                                    }}>
                                        <PaperclipIcon />
                                        <span>Upload files</span>
                                    </button>
                                    <button className="input-menu-button" onClick={handleNewProject}>
                                        <StarIcon />
                                        <span>New project</span>
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        <button 
                            className={`magic-enhance-button ${isEnhancing ? 'active' : ''}`} 
                            onClick={handleEnhancePrompt} 
                            disabled={!inputValue.trim() || isLoading || isEnhancing}
                            title="Enhance prompt with AI"
                        >
                            <CursorMagicIcon />
                        </button>
                    </div>
                    {(!inputValue && !isLoading) && (
                        <div className="animated-placeholder" key={placeholderIndex}>
                            <span className="placeholder-text">{placeholders[placeholderIndex]}</span>
                            <span className="tab-hint">Tab</span>
                        </div>
                    )}
                    {!isLoading ? (
                        <input ref={inputRef} type="text" value={inputValue} onChange={handleInputChange} onKeyDown={handleKeyDown} disabled={isLoading} />
                    ) : (
                        <div className="input-generating-label">
                            <span className="generating-prompt-text">{currentSession?.prompt}</span>
                            <ThinkingIcon />
                        </div>
                    )}
                    <button className="send-button" onClick={() => handleSendMessage()} disabled={isLoading || (!inputValue.trim() && !selectedImage)}><ArrowUpIcon /></button>
                </div>
            </div>

            <TemplateDiscovery 
                onSelectTemplate={handleSendMessage} 
                onViewAll={() => setIsDiscoverModalOpen(true)}
            />

            {canGoBack && <button className="nav-handle left" onClick={prevItem} title="Previous Item"><ArrowLeftIcon /></button>}
            {canGoForward && <button className="nav-handle right" onClick={nextItem} title="Next Item"><ArrowRightIcon /></button>}

            <div className={`action-bar ${focusedArtifactIndex !== null ? 'visible' : ''}`}>
                 <div className="action-buttons">
                    <button onClick={() => setFocusedArtifactIndex(null)}><GridIcon /> Grid View</button>
                    <button className="edit-design-pill pro-active" onClick={() => setIsEditorOpen(true)}>
                        <PencilIcon />
                        <span>Edit Design</span>
                    </button>
                    <button onClick={handleShowCode}><CodeIcon /> Source</button>
                 </div>
            </div>
        </div>
    </>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<React.StrictMode><App /></React.StrictMode>);
}
