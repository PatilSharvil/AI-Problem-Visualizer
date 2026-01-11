<div align = 'center'>
  <h1>VishvaRoop</h1>
</div>

<div align="center">


![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge) ![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js) ![React](https://img.shields.io/badge/React-18+-blue?style=for-the-badge&logo=react) ![AI Powered](https://img.shields.io/badge/AI-Powered-purple?style=for-the-badge&logo=openai)

</div>

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

## 📚 Supported Algorithms & Data Structures

### 📊 Data Structures
- **Arrays** - Linear data structure with indexing support
- **Binary Search Trees (BST)** - Hierarchical structure with ordered nodes
- **Stacks** - LIFO (Last In, First Out) operations
- **Queues** - FIFO (First In, First Out) operations

### 🧮 Algorithms
- **Sorting Algorithms**: Bubble Sort, Selection Sort, Insertion Sort, Quick Sort, Merge Sort
- **Searching Algorithms**: Binary Search, Linear Search
- **Tree Traversals**: Inorder, Preorder, Postorder, Level-order (BFS)
- **Tree Operations**: Insert, Remove, Search in BST
- **Stack Operations**: Push, Pop, Peek, Valid Parentheses
- **Queue Operations**: Enqueue, Dequeue, BFS Traversal
- **Array Algorithms**: Two Sum, Three Sum, Sliding Window, Two Pointer Problems
- **Dynamic Programming**: Work In Progress! 🚧
- **Graph Algorithms**: Work In Progress! 🚧

## 🌐 API Documentation

### 🔌 Backend Endpoints

#### `POST /api/classify`
Classifies an algorithm problem and generates visualization frames.

**Request Body:**
```json
{
  "problemStatement": "string"
}
```

**Response:**
```json
{
  "structures": [
    {
      "id": "string",
      "type": "string",
      "label": "string",
      "data": "array"
    }
  ],
  "frames": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "entities": [
        {
          "id": "string",
          "type": "string",
          "data": "array",
          "meta": "object"
        }
      ],
      "actions": [
        {
          "type": "string",
          "target": "string",
          "indices": "array",
          "value": "any"
        }
      ],
      "variables": "object"
    }
  ],
  "intent": {
    "domain": "string",
    "algorithm": "string",
    "source": "string"
  }
}
```

#### `GET /health`
Health check endpoint to verify server status.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "ISO date string"
}
```





  



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

# Enable/disable executors (default: true)
ENABLE_EXECUTORS=true

# Local model flag (set to true if using Ollama)
LOCAL_MODEL=false
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

## 🛠️ Development Setup

### 🧪 Running Tests
Currently, the project doesn't have automated tests set up, but we recommend manual testing of new features.

### 🧹 Linting & Formatting
The project follows standard JavaScript/React formatting conventions. Use your IDE's formatter for consistency.

### 🚀 Environment Variables Explained

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Backend server port | Yes |
| `LLM_PROVIDER` | AI provider ('gemini' or 'ollama') | Yes |
| `GEMINI_API_KEY` | Google Gemini API key (if using gemini) | Conditional |
| `OLLAMA_URL` | Ollama server URL | Conditional |
| `OLLAMA_MODEL` | Ollama model name | Conditional |
| `LOCAL_MODEL` | Flag to enable local model mode | No (defaults to false) |
| `ENABLE_EXECUTORS` | Enable deterministic fallback executors | No (defaults to true) |

### 🛠️ Debugging Tips

1. **Enable detailed logging**: Add `console.log` statements in the backend controllers to trace the flow
2. **Check network tab**: Monitor API requests in browser DevTools to see request/response details
3. **Verify data format**: Ensure the backend is returning properly formatted frames that the frontend expects
4. **Test with simple problems**: Start with basic problems like "binary search for 5 in [1,2,3,4,5,6,7]" to verify functionality

## 📋 Example Problems

Try these sample problems to see the visualizations in action:

### 🔍 Searching Algorithms
- `"Binary search for 5 in [1,2,3,4,5,6,7]"`
- `"Linear search for 3 in [10,20,30,40,5,50]"`

### 🧮 Sorting Algorithms
- `"Sort array [64,34,25,12,22,11,90] using bubble sort"`
- `"Sort [5,2,4,6,1,3] using insertion sort"`

### 🌳 Tree Operations
- `"Insert 4,2,6,1,3,5,7 into BST and then search for 5"`
- `"Inorder traversal of BST [4,2,6,1,3,5,7]"`
- `"Preorder traversal of BST [4,2,6,1,3,5,7]"`

### 📦 Stack Operations
- `"Validate parentheses in string '()[]{}'"`
- `"Reverse string 'hello' using stack"`

### 📥 Queue Operations
- `"Level order traversal of BST [4,2,6,1,3,5,7]"`

## 📊 Performance Considerations

- **Response Times**: API calls typically take 2-5 seconds depending on the complexity of the problem and the selected AI provider
- **Rate Limits**: When using cloud providers, be aware of API rate limits
- **Local Models**: Ollama provides faster response times but requires more local resources
- **Complexity**: More complex algorithms with many steps will generate more frames and take longer to process

## 🤝 Contributing

We welcome contributions to VishvaRoop! Here's how you can help:

### 🛠️ Development Guidelines
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request


## ❓ Frequently Asked Questions (FAQ)

### Q: What types of algorithm problems does VishvaRoop support?
A: Currently, VishvaRoop supports problems involving Arrays, Binary Search Trees, Stacks, and Queues. This includes sorting, searching, traversal, and basic operations on these data structures.

### Q: Can I use VishvaRoop without an internet connection?
A: Yes! By configuring the system to use Ollama with a local LLM, you can run VishvaRoop completely offline.

### Q: How accurate are the visualizations?
A: VishvaRoop uses a combination of AI and deterministic executors to ensure accuracy. The system has fallback mechanisms to maintain correctness even when AI output is imperfect.

### Q: Is my problem statement sent to external servers?
A: If you use cloud providers like Google Gemini, your problem statement is sent to their servers. For complete privacy, use the local Ollama option.

### Q: Can I extend VishvaRoop to support new data structures?
A: Absolutely! The entity-action architecture is designed to be extensible. You can add new visualization components and corresponding executors.

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

## 🚧 Known Limitations

- **Limited Data Structures**: Currently supports only Arrays, BSTs, Stacks, and Queues
- **AI Dependency**: Quality of visualizations depends on AI model's understanding
- **Complex Problem Parsing**: Very complex or ambiguous problem statements may not be interpreted correctly
- **Performance**: Complex algorithms may take longer to generate visualizations
- **Language Support**: Optimized for English problem statements

## 🔮 Future Enhancements
- 📈 Expanded Graph algorithms (Dijkstra, Bellman-Ford, etc).
- 🏗️ Expanded Data structures (Linked List, Graph, Matrix, etc).
- 🧩 Expanded Algorithms (Sorting, Searching, Graph Traversal, etc).
- 🤖 Betterment in deterministic engine.
- 📱 Mobile-responsive improvements
- 🎨 Customizable visualization themes
- 📤 Export visualizations as images/videos
- 🌐 Multi-language support for problem statements


```
“The future of engineering belongs to those who help others understand.”
```
