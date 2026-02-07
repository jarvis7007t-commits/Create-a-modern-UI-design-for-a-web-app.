
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef } from 'react';
import { Artifact } from '../types';
import { BookmarkIcon, XIcon, EyeIcon } from './Icons';

interface ArtifactCardProps {
    artifact: Artifact;
    isFocused: boolean;
    onClick: () => void;
    onSave?: (e: React.MouseEvent) => void;
    onPreview?: (e: React.MouseEvent) => void;
}

const ArtifactCard = React.memo(({ 
    artifact, 
    isFocused, 
    onClick,
    onSave,
    onPreview
}: ArtifactCardProps) => {
    const codeRef = useRef<HTMLPreElement>(null);

    // Auto-scroll logic for this specific card
    useEffect(() => {
        if (codeRef.current) {
            codeRef.current.scrollTop = codeRef.current.scrollHeight;
        }
    }, [artifact.html]);

    const isBlurring = artifact.status === 'streaming';
    const isError = artifact.status === 'error';

    return (
        <div 
            className={`artifact-card ${isFocused ? 'focused' : ''} ${isBlurring ? 'generating' : ''} ${isError ? 'error-state' : ''}`}
            onClick={onClick}
        >
            <div className="artifact-header">
                <span className="artifact-style-tag">{artifact.styleName}</span>
                <div className="artifact-header-actions">
                    {onPreview && !isBlurring && !isError && (
                        <button 
                            className="preview-artifact-btn" 
                            onClick={onPreview}
                            title="Preview Project"
                        >
                            <EyeIcon />
                        </button>
                    )}
                    {onSave && !isBlurring && !isError && (
                        <button 
                            className="save-artifact-btn" 
                            onClick={onSave}
                            title="Save Project"
                        >
                            <BookmarkIcon />
                        </button>
                    )}
                </div>
            </div>
            <div className="artifact-card-inner">
                {isBlurring && (
                    <div className="generating-overlay">
                        <pre ref={codeRef} className="code-stream-preview">
                            {artifact.html}
                        </pre>
                    </div>
                )}
                {isError && (
                    <div className="error-overlay">
                        <div className="error-content">
                            <XIcon />
                            <h3>Generation Failed</h3>
                            <p>{artifact.errorMessage || 'Quota exceeded or network issue. Please try again later.'}</p>
                        </div>
                    </div>
                )}
                {!isError && (
                    <iframe 
                        srcDoc={artifact.html} 
                        title={artifact.id} 
                        sandbox="allow-scripts allow-forms allow-modals allow-popups allow-presentation allow-same-origin"
                        className="artifact-iframe"
                    />
                )}
            </div>
        </div>
    );
});

export default ArtifactCard;