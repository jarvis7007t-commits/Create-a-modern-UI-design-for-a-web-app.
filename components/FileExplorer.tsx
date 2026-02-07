
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { ProjectFile } from '../types';
import JSZip from 'jszip';
import { 
    FolderIcon, 
    FolderOpenIcon, 
    FileIcon, 
    ChevronDownIcon, 
    ChevronRightIcon,
    ReactIcon,
    TSIcon,
    JSIcon,
    CSSIcon,
    JSONIcon,
    XIcon,
    CodeIcon,
    DownloadIcon,
    ThinkingIcon,
    MenuIcon,
    TrashIcon,
    PencilIcon,
    CheckIcon
} from './Icons';

// --- Helper Components ---

const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.tsx') || fileName.endsWith('.jsx')) return <ReactIcon />;
    if (fileName.endsWith('.ts')) return <TSIcon />;
    if (fileName.endsWith('.js')) return <JSIcon />;
    if (fileName.endsWith('.css')) return <CSSIcon />;
    if (fileName.endsWith('.json')) return <JSONIcon />;
    return <FileIcon />;
};

interface TreeNodeProps {
    node: ProjectFile;
    path: string;
    selectedFile: string;
    expandedFolders: Set<string>;
    onFileSelect: (path: string, content: string) => void;
    onToggleFolder: (path: string) => void;
    onDelete: (path: string) => void;
    onDownload: (path: string) => void;
    onEdit: (path: string) => void;
    onRename: (path: string) => void;
    level: number;
}

