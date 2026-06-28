import React from 'react';
import { motion } from 'framer-motion';

export function LightingRenderer() {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden mix-blend-screen z-[1]">
      {/* Slow, ambient breathing color fields */}
      <motion.div
        animate={{ opacity: [0.55, 1.0, 0.55] }}
        transition={{
          duration: 16,
          ease: 'easeInOut',
          repeat: Infinity
        }}
        className="absolute inset-0 w-full h-full"
        style={{
          background: `
            radial-gradient(55vw at 20% 25%, rgba(99, 102, 241, 0.03) 0%, transparent 100%),
            radial-gradient(45vw at 80% 75%, rgba(6, 182, 212, 0.02) 0%, transparent 100%)
          `
        }}
      />
    </div>
  );
}
export default LightingRenderer;
