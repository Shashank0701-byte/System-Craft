# AGENTS.md

# SystemCraft AI Development Guide

## Mission

You are contributing to **SystemCraft**, an AI-powered platform for practicing System Design interviews.

This is **not** a generic SaaS product.

It is an interactive learning experience where users build distributed systems, simulate failures, optimize architectures, and receive AI-powered interview feedback.

Every design decision should reinforce this mission.

---

# Core Philosophy

The website should feel like a premium product experience—not a landing page.

A visitor should immediately think:

> "This feels like I'm interacting with a real distributed system."

Never create layouts that resemble common Tailwind templates.

Avoid repetitive feature cards, oversized gradients, or excessive glassmorphism.

The design should communicate engineering excellence through clarity, motion, and purposeful interactions.

---

# Brand Personality

SystemCraft is:

* Intelligent
* Technical
* Premium
* Futuristic
* Calm
* Minimal
* Confident

It is **not**:

* Playful
* Cartoonish
* Overly flashy
* Corporate
* Generic
* Template-like

---

# Design Inspiration

Draw inspiration from the design quality of:

* Apple
* Linear
* Vercel
* Stripe
* Arc Browser
* Figma

Do **not** copy layouts.

Instead, understand their principles:

* Exceptional typography
* Generous whitespace
* Clear hierarchy
* Purposeful motion
* Minimal interfaces
* Premium interactions

---

# Visual Language

Use:

* Deep near-black backgrounds
* Subtle gradients
* Noise textures
* Soft volumetric lighting
* Carefully controlled glows
* Thin borders
* Layered depth
* Large typography
* Clean spacing

Avoid:

* Bright neon everywhere
* Heavy glassmorphism
* Thick borders
* Random gradients
* Overdesigned cards

Every section should breathe.

Whitespace is a design element.

---

# Motion Philosophy

Animation is communication.

Never animate simply because it looks cool.

Every animation must represent a state change.

Examples:

* Requests moving through services
* Cache hits
* Database overload
* Autoscaling
* Traffic rerouting
* Node failures
* Recovery
* Health changes
* Queue growth
* Latency spikes

Motion should explain distributed systems visually.

---

# Storytelling

The homepage should tell a narrative.

Instead of independent sections, create a journey.

Example flow:

Hero

↓

Understanding System Design

↓

Building Architecture

↓

Traffic Simulation

↓

Chaos & Failures

↓

AI Interview

↓

Performance Analysis

↓

Become Interview Ready

Each section should naturally transition into the next.

---

# Hero Section

Avoid the standard:

Text on the left.

Image on the right.

Instead:

The hero should itself become a distributed system.

Possible sequence:

* Network grid fades in.
* Nodes appear.
* Connections draw.
* Requests begin flowing.
* Cache introduced.
* Latency decreases.
* Database overloads.
* Autoscaler launches.
* System stabilizes.
* Headline appears.

The animation should explain why SystemCraft exists.

---

# Interactions

Every interaction should provide feedback.

Hover:

* Soft lift
* Increased shadow
* Glow
* Slight rotation where appropriate

Click:

* Compression
* Ripple
* Responsive feedback

Loading:

* Skeletons
* Progress
* Smooth transitions

Success:

* Confident confirmation

Failure:

* Clear but elegant indication

Avoid exaggerated animations.

---

# Scroll Experience

Scrolling should reveal information progressively.

Use:

* Parallax
* Sticky sections
* SVG path drawing
* Architecture assembly
* Traffic movement
* Progressive reveals

Avoid:

* Everything animating simultaneously
* Long fade-ins
* Distracting effects

Guide the user's attention.

---

# Components

Build reusable components.

Examples:

* Architecture nodes
* Connection lines
* Traffic packets
* Metric cards
* Dashboard widgets
* Status indicators
* Timeline
* Interview panels
* AI response cards

Maintain a consistent visual language.

---

# Typography

Typography should carry the interface.

Use:

* Large headings
* Minimal body text
* Excellent spacing
* Strong hierarchy
* Comfortable reading widths

Avoid paragraphs longer than four lines.

---

# Color Palette

Primary:

* Electric Indigo

Secondary:

* Royal Purple

Accent:

* Cyan

Background:

* Near Black

Text:

* Soft White

Status:

* Emerald
* Amber
* Crimson

Use color sparingly to draw attention.

---

# Technical Stack

Framework:

* Next.js App Router
* TypeScript

Styling:

* Tailwind CSS
* CSS Variables

Animation:

* Framer Motion
* GSAP ScrollTrigger (only for storytelling sections)

Scrolling:

* Lenis

Graphics:

* SVG
* Canvas when appropriate
* React Three Fiber only if it provides meaningful value

---

# Performance

Maintain smooth performance.

Target:

* 60 FPS
* GPU-friendly transforms
* Lazy loading
* Minimal JavaScript
* Optimized assets

Respect prefers-reduced-motion.

Accessibility is required.

---

# Code Quality

Produce production-quality code.

Follow these principles:

* Reusable components
* Clean abstractions
* Semantic HTML
* Accessible interactions
* Responsive layouts
* Type-safe implementation
* Maintainable architecture

Avoid unnecessary complexity.

---

# Before Every Change

Ask yourself:

Does this improve the user's understanding of distributed systems?

Does this interaction have purpose?

Would this feel at home on a premium product website?

Does this maintain consistency with the existing design language?

If the answer is "no", redesign it.

---

# Definition of Success

The goal is **not** to build another beautiful landing page.

The goal is to create an experience that makes engineers immediately think:

> "I've never seen a system design platform presented like this."

Every layout, animation, transition, interaction, and component should contribute toward that goal.
