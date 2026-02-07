
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Artifact, User, HistoryItem } from '../types';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { withRetry } from '../utils';
import { 
    ArrowLeftIcon, 
    ArrowUpIcon, 
    ThinkingIcon, 
    CodeIcon, 
    ImageIcon, 
    XIcon, 
    UserIcon,
    ShareIcon,
    GlobeIcon,
    CursorMagicIcon,
    PaletteIcon,
    AlignmentIcon,
    SpacingIcon,
    BoldIcon,
    ItalicIcon,
    UnderlineIcon,
    LinkIcon,
    UnlinkIcon,
    SpacingTopIcon,
    SpacingRightIcon,
    SpacingBottomIcon,
    SpacingLeftIcon,
    ChevronDownIcon,
    WandIcon,
    CheckIcon,
    RefreshCwIcon,
    MonitorIcon,
    SmartphoneIcon,
    PencilIcon,
    PlusIcon,
    MinusIcon,
    JumpToCodeIcon,
    ResizeHorizontalIcon,
    AlignLeftIcon,
    AlignCenterIcon,
    AlignRightIcon,
    AlignJustifyIcon,
    SearchIcon,
    SparklesIcon,
    GridIcon,
    FileIcon,
    ReactIcon,
    CSSIcon
} from './Icons';
import FileExplorer from './FileExplorer';

interface SystemEditorProps {
    artifact: Artifact;
    sessionPrompt: string;
    sessionId: string;
    user: User | null;
    onProfileClick: () => void;
    onSignInClick: () => void;
    onOpenProjects: () => void;
    onClose: () => void;
    onUpdate: (instruction: string, images?: { data: string; mimeType: string }[] | null) => void;
    onCodeUpdate: (sessionId: string, artifactId: string, newHtml: string) => void;
    isLoading?: boolean;
}

const FONTS_LIST = [
    'Inter', 
    'Roboto', 
    'Open Sans', 
    'Lato', 
    'Montserrat', 
    'Raleway', 
    'Poppins', 
    'Playfair Display', 
    'Merriweather', 
    'Nunito', 
    'Ubuntu', 
    'Oswald', 
    'Source Sans Pro', 
    'Slabo 27px', 
    'PT Sans', 
    'Roboto Condensed', 
    'Roboto Mono', 
    'Space Mono', 
    'Courier New', 
    'Times New Roman', 
    'Georgia', 
    'Verdana'
];

const SpacingInput = ({ icon, value, onChange }: { icon: React.ReactNode, value: number, onChange: (val: number) => void }) => (
    <div className="spacing-input-wrapper">
        <span className="icon">{icon}</span>
        <input 
            type="number" 
            className="spacing-input" 
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value) || 0)} 
        />
    </div>
);

const SpacingEditorPopover = ({ selection, onUpdate, onClose }: any) => {
    const [isPaddingLinked, setIsPaddingLinked] = useState(true);
    const [isMarginLinked, setIsMarginLinked] = useState(true);
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
            const trigger = document.querySelector('[data-spacing-trigger]');
            if (trigger && trigger.contains(event.target as Node)) return;
            onClose();
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const p = {
        top: parseInt(selection.styles.paddingTop) || 0,
        right: parseInt(selection.styles.paddingRight) || 0,
        bottom: parseInt(selection.styles.paddingBottom) || 0,
        left: parseInt(selection.styles.paddingLeft) || 0,
    };
    const m = {
        top: parseInt(selection.styles.marginTop) || 0,
        right: parseInt(selection.styles.marginRight) || 0,
        bottom: parseInt(selection.styles.marginBottom) || 0,
        left: parseInt(selection.styles.marginLeft) || 0,
    };

    const handlePaddingChange = (side: string, value: number) => {
        if (isPaddingLinked) {
            onUpdate({ paddingTop: `${value}px`, paddingRight: `${value}px`, paddingBottom: `${value}px`, paddingLeft: `${value}px` });
        } else {
            onUpdate({ [`padding${side.charAt(0).toUpperCase() + side.slice(1)}`]: `${value}px` });
        }
    };

    const handleMarginChange = (side: string, value: number) => {
        if (isMarginLinked) {
            onUpdate({ marginTop: `${value}px`, marginRight: `${value}px`, marginBottom: `${value}px`, marginLeft: `${value}px` });
        } else {
            onUpdate({ [`margin${side.charAt(0).toUpperCase() + side.slice(1)}`]: `${value}px` });
        }
    };
    
    const resetPadding = () => onUpdate({ paddingTop: '0px', paddingRight: '0px', paddingBottom: '0px', paddingLeft: '0px' });
    const resetMargin = () => onUpdate({ marginTop: '0px', marginRight: '0px', marginBottom: '0px', marginLeft: '0px' });

    return (
        <div className="spacing-popover" ref={popoverRef}>
            <div>
                <div className="spacing-section-header">
                    <h4>Padding</h4>
                    <button className="spacing-reset-btn" onClick={resetPadding}>Reset</button>
                </div>
                <div className="spacing-grid">
                    <SpacingInput icon={<SpacingLeftIcon />} value={p.left} onChange={v => handlePaddingChange('left', v)} />
                    <SpacingInput icon={<SpacingTopIcon />} value={p.top} onChange={v => handlePaddingChange('top', v)} />
                    <button className={`spacing-link-btn ${isPaddingLinked ? 'active' : ''}`} onClick={() => setIsPaddingLinked(p => !p)}>
                        {isPaddingLinked ? <LinkIcon /> : <UnlinkIcon />}
                    </button>
                    <SpacingInput icon={<SpacingBottomIcon />} value={p.bottom} onChange={v => handlePaddingChange('bottom', v)} />
                    <SpacingInput icon={<SpacingRightIcon />} value={p.right} onChange={v => handlePaddingChange('right', v)} />
                </div>
            </div>
            <div>
                <div className="spacing-section-header">
                    <h4>Margin</h4>
                    <button className="spacing-reset-btn" onClick={resetPadding}>Reset</button>
                </div>
                <div className="spacing-grid">
                    <SpacingInput icon={<SpacingLeftIcon />} value={m.left} onChange={v => handleMarginChange('left', v)} />
                    <SpacingInput icon={<SpacingTopIcon />} value={m.top} onChange={v => handleMarginChange('top', v)} />
                    <button className={`spacing-link-btn ${isMarginLinked ? 'active' : ''}`} onClick={() => setIsMarginLinked(p => !p)}>
                        {isMarginLinked ? <LinkIcon /> : <UnlinkIcon />}
                    </button>
                    <SpacingInput icon={<SpacingBottomIcon />} value={m.bottom} onChange={v => handleMarginChange('bottom', v)} />
                    <SpacingInput icon={<SpacingRightIcon />} value={m.right} onChange={v => handleMarginChange('right', v)} />
                </div>
            </div>
        </div>
    );
};

