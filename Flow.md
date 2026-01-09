# AI Algorithm Visualizer - Project Flow

## Step 1: User Input Processing
- User enters an algorithm problem statement (e.g., "Binary search for 5 in [1,3,6,9,11]")
- Frontend sends the problem statement to the backend API endpoint `/api/classify`
- Input validation occurs to ensure the problem statement is not empty

## Step 2: LLM Query & Response Generation
- Backend calls the configured LLM service (Ollama/Gemini) with structured prompts
- LLM analyzes the problem and generates a JSON response containing:
  - Data structures involved
  - Algorithm steps with titles and descriptions
  - State changes for each step
  - Highlighted elements for visualization

## Step 3: Executor Validation & Correction
- System checks if LLM output matches the query intent using pattern matching
- If LLM output is valid, minimal corrections are applied to preserve original intent
- If LLM output appears invalid, deterministic executors validate and correct:
  - Array bounds checking
  - Tree structure validation
  - Pointer positioning
  - Data consistency

## Step 4: Structure Normalization
- Universal Normalizer converts LLM output to standardized frame format
- Determines appropriate structure types (array, tree, stack, queue, etc.)
- Converts raw data to entity-action based visualization frames
- Applies query-based type overrides when needed (e.g., tree queries to array for binary search)

## Step 5: Frame Generation
- System creates visualization frames from normalized data
- Each frame contains:
  - Entity states (current data structures)
  - Actions to perform (highlight, swap, insert, etc.)
  - Variable values and metadata
  - Positioning information for rendering

## Step 6: Frontend Rendering
- Frames are sent back to the frontend
- VisualCanvas component renders entities (arrays, trees, stacks, etc.)
- AnimationEngine applies smooth transitions between frames
- Interactive controls allow playback, stepping, and navigation

## Step 7: User Interaction & Visualization
- User views step-by-step algorithm visualization
- Can play/pause, step forward/backward through the algorithm
- Sees real-time updates of data structures and algorithm progress
- Receives educational insights through visual representation of algorithm execution