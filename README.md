# 🏗️ SystemCraft

**Master System Design Interviews with AI-Powered Feedback.**

SystemCraft is a high-fidelity system design interview simulator. It combines an interactive architectural canvas with a sophisticated AI engine to evaluate your designs against real-world constraints, providing deep insights into trade-offs, scalability, and structural integrity.

---

## 🌟 Key Features

- **Interactive Design Canvas**: A powerful, intuitive workspace to build complex system architectures using industry-standard sub-components (LBs, Servers, Databases, etc.).
- **Real-time AI Interviewer**: Engage in simulated interview sessions where an AI evaluator monitors your progress and asks clarifying questions.
- **Architectural Linter**: Automatic detection of structural issues (e.g., disconnected load balancers, single points of failure).
- **Deep Qualitative Evaluation**: Powered by **Google Gemini**, the system analyzes your reasoning and provides a score (0-100) along with specific strengths, weaknesses, and suggestions.
- **Session Management**: Track your interview history and architectural improvements over time.

---

## 🛠️ Tech Stack

- **Frontend**: [Next.js 15](https://nextjs.org/) (App Router), React 19, Tailwind CSS 4.
- **Backend**: Next.js API Routes (Serverless).
- **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas/database) with Mongoose ODM.
- **Authentication**: [Firebase Auth](https://firebase.google.com/) (Google & GitHub).
- **AI Engine**: [Google Gemini](https://ai.google.dev/) (via OpenRouter/Google AI SDK).
- **Deployment**: [Vercel](https://vercel.com/).

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 20+ installed.
- A MongoDB Atlas cluster.
- A Firebase project with Authentication enabled.
- An OpenRouter API key or Google AI Studio key.

### 2. Installation
```bash
git clone https://github.com/Shashank0701-byte/System-Craft
cd System-Craft
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory (refer to `.env.example`):
```env
MONGODB_URL=your_mongodb_connection_string
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
# ... see .env.example for full list
```

### 4. Running Locally
```bash
npm run dev
```

---

## 🛡️ Evaluation Engine

SystemCraft uses a hybrid evaluation strategy:
1. **Structural Analysis**: Deterministic rules that check for physical connectivity and best practices in the canvas nodes.
2. **Reasoning Analysis**: An LLM-based evaluator that examines the "Why" behind your choices, focusing on scale and trade-offs.

---

## 📄 License
This project is private property of **Vertex Club**. All rights reserved.

---

## 🤝 Contributing
For internal members: Please create a feature branch before opening a Pull Request. Propose major changes via the System-Craft Discord channel first.
