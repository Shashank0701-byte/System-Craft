import React from 'react';
import { BlueprintGrid } from './renderers/BlueprintGrid';
import { LightingRenderer } from './renderers/LightingRenderer';
import { NoiseRenderer } from './renderers/NoiseRenderer';

export function InfrastructureEnvironment() {
  return (
    <div className="fixed inset-0 w-full h-full bg-[#020306] overflow-hidden pointer-events-none select-none z-0">
      {/* Blueprint background grid */}
      <BlueprintGrid />

      {/* Quiet Ambient Lighting */}
      <LightingRenderer />

      {/* Static Film grain and vignette overlay */}
      <NoiseRenderer />
    </div>
  );
}
export default InfrastructureEnvironment;
