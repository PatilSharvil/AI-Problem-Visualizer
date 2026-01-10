const { LLMAdapterInterface } = require('./llmAdapterInterface');
const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiAdapter extends LLMAdapterInterface {
  constructor(apiKey) {
    super();

    if (!apiKey) {
      throw new Error('API key is required for Gemini provider');
    }

    this.apiKey = apiKey;
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });
  }

  async callLLM(prompt) {
    try {
      // Use visualization-focused prompt
      const vizPrompt = this.buildVisualizationPrompt(prompt);
      const result = await this.model.generateContent(vizPrompt);
      const response = await result.response;
      const responseText = response.text();

      if (!responseText) {
        throw new Error('Gemini API did not return expected response format');
      }

      console.log('[GeminiAdapter] Raw Response:', responseText.substring(0, 500) + '...');

      // Find and parse the JSON from the response
      const jsonMatch = responseText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (!jsonMatch) {
        console.error('[GeminiAdapter] No JSON found in response');
        throw new Error('LLM did not return valid JSON format');
      }

      const cleanJson = jsonMatch[1].trim();

      try {
        return JSON.parse(cleanJson);
      } catch (parseError) {
        console.error('[GeminiAdapter] JSON Parse Error:', parseError.message);
        throw parseError;
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  }

  buildVisualizationPrompt(problem) {
    const p = problem.toLowerCase();

    // Detect data structure type from query
    const isTreeQuery = p.includes('tree') || p.includes('bst') ||
      p.includes('inorder') || p.includes('preorder') ||
      p.includes('postorder') || p.includes('level order') ||
      (p.includes('traversal') && !p.includes('array'));

    const isStackQuery = p.includes('stack') || p.includes('parenthes') ||
      p.includes('bracket') || p.includes('balanced') ||
      (p.includes('push') && p.includes('pop')) ||
      p.includes('lifo') || p.includes('reverse string') ||
      p.includes('postfix') || p.includes('infix') ||
      p.includes('expression') || p.includes('next greater');

    const isQueueQuery = p.includes('queue') || p.includes('fifo') ||
      p.includes('enqueue') || p.includes('dequeue') ||
      p.includes('bfs') || p.includes('breadth first');

    if (isTreeQuery) {
      return this.buildTreePrompt(problem);
    } else if (isStackQuery) {
      return this.buildStackPrompt(problem);
    } else if (isQueueQuery) {
      return this.buildQueuePrompt(problem);
    }
    return this.buildArrayPrompt(problem);
  }

  buildTreePrompt(problem) {
    return `You are an ALGORITHM VISUALIZATION ENGINE for TREE/BST operations.

=== STRICT OUTPUT FORMAT FOR TREES ===
{
  "structures": [
    {"id": "tree", "type": "tree", "label": "BST", "data": [LEVEL_ORDER_ARRAY]}
  ],
  "steps": [
    {
      "title": "Step Title",
      "description": "What happens",
      "tree": [CURRENT_TREE_STATE_LEVEL_ORDER],
      "highlight": [INDICES_TO_HIGHLIGHT]
    }
  ]
}

=== TREE FORMAT (LEVEL-ORDER ARRAY) ===
The tree is represented as a level-order array:
Example: [4,2,6,1,3,5,7] represents:
       4          ← index 0 (root)
      / \\
     2   6        ← indices 1, 2
    /\\ /\\
   1 3 5 7        ← indices 3, 4, 5, 6

- Root at index 0
- Left child of index i = 2*i + 1
- Right child of index i = 2*i + 2
- Use null for missing nodes

=== CRITICAL RULES ===
1. EVERY step MUST have a "tree" field with the FULL tree state
2. Use level-order array format [root, left, right, left.left, left.right, ...]
3. Use "highlight" to show which node indices are being processed
4. Generate 3-10 steps showing the algorithm execution
5. Return ONLY the JSON object

=== EXAMPLES ===

--- BST Insert Example ---
Problem: Insert 5,3,7 into BST
{
  "structures": [{"id": "tree", "type": "tree", "label": "BST", "data": []}],
  "steps": [
    {"title": "Insert 5", "description": "5 becomes root", "tree": [5], "highlight": [0]},
    {"title": "Insert 3", "description": "3 < 5, go left", "tree": [5,3], "highlight": [1]},
    {"title": "Insert 7", "description": "7 > 5, go right", "tree": [5,3,7], "highlight": [2]},
    {"title": "Complete", "description": "BST constructed", "tree": [5,3,7], "result": [5,3,7]}
  ]
}

--- Inorder Traversal Example ---
Problem: Inorder traversal of [4,2,6,1,3,5,7]
{
  "structures": [{"id": "tree", "type": "tree", "label": "BST", "data": [4,2,6,1,3,5,7]}],
  "steps": [
    {"title": "Visit 1", "description": "Leftmost node", "tree": [4,2,6,1,3,5,7], "highlight": [3], "result": [1]},
    {"title": "Visit 2", "description": "Parent of 1", "tree": [4,2,6,1,3,5,7], "highlight": [1], "result": [1,2]},
    {"title": "Visit 3", "description": "Right of 2", "tree": [4,2,6,1,3,5,7], "highlight": [4], "result": [1,2,3]},
    {"title": "Visit 4", "description": "Root", "tree": [4,2,6,1,3,5,7], "highlight": [0], "result": [1,2,3,4]},
    {"title": "Visit 5", "description": "Left of 6", "tree": [4,2,6,1,3,5,7], "highlight": [5], "result": [1,2,3,4,5]},
    {"title": "Visit 6", "description": "Right of root", "tree": [4,2,6,1,3,5,7], "highlight": [2], "result": [1,2,3,4,5,6]},
    {"title": "Visit 7", "description": "Rightmost", "tree": [4,2,6,1,3,5,7], "highlight": [6], "result": [1,2,3,4,5,6,7]}
  ]
}

--- BST Search Example ---
Problem: Search for 5 in BST [4,2,6,1,3,5,7]
{
  "structures": [{"id": "tree", "type": "tree", "label": "BST", "data": [4,2,6,1,3,5,7]}],
  "steps": [
    {"title": "Check 4", "description": "5 > 4, go right", "tree": [4,2,6,1,3,5,7], "highlight": [0]},
    {"title": "Check 6", "description": "5 < 6, go left", "tree": [4,2,6,1,3,5,7], "highlight": [2]},
    {"title": "Found 5", "description": "Target found!", "tree": [4,2,6,1,3,5,7], "highlight": [5], "result": [5]}
  ]
}

=== YOUR TASK ===
Problem: ${problem}

Generate visualization JSON with tree structure. Return ONLY the JSON object.`;
  }

  buildArrayPrompt(problem) {
    return `You are an ALGORITHM VISUALIZATION ENGINE. Your ONLY job is to generate step-by-step visualization data.

=== STRICT OUTPUT FORMAT ===
{
  "structures": [{"id": "arr", "type": "array", "label": "Array", "data": [THE_INPUT_ARRAY]}],
  "steps": [
    {"title": "Step Title", "description": "What happens", "array": [ARRAY_STATE], "pointers": {"left": 0, "right": 5}, "highlight": [INDICES]}
  ]
}

=== CRITICAL RULES ===
1. EVERY step MUST have an "array" field with the FULL array state
2. Use "pointers" for index tracking (left, right, mid, i, j)
3. Use "highlight" to show which indices are being processed
4. Generate 3-10 steps
5. Return ONLY the JSON object

=== EXAMPLES ===

--- Binary Search ---
{
  "structures": [{"id": "arr", "type": "array", "label": "Array", "data": [1,2,3,4,5,6,7]}],
  "steps": [
    {"title": "Check mid=3", "description": "arr[3]=4 < 5", "array": [1,2,3,4,5,6,7], "pointers": {"left": 0, "right": 6, "mid": 3}, "highlight": [3]},
    {"title": "Found at 4", "description": "arr[4]=5", "array": [1,2,3,4,5,6,7], "pointers": {"mid": 4}, "highlight": [4], "result": [5]}
  ]
}

--- 3Sum ---
{
  "structures": [{"id": "arr", "type": "array", "label": "Array", "data": [-4,-1,-1,0,1,2]}],
  "steps": [
    {"title": "Sort", "description": "Sort array", "array": [-4,-1,-1,0,1,2], "highlight": []},
    {"title": "Found [-1,-1,2]", "description": "-1+-1+2=0", "array": [-4,-1,-1,0,1,2], "pointers": {"i": 1, "left": 2, "right": 5}, "highlight": [1,2,5], "result": [[-1,-1,2]]}
  ]
}

=== YOUR TASK ===
Problem: ${problem}

Generate visualization JSON. Return ONLY the JSON object.`;
  }

  buildStackPrompt(problem) {
    return `You are an ALGORITHM VISUALIZATION ENGINE for STACK operations.

=== STRICT OUTPUT FORMAT FOR STACKS ===
{
  "structures": [
    {"id": "stack", "type": "stack", "label": "Stack", "data": []}
  ],
  "steps": [
    {
      "title": "Step Title",
      "description": "What happens",
      "stack": [CURRENT_STACK_STATE],
      "highlight": [INDICES_TO_HIGHLIGHT]
    }
  ]
}

=== STACK FORMAT ===
Stack array: [bottom, ..., top] - LAST element is TOP
- Push: Add to end of array (top)
- Pop: Remove from end of array (top)

=== CRITICAL RULES ===
1. EVERY step MUST have a "stack" field with the stack state
2. Use [bottom, ..., top] format - last element is TOP
3. Use "highlight" to show which elements are being processed
4. For parentheses: push opening brackets, pop on matching close
5. Generate 3-10 steps
6. Return ONLY the JSON object

=== EXAMPLES ===

--- Valid Parentheses Example ---
Problem: Check if "(())" is valid
{
  "structures": [{"id": "stack", "type": "stack", "label": "Stack", "data": []}],
  "steps": [
    {"title": "Push (", "description": "Found ( at index 0, push", "stack": ["("], "highlight": [0]},
    {"title": "Push (", "description": "Found ( at index 1, push", "stack": ["(", "("], "highlight": [1]},
    {"title": "Pop - Match", "description": "Found ) at index 2, matches top (", "stack": ["("], "highlight": [0]},
    {"title": "Pop - Match", "description": "Found ) at index 3, matches top (", "stack": [], "highlight": []},
    {"title": "Valid", "description": "Stack empty - valid!", "stack": [], "result": ["Valid"]}
  ]
}

--- Push/Pop Example ---
Problem: Push 1,2,3 then pop twice
{
  "structures": [{"id": "stack", "type": "stack", "label": "Stack", "data": []}],
  "steps": [
    {"title": "Push 1", "description": "1 is bottom and top", "stack": [1], "highlight": [0]},
    {"title": "Push 2", "description": "2 is new top", "stack": [1, 2], "highlight": [1]},
    {"title": "Push 3", "description": "3 is new top", "stack": [1, 2, 3], "highlight": [2]},
    {"title": "Pop 3", "description": "Remove top element", "stack": [1, 2], "result": [3]},
    {"title": "Pop 2", "description": "Remove top element", "stack": [1], "result": [3, 2]}
  ]
}

=== YOUR TASK ===
Problem: ${problem}

Generate visualization JSON with stack structure. Return ONLY the JSON object.`;
  }

  buildQueuePrompt(problem) {
    return `You are an ALGORITHM VISUALIZATION ENGINE for QUEUE operations.

=== STRICT OUTPUT FORMAT FOR QUEUES ===
{
  "structures": [
    {"id": "queue", "type": "queue", "label": "Queue", "data": []}
  ],
  "steps": [
    {
      "title": "Step Title",
      "description": "What happens",
      "queue": [CURRENT_QUEUE_STATE],
      "highlight": [INDICES_TO_HIGHLIGHT]
    }
  ]
}

=== QUEUE FORMAT ===
Queue array: [front, ..., rear] - FIRST element is FRONT
- Enqueue: Add to end of array (rear)
- Dequeue: Remove from start of array (front)

=== CRITICAL RULES ===
1. EVERY step MUST have a "queue" field with the queue state
2. Use [front, ..., rear] format - first element is FRONT
3. Use "highlight" to show which elements are being processed
4. For BFS: enqueue children, dequeue to visit
5. Generate 3-10 steps
6. Return ONLY the JSON object

=== EXAMPLES ===

--- Enqueue/Dequeue Example ---
Problem: Enqueue 1,2,3 then dequeue twice
{
  "structures": [{"id": "queue", "type": "queue", "label": "Queue", "data": []}],
  "steps": [
    {"title": "Enqueue 1", "description": "1 is front and rear", "queue": [1], "highlight": [0]},
    {"title": "Enqueue 2", "description": "2 is new rear", "queue": [1, 2], "highlight": [1]},
    {"title": "Enqueue 3", "description": "3 is new rear", "queue": [1, 2, 3], "highlight": [2]},
    {"title": "Dequeue 1", "description": "Remove front element", "queue": [2, 3], "result": [1]},
    {"title": "Dequeue 2", "description": "Remove front element", "queue": [3], "result": [1, 2]}
  ]
}

--- BFS Example ---
Problem: BFS on tree [4,2,6,1,3,5,7]
{
  "structures": [
    {"id": "tree", "type": "tree", "label": "BST", "data": [4,2,6,1,3,5,7]},
    {"id": "queue", "type": "queue", "label": "Queue", "data": []}
  ],
  "steps": [
    {"title": "Start", "description": "Enqueue root 4", "tree": [4,2,6,1,3,5,7], "queue": [4], "highlight": [0]},
    {"title": "Visit 4", "description": "Dequeue 4, enqueue 2,6", "tree": [4,2,6,1,3,5,7], "queue": [2,6], "result": [4]},
    {"title": "Visit 2", "description": "Dequeue 2, enqueue 1,3", "tree": [4,2,6,1,3,5,7], "queue": [6,1,3], "result": [4,2]},
    {"title": "Visit 6", "description": "Dequeue 6, enqueue 5,7", "tree": [4,2,6,1,3,5,7], "queue": [1,3,5,7], "result": [4,2,6]},
    {"title": "Complete", "description": "Visit remaining nodes", "tree": [4,2,6,1,3,5,7], "queue": [], "result": [4,2,6,1,3,5,7]}
  ]
}

=== YOUR TASK ===
Problem: ${problem}

Generate visualization JSON with queue structure. Return ONLY the JSON object.`;
  }
}

module.exports = { GeminiAdapter };
