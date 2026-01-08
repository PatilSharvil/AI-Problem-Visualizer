# VishvaRoop 
### Universal AI-Powered Algorithm Visualizer

> **Visualize any algorithm problem instantly using the power of Generative AI. 🪄✨**

VishvaRoop is a next-generation education tool that transforms static algorithm problems into dynamic, step-by-step visualizations. By combining Large Language Models (Gemini/Ollama) with a robust "Entity-Action" architecture, it understands complex problem statements and renders semantic animations. 🎬

---

## 🚀 Key Features

- 🌐 **Universal Visualization**: Currently supports 4 data structures: **Arrays**, **Stacks**, **Queues**, and **BST**. We are actively working on adding more!
- 🧠 **AI-Driven Core**: Leverages **Google Gemini** ✨ and **Ollama** 🦙 to parse problems and generate deterministic execution steps.
- 🏗️ **Entity-Action Architecture**: A novel approach that normalizes LLM output into verifiable actions (Create, Select, Move, Highlight) for consistent rendering.
- 🛡️ **Adaptive Fallbacks**: Built-in deterministic executors ensure visualization continuity even if the AI output is imperfect.
- ⏯️ **Interactive Playback**: Full control with **Play/Pause**, **Step Forward/Back**.
- 📚 **Rich Data Structures**: Visualizes **Arrays**, **Binary Trees**, **Stacks**, **Queues** (MVP Phase).
- 🎨 **Modern UI**: A sleek, dark-themed experience built with **React** and **Tailwind CSS**.

## 🛠️ Tech Stack

### 🖥️ Frontend
- **Framework**: [React](https://react.dev/) ⚛️ + [Vite](https://vitejs.dev/) ⚡
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) 💨
- **Animations**: [Anime.js](https://animejs.com/) 🎥
- **Icons**: [Lucide React](https://lucide.dev/) 🖌️
- **State/Networking**: Axios 📡

### ⚙️ Backend
- **Runtime**: [Node.js](https://nodejs.org/) 🟢 & [Express](https://expressjs.com/) 🚂
- **AI Integration**: 
    - **Google Gemini** (Cloud) ✨
    - **Ollama** (Local LLM) 🦙
- **Architecture**: Service-Controller pattern with Custom Normalizers 📐

## 🔄 Architecture & Flow

1. ⌨️ **Input**: User inputs a problem statement (e.g., *"Find the maximum subarray sum"*).
2. 🔍 **Analysis**: The **LLM Service** (Gemini/Ollama) analyzes the problem type and generates a logical plan.
3. 📏 **Normalization**: The **Universal Normalizer** converts raw AI output into a strictly structured JSON of Entities and Actions.
4. ⚙️ **Execution**: The **Executor Engine** runs the logic (with deterministic fallbacks).
5. 🎨 **Rendering**: The Frontend **VisualCanvas** interprets the frames and manages state transitions using Anime.js.

## 🏃‍♂️ How to Run Locally

### 📋 Prerequisites
- **Node.js** (v18 or higher) 🟢
- **npm** or **yarn** 📦
- (Optional) [Ollama](https://ollama.ai/) 🦙 installed locally for offline AI support.

### 📥 Installation

1. **Clone the repository** 👯
   ```bash
   git clone https://github.com/PatilSharvil/AI-Problem-Visualizer.git
   cd AI-Problem-Visualizer
   ```

2. **Install Backend Dependencies** 🛠️
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies** 💅
   ```bash
   cd ../frontend
   npm install
   ```

### ⚙️ Configuration

Create a `.env` file in the `backend/` directory:

```env
# Server Port
PORT=5000

# AI Provider Configuration (Choose 'gemini' or 'ollama')
LLM_PROVIDER=gemini

# If using Gemini ✨
GEMINI_API_KEY=your_gemini_api_key_here

# If using Ollama 🦙
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5-coder:7b-instruct
```

### 🏁 Start the Application

**Backend:** 🔌
```bash
cd backend
npm run dev
# Server running on http://localhost:5000
```

**Frontend:** 🖥️
```bash
cd frontend
npm run dev
# App running on http://localhost:5173
```

## 📂 Folder Structure

```
VishvaRoop/
├── backend/ ⚙️
│   ├── src/
│   │   ├── controllers/      # Request handlers 🕹️
│   │   ├── services/         # LLM Adapter, Executors, Normalizer 🧠
│   │   ├── schemas/          # Validation schemas 🛡️
│   │   └── routes/           # API Endpoints 🛣️
│   └── server.js             # Entry point 🚪
│
├── frontend/ 🎨
│   ├── src/
│   │   ├── components/
│   │   │   ├── entities/     # Visualizers (Array, Tree, Graph...) 📊
│   │   │   └── ...
│   │   ├── pages/            # Landing, VisualizerPage 📄
│   │   └── App.jsx
│   └── index.html
└── README.md
```

## 🔮 Future Enhancements
- 📈 Expanded Graph algorithms (Dijkstra, Bellman-Ford, etc).
- 🏗️ Expanded Data structures (Linked List, Graph, Matrix, etc).
- 🧩 Expanded Algorithms (Sorting, Searching, Graph Traversal, etc).
- 🤖 Betterment in deterministic engine.

## 📝 License
MIT License. 📜