const AlignmentPopover = ({ currentAlign, onUpdate, onClose }: any) => {
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                const trigger = document.querySelector('[data-align-trigger]');
                if (trigger && trigger.contains(event.target as Node)) return;
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div className="alignment-popover" ref={popoverRef}>
            <button className={`toolbar-btn ${currentAlign === 'left' ? 'active' : ''}`} onClick={() => onUpdate('left')}>
                <AlignLeftIcon />
            </button>
            <button className={`toolbar-btn ${currentAlign === 'center' ? 'active' : ''}`} onClick={() => onUpdate('center')}>
                <AlignCenterIcon />
            </button>
            <button className={`toolbar-btn ${currentAlign === 'right' ? 'active' : ''}`} onClick={() => onUpdate('right')}>
                <AlignRightIcon />
            </button>
            <button className={`toolbar-btn ${currentAlign === 'justify' ? 'active' : ''}`} onClick={() => onUpdate('justify')}>
                <AlignJustifyIcon />
            </button>
        </div>
    );
};

const FontPickerPopover = ({ currentFont, onUpdate, onClose }: any) => {
    const [search, setSearch] = useState('');
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                const trigger = document.querySelector('[data-font-trigger]');
                if (trigger && trigger.contains(event.target as Node)) return;
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const filteredFonts = FONTS_LIST.filter(f => f.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="font-picker-popover" ref={popoverRef}>
            <div className="font-search-header">
                <h4>Fonts</h4>
                <button className="close-button" style={{width: 24, height: 24, fontSize: 14}} onClick={onClose}><XIcon /></button>
            </div>
            <div className="font-search-input-wrapper">
                <SearchIcon />
                <input 
                    className="font-search-input" 
                    placeholder="Search fonts" 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                />
            </div>
            <div className="font-list">
                {filteredFonts.map(font => (
                    <div 
                        key={font} 
                        className={`font-item ${currentFont.includes(font) ? 'active' : ''}`}
                        onClick={() => { onUpdate(font); onClose(); }}
                        style={{ fontFamily: font }}
                    >
                        {font}
                        {currentFont.includes(font) && <CheckIcon />}
                    </div>
                ))}
            </div>
        </div>
    );
};

interface AgentLog {
    id: string;
    type: 'thought' | 'action-file' | 'success' | 'info';
    message: string;
    detail?: string;
    timestamp: number;
    completed: boolean;
}

