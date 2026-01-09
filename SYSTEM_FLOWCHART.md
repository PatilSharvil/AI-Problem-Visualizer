# AI Algorithm Visualizer (VishvaRoop) - System Flowchart

```mermaid
flowchart TD
    A[User Input: Algorithm Problem] --> B{LOCAL_MODEL Flag}
    
    B -->|true| C[Use Ollama Adapter]
    B -->|false| D[Use Cloud API Key Manager]
    
    C --> E[Call Ollama API with qwen2.5-coder:7b-instruct]
    D --> F[Select Cloud Provider & API Key]
    F --> G[Call Cloud LLM API]
    
    E --> H[Parse LLM JSON Response]
    G --> H
    
    H --> I[Validate LLM Output with Zod Schema]
    I --> J{Validation Success?}
    
    J -->|No| K[Run Deterministic Executors Fallback]
    J -->|Yes| L[Universal Normalizer]
    K --> L
    
    L --> M[Convert to Entity-Action Frames]
    M --> N[Backend Returns Frames to Frontend]
    
    N --> O[Frontend Receives Frames]
    O --> P[Visual Canvas Renders Entities]
    
    P --> Q{User Controls}
    Q --> R[Play/Pause]
    Q --> S[Step Forward/Back]
    Q --> T[Speed Adjustment]
    
    R --> U[Animate Next Frame]
    S --> V[Show Specific Frame]
    T --> W[Adjust Animation Speed]
    
    U --> P
    V --> P
    W --> P
    
    subgraph "Backend Services"
        C1[OllamaAdapter]
        D1[APIKeyManager]
        L1[LLMService]
        N1[UniversalNormalizer]
        E1[Executors]
    end
    
    subgraph "Frontend Components"
        F1[VisualCanvas]
        F2[FrameVisualizer]
        F3[Entity Components]
        F4[AnimationEngine]
    end
    
    C1 --> L1
    D1 --> L1
    L1 --> N1
    N1 --> E1
    F1 --> F2
    F3 --> F1
    F4 --> F1
```

## Detailed Flow Description:

1. **User Input**: User enters an algorithm problem statement (e.g., "Sort array using bubble sort")

2. **Model Selection**: System checks `LOCAL_MODEL` environment variable:
   - If `true`: Uses Ollama with `qwen2.5-coder:7b-instruct` model
   - If `false`: Uses cloud providers with API key rotation

3. **LLM Processing**: 
   - Local: Calls Ollama API directly
   - Cloud: Selects provider based on availability and calls appropriate API

4. **Response Processing**:
   - Validates LLM output against Zod schema
   - If validation fails, runs deterministic executors as fallback
   - Normalizes output to entity-action format

5. **Frame Generation**: Converts normalized data to visualization frames with entities and actions

6. **Frontend Rendering**: 
   - Receives frames from backend
   - Visual Canvas renders appropriate entity components
   - Animation engine handles transitions

7. **User Interaction**: Play/pause, step controls, and speed adjustment allow user to control visualization

The system is designed to be resilient with fallback mechanisms ensuring visualization even when LLM output is imperfect.