# AI Algorithm Visualizer (VishvaRoop) - System Architecture

## High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        FE[Frontend<br/>React + Vite<br/>Tailwind CSS + Anime.js]
        U[User<br/>Browser]
    end
    
    subgraph "Server Layer"
        BE[Backend<br/>Node.js + Express]
        subgraph "Backend Services"
            LS[LLM Service]
            AK[API Key Manager]
            ON[Universal Normalizer]
            EX[Executors]
            SC[Schema Validation<br/>Zod]
        end
    end
    
    subgraph "LLM Layer"
        OM[Ollama<br/>qwen2.5-coder:7b-instruct]
        CG[Cloud Providers<br/>Gemini, OpenAI,<br/>DeepSeek, etc.]
    end
    
    subgraph "Data Layer"
        DT[Data Structures<br/>Arrays, Trees, Stacks,<br/>Queues, etc.]
    end
    
    U --> FE
    FE --> BE
    BE --> LS
    LS --> OM
    LS --> CG
    LS --> AK
    BE --> ON
    BE --> EX
    BE --> SC
    ON --> DT
    EX --> DT
    DT --> BE
    BE --> FE
    FE --> U
```

## Component Architecture

### Frontend Architecture
```mermaid
graph TD
    APP[App.jsx<br/>Router]
    --> LP[LandingPage.jsx]
    --> VP[VisualizerPage.jsx]
    --> AP[AboutPage.jsx]
    
    VP --> PI[ProblemInput.jsx]
    VP --> FV[FrameVisualizer.jsx]
    
    FV --> VC[VisualCanvas.jsx]
    FV --> IP[InfoPanel.jsx]
    
    VC --> AE[ArrayEntity.jsx]
    VC --> TE[TreeEntity.jsx]
    VC --> SE[StackEntity.jsx]
    VC --> QE[QueueEntity.jsx]
    VC --> LE[LinkedListEntity.jsx]
    VC --> DE[DPTableEntity.jsx]
    VC --> ME[MatrixEntity.jsx]
    
    subgraph "Utilities"
        AE1[AnimationEngine.js]
        AE2[CSS Styles]
    end
```

### Backend Architecture
```mermaid
graph LR
    SR[Server.js<br/>Express + CORS]
    
    subgraph "Routes"
        AR[algorithmRoutes.js]
    end
    
    subgraph "Controllers"
        AC[algorithmController.js]
    end
    
    subgraph "Services"
        LS[LLMService.js]
        OM[OllamaAdapter.js]
        GM[GeminiAdapter.js]
        DM[DeepSeekAdapter.js]
        ON[UniversalNormalizer.js]
        EX[Executors.js]
        AK[ApiKeyManager.js]
    end
    
    subgraph "Schemas"
        SC[llmOutputSchema.js]
    end
    
    SR --> AR
    AR --> AC
    AC --> LS
    AC --> ON
    AC --> EX
    AC --> SC
    LS --> OM
    LS --> GM
    LS --> DM
    LS --> AK
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Vercel (Frontend)"
        VF[Vercel Edge Network]
        WE[Web Interface<br/>React App]
        CD[CDN<br/>Static Assets]
    end
    
    subgraph "Render (Backend)"
        RB[Render Infrastructure]
        AP[API Server<br/>Node.js]
        LG[Logging & Monitoring]
    end
    
    subgraph "External Services"
        OL[Ollama Server<br/>Local/Remote]
        CP[Cloud LLM APIs<br/>Gemini, OpenAI, etc.]
    end
    
    subgraph "User Environment"
        US[User Browser]
    end
    
    US --> VF
    VF --> AP
    AP --> OL
    AP --> CP
    VF --> CD
    RB --> LG
```

## Data Flow Architecture

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant BE as Backend
    participant LLM as LLM Service
    participant AD as LLM Adapter
    participant NV as Normalizer & Validators
    participant EX as Executors
    participant FE2 as Frontend (Receive)
    participant VC as Visual Canvas
    
    U->>FE: Enter problem statement
    FE->>BE: POST /api/classify
    BE->>LLM: Call LLM Service
    alt LOCAL_MODEL = true
        LLM->>AD: Use OllamaAdapter
        AD->>OL: Call Ollama API
        OL-->>AD: JSON Response
    else LOCAL_MODEL = false
        LLM->>AD: Use Cloud Adapter
        AD->>CL: Call Cloud API
        CL-->>AD: JSON Response
    end
    AD-->>LLM: Parsed JSON
    LLM-->>BE: LLM Response
    BE->>NV: Validate & Normalize
    alt Validation Fails
        BE->>EX: Run Executors Fallback
    end
    BE->>FE2: Return Frames
    FE2->>VC: Render Visualization
    VC->>U: Display Interactive Visualization
```

## Key Architecture Principles

### 1. **Modular Design**
- Separation of concerns between frontend and backend
- Independent service modules for different functionalities
- Pluggable LLM adapters for easy provider switching

### 2. **Resilience & Fallbacks**
- Multiple fallback layers (LLM → Executors → Mock Data)
- Deterministic algorithms for reliable visualizations
- Graceful degradation when LLM output is imperfect

### 3. **Scalability**
- Stateless API design
- Environment-based configuration
- Horizontal scaling support for cloud deployment

### 4. **Extensibility**
- Entity-Action architecture for new data structures
- Plugin system for new LLM providers
- Modular visualization components

### 5. **Security**
- Environment variable-based configuration
- API key rotation and management
- Input validation and sanitization

## Technology Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Animations**: Anime.js
- **Icons**: Lucide React
- **Routing**: React Router DOM

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Validation**: Zod
- **HTTP Client**: node-fetch
- **AI Integration**: Google Generative AI, Ollama

### LLM Providers
- **Local**: Ollama with qwen2.5-coder:7b-instruct
- **Cloud**: Gemini, OpenAI, DeepSeek, Groq, Together AI

### Deployment
- **Frontend**: Vercel
- **Backend**: Render
- **CDN**: Vercel Edge Network