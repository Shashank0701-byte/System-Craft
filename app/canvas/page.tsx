'use client';

import { useState } from 'react';
import { CanvasHeader } from '@/components/canvas/CanvasHeader';
import { ComponentPalette } from '@/components/canvas/ComponentPalette';
import { DesignCanvas } from '@/components/canvas/DesignCanvas';
import { PropertiesPanel } from '@/components/canvas/PropertiesPanel';
import { AIFeedbackPanel } from '@/components/canvas/AIFeedbackPanel';

export default function CanvasPage() {
  const [showAIPanel, setShowAIPanel] = useState(false);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display">
      <CanvasHeader onRunAIReview={() => setShowAIPanel(true)} />
      <div className="flex flex-1 overflow-hidden">
        <ComponentPalette />
        <DesignCanvas />
        {showAIPanel ? (
          <AIFeedbackPanel onClose={() => setShowAIPanel(false)} />
        ) : (
          <PropertiesPanel />
        )}
      </div>
    </div>
  );
}