const AgentSimulation = ({ prompt }: { prompt: string }) => {
    const [logs, setLogs] = useState<AgentLog[]>([]);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    useEffect(() => {
        const initialLog: AgentLog = {
            id: 'init',
            type: 'thought',
            message: 'Analyzing request...',
            timestamp: Date.now(),
            completed: false
        };
        setLogs([initialLog]);

        let isMounted = true;
        const timeouts: any[] = [];

        const addLog = (log: Omit<AgentLog, 'id' | 'timestamp' | 'completed'>) => {
            if (!isMounted) return;
            setLogs(prev => {
                const updated = prev.map(l => ({ ...l, completed: true }));
                return [...updated, {
                    ...log,
                    id: Math.random().toString(36),
                    timestamp: Date.now(),
                    completed: false
                }];
            });
        };

        const p = prompt.toLowerCase();
        const files = [];
        if (p.includes('header') || p.includes('nav')) files.push('Header.tsx');
        if (p.includes('button') || p.includes('cta')) files.push('Button.tsx');
        if (p.includes('card') || p.includes('grid')) files.push('Card.tsx');
        if (p.includes('style') || p.includes('color') || p.includes('css')) files.push('index.css');
        if (files.length === 0) files.push('App.tsx', 'index.css');

        timeouts.push(setTimeout(() => {
            addLog({ type: 'info', message: 'Identifying components...' });
        }, 800));

        timeouts.push(setTimeout(() => {
            addLog({ type: 'thought', message: 'Generating implementation plan...' });
        }, 1600));

        let delay = 2400;
        files.forEach((file, i) => {
            timeouts.push(setTimeout(() => {
                addLog({ type: 'action-file', message: `Updating ${file}`, detail: 'src/components/' });
            }, delay));
            delay += 1200 + Math.random() * 500;
        });

        timeouts.push(setTimeout(() => {
            addLog({ type: 'thought', message: 'Refining responsiveness...' });
        }, delay));

        return () => {
            isMounted = false;
            timeouts.forEach(clearTimeout);
        };
    }, [prompt]);

    return (
        <div className="agent-simulation-container">
            <div className="agent-header">
                <div className="agent-avatar-pulse">
                    <ThinkingIcon />
                </div>
                <span>Agent Working</span>
            </div>
            <div className="agent-logs">
                {logs.map((log, index) => (
                    <div key={log.id} className={`agent-log-item ${log.type} ${!log.completed ? 'active-step' : ''}`}>
                        <div className="log-line"></div>
                        <div className="log-icon">
                            {log.type === 'thought' && <ThinkingIcon />}
                            {log.type === 'action-file' && <FileIcon />}
                            {log.type === 'success' && <CheckIcon />}
                            {log.type === 'info' && <SearchIcon />}
                        </div>
                        <div className="log-content">
                            <span className="log-msg">{log.message}</span>
                            {log.detail && <span className="log-detail">{log.detail}</span>}
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
        </div>
    );
};


const SystemEditor = ({ 
    artifact, 
    sessionPrompt,
    sessionId,
    user,
    onProfileClick,
    onSignInClick,
    onOpenProjects,
    onClose, 
    onUpdate,
    onCodeUpdate,
    isLoading 
}: SystemEditorProps) => {
    const [inputValue, setInputValue] = useState('');
    const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
    const [selectedImages, setSelectedImages] = useState<{ data: string; mimeType: string }[]>([]);
    const [hasShared, setHasShared] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [isInspectorActive, setIsInspectorActive] = useState(false);
    const [isBuildMode, setIsBuildMode] = useState(false);
    const [isBuildMenuOpen, setIsBuildMenuOpen] = useState(false);
    
    // Popover States
    const [activePopover, setActivePopover] = useState<'spacing' | 'alignment' | 'font' | null>(null);
    
    // Inline Prompt State
    const [showInlinePrompt, setShowInlinePrompt] = useState(false);
    const [inlinePromptValue, setInlinePromptValue] = useState('');
    const inlineInputRef = useRef<HTMLInputElement>(null);

    const DEVICES = [
        { name: 'iPhone 16', width: 393, height: 852, icon: <SmartphoneIcon /> },
        { name: 'iPhone 16 Pro Max', width: 440, height: 956, icon: <SmartphoneIcon /> },
        { name: 'Android Compact', width: 412, height: 917, icon: <SmartphoneIcon /> },
        { name: 'Tablet', width: 768, height: 1024, icon: <SmartphoneIcon style={{transform: 'rotate(90deg)'}}/> },
        { name: 'Desktop', width: 1280, height: 800, icon: <MonitorIcon /> },
        { name: 'Custom', width: 500, height: 800, icon: <PencilIcon /> } 
    ];

    // --- UI Lab State (Resizing) ---
    const [previewSize, setPreviewSize] = useState({ width: 393, height: 852 });
    const [selectedDevice, setSelectedDevice] = useState(DEVICES[0]);
    const [isDeviceMenuOpen, setIsDeviceMenuOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const [isResizing, setIsResizing] = useState(false);
    const resizeRef = useRef<{ startX: number, startY: number, startW: number, startH: number, direction: string | null }>({
        startX: 0, startY: 0, startW: 0, startH: 0, direction: null
    });
    
    const deviceMenuRef = useRef<HTMLDivElement>(null);
    const buildMenuRef = useRef<HTMLDivElement>(null);
    
    const [versions, setVersions] = useState<{id: string, html: string}[]>([{ id: 'v1', html: artifact.html }]);
    
    const [selection, setSelection] = useState<{
        id: string;
        tagName: string;
        rect: DOMRect | null;
        styles: any;
        text: string;
    } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const codeContainerRef = useRef<HTMLDivElement>(null);
    const spacingBtnRef = useRef<HTMLButtonElement>(null);
    const alignBtnRef = useRef<HTMLButtonElement>(null);
    const fontBtnRef = useRef<HTMLButtonElement>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    const [iframeContent, setIframeContent] = useState(artifact.html);

    // Derived history from the artifact prop
    const artifactHistory = useMemo(() => artifact.history || [], [artifact.history]);

    useEffect(() => {
        if (artifact.status === 'complete' && artifact.html) {
            setIframeContent(artifact.html);
        }
    }, [artifact.status, artifact.html]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [artifactHistory, isLoading]);

    useEffect(() => {
        if (showInlinePrompt && inlineInputRef.current) {
            inlineInputRef.current.focus();
        }
    }, [showInlinePrompt]);

    useEffect(() => {
        if (!isLoading && artifact.html && (versions.length === 0 || versions[versions.length - 1].html !== artifact.html)) {
             const newVerId = `v${versions.length + 1}`;
             setVersions(prev => [...prev, { id: newVerId, html: artifact.html }]);
        }
    }, [artifact.html, isLoading, versions.length]);

    useEffect(() => {
        if (!isInspectorActive || !selection) {
            setActivePopover(null);
            setShowInlinePrompt(false);
        }
    }, [isInspectorActive, selection]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (deviceMenuRef.current && !deviceMenuRef.current.contains(event.target as Node)) {
                setIsDeviceMenuOpen(false);
            }
            if (buildMenuRef.current && !buildMenuRef.current.contains(event.target as Node)) {
                setIsBuildMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing || !resizeRef.current.direction) return;
            e.preventDefault();

            const { startX, startY, startW, startH, direction } = resizeRef.current;
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            let newW = startW;
            let newH = startH;

            switch(direction) {
                case 'right':
                    newW = Math.max(320, startW + (deltaX * 2));
                    break;
                case 'left':
                    newW = Math.max(320, startW - (deltaX * 2));
                    break;
                case 'bottom':
                    newH = Math.max(400, startH + deltaY);
                    break;
                case 'bottomRight':
                    newW = Math.max(320, startW + (deltaX * 2));
                    newH = Math.max(400, startH + deltaY);
                    break;
                case 'bottomLeft':
                    newW = Math.max(320, startW - (deltaX * 2));
                    newH = Math.max(400, startH + deltaY);
                    break;
            }

            setPreviewSize({ width: Math.round(newW), height: Math.round(newH) });
            
            if (selectedDevice.name !== 'Custom') {
                setSelectedDevice(DEVICES.find(d => d.name === 'Custom') || DEVICES[DEVICES.length - 1]);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            resizeRef.current.direction = null;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        if (isResizing) {
            document.body.style.userSelect = 'none';
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, selectedDevice.name]);

    const startResize = (e: React.MouseEvent, direction: 'left' | 'right' | 'bottom' | 'bottomRight' | 'bottomLeft') => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        const currentRect = iframeRef.current?.getBoundingClientRect();
        resizeRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            startW: currentRect ? currentRect.width : previewSize.width,
            startH: currentRect ? currentRect.height : previewSize.height,
            direction
        };
        let cursor = '';
        switch(direction) {
            case 'left': case 'right': cursor = 'ew-resize'; break;
            case 'bottom': cursor = 'ns-resize'; break;
            case 'bottomRight': cursor = 'nwse-resize'; break;
            case 'bottomLeft': cursor = 'nesw-resize'; break;
        }
        document.body.style.cursor = cursor;
    };

    const handleDimensionInput = (key: 'width' | 'height', val: string) => {
        const num = parseInt(val);
        if (!isNaN(num)) {
            setPreviewSize(prev => ({ ...prev, [key]: num }));
            if (selectedDevice.name !== 'Custom') {
                setSelectedDevice(DEVICES.find(d => d.name === 'Custom') || DEVICES[DEVICES.length - 1]);
            }
        }
    };

    const instrumentedHtml = useMemo(() => {
        if (!iframeContent) return `<html><body></body></html>`;
        const parser = new DOMParser();
        const doc = parser.parseFromString(iframeContent, 'text/html');
        const elements = doc.body.querySelectorAll('*');
        elements.forEach((el, idx) => {
            if (!el.getAttribute('data-flash-id')) {
                el.setAttribute('data-flash-id', `el-${idx}`);
            }
        });
        return doc.documentElement.outerHTML;
    }, [iframeContent]);

    const bridgeScript = `
    (function() {
        let activeEl = null;
        let styleTag = document.createElement('style');
        const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary') || '#4f46e5';
        styleTag.innerHTML = \`
            .flash-hover-highlight { outline: 2px solid \${accentColor} !important; outline-offset: 2px; cursor: crosshair !important; }
            .flash-selected-highlight { outline: 2px solid \${accentColor} !important; outline-offset: 2px; box-shadow: 0 0 15px \${accentColor}66; }
        \`;
        document.head.appendChild(styleTag);

        document.addEventListener('mouseover', (e) => {
            if (!window.inspectorActive) return;
            e.target.classList.add('flash-hover-highlight');
        });

        document.addEventListener('mouseout', (e) => {
            e.target.classList.remove('flash-hover-highlight');
        });

        document.addEventListener('click', (e) => {
            if (!window.inspectorActive) return;
            e.preventDefault();
            e.stopPropagation();

            if (activeEl) activeEl.classList.remove('flash-selected-highlight');
            activeEl = e.target;
            activeEl.classList.add('flash-selected-highlight');

            const styles = window.getComputedStyle(activeEl);
            window.parent.postMessage({
                type: 'FLASH_ELEMENT_SELECTED',
                id: activeEl.getAttribute('data-flash-id'),
                tagName: activeEl.tagName.toLowerCase(),
                text: activeEl.innerText || '',
                rect: activeEl.getBoundingClientRect(),
                styles: {
                    fontSize: styles.fontSize,
                    fontFamily: styles.fontFamily,
                    color: styles.color,
                    fontWeight: styles.fontWeight,
                    textAlign: styles.textAlign,
                    lineHeight: styles.lineHeight,
                    fontStyle: styles.fontStyle,
                    textDecoration: styles.textDecoration,
                    paddingTop: styles.paddingTop,
                    paddingRight: styles.paddingRight,
                    paddingBottom: styles.paddingBottom,
                    paddingLeft: styles.paddingLeft,
                    marginTop: styles.marginTop,
                    marginRight: styles.marginRight,
                    marginBottom: styles.marginBottom,
                    marginLeft: styles.marginLeft,
                }
            }, '*');
        }, true);

        window.addEventListener('message', (e) => {
            if (e.data.type === 'FLASH_TOGGLE_INSPECTOR') {
                window.inspectorActive = e.data.active;
                if (!e.data.active && activeEl) {
                    activeEl.classList.remove('flash-selected-highlight');
                }
            }
            if (e.data.type === 'FLASH_UPDATE_STYLE') {
                const el = document.querySelector(\`[data-flash-id="\${e.data.id}"]\`);
                if (el) {
                    Object.assign(el.style, e.data.styles);
                    window.parent.postMessage({
                        type: 'FLASH_ELEMENT_RECT_UPDATE',
                        rect: el.getBoundingClientRect()
                    }, '*');
                }
            }
        });
    })();
    `;

    const previewDoc = useMemo(() => `
        ${instrumentedHtml}
        <script>${bridgeScript}</script>
    `, [instrumentedHtml]);

    const saveChangesToCode = (id: string, styles: any) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(instrumentedHtml, 'text/html');
        const el = doc.querySelector(`[data-flash-id="${id}"]`);
        if (el instanceof HTMLElement) {
            Object.keys(styles).forEach(key => {
                el.style[key as any] = styles[key];
            });
            const newHtml = doc.documentElement.outerHTML;
            onCodeUpdate(sessionId, artifact.id, newHtml);
        }
    };

    useEffect(() => {
        const handleMessage = (e: MessageEvent) => {
            if (e.data.type === 'FLASH_ELEMENT_SELECTED') {
                setSelection(e.data);
            }
            if (e.data.type === 'FLASH_ELEMENT_RECT_UPDATE' && selection) {
                setSelection(prev => prev ? ({ ...prev, rect: e.data.rect }) : null);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [selection]);

    const toggleInspector = () => {
        const newState = !isInspectorActive;
        setIsInspectorActive(newState);
        if (!newState) setSelection(null);
        iframeRef.current?.contentWindow?.postMessage({
            type: 'FLASH_TOGGLE_INSPECTOR',
            active: newState
        }, '*');
    };

    const updateSelectedStyle = (newStyles: any) => {
        if (!selection) return;
        iframeRef.current?.contentWindow?.postMessage({
            type: 'FLASH_UPDATE_STYLE',
            id: selection.id,
            styles: newStyles
        }, '*');
        setSelection(prev => prev ? ({ ...prev, styles: { ...prev.styles, ...newStyles } }) : null);
        saveChangesToCode(selection.id, newStyles);
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
                    model: 'gemini-3-pro-preview',
                    contents: `Rewrite this UI refinement request to be professional, descriptive and specific. Keep it concise: "${inputValue}"`,
                    config: {
                        thinkingConfig: { thinkingBudget: 32768 }
                    }
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

    const handlePublish = async () => {
        setIsPublishing(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        try {
            const encodedHtml = btoa(unescape(encodeURIComponent(artifact.html)));
            const publicUrl = `${window.location.origin}${window.location.pathname}#view=${encodedHtml}`;
            window.open(publicUrl, '_blank');
        } catch (e) {
            console.error("Publishing failed:", e);
        } finally {
            setIsPublishing(false);
        }
    };

    const handleShare = async () => {
        const shareTitle = `Flash UI - ${artifact.styleName}`;
        const shareText = `Check out this UI I generated for "${sessionPrompt}" using Flash UI!`;
        try {
            if (navigator.share) {
                await navigator.share({ title: shareTitle, text: shareText, url: window.location.origin });
            } else {
                await navigator.clipboard.writeText(`${shareText}\n\n${artifact.html}`);
            }
            setHasShared(true);
            setTimeout(() => setHasShared(false), 2000);
        } catch (err) { console.error(err); }
    };

    const handleRefreshPreview = () => {
        setRefreshKey(prev => prev + 1);
    };

    const handleDeviceSelect = (device: any) => {
        setSelectedDevice(device);
        setPreviewSize({ width: device.width, height: device.height });
        setIsDeviceMenuOpen(false);
    };

    const getPopoverStyle = (triggerRef: React.RefObject<HTMLElement>, alignRight = false) => {
        if (!triggerRef.current || !toolbarRef.current) return {};
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const toolbarRect = toolbarRef.current.getBoundingClientRect();
        const top = triggerRect.bottom - toolbarRect.top + 8;
        let left = 0;
        if (alignRight) {
            left = (triggerRect.right - toolbarRect.left) - 280;
        } else {
            left = triggerRect.left - toolbarRect.left;
        }
        return { position: 'absolute' as const, top, left };
    };

    const handleRestoreVersion = (versionId: string) => {
        const version = versions.find(v => v.id === versionId);
        if (version) {
            onCodeUpdate(sessionId, artifact.id, version.html);
        }
    };

    const handleSend = () => {
        if (!inputValue.trim() && selectedImages.length === 0) return;

        let finalPrompt = inputValue || (isBuildMode ? 'Execute Professional Build' : 'Image Reference Update');
        
        if (isBuildMode) {
            finalPrompt = `[PROFESSIONAL BUILD MODE ACTIVE] Generate a production-ready, highly sophisticated web application with advanced UI patterns, smooth animations, and comprehensive state management structures. Task: ${finalPrompt}`;
        }

        onUpdate(finalPrompt, selectedImages.length > 0 ? selectedImages : null);
        
        setInputValue('');
        setSelectedImages([]);
    };

    const handleInlineSubmit = () => {
        if (!inlinePromptValue.trim()) return;
        let prompt = inlinePromptValue;
        if (selection) {
            prompt = `Edit the <${selection.tagName}> element containing "${selection.text.slice(0, 20)}...": ${inlinePromptValue}`;
        }
        onUpdate(prompt);
        setInlinePromptValue('');
        setShowInlinePrompt(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []) as File[];
        if (files.length === 0) return;
        
        const remainingSlots = 6 - selectedImages.length;
        const filesToProcess = files.slice(0, remainingSlots);

        filesToProcess.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = (reader.result as string).split(',')[1];
                setSelectedImages(prev => [...prev, { data: base64, mimeType: file.type }].slice(0, 6));
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleExplorerSave = (newHtml: string) => {
        onCodeUpdate(sessionId, artifact.id, newHtml);
    };

    return (
        <div className="editor-container">
            <header className="editor-header">
                <div className="header-left">
                    <button className="back-btn" onClick={onClose} title="Back to Grid" style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ArrowLeftIcon />
                    </button>
                </div>

                <div className="header-center-group">
                    <div className="device-toolbar relative">
                        <button className="device-btn" onClick={handleRefreshPreview} title="Refresh">
                            <RefreshCwIcon />
                        </button>
                        <div className="device-divider"></div>
                        <div className="mobile-dropdown-trigger">
                             <button 
                                className="device-btn active-device-label" 
                                onClick={() => setIsDeviceMenuOpen(!isDeviceMenuOpen)}
                                title="Change Device"
                                style={{ width: 'auto', padding: '0 8px', gap: '6px', fontSize: '13px' }}
                            >
                                {selectedDevice.name} <ChevronDownIcon />
                            </button>
                            {isDeviceMenuOpen && (
                                <div className="header-device-dropdown" ref={deviceMenuRef}>
                                    {DEVICES.map(dev => (
                                        <div 
                                            key={dev.name} 
                                            className={`lab-dropdown-item ${selectedDevice.name === dev.name ? 'selected' : ''}`}
                                            onClick={() => handleDeviceSelect(dev)}
                                        >
                                            <div className="lab-dropdown-item-name">
                                                {dev.icon}
                                                <span>{dev.name}</span>
                                            </div>
                                            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                                <span className="lab-dims">{dev.width}x{dev.height}</span>
                                                {selectedDevice.name === dev.name && <CheckIcon />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div style={{ width: 1, height: 16, background: 'var(--editor-border)' }}></div>
                    <div className="toggle-pill">
                        <button className={viewMode === 'preview' ? 'active' : ''} onClick={() => setViewMode('preview')}><ImageIcon /> Preview</button>
                        <button className={viewMode === 'code' ? 'active' : ''} onClick={() => setViewMode('code')}><CodeIcon /> Code</button>
                    </div>
                </div>

                <div className="header-right">
                    <button className="nav-projects-btn" onClick={onOpenProjects} title="All Projects" style={{ scale: '0.85', transformOrigin: 'right center' }}>
                        <GridIcon /> All Projects
                    </button>
                    {user ? (
                        <button className="profile-trigger" onClick={onProfileClick} style={{ scale: '0.85', transformOrigin: 'right center' }}>
                            {user.picture ? <img src={user.picture} alt={user.name} /> : <UserIcon />}
                            <span className="user-name">{user.name.split(' ')[0]}</span>
                        </button>
                    ) : (
                        <button className="auth-trigger" onClick={onSignInClick} style={{ scale: '0.85', transformOrigin: 'right center' }}>
                            <UserIcon /> Sign In
                        </button>
                    )}
                    <button className={`publish-btn ${isPublishing ? 'publishing' : ''}`} onClick={handlePublish} disabled={isPublishing} style={{ scale: '0.85', transformOrigin: 'right center' }}>
                        {isPublishing ? <ThinkingIcon /> : <GlobeIcon />} {isPublishing ? 'Publishing...' : 'Publish'}
                    </button>
                    <button className={`share-btn ${hasShared ? 'shared' : ''}`} onClick={handleShare} style={{ scale: '0.85', transformOrigin: 'right center' }}>
                        {hasShared ? <><CheckIcon /> Shared</> : <><ShareIcon /> Share</>}
                    </button>
                </div>
            </header>

            <main className="editor-main">
                <aside className="chat-sidebar">
                    <div className="sidebar-nav">
                        <span className="nav-title">History & Rationales</span>
                    </div>

                    <div className="chat-content">
                        {artifactHistory.map((item, index) => {
                            return (
                                <div key={item.id} className="history-card">
                                    <div className="history-card-header">
                                        <div className="history-prompt">{item.prompt}</div>
                                        {index < versions.length && (
                                           <div className="version-badge" onClick={() => handleRestoreVersion(`v${index + 1}`)}>v{index + 1}</div>
                                        )}
                                    </div>
                                    <div className="history-meta">
                                        <span className="history-time">
                                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {index < versions.length - 1 && (
                                            <button className="restore-btn" onClick={() => handleRestoreVersion(`v${index + 1}`)}>Restore</button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {isLoading && <AgentSimulation prompt={artifactHistory[artifactHistory.length - 1]?.prompt || 'Processing...'} />}
                        <div ref={bottomRef} />
                    </div>

                    <div className="chat-input-area">
                        <div className={`prompt-inner ${isBuildMode ? 'build-active' : ''}`}>
                            <input type="file" ref={fileInputRef} multiple style={{ display: 'none' }} onChange={handleFileChange} accept="image/*" />
                            
                            {selectedImages.length > 0 && (
                                <div className="multi-image-preview-grid">
                                    {selectedImages.map((img, idx) => (
                                        <div key={idx} className="image-preview-thumb">
                                            <img src={`data:${img.mimeType};base64,${img.data}`} alt={`preview-${idx}`} />
                                            <button className="remove-image-btn" onClick={() => removeImage(idx)}><XIcon /></button>
                                        </div>
                                    ))}
                                    {selectedImages.length < 6 && (
                                        <button className="add-more-images-btn" onClick={() => fileInputRef.current?.click()}>
                                            <PlusIcon />
                                        </button>
                                    )}
                                </div>
                            )}

                            {isBuildMode && (
                                <div className="build-badge">
                                    <SparklesIcon /> Professional Builder Active
                                </div>
                            )}

                            <textarea 
                                placeholder={isBuildMode ? "Describe the professional app..." : "Edit design..."} 
                                value={inputValue} 
                                onChange={(e) => setInputValue(e.target.value)} 
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} 
                            />
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                                <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
                                    <div ref={buildMenuRef}>
                                        <button 
                                            className={`image-upload-button ${selectedImages.length > 0 ? 'active' : ''}`} 
                                            onClick={() => setIsBuildMenuOpen(!isBuildMenuOpen)} 
                                            title="Build & Upload Options" 
                                            disabled={isLoading} 
                                            style={{ width: '32px', height: '32px' }}
                                        >
                                            <ImageIcon />
                                        </button>

                                        {isBuildMenuOpen && (
                                            <div className="input-menu-popover" style={{ bottom: '100%', left: 0, marginBottom: '12px' }}>
                                                <div className="input-menu-header">Build Center</div>
                                                <button className={`input-menu-button ${isBuildMode ? 'active' : ''}`} onClick={() => {
                                                    setIsBuildMode(!isBuildMode);
                                                    setIsBuildMenuOpen(false);
                                                }}>
                                                    <WandIcon />
                                                    <span>{isBuildMode ? "Disable" : "Enable"} Build Button</span>
                                                </button>
                                                <div className="input-menu-divider"></div>
                                                <button className="input-menu-button" onClick={() => {
                                                    fileInputRef.current?.click();
                                                    setIsBuildMenuOpen(false);
                                                }}>
                                                    <PlusIcon />
                                                    <span>Upload Images (Max 6)</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <button className={`magic-enhance-button mini ${isInspectorActive ? 'active' : ''}`} onClick={toggleInspector} title="Toggle Direct Edit Inspector" style={{ width: '32px', height: '32px' }}><CursorMagicIcon /></button>
                                </div>
                                <button className="send-button small" onClick={handleSend} disabled={(!inputValue.trim() && selectedImages.length === 0) || isLoading}>
                                    <ArrowUpIcon />
                                </button>
                            </div>
                        </div>
                    </div>
                </aside>

                <section className="editor-canvas lab-preview-container">
                    {viewMode === 'preview' ? (
                        <div className="lab-stage">
                            {!['Desktop', 'Tablet'].includes(selectedDevice.name) && (
                                <div className="dimension-controls">
                                    <div className="dim-input-group">
                                        <label>W</label>
                                        <input type="number" value={previewSize.width} onChange={(e) => handleDimensionInput('width', e.target.value)} />
                                    </div>
                                    <div className="dim-link-icon"><LinkIcon /></div>
                                    <div className="dim-input-group">
                                        <label>H</label>
                                        <input type="number" value={previewSize.height} onChange={(e) => handleDimensionInput('height', e.target.value)} />
                                    </div>
                                </div>
                            )}

                            <div 
                                className={`lab-canvas-wrapper ${isResizing ? 'resizing' : ''}`}
                                style={{ 
                                    width: previewSize.width,
                                    height: previewSize.height,
                                    transition: isResizing ? 'none' : 'width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), height 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
                                }}
                            >
                                <div className="resize-handle-bar left" onMouseDown={(e) => { startResize(e, 'left'); }}><div className="handle-grip"></div></div>
                                <div className="resize-handle-bar right" onMouseDown={(e) => { startResize(e, 'right'); }}><div className="handle-grip"></div></div>
                                <div className="resize-handle-bar bottom" onMouseDown={(e) => { startResize(e, 'bottom'); }}><div className="handle-grip horizontal"></div></div>
                                <div className="resize-handle-bar corner bottom-right" onMouseDown={(e) => { startResize(e, 'bottomRight'); }}><div className="handle-grip-corner"></div></div>
                                <div className="resize-handle-bar corner bottom-left" onMouseDown={(e) => { startResize(e, 'bottomLeft'); }}><div className="handle-grip-corner"></div></div>
                                
                                <iframe key={refreshKey} ref={iframeRef} srcDoc={previewDoc} title="Preview" sandbox="allow-scripts allow-forms allow-modals allow-popups allow-presentation allow-same-origin" className="lab-iframe" />
                                
                                {(isLoading || artifact.status === 'streaming') && (
                                    <div className="generating-overlay-editor">
                                        <ThinkingIcon />
                                        <span>Updating design...</span>
                                    </div>
                                )}

                                {selection && selection.rect && (
                                    <div className="selection-manager-overlay">
                                        <div className="element-selection-box" style={{ top: selection.rect.top, left: selection.rect.left, width: selection.rect.width, height: selection.rect.height }}>
                                            <div className="tag-label">{selection.tagName}</div>
                                        </div>
                                        <div className="rich-toolbar" ref={toolbarRef} style={{ top: Math.max(20, selection.rect.top - 60), left: Math.max(20, selection.rect.left + (selection.rect.width / 2) - 200) }}>
                                            {showInlinePrompt ? (
                                                <div className="rich-toolbar-input-mode">
                                                    <div className="toolbar-input-group">
                                                        <button className="toolbar-input-icons" onClick={() => setShowInlinePrompt(false)} title="Back to tools"><PaletteIcon /><SparklesIcon /></button>
                                                        <input ref={inlineInputRef} type="text" className="toolbar-input-field" placeholder="Ask for changes..." value={inlinePromptValue} onChange={(e) => setInlinePromptValue(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') handleInlineSubmit(); if(e.key === 'Escape') setShowInlinePrompt(false); }} />
                                                        <button className="toolbar-submit-btn" onClick={handleInlineSubmit}><ArrowUpIcon /></button>
                                                    </div>
                                                    <div className="toolbar-divider"></div>
                                                    <button className="toolbar-btn" onClick={() => setViewMode('code')}><JumpToCodeIcon /></button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="toolbar-section">
                                                        <button className="toolbar-btn" onClick={() => setShowInlinePrompt(true)} title="Edit with AI"><PencilIcon /></button>
                                                        <button className="toolbar-btn highlight" onClick={() => onUpdate(`Enhance and refine the ${selection.tagName} containing "${selection.text}"`)} title="AI Edit"><PaletteIcon /></button>
                                                    </div>
                                                    <div className="toolbar-divider" />
                                                    <div className="font-section"><button className="font-btn" data-font-trigger onClick={() => setActivePopover(activePopover === 'font' ? null : 'font')} ref={fontBtnRef}>{selection.styles.fontFamily ? selection.styles.fontFamily.split(',')[0].replace(/['"]/g, '') : 'Inter'}<ChevronDownIcon /></button><div className="color-swatch-wrapper" style={{ backgroundColor: selection.styles.color || '#fff' }}><input type="color" className="color-input" value={selection.styles.color ? (selection.styles.color.startsWith('#') ? selection.styles.color : '#000000') : '#000000'} onChange={(e) => updateSelectedStyle({ color: e.target.value })} /></div></div>
                                                    <div className="toolbar-divider" />
                                                    <div className="size-section"><button className="size-btn" onClick={() => updateSelectedStyle({ fontSize: (parseInt(selection.styles.fontSize) - 1) + 'px' })}><MinusIcon /></button><input type="number" className="size-input" value={parseInt(selection.styles.fontSize) || 16} onChange={(e) => updateSelectedStyle({ fontSize: e.target.value + 'px' })} /><button className="size-btn" onClick={() => updateSelectedStyle({ fontSize: (parseInt(selection.styles.fontSize) + 1) + 'px' })}><PlusIcon /></button></div>
                                                    <div className="toolbar-divider" />
                                                    <div className="style-section"><button className={`toolbar-btn ${selection.styles.fontWeight === 'bold' || parseInt(selection.styles.fontWeight) > 500 ? 'active' : ''}`} onClick={() => updateSelectedStyle({ fontWeight: selection.styles.fontWeight === 'bold' ? 'normal' : 'bold' })}><BoldIcon /></button><button className={`toolbar-btn ${selection.styles.fontStyle === 'italic' ? 'active' : ''}`} onClick={() => updateSelectedStyle({ fontStyle: selection.styles.fontStyle === 'italic' ? 'normal' : 'italic' })}><UnderlineIcon /></button><button className={`toolbar-btn ${selection.styles.textDecoration && selection.styles.textDecoration.includes('underline') ? 'active' : ''}`} onClick={() => updateSelectedStyle({ textDecoration: selection.styles.textDecoration.includes('underline') ? 'none' : 'underline' })}><UnderlineIcon /></button></div>
                                                    <div className="toolbar-divider" />
                                                    <div className="toolbar-section"><button ref={alignBtnRef} data-align-trigger className={`toolbar-btn ${activePopover === 'alignment' ? 'active' : ''}`} onClick={() => setActivePopover(activePopover === 'alignment' ? null : 'alignment')}><AlignmentIcon /><ChevronDownIcon /></button></div>
                                                    <div className="toolbar-divider" />
                                                    <div className="toolbar-section"><button ref={spacingBtnRef} data-spacing-trigger className={`toolbar-btn ${activePopover === 'spacing' ? 'active' : ''}`} onClick={() => setActivePopover(activePopover === 'spacing' ? null : 'spacing')}><ResizeHorizontalIcon /><ChevronDownIcon /></button></div>
                                                    <div className="toolbar-divider" />
                                                    <div className="toolbar-section"><button className="toolbar-btn" onClick={() => setViewMode('code')}><JumpToCodeIcon /></button></div>
                                                </>
                                            )}
                                        </div>
                                        {activePopover === 'spacing' && (<div style={getPopoverStyle(spacingBtnRef, true)}><SpacingEditorPopover selection={selection} onUpdate={updateSelectedStyle} onClose={() => setActivePopover(null)} /></div>)}
                                        {activePopover === 'alignment' && (<div style={getPopoverStyle(alignBtnRef)}><AlignmentPopover currentAlign={selection.styles.textAlign || 'left'} onUpdate={(align: string) => updateSelectedStyle({ textAlign: align })} onClose={() => setActivePopover(null)} /></div>)}
                                        {activePopover === 'font' && (<div style={getPopoverStyle(fontBtnRef)}><FontPickerPopover currentFont={selection.styles.fontFamily || ''} onUpdate={(font: string) => updateSelectedStyle({ fontFamily: font })} onClose={() => setActivePopover(null)} /></div>)}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="editor-code-view" ref={codeContainerRef}>
                            <FileExplorer html={artifact.html} prompt={sessionPrompt} onSave={handleExplorerSave} />
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default SystemEditor;
