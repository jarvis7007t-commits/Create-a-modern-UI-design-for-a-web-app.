/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { TEMPLATES } from '../constants';
import { SearchIcon, XIcon, BookmarkIcon } from './Icons';

interface DiscoverModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectTemplate: (prompt: string) => void;
}

const DiscoverModal = ({ isOpen, onClose, onSelectTemplate }: DiscoverModalProps) => {
    const [searchQuery, setSearchQuery] = useState('');

    if (!isOpen) return null;

    const filteredTemplates = TEMPLATES.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.prompt.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelect = (prompt: string) => {
        onSelectTemplate(prompt);
        onClose();
    };

    return (
        <div className="projects-modal-overlay" onClick={onClose}>
            <div className="projects-modal-content" onClick={e => e.stopPropagation()}>
                <div className="projects-modal-header">
                    <div className="modal-left-section">
                        <div className="search-bar-wrapper">
                            <SearchIcon />
                            <input
                                type="text"
                                placeholder={"Search templates..."}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="project-count-badge">
                            {filteredTemplates.length} templates
                        </div>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>
                        <XIcon />
                    </button>
                </div>

                <div className="projects-grid-container">
                    {filteredTemplates.length === 0 ? (
                        <div className="empty-projects-state">
                            <p>No matching templates found for "{searchQuery}"</p>
                        </div>
                    ) : (
                        <div className="projects-grid">
                            {filteredTemplates.map(template => (
                                <div key={template.id} className="project-card-item" onClick={() => handleSelect(template.prompt)}>
                                    <div className="project-preview-window">
                                        <img src={template.imageUrl} alt={template.title} />
                                    </div>
                                    <div className="project-info-bar">
                                        <div className="project-text">
                                            <h3 className="project-title">{template.title}</h3>
                                            <p className="project-prompt">{template.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DiscoverModal;
