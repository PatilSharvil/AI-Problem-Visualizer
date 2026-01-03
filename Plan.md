# AI Algorithm Visualizer - Implementation Plan

## Project Overview
Build a web application that takes a LeetCode-style algorithm problem (text only) and uses an LLM to identify algorithmic patterns, logical phases, and key variables, then converts those phases into visual frames rendered in a React frontend.

## Architecture Overview
```
[User Input] -> [LLM Classification] -> [Backend Validation] -> [Phase Normalization] -> [Frame Generation] -> [React Frontend]
```

## Core Components

### 1. LLM Service Layer
- **LLM Adapter Interface**: Abstraction for swapping between local (Ollama Qwen-3 8B) and production (Google Gemini API)
- **Prompt Engineering**: Structured prompts to force JSON output without free-text explanations
- **Response Validation**: Zod validation of LLM output

### 2. Backend Services
- **Problem Classifier**: Takes problem statement, calls LLM, validates output
- **Phase Normalization Engine**: Standardizes phases into consistent format
- **Frame Generation Engine**: Converts standardized phases into visualization frames
- **API Endpoints**: REST API for communication with frontend

### 3. Frontend Components
- **Input Interface**: Text area for problem statement input
- **Visualization Canvas**: Renders algorithm frames with controls
- **Controls**: Play/pause/step through visualization
- **Information Panel**: Shows identified pattern, phases, and key variables

### 4. Data Schemas
- **LLM Input Schema**: Problem statement format
- **LLM Output Schema**: Pattern, phases, key variables (JSON only)
- **Normalized Phase Schema**: Standardized phase format
- **Frame Schema**: Visualization-ready format

## Implementation Phases

### Phase 1: Foundation Setup
- Initialize Node.js + Express backend
- Initialize React frontend
- Set up project structure
- Configure dependencies

### Phase 2: LLM Integration
- Implement LLM adapter interface
- Create local Ollama adapter
- Create placeholder Gemini adapter
- Implement structured prompting

### Phase 3: Backend Logic
- Create Zod schemas for validation
- Implement Problem Classifier service
- Create Phase Normalization engine
- Create Frame Generation engine
- Set up API endpoints

### Phase 4: Frontend Development
- Build input interface
- Create visualization canvas
- Implement playback controls
- Connect to backend API

### Phase 5: Integration & Testing
- Full system integration
- End-to-end testing
- Performance optimization
- Error handling

## Technical Specifications

### Algorithm Patterns to Support (Initial Set)
- Brute Force
- Sliding Window (fixed & variable) 
- Two Pointers
- Prefix Sum
- Binary Search
- Min/Max tracking
- Frequency Map
- Greedy (basic)

### LLM Output Schema (LOCKED - FINAL)
```
{
  "pattern": string,  // One of the supported patterns: "Brute Force", "Sliding Window", "Two Pointers", "Prefix Sum", "Binary Search", "Min/Max tracking", "Frequency Map", "Greedy"
  "phases": [
    {
      "id": string,           // Unique identifier for the phase
      "description": string,  // Human-readable description of the phase
      "input_state": object,  // Semantic description of input data structures (NO execution values allowed)
      "output_state": object, // Semantic description of output data structures (NO execution values allowed)
      "actions": [string]     // Specific actions performed in this phase
    }
  ],
  "key_variables": [
    {
      "name": string,         // Name of the variable to visualize
      "description": string,  // Description of what the variable represents
      "type": "number|boolean|list|object|string"  // Data type for visualization purposes
    }
  ]
}
```

### Examples of Valid Sliding Window JSON Output:

Example 1 - Fixed Window Size:
```
{
  "pattern": "Sliding Window",
  "phases": [
    {
      "id": "initialize_window",
      "description": "Initialize the sliding window with first k elements",
      "input_state": {
        "array": "input array of numbers",
        "k": "window size"
      },
      "output_state": {
        "window": "initialized window of size k",
        "current_sum": "sum of first k elements"
      },
      "actions": ["set window boundaries", "calculate initial sum"]
    },
    {
      "id": "slide_window",
      "description": "Slide the window by one position and update sum",
      "input_state": {
        "window": "current window position",
        "next_element": "element to add to window"
      },
      "output_state": {
        "window": "slid window position",
        "current_sum": "updated sum after sliding"
      },
      "actions": ["remove leftmost element", "add rightmost element", "update sum"]
    }
  ],
  "key_variables": [
    {
      "name": "window_left",
      "description": "Left pointer of the sliding window",
      "type": "number"
    },
    {
      "name": "window_right",
      "description": "Right pointer of the sliding window",
      "type": "number"
    },
    {
      "name": "current_sum",
      "description": "Current sum of elements in the window",
      "type": "number"
    }
  ]
}
```

Example 2 - Variable Window Size:
```
{
  "pattern": "Sliding Window",
  "phases": [
    {
      "id": "initialize_pointers",
      "description": "Set up left and right pointers for variable size window",
      "input_state": {
        "array": "input array",
        "target": "target value to find"
      },
      "output_state": {
        "left": "left pointer at start",
        "right": "right pointer at start",
        "current_sum": "sum at initial position"
      },
      "actions": ["initialize pointers", "set initial values"]
    },
    {
      "id": "expand_contract_window",
      "description": "Expand or contract window based on condition",
      "input_state": {
        "current_sum": "sum of current window",
        "target": "target value"
      },
      "output_state": {
        "left": "possibly updated left pointer",
        "right": "possibly updated right pointer",
        "current_sum": "updated sum"
      },
      "actions": ["expand window if sum < target", "contract window if sum >= target"]
    }
  ],
  "key_variables": [
    {
      "name": "left",
      "description": "Left pointer of the sliding window",
      "type": "number"
    },
    {
      "name": "right",
      "description": "Right pointer of the sliding window",
      "type": "number"
    },
    {
      "name": "current_sum",
      "description": "Current sum of elements in the window",
      "type": "number"
    }
  ]
}
```

### Frame Schema
```
{
  "frame_id": string,
  "phase_id": string,
  "title": string,
  "description": string,
  "state": object,          // Current state of variables
  "visual_elements": [      // Elements to render in visualization
    {
      "type": "array|graph|tree|variable|text",
      "data": any,
      "highlighted_indices": [number],
      "position": {x: number, y: number}
    }
  ],
  "explanation": string
}
```

## Dependencies
- **Backend**:
  - express
  - zod
  - cors
  - dotenv
  - @langchain/community (for LLM abstraction)
  - node-fetch or axios
- **Frontend**:
  - react
  - react-dom
  - @types/react
  - @types/react-dom
  - axios or fetch
  - d3 or visx for visualizations

## File Structure
```
ai-algorithm-visualizer/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── schemas/
│   │   ├── middleware/
│   │   └── routes/
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── utils/
│   │   └── App.js
│   ├── public/
│   ├── package.json
│   └── index.html
├── PLAN.md
├── PROJECT_STATE.md
└── README.md
```

## Risk Mitigation
- Validate all LLM outputs before processing
- Implement fallbacks if LLM returns invalid JSON
- Ensure deterministic frame generation from normalized phases
- Set up proper error boundaries in React frontend