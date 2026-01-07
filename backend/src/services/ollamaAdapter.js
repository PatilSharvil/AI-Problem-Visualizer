const { LLMAdapterInterface } = require('./llmAdapterInterface');
const fetch = require('node-fetch');

class OllamaAdapter extends LLMAdapterInterface {
  constructor(model = 'qwen2.5-coder:7b-instruct') {
    super();
    this.model = process.env.OLLAMA_MODEL || model;
    this.baseUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  }

  async callLLM(prompt) {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt: this.buildPrompt(prompt),
          stream: false,
          options: { temperature: 0.1 }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseJSON(data.response);
    } catch (error) {
      console.error('Ollama error:', error.message);
      throw error;
    }
  }

  parseJSON(text) {
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    } catch (e) {
      console.log('JSON parse failed, trying cleanup...');
    }

    try {
      let fixed = text.match(/\{[\s\S]*\}/)?.[0] || text;
      fixed = fixed.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
      return JSON.parse(fixed);
    } catch (e) {
      return this.getFallback();
    }
  }

  getFallback() {
    return {
      structures: [{ id: "arr", type: "array", label: "Data", data: [] }],
      steps: [{ title: "Error", description: "Could not parse LLM output", array: [], variables: {} }]
    };
  }

  buildPrompt(problem) {
    // Detect problem type to give focused examples
    const problemLower = problem.toLowerCase();

    let examples = '';

    // Tree operations detection
    const hasTree = problemLower.includes('tree') || problemLower.includes('bst');

    // Detect multi-operation tree queries (e.g., "insert X then remove Y then insert Z")
    const hasMultiOps = hasTree && (
      (problemLower.includes('insert') && problemLower.includes('remove')) ||
      (problemLower.includes('then') && (problemLower.includes('insert') || problemLower.includes('remove'))) ||
      (problemLower.match(/insert.*insert/i)) ||
      (problemLower.includes('following'))
    );

    if (hasMultiOps) {
      examples = this.getTreeMultiOpExample();
    } else if (problemLower.includes('preorder')) {
      examples = this.getPreorderExample();
    } else if (problemLower.includes('postorder')) {
      examples = this.getPostorderExample();
    } else if (problemLower.includes('inorder')) {
      examples = this.getInorderExample();
    } else if ((problemLower.includes('insert') || problemLower.includes('add') || problemLower.includes('create')) && hasTree) {
      examples = this.getTreeInsertExample();
    } else if ((problemLower.includes('search') || problemLower.includes('find') || problemLower.includes('present') || problemLower.includes('contains')) && hasTree) {
      examples = this.getTreeSearchExample();
    } else if (problemLower.includes('stack') || problemLower.includes('parenthes') || problemLower.includes('bracket')) {
      examples = this.getStackExample();
    } else if (problemLower.includes('queue') || problemLower.includes('bfs') || problemLower.includes('level order')) {
      examples = this.getQueueExample();
    } else if (problemLower.includes('two pointer') || problemLower.includes('pair') || (problemLower.includes('sum') && problemLower.includes('sorted'))) {
      examples = this.getTwoPointerExample();
    } else if (problemLower.includes('sliding') || problemLower.includes('window') || problemLower.includes('subarray')) {
      examples = this.getSlidingWindowExample();
    } else if (problemLower.includes('sort') || problemLower.includes('bubble') || problemLower.includes('selection')) {
      examples = this.getSortExample();
    } else if (hasTree) {
      examples = this.getInorderExample(); // Default to traversal for generic tree problems
    } else {
      examples = this.getGenericExample();
    }

    return `You are an algorithm visualization engine. You MUST generate step-by-step JSON.

${examples}

=== YOUR TASK ===
Generate visualization for: ${problem}

=== STRICT RULES - FOLLOW EXACTLY ===
1. Generate ONE STEP for EACH node/element processed (NOT just 2 steps!)
2. For traversals: if tree has 8 nodes, generate 8+ steps
3. Each step MUST have: "title", "description", "tree" (with ALL nodes), "result" (cumulative)
4. Title format MUST be "Visit X" or "Insert X" or "Remove X" where X is the value
5. Use the EXACT values from the user's problem
6. Tree array MUST stay the same size during traversal (don't shrink it)

Return ONLY valid JSON with this exact structure:
{
  "structures": [{"id": "tree", "type": "tree", "label": "BST", "data": [ALL_NODES]}],
  "steps": [
    {"title": "Visit X", "description": "...", "tree": [ALL_NODES], "result": [X]},
    {"title": "Visit Y", "description": "...", "tree": [ALL_NODES], "result": [X,Y]},
    ...one step per node...
  ]
}`;
  }

  getPreorderExample() {
    return `=== PREORDER TRAVERSAL FORMAT ===
Preorder = ROOT first, then LEFT, then RIGHT
For tree [4,2,6,1,3,5,7]: visit order is 4→2→1→3→6→5→7

CRITICAL: Generate ONE STEP PER NODE with title "Visit X" where X is the node value.

{
  "structures": [{"id": "tree", "type": "tree", "label": "BST", "data": [USER_TREE]}],
  "steps": [
    {"title": "Visit 4", "description": "Start at root", "tree": [USER_TREE], "result": [4]},
    {"title": "Visit 2", "description": "Left child of 4", "tree": [USER_TREE], "result": [4,2]},
    {"title": "Visit 1", "description": "Left child of 2", "tree": [USER_TREE], "result": [4,2,1]},
    {"title": "Visit 3", "description": "Right child of 2", "tree": [USER_TREE], "result": [4,2,1,3]},
    {"title": "Visit 6", "description": "Right child of 4", "tree": [USER_TREE], "result": [4,2,1,3,6]},
    {"title": "Visit 5", "description": "Left child of 6", "tree": [USER_TREE], "result": [4,2,1,3,6,5]},
    {"title": "Visit 7", "description": "Right child of 6", "tree": [USER_TREE], "result": [4,2,1,3,6,5,7]},
    {"title": "Traversal Complete", "description": "All nodes visited", "tree": [USER_TREE], "result": [4,2,1,3,6,5,7]}
  ]
}`;
  }

  getPostorderExample() {
    return `=== POSTORDER TRAVERSAL FORMAT ===
Postorder = LEFT first, then RIGHT, then ROOT last
For tree [4,2,6,1,3,5,7]: visit order is 1→3→2→5→7→6→4

CRITICAL: Generate ONE STEP PER NODE with title "Visit X" where X is the node value.

{
  "structures": [{"id": "tree", "type": "tree", "label": "BST", "data": [USER_TREE]}],
  "steps": [
    {"title": "Visit 1", "description": "Leftmost leaf", "tree": [USER_TREE], "result": [1]},
    {"title": "Visit 3", "description": "Right sibling of 1", "tree": [USER_TREE], "result": [1,3]},
    {"title": "Visit 2", "description": "Parent of 1,3", "tree": [USER_TREE], "result": [1,3,2]},
    {"title": "Visit 5", "description": "Left of right subtree", "tree": [USER_TREE], "result": [1,3,2,5]},
    {"title": "Visit 7", "description": "Right sibling of 5", "tree": [USER_TREE], "result": [1,3,2,5,7]},
    {"title": "Visit 6", "description": "Parent of 5,7", "tree": [USER_TREE], "result": [1,3,2,5,7,6]},
    {"title": "Visit 4", "description": "Root visited last", "tree": [USER_TREE], "result": [1,3,2,5,7,6,4]},
    {"title": "Traversal Complete", "description": "All nodes visited", "tree": [USER_TREE], "result": [1,3,2,5,7,6,4]}
  ]
}`;
  }

  getInorderExample() {
    return `=== INORDER TRAVERSAL FORMAT ===
Inorder = LEFT first, then ROOT, then RIGHT
For BST [4,2,6,1,3,5,7]: visit order is 1→2→3→4→5→6→7 (sorted!)

CRITICAL: Generate ONE STEP PER NODE with title "Visit X" where X is the node value.
Use the user's tree values, not example values!

{
  "structures": [{"id": "tree", "type": "tree", "label": "BST", "data": [USER_TREE]}],
  "steps": [
    {"title": "Visit 1", "description": "Leftmost node", "tree": [USER_TREE], "result": [1]},
    {"title": "Visit 2", "description": "Parent of 1", "tree": [USER_TREE], "result": [1,2]},
    {"title": "Visit 3", "description": "Right child of 2", "tree": [USER_TREE], "result": [1,2,3]},
    {"title": "Visit 4", "description": "Root node", "tree": [USER_TREE], "result": [1,2,3,4]},
    {"title": "Visit 5", "description": "Left of right subtree", "tree": [USER_TREE], "result": [1,2,3,4,5]},
    {"title": "Visit 6", "description": "Right subtree root", "tree": [USER_TREE], "result": [1,2,3,4,5,6]},
    {"title": "Visit 7", "description": "Rightmost node", "tree": [USER_TREE], "result": [1,2,3,4,5,6,7]},
    {"title": "Traversal Complete", "description": "All nodes visited", "tree": [USER_TREE], "result": [1,2,3,4,5,6,7]}
  ]
}`;
  }

  getTreeInsertExample() {
    return `=== BST INSERT FORMAT ===
Tree GROWS with each insert. Show tree state after each insertion.

{
  "structures": [{"id": "tree", "type": "tree", "label": "BST", "data": []}],
  "steps": [
    {"title": "Insert X", "description": "X becomes root", "tree": [X]},
    {"title": "Insert Y", "description": "Y < X, go left", "tree": [X,Y]},
    ...tree grows with each step...
  ]
}`;
  }

  getTreeSearchExample() {
    return `=== BST SEARCH FORMAT ===
Tree stays CONSTANT. Follow BST rules to find target.

BST SEARCH RULES:
- If target < current node → go LEFT
- If target > current node → go RIGHT
- If target == current node → FOUND!

Example: Search for 5 in BST [4,2,6,1,3,5,7]
- Start at 4: 5 > 4, go RIGHT
- At 6: 5 < 6, go LEFT
- At 5: Found!

{
  "structures": [{"id": "tree", "type": "tree", "label": "BST", "data": [4,2,6,1,3,5,7]}],
  "steps": [
    {"title": "Visit 4", "description": "5 > 4, go RIGHT", "tree": [4,2,6,1,3,5,7], "path": [4]},
    {"title": "Visit 6", "description": "5 < 6, go LEFT", "tree": [4,2,6,1,3,5,7], "path": [4,6]},
    {"title": "Found 5", "description": "Found target!", "tree": [4,2,6,1,3,5,7], "path": [4,6,5], "result": [5]}
  ]
}`;
  }

  getTreeMultiOpExample() {
    return `=== BST MULTI-OPERATION FORMAT ===
Given an EXISTING BST, perform operations following BST rules.

BST RULES:
- INSERT: If value < node go left, if value > node go right, insert at empty spot
- SEARCH: If value < node go left, if value > node go right
- REMOVE leaf: Just remove it
- REMOVE node with 1 child: Replace with child
- REMOVE node with 2 children: Replace with inorder successor (smallest in right subtree)

Example: BST [5,3,7,1], insert 6, remove 1

{
  "structures": [{"id": "tree", "type": "tree", "label": "BST", "data": [5,3,7,1]}],
  "steps": [
    {"title": "Initial BST", "description": "Starting tree", "tree": [5,3,7,1]},
    {"title": "Insert 6", "description": "6 > 5 (go right), 6 < 7 (insert as left of 7)", "tree": [5,3,7,1,null,6]},
    {"title": "Remove 1", "description": "Find 1: 1 < 5 (left), 1 < 3 (left). 1 is leaf, remove", "tree": [5,3,7,null,null,6]},
    {"title": "Done", "description": "All operations complete", "tree": [5,3,7,null,null,6]}
  ]
}`;
  }

  getStackExample() {
    return `=== STACK FORMAT ===
{
  "structures": [{"id": "stack", "type": "stack", "label": "Stack", "data": []}],
  "steps": [
    {"title": "Push X", "description": "Add X to stack", "stack": [X]},
    {"title": "Pop", "description": "Remove top", "stack": []}
  ]
}`;
  }

  getQueueExample() {
    return `=== QUEUE/BFS FORMAT ===
{
  "structures": [{"id": "queue", "type": "queue", "label": "Queue", "data": []}],
  "steps": [
    {"title": "Enqueue X", "description": "Add X", "queue": [X], "result": []},
    {"title": "Dequeue", "description": "Remove front", "queue": [], "result": [X]}
  ]
}`;
  }

  getTwoPointerExample() {
    return `=== TWO POINTER FORMAT ===
{
  "structures": [{"id": "arr", "type": "array", "label": "Array", "data": [USER_ARRAY_HERE]}],
  "steps": [
    {"title": "Initialize", "description": "left=0, right=N-1", "array": [VALUES], "pointers": {"left": 0, "right": N-1}, "highlight": [0, N-1]},
    {"title": "Check", "description": "Compare values", "array": [VALUES], "pointers": {"left": L, "right": R}, "highlight": [L, R]}
  ]
}`;
  }

  getSlidingWindowExample() {
    return `=== SLIDING WINDOW FORMAT ===
{
  "structures": [{"id": "arr", "type": "array", "label": "Array", "data": [USER_ARRAY_HERE]}],
  "steps": [
    {"title": "Window [0-K]", "description": "Initial window", "array": [VALUES], "highlight": [0,1,2], "variables": {"sum": X}},
    {"title": "Slide", "description": "Move window right", "array": [VALUES], "highlight": [1,2,3], "variables": {"sum": Y}}
  ]
}`;
  }

  getSortExample() {
    return `=== SORTING FORMAT ===
{
  "structures": [{"id": "arr", "type": "array", "label": "Array", "data": [USER_ARRAY_HERE]}],
  "steps": [
    {"title": "Compare", "description": "Compare A and B", "array": [VALUES], "highlight": [i, j]},
    {"title": "Swap", "description": "A > B, swap", "array": [NEW_VALUES], "highlight": [i, j]}
  ]
}`;
  }

  getGenericExample() {
    return `
=== COMPREHENSIVE ALGORITHM VISUALIZATION GUIDE ===

You are an algorithm visualization engine. Generate step-by-step JSON that shows how data structures change during algorithm execution.

CRITICAL RULES:
1. Generate ONE STEP for EACH operation/node/element processed
2. Use EXACT values from the user's problem - never use placeholder values
3. Each step MUST have: title, description, and the relevant data structure field
4. Return ONLY valid JSON - no markdown, no explanation

================================================================================
SECTION 1: ARRAY OPERATIONS
================================================================================

ARRAY FORMAT:
- Use "array" field for array data
- Use "highlight" to highlight specific indices (array of indices)
- Use "pointers" for two-pointer or sliding window (object with named pointers)
- Use "variables" for tracking values like sum, max, min, etc.

--- ARRAY SORTING EXAMPLE ---
Problem: Sort [5,3,8,1,9] using bubble sort

{
  "structures": [{"id": "arr", "type": "array", "label": "Array", "data": [5,3,8,1,9]}],
  "steps": [
    {"title": "Compare 5 and 3", "description": "5 > 3, swap", "array": [3,5,8,1,9], "highlight": [0,1]},
    {"title": "Compare 5 and 8", "description": "5 < 8, no swap", "array": [3,5,8,1,9], "highlight": [1,2]},
    {"title": "Compare 8 and 1", "description": "8 > 1, swap", "array": [3,5,1,8,9], "highlight": [2,3]},
    {"title": "Compare 8 and 9", "description": "8 < 9, no swap", "array": [3,5,1,8,9], "highlight": [3,4]},
    {"title": "Pass 1 Complete", "description": "Largest element 9 in place", "array": [3,5,1,8,9], "highlight": [4]},
    {"title": "Compare 3 and 5", "description": "3 < 5, no swap", "array": [3,5,1,8,9], "highlight": [0,1]},
    {"title": "Compare 5 and 1", "description": "5 > 1, swap", "array": [3,1,5,8,9], "highlight": [1,2]},
    {"title": "Compare 5 and 8", "description": "5 < 8, no swap", "array": [3,1,5,8,9], "highlight": [2,3]},
    {"title": "Pass 2 Complete", "description": "8 in place", "array": [3,1,5,8,9], "highlight": [3,4]},
    {"title": "Continue sorting...", "description": "Continue passes", "array": [1,3,5,8,9], "highlight": []},
    {"title": "Sorted", "description": "Array is fully sorted", "array": [1,3,5,8,9], "highlight": [], "result": [1,3,5,8,9]}
  ]
}

--- TWO POINTER EXAMPLE ---
Problem: Find pair with sum 10 in sorted [1,2,3,4,5,6,7,8]

{
  "structures": [{"id": "arr", "type": "array", "label": "Array", "data": [1,2,3,4,5,6,7,8]}],
  "steps": [
    {"title": "Initialize", "description": "left=0, right=7, sum=1+8=9", "array": [1,2,3,4,5,6,7,8], "pointers": {"left": 0, "right": 7}, "highlight": [0,7], "variables": {"sum": 9}},
    {"title": "Sum < target", "description": "9 < 10, move left right", "array": [1,2,3,4,5,6,7,8], "pointers": {"left": 1, "right": 7}, "highlight": [1,7], "variables": {"sum": 10}},
    {"title": "Found!", "description": "2 + 8 = 10", "array": [1,2,3,4,5,6,7,8], "pointers": {"left": 1, "right": 7}, "highlight": [1,7], "result": [2,8]}
  ]
}

--- SLIDING WINDOW EXAMPLE ---
Problem: Max sum of subarray of size 3 in [2,1,5,1,3,2]

{
  "structures": [{"id": "arr", "type": "array", "label": "Array", "data": [2,1,5,1,3,2]}],
  "steps": [
    {"title": "Window [0-2]", "description": "Sum = 2+1+5 = 8", "array": [2,1,5,1,3,2], "highlight": [0,1,2], "variables": {"sum": 8, "maxSum": 8}},
    {"title": "Slide to [1-3]", "description": "Remove 2, add 1. Sum = 8-2+1 = 7", "array": [2,1,5,1,3,2], "highlight": [1,2,3], "variables": {"sum": 7, "maxSum": 8}},
    {"title": "Slide to [2-4]", "description": "Remove 1, add 3. Sum = 7-1+3 = 9", "array": [2,1,5,1,3,2], "highlight": [2,3,4], "variables": {"sum": 9, "maxSum": 9}},
    {"title": "Slide to [3-5]", "description": "Remove 5, add 2. Sum = 9-5+2 = 6", "array": [2,1,5,1,3,2], "highlight": [3,4,5], "variables": {"sum": 6, "maxSum": 9}},
    {"title": "Done", "description": "Max sum is 9 for window [5,1,3]", "array": [2,1,5,1,3,2], "highlight": [2,3,4], "result": [9]}
  ]
}

--- BINARY SEARCH EXAMPLE ---
Problem: Find 7 in sorted [1,2,3,4,5,6,7,8,9]

{
  "structures": [{"id": "arr", "type": "array", "label": "Array", "data": [1,2,3,4,5,6,7,8,9]}],
  "steps": [
    {"title": "Check mid", "description": "mid=4, arr[4]=5, target=7 > 5, go right", "array": [1,2,3,4,5,6,7,8,9], "pointers": {"left": 0, "mid": 4, "right": 8}, "highlight": [4]},
    {"title": "Check mid", "description": "mid=6, arr[6]=7, target=7 == 7, Found!", "array": [1,2,3,4,5,6,7,8,9], "pointers": {"left": 5, "mid": 6, "right": 8}, "highlight": [6], "result": [6]}
  ]
}

================================================================================
SECTION 2: STACK OPERATIONS
================================================================================

STACK FORMAT:
- Use "stack" field for stack data (array where last element is top)
- Push: add to end of array
- Pop: remove from end of array

--- VALID PARENTHESES EXAMPLE ---
Problem: Check if "((()))" is valid

{
  "structures": [{"id": "stack", "type": "stack", "label": "Stack", "data": []}],
  "steps": [
    {"title": "Push (", "description": "Open bracket, push", "stack": ["("], "variables": {"char": "(", "index": 0}},
    {"title": "Push (", "description": "Open bracket, push", "stack": ["(", "("], "variables": {"char": "(", "index": 1}},
    {"title": "Push (", "description": "Open bracket, push", "stack": ["(", "(", "("], "variables": {"char": "(", "index": 2}},
    {"title": "Pop )", "description": "Close matches open, pop", "stack": ["(", "("], "variables": {"char": ")", "index": 3}},
    {"title": "Pop )", "description": "Close matches open, pop", "stack": ["("], "variables": {"char": ")", "index": 4}},
    {"title": "Pop )", "description": "Close matches open, pop", "stack": [], "variables": {"char": ")", "index": 5}},
    {"title": "Valid!", "description": "Stack empty, all brackets matched", "stack": [], "result": ["true"]}
  ]
}

--- REVERSE STRING WITH STACK ---
Problem: Reverse "hello" using stack

{
  "structures": [{"id": "stack", "type": "stack", "label": "Stack", "data": []}],
  "steps": [
    {"title": "Push h", "description": "Push to stack", "stack": ["h"]},
    {"title": "Push e", "description": "Push to stack", "stack": ["h", "e"]},
    {"title": "Push l", "description": "Push to stack", "stack": ["h", "e", "l"]},
    {"title": "Push l", "description": "Push to stack", "stack": ["h", "e", "l", "l"]},
    {"title": "Push o", "description": "Push to stack", "stack": ["h", "e", "l", "l", "o"]},
    {"title": "Pop o", "description": "Pop from stack", "stack": ["h", "e", "l", "l"], "result": ["o"]},
    {"title": "Pop l", "description": "Pop from stack", "stack": ["h", "e", "l"], "result": ["o", "l"]},
    {"title": "Pop l", "description": "Pop from stack", "stack": ["h", "e"], "result": ["o", "l", "l"]},
    {"title": "Pop e", "description": "Pop from stack", "stack": ["h"], "result": ["o", "l", "l", "e"]},
    {"title": "Pop h", "description": "Pop from stack", "stack": [], "result": ["o", "l", "l", "e", "h"]}
  ]
}

================================================================================
SECTION 3: QUEUE OPERATIONS
================================================================================

QUEUE FORMAT:
- Use "queue" field for queue data (array where first element is front)
- Enqueue: add to end of array
- Dequeue: remove from start of array

--- BFS LEVEL ORDER EXAMPLE ---
Problem: Level order traversal of tree [4,2,6,1,3,5,7]

{
  "structures": [
    {"id": "tree", "type": "tree", "label": "BST", "data": [4,2,6,1,3,5,7]},
    {"id": "queue", "type": "queue", "label": "Queue", "data": []}
  ],
  "steps": [
    {"title": "Enqueue root", "description": "Start with root 4", "tree": [4,2,6,1,3,5,7], "queue": [4], "result": []},
    {"title": "Visit 4", "description": "Dequeue 4, enqueue children 2,6", "tree": [4,2,6,1,3,5,7], "queue": [2,6], "result": [4]},
    {"title": "Visit 2", "description": "Dequeue 2, enqueue children 1,3", "tree": [4,2,6,1,3,5,7], "queue": [6,1,3], "result": [4,2]},
    {"title": "Visit 6", "description": "Dequeue 6, enqueue children 5,7", "tree": [4,2,6,1,3,5,7], "queue": [1,3,5,7], "result": [4,2,6]},
    {"title": "Visit 1", "description": "Dequeue 1, no children", "tree": [4,2,6,1,3,5,7], "queue": [3,5,7], "result": [4,2,6,1]},
    {"title": "Visit 3", "description": "Dequeue 3, no children", "tree": [4,2,6,1,3,5,7], "queue": [5,7], "result": [4,2,6,1,3]},
    {"title": "Visit 5", "description": "Dequeue 5, no children", "tree": [4,2,6,1,3,5,7], "queue": [7], "result": [4,2,6,1,3,5]},
    {"title": "Visit 7", "description": "Dequeue 7, no children", "tree": [4,2,6,1,3,5,7], "queue": [], "result": [4,2,6,1,3,5,7]}
  ]
}

================================================================================
SECTION 4: TREE OPERATIONS (BST)
================================================================================

TREE FORMAT:
- Use "tree" field for level-order array representation
- Level order: [root, left, right, left.left, left.right, right.left, right.right, ...]
- Use null for missing children
- Use "result" for traversal order or found values

BST RULES (CRITICAL):
- Left child < parent < Right child (ALWAYS!)
- INSERT: If value < node, go left; if value > node, go right; insert at empty spot
- SEARCH: If value < node, go left; if value > node, go right; if equal, found!
- REMOVE leaf: just remove
- REMOVE node with 1 child: replace with child
- REMOVE node with 2 children: replace with inorder successor (smallest in right subtree)

--- INORDER TRAVERSAL (Left-Root-Right) ---
Problem: Inorder traversal of BST [4,2,6,1,3,5,7]
Result order: 1,2,3,4,5,6,7 (sorted!)

{
  "structures": [{"id": "tree", "type": "tree", "label": "BST", "data": [4,2,6,1,3,5,7]}],
  "steps": [
    {"title": "Visit 1", "description": "Leftmost node", "tree": [4,2,6,1,3,5,7], "result": [1]},
    {"title": "Visit 2", "description": "Parent of 1", "tree": [4,2,6,1,3,5,7], "result": [1,2]},
    {"title": "Visit 3", "description": "Right of 2", "tree": [4,2,6,1,3,5,7], "result": [1,2,3]},
    {"title": "Visit 4", "description": "Root", "tree": [4,2,6,1,3,5,7], "result": [1,2,3,4]},
    {"title": "Visit 5", "description": "Left of 6", "tree": [4,2,6,1,3,5,7], "result": [1,2,3,4,5]},
    {"title": "Visit 6", "description": "Right subtree root", "tree": [4,2,6,1,3,5,7], "result": [1,2,3,4,5,6]},
    {"title": "Visit 7", "description": "Rightmost", "tree": [4,2,6,1,3,5,7], "result": [1,2,3,4,5,6,7]}
  ]
}

--- PREORDER TRAVERSAL (Root-Left-Right) ---
Result order: 4,2,1,3,6,5,7

{
  "structures": [{"id": "tree", "type": "tree", "label": "BST", "data": [4,2,6,1,3,5,7]}],
  "steps": [
    {"title": "Visit 4", "description": "Root first", "tree": [4,2,6,1,3,5,7], "result": [4]},
    {"title": "Visit 2", "description": "Left of 4", "tree": [4,2,6,1,3,5,7], "result": [4,2]},
    {"title": "Visit 1", "description": "Left of 2", "tree": [4,2,6,1,3,5,7], "result": [4,2,1]},
    {"title": "Visit 3", "description": "Right of 2", "tree": [4,2,6,1,3,5,7], "result": [4,2,1,3]},
    {"title": "Visit 6", "description": "Right of 4", "tree": [4,2,6,1,3,5,7], "result": [4,2,1,3,6]},
    {"title": "Visit 5", "description": "Left of 6", "tree": [4,2,6,1,3,5,7], "result": [4,2,1,3,6,5]},
    {"title": "Visit 7", "description": "Right of 6", "tree": [4,2,6,1,3,5,7], "result": [4,2,1,3,6,5,7]}
  ]
}

--- POSTORDER TRAVERSAL (Left-Right-Root) ---
Result order: 1,3,2,5,7,6,4

{
  "structures": [{"id": "tree", "type": "tree", "label": "BST", "data": [4,2,6,1,3,5,7]}],
  "steps": [
    {"title": "Visit 1", "description": "Leftmost leaf", "tree": [4,2,6,1,3,5,7], "result": [1]},
    {"title": "Visit 3", "description": "Right child of 2", "tree": [4,2,6,1,3,5,7], "result": [1,3]},
    {"title": "Visit 2", "description": "Parent after both children", "tree": [4,2,6,1,3,5,7], "result": [1,3,2]},
    {"title": "Visit 5", "description": "Left of 6", "tree": [4,2,6,1,3,5,7], "result": [1,3,2,5]},
    {"title": "Visit 7", "description": "Right of 6", "tree": [4,2,6,1,3,5,7], "result": [1,3,2,5,7]},
    {"title": "Visit 6", "description": "Parent after children", "tree": [4,2,6,1,3,5,7], "result": [1,3,2,5,7,6]},
    {"title": "Visit 4", "description": "Root last", "tree": [4,2,6,1,3,5,7], "result": [1,3,2,5,7,6,4]}
  ]
}

--- BST SEARCH ---
Problem: Search for 5 in BST [4,2,6,1,3,5,7]

{
  "structures": [{"id": "tree", "type": "tree", "label": "BST", "data": [4,2,6,1,3,5,7]}],
  "steps": [
    {"title": "Visit 4", "description": "5 > 4, go RIGHT", "tree": [4,2,6,1,3,5,7], "path": [4]},
    {"title": "Visit 6", "description": "5 < 6, go LEFT", "tree": [4,2,6,1,3,5,7], "path": [4,6]},
    {"title": "Found 5", "description": "Target found!", "tree": [4,2,6,1,3,5,7], "path": [4,6,5], "result": [5]}
  ]
}

--- BST INSERT ---
Problem: In BST [4,2,6,1,3], insert 5

{
  "structures": [{"id": "tree", "type": "tree", "label": "BST", "data": [4,2,6,1,3]}],
  "steps": [
    {"title": "Initial BST", "description": "Start with given tree", "tree": [4,2,6,1,3]},
    {"title": "Insert 5", "description": "5 > 4 (right), 5 < 6 (left), insert as left of 6", "tree": [4,2,6,1,3,5]}
  ]
}

--- BST REMOVE ---
Problem: In BST [4,2,6,1,3,5,7], remove 2

{
  "structures": [{"id": "tree", "type": "tree", "label": "BST", "data": [4,2,6,1,3,5,7]}],
  "steps": [
    {"title": "Initial BST", "description": "Start with given tree", "tree": [4,2,6,1,3,5,7]},
    {"title": "Found 2", "description": "2 < 4, go left. Found node to remove", "tree": [4,2,6,1,3,5,7]},
    {"title": "Remove 2", "description": "Node has 2 children. Replace with inorder successor 3", "tree": [4,3,6,1,null,5,7]}
  ]
}

--- MULTI-OPERATION EXAMPLE ---
Problem: In BST [4,2,6,1,3,5,7], insert 8 then remove 1

{
  "structures": [{"id": "tree", "type": "tree", "label": "BST", "data": [4,2,6,1,3,5,7]}],
  "steps": [
    {"title": "Initial BST", "description": "Start", "tree": [4,2,6,1,3,5,7]},
    {"title": "Insert 8", "description": "8 > 4 (right), 8 > 6 (right), 8 > 7 (right of 7)", "tree": [4,2,6,1,3,5,7,null,null,null,null,null,null,null,8]},
    {"title": "Remove 1", "description": "1 < 4 (left), 1 < 2 (left). 1 is leaf, remove", "tree": [4,2,6,null,3,5,7,null,null,null,null,null,null,null,8]},
    {"title": "Done", "description": "All operations complete", "tree": [4,2,6,null,3,5,7,null,null,null,null,null,null,null,8]}
  ]
}

================================================================================
NOW GENERATE YOUR RESPONSE
================================================================================

Use the examples above as guides. Match the data structure type in the user's problem.
Generate ONE STEP PER OPERATION with title "Visit X", "Insert X", "Remove X", "Push X", "Pop", "Compare X and Y", etc.
Use EXACT values from the problem - never use placeholder values!
Return ONLY valid JSON.`;
  }
}

module.exports = { OllamaAdapter };