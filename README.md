# AI Algorithm Visualizer

A universal algorithm visualization system that can visualize any algorithm pattern using AI-powered step generation.

## 🎯 Features

- **14 Algorithm Patterns** - Sliding Window, Two Pointers, Binary Search, Stack, Queue, Hashmap, and more
- **AI-Powered** - Uses Ollama LLM to generate step-by-step visualizations
- **Multi-Phase Support** - Complex problems using multiple patterns
- **Interactive UI** - Play/Pause, Next/Previous, Keyboard controls

## 📊 Supported Patterns

| # | Pattern | Status | Visual Component |
|---|---------|--------|------------------|
| 1 | Sliding Window | ✅ Ready | ArrayRow + Window |
| 2 | Two Pointers | ✅ Ready | ArrayRow + L/R |
| 3 | Fast/Slow Pointers | ✅ Ready | ArrayRow + Slow/Fast |
| 4 | Binary Search | ✅ Ready | ArrayRow + L/M/R |
| 5 | Cyclic Sort | ✅ Ready | ArrayRow + Swap |
| 6 | Linked List Reversal | ✅ Ready | ArrayRow |
| 7 | Tree BFS | ⏳ Pending | Needs TreeDisplay |
| 8 | Tree DFS | ⏳ Pending | Needs TreeDisplay |
| 9 | Two Heaps | ✅ Ready | HeapDisplay |
| 10 | Subsets | ✅ Ready | SubsetsDisplay |
| 11 | Top K Elements | ✅ Ready | HeapDisplay |
| 12 | K-way Merge | ✅ Ready | ArrayRow + Heap |
| 13 | Merge Intervals | ⏳ Pending | Needs IntervalDisplay |
| 14 | Topological Sort | ⏳ Pending | Needs GraphDisplay |
| 15 | Hashmap | ✅ Ready | HashMapDisplay |
| 16 | Stack/Queue | ✅ Ready | StackQueueDisplay |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Ollama running locally with a model (e.g., `qwen2.5-coder:7b-instruct`)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd "AI Algorithm visualizer"

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Running

```bash
# Terminal 1: Start backend
cd backend
node server.js

# Terminal 2: Start frontend
cd frontend
npm run dev
```

Open http://localhost:5173

## 🎮 Usage

1. Enter an algorithm problem in the input box
2. Click "Visualize"
3. Use controls to navigate through steps:
   - **←** Previous step
   - **→** Next step
   - **Space** Play/Pause

### Example Problems

```
# Sliding Window
Given array nums = [2,1,5,1,3,2] and k=3, find the maximum sum of any contiguous subarray of size k

# Two Pointers
Given array heights = [1,8,6,2,5,4,8,3,7], find the maximum area of water container

# Binary Search
Given sorted array [1,3,5,7,9,11,13], find the index of target value 7

# Stack
Given string '([]){}'', determine if the parentheses are valid

# Hashmap
Given nums = [2,7,11,15] and target 9, find two numbers that add up to target
```

## 📁 Project Structure

```
AI Algorithm visualizer/
├── backend/
│   ├── server.js
│   └── src/
│       ├── controllers/
│       │   └── algorithmController.js
│       ├── services/
│       │   ├── ollamaAdapter.js
│       │   ├── llmService.js
│       │   └── visualizationNormalizer.js
│       └── schemas/
│           └── llmOutputSchema.js
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── components/
│   │       ├── ArrayRow.jsx
│   │       ├── FrameVisualizer.jsx
│   │       ├── HashMapDisplay.jsx
│   │       ├── HeapDisplay.jsx
│   │       ├── ProblemInput.jsx
│   │       ├── StackQueueDisplay.jsx
│   │       ├── SubsetsDisplay.jsx
│   │       └── VariablePanel.jsx
│   └── index.html
└── README.md
```

## ⚙️ Configuration

Environment variables (create `.env` in backend/):

```
LLM_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5-coder:7b-instruct
PORT=5000
```

## 🔮 Roadmap

- [ ] TreeDisplay for BFS/DFS visualization
- [ ] GraphDisplay for Topological Sort
- [ ] IntervalDisplay for Merge Intervals
- [ ] LinkedListDisplay with arrow animations
- [ ] Export visualization as video/GIF

## 📝 License

MIT