const TreeNode: React.FC<TreeNodeProps> = ({ 
    node, 
    path, 
    selectedFile, 
    expandedFolders, 
    onFileSelect, 
    onToggleFolder, 
    onDelete, 
    onDownload, 
    onEdit,
    onRename,
    level 
}) => {
    const currentPath = path ? `${path}/${node.name}` : node.name;
    const isExpanded = expandedFolders.has(currentPath);
    const isSelected = selectedFile === currentPath;
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        if (isMenuOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen]);

    const handleMenuClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMenuOpen(!isMenuOpen);
    };

    const isFolder = !!node.children;

    return (
        <div>
            <div 
                className={`tree-item ${isSelected ? 'active' : ''}`} 
                onClick={() => isFolder ? onToggleFolder(currentPath) : onFileSelect(currentPath, node.content || '')}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
            >
                {isFolder ? (
                    <span className="arrow">
                        {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                    </span>
                ) : <span className="arrow" />}
                
                <span className="file-icon" style={{ color: isFolder && isExpanded ? '#e4e4e7' : '#a1a1aa' }}>
                    {isFolder ? (isExpanded ? <FolderOpenIcon /> : <FolderIcon />) : getFileIcon(node.name)}
                </span>
                
                <span className="node-name">{node.name}</span>
                
                <div className="node-actions-container" ref={menuRef}>
                    <button className="node-menu-trigger" onClick={handleMenuClick} title="Actions">
                        <MenuIcon />
                    </button>
                    {isMenuOpen && (
                        <div className="node-context-menu">
                            {!isFolder && (
                                <>
                                    <button className="menu-item" onClick={(e) => { e.stopPropagation(); onEdit(currentPath); setIsMenuOpen(false); }}>
                                        <CodeIcon /> Open in Editor
                                    </button>
                                    <button className="menu-item" onClick={(e) => { e.stopPropagation(); onDownload(currentPath); setIsMenuOpen(false); }}>
                                        <DownloadIcon /> Download
                                    </button>
                                </>
                            )}
                            <button className="menu-item" onClick={(e) => { e.stopPropagation(); onRename(currentPath); setIsMenuOpen(false); }}>
                                <PencilIcon /> Rename
                            </button>
                            <div className="menu-divider" />
                            <button className="menu-item delete" onClick={(e) => { e.stopPropagation(); onDelete(currentPath); setIsMenuOpen(false); }}>
                                <TrashIcon /> Delete {isFolder ? 'Folder' : 'File'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {isFolder && isExpanded && (
                <div>
                    {node.children!.map((child) => (
                        <TreeNode
                            key={child.name}
                            node={child}
                            path={currentPath}
                            selectedFile={selectedFile}
                            expandedFolders={expandedFolders}
                            onFileSelect={onFileSelect}
                            onToggleFolder={onToggleFolder}
                            onDelete={onDelete}
                            onDownload={onDownload}
                            onEdit={onEdit}
                            onRename={onRename}
                            level={level + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const SyntaxHighlight = ({ code }: { code: string }) => {
    const tokens = useMemo(() => {
        const lines = code.split('\n');
        return lines.map((line, i) => {
            let processed = line;
            if (!processed) return <div key={i} className="code-line" />;

            // Simple syntax highlighting for visual effect
            processed = processed.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            processed = processed.replace(/('.*?'|".*?"|`.*?`)/g, '<span class="token-string">$1</span>');
            processed = processed.replace(/(\/\/.*)/g, '<span class="token-comment">$1</span>');
            
            const keywords = /\b(import|export|default|function|const|let|var|return|if|else|for|while|interface|type|from|class)\b/g;
            processed = processed.replace(keywords, '<span class="token-keyword">$1</span>');
            
            processed = processed.replace(/(\w+)(?=\()/g, '<span class="token-function">$1</span>');
            processed = processed.replace(/\b([A-Z][a-zA-Z0-9]*)\b/g, '<span class="token-class">$1</span>');
            
            return <div key={i} className="code-line" dangerouslySetInnerHTML={{ __html: processed || ' ' }} />;
        });
    }, [code]);

    return <>{tokens}</>;
};

const promptToPascalCase = (prompt: string): string => {
    const sanitized = prompt.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    if (!sanitized) return 'MyComponent';

    const name = sanitized
        .split(' ')
        .filter(word => word.length > 0 && !['a', 'an', 'the', 'for', 'ui', 'component', 'design', 'a', 'of', 'in', 'and'].includes(word.toLowerCase()))
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
    return name || 'MyComponent';
};

// --- Recursive Utility to modify the tree ---
const updateFileInTree = (nodes: ProjectFile[], path: string, newContent: string | null): ProjectFile[] => {
    const parts = path.split('/');
    const currentPart = parts[0];

    return nodes.map(node => {
        if (node.name === currentPart) {
            if (parts.length === 1) {
                if (newContent === null) return null as any; // marked for deletion
                return { ...node, content: newContent };
            }
            if (node.children) {
                return { ...node, children: updateFileInTree(node.children, parts.slice(1).join('/'), newContent) };
            }
        }
        return node;
    }).filter(Boolean);
};

const renameInTree = (nodes: ProjectFile[], path: string, newName: string): ProjectFile[] => {
    const parts = path.split('/');
    const currentPart = parts[0];

    return nodes.map(node => {
        if (node.name === currentPart) {
            if (parts.length === 1) {
                return { ...node, name: newName };
            }
            if (node.children) {
                return { ...node, children: renameInTree(node.children, parts.slice(1).join('/'), newName) };
            }
        }
        return node;
    });
};

// --- Professional Vite Project Generation ---
const generateViteProjectStructure = (html: string, prompt: string): ProjectFile => {
    const componentName = promptToPascalCase(prompt);

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 1. Extract CSS
    const styleTags = doc.querySelectorAll('style');
    let componentCss = `/* CSS for ${componentName} */\n\n`;
    styleTags.forEach(tag => {
        componentCss += tag.innerHTML.trim() + "\n\n";
        tag.remove();
    });

    // 2. Clean HTML body for component JSX
    doc.querySelectorAll('script').forEach(s => s.remove());
    let bodyHtml = doc.body.innerHTML;
    const componentJsx = bodyHtml
        .replace(/class="/g, 'className="')
        .replace(/for="/g, 'htmlFor="')
        .replace(/tabindex="/g, 'tabIndex="')
        .replace(/autocomplete="/g, 'autoComplete="')
        .replace(/<br>/g, '<br />')
        .replace(/<hr>/g, '<hr />')
        .replace(/<img ([^>]*[^/])>/g, '<img $1 />')
        .replace(/<input ([^>]*[^/])>/g, '<input $1 />')
        .replace(/<!--(.*?)-->/gs, '{/*$1*/}')
        .replace(/style="([^"]*)"/g, (match, styleString) => {
            const stylePairs = styleString.split(';').filter(s => s.trim()).map(s => {
                const colonIndex = s.indexOf(':');
                if (colonIndex === -1) return null;
                let key = s.slice(0, colonIndex).trim();
                const value = s.slice(colonIndex + 1).trim();
                key = key.replace(/-(\w)/g, (_, char) => char.toUpperCase());
                return `'${key}': ${JSON.stringify(value)}`;
            }).filter(Boolean);
            if (stylePairs.length === 0) return '';
            return `style={{ ${stylePairs.join(', ')} }}`;
        });

    // 3. Create file contents
    const componentContent = `import React from 'react';
import './${componentName}.css';

export default function ${componentName}() {
  /**
   * This is your generated UI component.
   * You can add state and logic here to make it interactive.
   */
  return (
    <>
      ${componentJsx}
    </>
  );
}
`;

    const appTsxContent = `import React from 'react';
import ${componentName} from './components/${componentName}/${componentName}';
import './index.css';

export default function App() {
  // This is the main container for your app.
  // It's set to display your component in the center.
  return (
    <div className="app-container">
      <${componentName} />
    </div>
  );
}
`;

    const indexCssContent = `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #1a1a1a;
  color: white;
}

.app-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
  box-sizing: border-box;
}
`;

    const mainTsxContent = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
`;

    const indexHtmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${prompt}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;

    const packageJsonContent = JSON.stringify({
        name: "flash-ui-project",
        private: true,
        version: "0.0.0",
        type: "module",
        scripts: { dev: "vite", build: "vite build", preview: "vite preview" },
        dependencies: { react: "^18.2.0", "react-dom": "^18.2.0" },
        devDependencies: {
            "@types/react": "^18.2.15", "@types/react-dom": "^18.2.7",
            "@vitejs/plugin-react": "^4.0.3", typescript: "^5.0.2", vite: "^4.4.5"
        }
    }, null, 2);

    const viteConfigContent = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})
`;

    const tsconfigContent = JSON.stringify({
        compilerOptions: {
            target: "ES2020", useDefineForClassFields: true, lib: ["ES2020", "DOM", "DOM.Iterable"],
            module: "ESNext", skipLibCheck: true, moduleResolution: "bundler",
            allowImportingTsExtensions: true, resolveJsonModule: true, isolatedModules: true,
            noEmit: true, jsx: "react-jsx", strict: true, noUnusedLocals: true,
            noUnusedParameters: true, noFallthroughCasesInSwitch: true
        },
        include: ["src"], references: [{ path: "./tsconfig.node.json" }]
    }, null, 2);

    const tsconfigNodeContent = JSON.stringify({
        compilerOptions: {
            composite: true, skipLibCheck: true, module: "ESNext",
            moduleResolution: "bundler", allowSyntheticDefaultImports: true
        },
        include: ["vite.config.ts"]
    }, null, 2);

    return {
        name: 'flash-project',
        children: [
            {
                name: 'src',
                children: [
                    {
                        name: 'components',
                        children: [{
                            name: componentName,
                            children: [
                                { name: `${componentName}.tsx`, content: componentContent },
                                { name: `${componentName}.css`, content: componentCss }
                            ]
                        }]
                    },
                    { name: 'App.tsx', content: appTsxContent },
                    { name: 'main.tsx', content: mainTsxContent },
                    { name: 'index.css', content: indexCssContent },
                ]
            },
            { name: 'index.html', content: indexHtmlContent },
            { name: 'package.json', content: packageJsonContent },
            { name: 'vite.config.ts', content: viteConfigContent },
            { name: 'tsconfig.json', content: tsconfigContent },
            { name: 'tsconfig.node.json', content: tsconfigNodeContent },
            { name: 'README.md', content: `# ${prompt}\n\nGenerated with Flash UI.` }
        ]
    };
};

interface FileExplorerProps {
    html?: string;
    prompt?: string;
    onSave?: (newHtml: string) => void;
}

const findFileByPath = (nodes: ProjectFile[], path: string): ProjectFile | null => {
    const parts = path.split('/');
    let currentNodes: ProjectFile[] | undefined = nodes;
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const node = currentNodes?.find(n => n.name === part);
        if (!node) return null;
        if (i === parts.length - 1) return node;
        currentNodes = node.children;
    }
    return null;
};

const FileExplorer = ({ html, prompt = "Generated Project", onSave }: FileExplorerProps) => {
    const [projectStructure, setProjectStructure] = useState<ProjectFile>({ name: 'root', children: [] });
    
    const [selectedPath, setSelectedPath] = useState('');
    const [selectedContent, setSelectedContent] = useState('');
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [openTabs, setOpenTabs] = useState<{path: string, content: string}[]>([]);
    const [isZipping, setIsZipping] = useState(false);
    
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState('');

    useEffect(() => {
        if (html && prompt) {
            const newStructure = generateViteProjectStructure(html, prompt);
            setProjectStructure(newStructure);
            
            const componentName = promptToPascalCase(prompt);
            setExpandedFolders(new Set(['src', 'src/components', `src/components/${componentName}`]));

            const defaultFilePath = `src/components/${componentName}/${componentName}.tsx`;
            const defaultFile = findFileByPath(newStructure.children || [], defaultFilePath);

            if (defaultFile?.content) {
                const newContent = defaultFile.content;
                setOpenTabs(tabs => {
                    const existing = tabs.find(t => t.path === defaultFilePath);
                    if (existing) {
                        return tabs.map(t => t.path === defaultFilePath ? { ...t, content: newContent } : t);
                    }
                    return [{ path: defaultFilePath, content: newContent }, ...tabs];
                });
                setSelectedPath(defaultFilePath);
                setSelectedContent(newContent);
            }
        }
    }, [html, prompt]);

    const handleFileSelect = useCallback((path: string, content: string) => {
        setSelectedPath(path);
        setSelectedContent(content);
        setIsEditing(false);
        
        setOpenTabs(prev => {
            if (prev.find(t => t.path === path)) return prev;
            return [...prev, { path, content }];
        });
    }, []);

    const handleToggleFolder = useCallback((path: string) => {
        setExpandedFolders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(path)) newSet.delete(path);
            else newSet.add(path);
            return newSet;
        });
    }, []);

    const closeTab = (e: React.MouseEvent, path: string) => {
        e.stopPropagation();
        const newTabs = openTabs.filter(t => t.path !== path);
        setOpenTabs(newTabs);
        
        if (selectedPath === path) {
            if (newTabs.length > 0) {
                const last = newTabs[newTabs.length - 1];
                setSelectedPath(last.path);
                setSelectedContent(last.content);
                setIsEditing(false);
            } else {
                setSelectedPath('');
                setSelectedContent('');
                setIsEditing(false);
            }
        }
    };

    const activateTab = (tab: {path: string, content: string}) => {
        setSelectedPath(tab.path);
        setSelectedContent(tab.content);
        setIsEditing(false);
    };

    // --- File Management Actions ---

    const handleDeleteNode = (path: string) => {
        if (!window.confirm(`Are you sure you want to delete ${path}?`)) return;

        setProjectStructure(prev => ({
            ...prev,
            children: updateFileInTree(prev.children || [], path, null)
        }));

        setOpenTabs(prev => prev.filter(t => !t.path.startsWith(path)));
        if (selectedPath.startsWith(path)) {
            setSelectedPath('');
            setSelectedContent('');
            setIsEditing(false);
        }
    };

    const handleDownloadFile = (path: string) => {
        const file = findFileByPath(projectStructure.children || [], path);
        if (!file || !file.content) return;

        const blob = new Blob([file.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = path.split('/').pop() || 'file.txt';
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    const handleStartEdit = (path: string) => {
        const file = findFileByPath(projectStructure.children || [], path);
        if (file && !file.children) {
            setSelectedPath(path);
            setSelectedContent(file.content || '');
            setEditValue(file.content || '');
            setIsEditing(true);
            
            setOpenTabs(prev => {
                if (prev.find(t => t.path === path)) return prev;
                return [...prev, { path, content: file.content || '' }];
            });
        }
    };

    const handleRenameNode = (path: string) => {
        const currentName = path.split('/').pop() || '';
        const newName = window.prompt(`Rename ${currentName} to:`, currentName);
        if (newName && newName !== currentName) {
            setProjectStructure(prev => ({
                ...prev,
                children: renameInTree(prev.children || [], path, newName)
            }));
            
            const oldPrefix = path;
            const newPrefix = path.split('/').slice(0, -1).concat(newName).join('/');
            
            if (selectedPath.startsWith(oldPrefix)) {
                setSelectedPath(selectedPath.replace(oldPrefix, newPrefix));
            }
            
            setOpenTabs(prev => prev.map(tab => {
                if (tab.path.startsWith(oldPrefix)) {
                    return { ...tab, path: tab.path.replace(oldPrefix, newPrefix) };
                }
                return tab;
            }));
        }
    };

    const handleSaveEdit = () => {
        const newStructureChildren = updateFileInTree(projectStructure.children || [], selectedPath, editValue);
        setProjectStructure(prev => ({
            ...prev,
            children: newStructureChildren
        }));
        setSelectedContent(editValue);
        setOpenTabs(prev => prev.map(t => t.path === selectedPath ? { ...t, content: editValue } : t));
        setIsEditing(false);

        // Attempt to reconstruction flattened HTML for the parent preview
        if (onSave) {
            const componentName = promptToPascalCase(prompt);
            const tsxPath = `src/components/${componentName}/${componentName}.tsx`;
            const cssPath = `src/components/${componentName}/${componentName}.css`;
            
            const tsxFile = findFileByPath(newStructureChildren, tsxPath);
            const cssFile = findFileByPath(newStructureChildren, cssPath);

            if (tsxFile && tsxFile.content) {
                const tsx = tsxFile.content;
                const css = cssFile?.content || '';
                
                // Regex to pull JSX content from tsx file
                const jsxMatch = tsx.match(/return\s*\(\s*<>\s*([\s\S]*?)\s*<\/>\s*\);/);
                if (jsxMatch) {
                    let bodyHtml = jsxMatch[1].trim();
                    // Basic de-reactification
                    bodyHtml = bodyHtml
                        .replace(/className="/g, 'class="')
                        .replace(/htmlFor="/g, 'for="')
                        .replace(/tabIndex="/g, 'tabindex="')
                        .replace(/autoComplete="/g, 'autocomplete="')
                        .replace(/style=\{\{\s*([\s\S]*?)\s*\}\}/g, (match, styleObj) => {
                            const styleItems = styleObj.split(',').map((s: string) => {
                                const parts = s.split(':');
                                if (parts.length !== 2) return '';
                                const key = parts[0].trim().replace(/['"]/g, '').replace(/([A-Z])/g, '-$1').toLowerCase();
                                const val = parts[1].trim().replace(/['"]/g, '');
                                return `${key}: ${val};`;
                            });
                            return `style="${styleItems.join(' ')}"`;
                        });

                    const reconstructedHtml = `<!DOCTYPE html><html><head><style>${css}</style></head><body>${bodyHtml}</body></html>`;
                    onSave(reconstructedHtml);
                }
            }
        }
    };

    const handleDownloadZip = async () => {
        setIsZipping(true);
        try {
            const zip = new JSZip();

            const addFilesToZip = (folder: JSZip, nodes: ProjectFile[]) => {
                nodes.forEach(node => {
                    if (node.children) {
                        const newFolder = folder.folder(node.name);
                        if (newFolder) {
                            addFilesToZip(newFolder, node.children);
                        }
                    } else {
                        folder.file(node.name, node.content || '');
                    }
                });
            };

            if (projectStructure.children) {
                addFilesToZip(zip, projectStructure.children);
            }

            const content = await zip.generateAsync({ type: "blob" });
            
            const url = window.URL.createObjectURL(content);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${promptToPascalCase(prompt).toLowerCase()}-project.zip`;
            document.body.appendChild(a);
            a.click();
            
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Failed to zip project:", error);
        } finally {
            setIsZipping(false);
        }
    };

    const lineCount = useMemo(() => (isEditing ? editValue : selectedContent).split('\n').length, [isEditing, editValue, selectedContent]);
    const lineNumbers = useMemo(() => Array.from({ length: lineCount }, (_, i) => i + 1), [lineCount]);

    return (
        <div className="ide-container">
            <div className="ide-sidebar">
                <div className="ide-sidebar-header">
                    <span>File Explorer</span>
                    <button 
                        onClick={handleDownloadZip} 
                        className="file-explorer-copy-btn" 
                        title="Download Entire Project (ZIP)"
                        style={{ padding: '4px 8px', height: 'auto', background: 'transparent', border: 'none', color: '#a1a1aa' }}
                        disabled={isZipping}
                    >
                        {isZipping ? <ThinkingIcon /> : <DownloadIcon />}
                    </button>
                </div>
                <div className="ide-file-tree">
                    {projectStructure.children?.map((node) => (
                        <TreeNode
                            key={node.name}
                            node={node}
                            path=""
                            selectedFile={selectedPath}
                            expandedFolders={expandedFolders}
                            onFileSelect={handleFileSelect}
                            onToggleFolder={handleToggleFolder}
                            onDelete={handleDeleteNode}
                            onDownload={handleDownloadFile}
                            onEdit={handleStartEdit}
                            onRename={handleRenameNode}
                            level={0}
                        />
                    ))}
                </div>
            </div>
            
            <div className="ide-main">
                <div className="ide-tab-bar">
                    {openTabs.map(tab => (
                        <div 
                            key={tab.path} 
                            className={`ide-tab ${selectedPath === tab.path ? 'active' : ''}`}
                            onClick={() => activateTab(tab)}
                        >
                            <span className="file-icon">{getFileIcon(tab.path)}</span>
                            <span>{tab.path.split('/').pop()}</span>
                            <span className="close-icon" onClick={(e) => closeTab(e, tab.path)}>
                                <XIcon />
                            </span>
                        </div>
                    ))}
                    {isEditing && (
                        <button className="ide-save-btn" onClick={handleSaveEdit}>
                            <CheckIcon /> Save Changes
                        </button>
                    )}
                </div>
                
                {selectedPath ? (
                    <div className="ide-editor-container">
                        <div className="line-numbers">
                            {lineNumbers.map(n => (
                                <div key={n} className="line-number">{n}</div>
                            ))}
                        </div>
                        <div className="code-content">
                            {isEditing ? (
                                <textarea 
                                    className="ide-textarea" 
                                    value={editValue} 
                                    onChange={(e) => setEditValue(e.target.value)} 
                                    spellCheck={false}
                                    autoFocus
                                />
                            ) : (
                                <SyntaxHighlight code={selectedContent} />
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="ide-empty">
                        <CodeIcon />
                        <p>Select a file to view code</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileExplorer;
