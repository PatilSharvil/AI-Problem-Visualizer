# AI Algorithm Visualizer - System Documentation

## Current Status ✅

| Component | Status | URL |
|-----------|--------|-----|
| Backend | Running | http://localhost:5000 |
| Frontend | Running | http://localhost:5173 |
| LLM | Ollama | http://localhost:11434 |

### Supported Visualizations (MVP)

| Type | Status | Features |
|------|--------|----------|
| **Array** | ✅ Working | Swap animation, pointers (i,j,left,right), highlighting |
| **Linked List** | ✅ Working | Node boxes, swap/remove animations, pointer labels |
| **DP** | ✅ Working | 1D/2D tables, fill animation, dependency highlighting |
| **Merge (Array)** | ✅ Working | Array1, Array2, Result with pointers |
| **Merge (Linked List)** | ✅ Working | List1, List2, merged result |

---

## System Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Frontend       │     │    Backend       │     │    Ollama LLM    │
│   (React/Vite)   │────▶│   (Express.js)   │────▶│   (qwen2.5)      │
│   Port: 5173     │     │   Port: 5000     │     │   Port: 11434    │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

---

## How It Works

### 1. User Input
User types a problem like: `Merge sorted arrays [1,3,5] and [2,4,6]`

### 2. API Request
Frontend sends POST to `/api/visualize` with the problem text.

### 3. LLM Processing
**Backend → Ollama:**
- `ollamaAdapter.js` builds a prompt with examples
- LLM returns JSON with pattern, structures, and steps

**Example LLM Response:**
```json
{
  "pattern": "merge",
  "structures": [
    {"id": "arr1", "type": "array", "data": [1,3,5]},
    {"id": "arr2", "type": "array", "data": [2,4,6]},
    {"id": "result", "type": "array", "data": []}
  ],
  "steps": [
    {"title": "Compare", "array": [1,3,5], "array2": [2,4,6], "result": [1]},
    {"title": "Compare", "array": [1,3,5], "array2": [2,4,6], "result": [1,2]}
  ]
}
```

### 4. Normalization
**`visualizationNormalizer.js`:**
1. `normalize()` - Standardizes LLM output, preserves all fields
2. `toFrames()` - Converts steps to renderable frames
3. `stepToFrame()` - Creates components for each data structure

### 5. Frame Rendering
**Frontend:**
- `FrameVisualizer.jsx` receives frames
- Maps component types to React components:
  - `array` → `ArrayRow`
  - `linked_list` → `LinkedListDisplay`
  - `dp_table` → `DPTableDisplay`
  - `stack` → `StackQueueDisplay`

### 6. Animation
Each component detects changes and animates:
- **Swap**: Detects 2 elements exchanged → translateX animation
- **Remove**: Detects length decrease → fade/shrink animation
- **Fill**: Detects new value → pulse animation

---

## Key Files

### Backend
| File | Purpose |
|------|---------|
| `server.js` | Express server setup |
| `algorithmController.js` | API endpoint handler |
| `ollamaAdapter.js` | LLM prompt building and response parsing |
| `visualizationNormalizer.js` | Transforms LLM output to frames |

### Frontend
| File | Purpose |
|------|---------|
| `App.jsx` | Main app, input handling |
| `FrameVisualizer.jsx` | Frame display and navigation |
| `ArrayRow.jsx` | Array visualization component |
| `LinkedListDisplay.jsx` | Linked list visualization |
| `DPTableDisplay.jsx` | DP table visualization |
| `StackQueueDisplay.jsx` | Stack/Queue visualization |

---

## Data Flow Summary

```
User Input
    ↓
POST /api/visualize
    ↓
ollamaAdapter.callLLM(prompt)
    ↓
visualizationNormalizer.normalize()
    ↓
visualizationNormalizer.toFrames()
    ↓
JSON Response { pattern, structures, frames }
    ↓
FrameVisualizer.jsx
    ↓
Component renders (ArrayRow, LinkedListDisplay, etc.)
    ↓
Animation hooks detect changes → CSS transitions
```

---

## Running the System

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev

# Ollama must be running with model
ollama run qwen2.5-coder:7b-instruct
```

---

## Recent Fixes

1. **normalizeSteps()** - Now preserves `array2`, `result`, `list1`, `list2`, `matrix`, `dp`, etc.
2. **stepToFrame()** - Handles merge operations with correct data sources
3. **LLM Prompt** - Uses actual input values, not hardcoded examples
4. **LinkedListDisplay** - Swap and remove animations working
