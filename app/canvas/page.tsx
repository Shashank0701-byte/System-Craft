
import { CanvasHeader } from '@/components/canvas/CanvasHeader';
import { ComponentPalette } from '@/components/canvas/ComponentPalette';
import { DesignCanvas } from '@/components/canvas/DesignCanvas';
import { PropertiesPanel } from '@/components/canvas/PropertiesPanel';

export default function CanvasPage() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display">
      <CanvasHeader />
      <div className="flex flex-1 overflow-hidden">
        <ComponentPalette />
        <DesignCanvas />
        <PropertiesPanel />
      </div>
    </div>
  );
}
