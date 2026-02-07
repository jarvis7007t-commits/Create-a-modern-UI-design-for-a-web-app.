/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { TEMPLATES } from '../constants';

interface TemplateDiscoveryProps {
  onSelectTemplate: (prompt: string) => void;
  onViewAll: () => void;
}

const TemplateDiscovery: React.FC<TemplateDiscoveryProps> = ({ onSelectTemplate, onViewAll }) => {
  return (
    <div className="template-discovery-container">
      <div className="template-header">
        <div>
          <h2>Discover what's possible</h2>
          <p>Get started with one of our inspirational templates.</p>
        </div>
        <a href="#" className="view-all-link" onClick={(e) => { e.preventDefault(); onViewAll(); }}>View all</a>
      </div>
      <div className="projects-grid">
        {TEMPLATES.map((template) => (
          <div
            key={template.id}
            className="project-card-item"
            onClick={() => onSelectTemplate(template.prompt)}
          >
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
    </div>
  );
};

export default TemplateDiscovery;
