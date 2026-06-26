# BACKGROUND_DESIGN.md

# SystemCraft Background Design Guidelines

## Philosophy

The background should never feel like a flat color.

It should feel like the user is inside a living distributed system.

The background should create atmosphere without competing with the content.

The best compliment should be:

> "I didn't notice the background, but the whole website feels premium."

Every effect should be subtle.

---

# Layer 01 — Base Background

Use a very dark base.

Avoid pure black.

Recommended:

```css
#07070D
#090B12
#0A0D14
```

The page should feel deep rather than empty.

---

# Layer 02 — Ambient Lighting

Every major section should have its own radial light source.

Never use a single page-wide gradient.

Hero

* Indigo
* Purple

Timeline

* Emerald
* Cyan

Features

* Blue
* Cyan

CTA

* Purple
* Indigo

The lights should be huge.

Opacity:

5–10%

Blur:

Very high.

The lighting should blend naturally into neighboring sections.

---

# Layer 03 — Noise Texture

Add an extremely subtle noise overlay.

Purpose:

* Break flat gradients
* Add texture
* Improve perceived quality

Opacity:

2–3%

Blend Mode:

Overlay or Soft Light

The user should barely notice it.

---

# Layer 04 — Engineering Grid

Since SystemCraft teaches distributed systems, use a faint engineering grid.

Characteristics:

* Thin lines
* Low opacity
* Large spacing
* Fade toward screen edges

Opacity:

2–4%

The grid should exist behind every section.

Never distract from content.

---

# Layer 05 — Floating Particles

Add small floating particles.

Do NOT create a galaxy.

The particles should resemble:

* Dust
* Tiny stars
* Digital noise

Behavior:

* Extremely slow movement
* Random drift
* Small size variation
* Low opacity

No explosions.

No flashy movement.

---

# Layer 06 — Cursor Lighting

The mouse should subtly illuminate nearby areas.

Implementation:

A large radial gradient follows the cursor.

Characteristics:

* Large radius
* Soft edges
* Very low opacity
* Smooth interpolation

The cursor itself should remain unchanged.

The light should create atmosphere rather than draw attention.

---

# Layer 07 — Section Lighting

Each section should have a unique environmental glow.

Example:

Hero

Purple

↓

Timeline

Green

↓

Features

Cyan

↓

CTA

Purple

Transitions should happen gradually while scrolling.

Never use hard separators.

---

# Layer 08 — Architecture Blueprint

Hide distributed system architecture within the background.

Examples:

Client

↓

Load Balancer

↓

API

↓

Cache

↓

Queue

↓

Database

↓

Replica

Render using:

* SVG
* 1–3% opacity
* Thin strokes

The user should discover them naturally.

---

# Layer 09 — Moving Gradients

Use slow moving gradients.

Animation duration:

30–60 seconds

Movement:

* Translate
* Rotate
* Scale

Avoid:

* Blob animations
* Fast movement
* Constant pulsing

Motion should feel atmospheric.

---

# Layer 10 — Glow Behind Components

Cards should softly illuminate their surroundings.

Instead of:

Card

Use:

Soft radial glow

↓

Card

Glow opacity should remain low.

No harsh shadows.

---

# Layer 11 — Data Flow

Occasionally animate tiny packets travelling through hidden SVG paths.

Packets should represent:

* Requests
* Responses
* Queue messages

Movement:

* Smooth
* Continuous
* Very subtle

Do not overload the page.

---

# Layer 12 — Background Depth

Create multiple depth planes.

Far Layer

* Noise
* Stars

Middle Layer

* Grid
* Blueprints

Near Layer

* Lights
* Particles

Foreground

* Components

This separation creates depth.

---

# Layer 13 — Scroll Atmosphere

The atmosphere should evolve while scrolling.

Hero

Deep Purple

↓

Timeline

Emerald

↓

Simulation

Cyan

↓

Interview

Blue

↓

CTA

Purple

The user should feel like they're moving through different environments.

---

# Layer 14 — Breathing Motion

Nothing should remain perfectly static.

Examples:

* Background gradients drift slowly.
* Particles float.
* Nodes pulse gently.
* Lights breathe.
* Blueprint opacity changes slightly.

Everything should move just enough to feel alive.

---

# Layer 15 — Interactive Response

Background elements should respond subtly to user interaction.

Hovering important sections may:

* Brighten nearby lighting
* Activate blueprint lines
* Increase particle activity
* Illuminate nearby nodes

The response should always remain restrained.

---

# Performance Requirements

Maintain:

* 60 FPS
* GPU accelerated transforms
* CSS transforms instead of layout changes
* Lazy-loaded effects
* Optimized SVGs
* RequestAnimationFrame for continuous animation

Respect:

prefers-reduced-motion

Accessibility should never be compromised.

---

# Design Rules

Always ask:

Does this effect improve immersion?

Does it reinforce distributed systems?

Would removing it make the page feel less alive?

If the answer is "no", remove it.

---

# Never Do These

❌ Giant animated blobs

❌ Neon overload

❌ Heavy glass everywhere

❌ Random particles

❌ Fast animations

❌ Constant pulsing

❌ Distracting effects

❌ Backgrounds brighter than content

❌ Excessive shadows

❌ Generic Tailwind gradients

---

# Success Criteria

The background should feel:

* Deep
* Technical
* Premium
* Calm
* Intelligent
* Atmospheric
* Alive

The user should feel like they are inside an operating distributed system rather than looking at a traditional website.

The background should support the content—not compete with it.

The best background is one the user barely notices, yet immediately misses if it is removed.
