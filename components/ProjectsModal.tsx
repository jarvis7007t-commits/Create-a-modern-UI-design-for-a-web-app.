/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { SavedArtifact } from '../types';
import { SearchIcon, XIcon, TrashIcon, BookmarkIcon } from './Icons';

interface ProjectsModalProps {
    isOpen: boolean;
    onClose: () => void;
    artifacts: SavedArtifact[];
    onSelect: (artifact: SavedArtifact) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
}

const ProjectsModal = ({ isOpen, onClose, artifacts, onSelect, onDelete }: ProjectsModalProps) => {
    const [searchQuery, setSearchQuery] = useState('');

    if (!isOpen) return null;

    const filteredProjects = artifacts.filter(a =>
        (a.styleName && a.styleName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (a.prompt && a.prompt.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="projects-modal-overlay" onClick={onClose}>
            <div className="projects-modal-content" onClick={e => e.stopPropagation()}>
                <div className="projects-modal-header">
                    <div className="modal-left-section">
                        <div className="search-bar-wrapper">
                            <SearchIcon />
                            <input
                                type="text"
                                placeholder={"Search your projects..."}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="project-count-badge">
                            {filteredProjects.length} items
                        </div>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>
                        <XIcon />
                    </button>
                </div>

                <div className="projects-grid-container">
                    {artifacts.length === 0 ? (
                        <div className="empty-projects-state">
                            <div className="empty-icon-circle">
                                <BookmarkIcon />
                            </div>
                            <h3>No Projects Yet</h3>
                            <p>Save your favorite designs to access them here anytime.</p>
                        </div>
                    ) : filteredProjects.length === 0 ? (
                        <div className="empty-projects-state">
                            <p>No matching projects found for "{searchQuery}"</p>
                        </div>
                    ) : (
                        <div className="projects-grid">
                            {filteredProjects.map(art => (
                                <div key={art.id} className="project-card-item" onClick={() => onSelect(art)}>
                                    <div className="project-preview-window">
                                        <iframe srcDoc={art.html} title={art.styleName} sandbox="allow-scripts" />
                                    </div>
                                    <div className="project-info-bar">
                                        <div className="project-text">
                                            <h3 className="project-title">{art.styleName || 'Untitled Project'}</h3>
                                            <p className="project-prompt">{art.prompt}</p>
                                            <p className="project-date">{new Date(art.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                        </div>
                                        <button className="delete-project-btn" onClick={(e) => onDelete(art.id, e)} title="Delete Project">
                                            <TrashIcon />
                                        </button>
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

export default ProjectsModal;
