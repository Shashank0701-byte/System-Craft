"use client";

import { useState } from "react";

export interface ExpandCard {
  src: string;
  alt: string;
  label?: string;
}

interface ExpandCardsProps {
  cards: ExpandCard[];
  height?: string;
}

// Placeholder SystemCraft screenshots — swap with real ones later
export const SYSTEMCRAFT_CARDS: ExpandCard[] = [
  {
    src: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80",
    alt: "Design canvas with nodes",
    label: "Canvas",
  },
  {
    src: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&auto=format&fit=crop&q=80",
    alt: "AI interviewer chat",
    label: "AI Interviewer",
  },
  {
    src: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80",
    alt: "Evaluation results dashboard",
    label: "Evaluation",
  },
  {
    src: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
    alt: "Chaos mode node failure",
    label: "Chaos Mode",
  },
  {
    src: "https://images.unsplash.com/photo-1543286386-713bdd548da4?w=800&auto=format&fit=crop&q=80",
    alt: "Analytics and progress tracking",
    label: "Analytics",
  },
];

export default function ExpandCards({ cards = SYSTEMCRAFT_CARDS, height = "22rem" }: Partial<ExpandCardsProps> & { cards?: ExpandCard[] }) {
  const [expanded, setExpanded] = useState(0);

  return (
    <div className="flex w-full items-stretch gap-2">
      {cards.map((card, i) => (
        <div
          key={i}
          onMouseEnter={() => setExpanded(i)}
          className="relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 transition-all duration-500 ease-in-out"
          style={{
            flex: expanded === i ? '0 0 40%' : '1 1 0%',
            minWidth: expanded === i ? '0' : '3rem',
            height,
          }}
        >
          {/* Image */}
          <img
            src={card.src}
            alt={card.alt}
            className="w-full h-full object-cover"
            loading="lazy"
          />

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Label — only visible when expanded */}
          <div
            className="absolute bottom-4 left-4 right-4 transition-all duration-300"
            style={{ opacity: expanded === i ? 1 : 0 }}
          >
            {card.label && (
              <span className="text-xs font-bold uppercase tracking-widest text-primary/80 block mb-1">
                Feature
              </span>
            )}
            <p className="text-sm font-semibold text-white leading-tight">{card.label}</p>
          </div>

          {/* Collapsed vertical label */}
          <div
            className="absolute inset-0 flex items-center justify-center transition-opacity duration-300"
            style={{ opacity: expanded === i ? 0 : 1 }}
          >
            <span
              className="text-[10px] font-bold uppercase tracking-widest text-white/50 whitespace-nowrap"
              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
            >
              {card.label}
            </span>
          </div>

          {/* Purple glow on active */}
          {expanded === i && (
            <div className="absolute inset-0 rounded-2xl ring-1 ring-primary/40 pointer-events-none" />
          )}
        </div>
      ))}
    </div>
  );
}
