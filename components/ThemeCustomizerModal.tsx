
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { XIcon, PencilIcon, ChevronDownIcon, CheckIcon } from './Icons';

interface ThemeCustomizerModalProps {
    onClose: () => void;
    theme: string;
    setTheme: (theme: string) => void;
    accent: string;
    setAccent: (accent: string) => void;
    // Props no longer used but kept for interface compatibility if needed, or removed if cleaned up upstream
    font?: string;
    setFont?: (font: string) => void;
    density?: string;
    setDensity?: (density: string) => void;
    backgroundFx?: boolean;
    setBackgroundFx?: (fx: boolean) => void;
    accentColors?: any[];
}

// --- Color Utils ---

const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
};

const rgbToHsv = (r: number, g: number, b: number) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s, v = max;
    const d = max - min;
    s = max === 0 ? 0 : d / max;
    if (max === min) {
        h = 0;
    } else {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h * 360, s: s * 100, v: v * 100 };
};

const hsvToRgb = (h: number, s: number, v: number) => {
    s /= 100;
    v /= 100;
    let r = 0, g = 0, b = 0;
    const i = Math.floor(h / 60);
    const f = h / 60 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
};

const rgbToHex = (r: number, g: number, b: number) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

// TypeScript definition for EyeDropper API
declare global {
    interface Window {
        EyeDropper?: any;
    }
}

const COLOR_FORMATS = ['HEX', 'RGB', 'HSL', 'HWB', 'LCH'];

