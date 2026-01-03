# PROJECT_STATE.md

## Project: AI Algorithm Visualizer

### Date: January 2, 2026

### Current Status: Implementation Phase - Sliding Window MVP Complete

### Implemented Components:

1. **Project Planning**
   - Created detailed implementation plan in `PLAN.md`

2. **Backend Structure**
   - Initialized backend directory with proper subdirectories:
     - `controllers/`
     - `services/`
     - `schemas/`
     - `middleware/`
     - `routes/`
   - Created `server.js` with basic Express setup
   - Created `algorithmRoutes.js` for API endpoints
   - Created `package.json` with dependencies

3. **Frontend Structure**
   - Initialized frontend directory with proper subdirectories:
     - `components/`
     - `services/`
     - `utils/`
   - Created `package.json` with React dependencies
   - Created Vite configuration with backend proxy
   - Created basic HTML template and React entry point

4. **LLM Integration**
   - Created `LLMAdapterInterface` as abstract base class
   - Implemented `OllamaAdapter` for local development with Qwen-3 8B
   - Implemented `GeminiAdapter` placeholder for production use
   - Created `LLMService` that uses configured adapter (default: ollama)

5. **Data Validation**
   - Created Zod schema (`llmOutputSchema.js`) for validating LLM output
   - Schema enforces algorithm patterns: Brute Force, Sliding Window, Two Pointers, Prefix Sum, Binary Search, Min/Max tracking, Frequency Map, Greedy

6. **Backend Services**
   - Created `PhaseNormalizationEngine` to standardize LLM output phases
   - Created `SlidingWindowFrameGenerator` for pattern-specific frame generation
   - Updated `FrameGenerationEngine` to use pattern-specific generators
   - Created `algorithmController.js` with validation and processing pipeline

7. **API Implementation**
   - `/api/classify` endpoint that processes problem statements
   - Complete validation pipeline: LLM output → Schema validation → Pattern-specific frame generation

8. **Frontend Components**
   - Created `App.jsx` main application component
   - Created `ProblemInput.jsx` for user problem input
   - Created `FrameVisualizer.jsx` for displaying algorithm frames
   - Added basic styling in `App.css`

### File Paths Added/Changed in This Session:
- `PLAN.md` - Updated with locked LLM JSON contract and examples
- `backend/src/schemas/llmOutputSchema.js` - Added stricter contract documentation
- `backend/src/services/slidingWindowFrameGenerator.js` - New pattern-specific frame generator
- `backend/src/services/frameGenerationEngine.js` - Updated to use pattern-specific generators
- `backend/src/controllers/algorithmController.js` - Updated to pass full LLM output to frame generator
- `backend/server.js` - Added health check endpoint and environment logging
- `backend/.env` - Added environment configuration
- `frontend/src/App.jsx` - Main application component with state management
- `frontend/src/components/ProblemInput.jsx` - Component for problem statement input
- `frontend/src/components/FrameVisualizer.jsx` - Component for visualizing algorithm frames
- `frontend/src/App.css` - Basic styling for the application

### Pending TODOs:
1. Add detailed algorithm-specific visualization logic for other patterns
2. Implement more sophisticated visual representations (arrays, pointers, etc.)
3. Add unit tests for backend services
4. Implement additional visualization controls (play/pause with timer)
5. Add more comprehensive error handling
6. Extend to support additional algorithm patterns beyond Sliding Window

### Architectural Decisions:
1. **Adapter Pattern**: Used for LLM integration to allow easy switching between local (Ollama) and cloud (Gemini) providers
2. **Schema Validation**: Strict Zod validation enforces the exact JSON structure from LLMs
3. **Deterministic Processing**: Backend processes LLM output deterministically through normalization and frame generation engines
4. **Separation of Concerns**: Clear separation between LLM service, validation, normalization, and frame generation
5. **Environment-based Configuration**: LLM provider can be switched via environment variables
6. **Locked LLM Contract**: JSON contract is now finalized and locked with specific constraints to prevent execution data in semantic fields
7. **Pattern-Specific Generators**: Each algorithm pattern has its own frame generator for specialized visualization

### LLM JSON Contract (LOCKED):
The LLM output schema has been finalized with strict constraints:
- `pattern`: Enum limited to supported algorithm patterns
- `phases`: Array of semantic phase descriptions without execution values
- `key_variables`: List of variables to visualize with their types
- NO execution data allowed in input_state/output_state fields
- Contract includes specific examples for sliding window pattern

### MVP Status - Sliding Window Pattern:
- [x] LLM correctly identifies sliding window problems
- [x] JSON output contract is locked and validated
- [x] Sliding window-specific frame generation implemented
- [x] Frontend visualization interface created
- [x] End-to-end flow working for sliding window pattern
- [x] Error handling for unsupported patterns implemented