const ThemeCustomizerModal = ({
    onClose,
    theme,
    setTheme,
    accent,
    setAccent,
}: ThemeCustomizerModalProps) => {
    const [hsv, setHsv] = useState({ h: 0, s: 0, v: 100 });
    const [isDraggingSat, setIsDraggingSat] = useState(false);
    const [isDraggingHue, setIsDraggingHue] = useState(false);
    
    // Format Dropdown State
    const [currentFormat, setCurrentFormat] = useState('HEX');
    const [isFormatMenuOpen, setIsFormatMenuOpen] = useState(false);
    const formatMenuRef = useRef<HTMLDivElement>(null);

    const satBoxRef = useRef<HTMLDivElement>(null);
    const hueSliderRef = useRef<HTMLDivElement>(null);

    // Initialize HSV from current accent prop
    useEffect(() => {
        const rgb = hexToRgb(accent);
        setHsv(rgbToHsv(rgb.r, rgb.g, rgb.b));
    }, []); // Run once on mount

    // Click outside handler for format menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (formatMenuRef.current && !formatMenuRef.current.contains(event.target as Node)) {
                setIsFormatMenuOpen(false);
            }
        };
        if (isFormatMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isFormatMenuOpen]);

    // Update parent accent when HSV changes locally
    const updateAccent = (h: number, s: number, v: number) => {
        const rgb = hsvToRgb(h, s, v);
        const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
        setAccent(hex);
    };

    const handleSatChange = useCallback((e: MouseEvent | React.MouseEvent) => {
        if (!satBoxRef.current) return;
        const rect = satBoxRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        
        const newS = x * 100;
        const newV = (1 - y) * 100;
        
        setHsv(prev => {
            updateAccent(prev.h, newS, newV);
            return { ...prev, s: newS, v: newV };
        });
    }, []);

    const handleHueChange = useCallback((e: MouseEvent | React.MouseEvent) => {
        if (!hueSliderRef.current) return;
        const rect = hueSliderRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        
        const newH = x * 360;
        setHsv(prev => {
            updateAccent(newH, prev.s, prev.v);
            return { ...prev, h: newH };
        });
    }, []);

    const handleEyeDropper = async () => {
        if (!window.EyeDropper) {
            alert('Your browser does not support the EyeDropper API. Please try Chrome, Edge, or Opera.');
            return;
        }

        try {
            const eyeDropper = new window.EyeDropper();
            const result = await eyeDropper.open();
            const hex = result.sRGBHex;
            
            // Update accent
            setAccent(hex);
            
            // Sync local HSV state
            const rgb = hexToRgb(hex);
            setHsv(rgbToHsv(rgb.r, rgb.g, rgb.b));
        } catch (e) {
            console.log('EyeDropper canceled or failed', e);
        }
    };

    useEffect(() => {
        const handleUp = () => {
            setIsDraggingSat(false);
            setIsDraggingHue(false);
        };
        const handleMove = (e: MouseEvent) => {
            if (isDraggingSat) handleSatChange(e);
            if (isDraggingHue) handleHueChange(e);
        };
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('mousemove', handleMove);
        return () => {
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('mousemove', handleMove);
        };
    }, [isDraggingSat, isDraggingHue, handleSatChange, handleHueChange]);

    return (
        <div className="theme-modal-overlay" onClick={onClose}>
            <div className="theme-modal-panel custom-picker-panel" onClick={(e) => e.stopPropagation()}>
                <header className="theme-modal-header">
                    <h2>Theme Customizer</h2>
                    <button className="close-button" onClick={onClose}><XIcon /></button>
                </header>
                <div className="theme-modal-content">
                    <div className="theme-modal-section">
                        <h3>Mode</h3>
                        <div className="theme-toggle-capsule">
                            <button className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')}>Dark</button>
                            <button className={theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')}>Light</button>
                        </div>
                    </div>

                    {/* Custom Color Picker */}
                    <div className="color-picker-container">
                        {/* Saturation/Value Box */}
                        <div 
                            className="sat-val-box" 
                            ref={satBoxRef}
                            onMouseDown={(e) => { setIsDraggingSat(true); handleSatChange(e); }}
                            style={{ backgroundColor: `hsl(${hsv.h}, 100%, 50%)` }}
                        >
                            <div className="sat-val-overlay-white"></div>
                            <div className="sat-val-overlay-black"></div>
                            <div 
                                className="picker-thumb"
                                style={{ 
                                    left: `${hsv.s}%`, 
                                    top: `${100 - hsv.v}%`,
                                    backgroundColor: accent 
                                }}
                            ></div>
                        </div>

                        {/* Hue Slider */}
                        <div className="hue-slider-row">
                            <div 
                                className="hue-slider-container"
                                ref={hueSliderRef}
                                onMouseDown={(e) => { setIsDraggingHue(true); handleHueChange(e); }}
                            >
                                <div 
                                    className="hue-thumb"
                                    style={{ left: `${(hsv.h / 360) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Hex Display */}
                        <div className="color-values-row">
                            <div className="color-field-group">
                                <label>Value</label>
                                <div className="value-display-box">
                                    {accent}
                                </div>
                            </div>
                        </div>

                        <div className="color-values-row">
                            <div className="color-field-group">
                                <label>Format</label>
                                <div className="format-row">
                                    <div className="format-select-wrapper" ref={formatMenuRef}>
                                        <div 
                                            className={`format-select ${isFormatMenuOpen ? 'active' : ''}`}
                                            onClick={() => setIsFormatMenuOpen(!isFormatMenuOpen)}
                                        >
                                            {currentFormat} 
                                            <span style={{fontSize: '10px', marginLeft: 'auto'}}>
                                                <ChevronDownIcon />
                                            </span>
                                        </div>
                                        
                                        {isFormatMenuOpen && (
                                            <div className="format-dropdown-menu">
                                                {COLOR_FORMATS.map(fmt => (
                                                    <div 
                                                        key={fmt} 
                                                        className={`format-dropdown-item ${currentFormat === fmt ? 'selected' : ''}`}
                                                        onClick={() => {
                                                            setCurrentFormat(fmt);
                                                            setIsFormatMenuOpen(false);
                                                        }}
                                                    >
                                                        {fmt}
                                                        {currentFormat === fmt && <CheckIcon />}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <button 
                                        className="format-edit-btn" 
                                        onClick={handleEyeDropper}
                                        title="Pick color from screen"
                                    >
                                        <PencilIcon />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThemeCustomizerModal;
