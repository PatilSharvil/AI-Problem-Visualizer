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

    // Detect tree property queries (height, depth, width, min, max, validate)
    const hasTreeProperty = hasTree && (
      problemLower.includes('height') ||
      problemLower.includes('depth') ||
      problemLower.includes('width') ||
      problemLower.includes('diameter') ||
      problemLower.includes('minimum') ||
      problemLower.includes('maximum') ||
      problemLower.includes('min ') ||
      problemLower.includes('max ') ||
      problemLower.includes('validate') ||
      problemLower.includes('valid') ||
      problemLower.includes('count') ||
      problemLower.includes('balanced')
    );

    // FIRST: Check for explicit binary search (array algorithm)
    if (problemLower.includes('binary search')) {
      examples = this.getArrayComprehensiveExample();
    } else if (hasMultiOps) {
      examples = this.getTreeComprehensiveExample(); // Use comprehensive for multi-ops
    } else if (hasTreeProperty) {
      examples = this.getTreeComprehensiveExample(); // Use comprehensive for property queries
    } else if (problemLower.includes('preorder')) {
      examples = this.getPreorderExample();
    } else if (problemLower.includes('postorder')) {
      examples = this.getPostorderExample();
    } else if (problemLower.includes('inorder')) {
      examples = this.getInorderExample();
    } else if ((problemLower.includes('insert') || problemLower.includes('add') || problemLower.includes('create')) && hasTree) {
      examples = this.getTreeComprehensiveExample(); // Use comprehensive for insert
    } else if (problemLower.includes('binary search') || (problemLower.includes('search') && problemLower.includes('[') && !hasTree)) {
      // Binary search on arrays - detect BEFORE tree search
      examples = this.getArrayComprehensiveExample();
    } else if ((problemLower.includes('search') || problemLower.includes('find') || problemLower.includes('present') || problemLower.includes('contains')) && hasTree) {
      examples = this.getTreeSearchExample();
    } else if ((problemLower.includes('delete') || problemLower.includes('remove')) && hasTree) {
      examples = this.getTreeComprehensiveExample(); // Use comprehensive for delete
    } else if (problemLower.includes('stack') || problemLower.includes('parenthes') || problemLower.includes('bracket') ||
      problemLower.includes('push') || problemLower.includes('pop') || problemLower.includes('lifo') ||
      problemLower.includes('last in') || problemLower.includes('reverse') && !problemLower.includes('array') ||
      problemLower.includes('expression') || problemLower.includes('postfix') || problemLower.includes('infix') ||
      problemLower.includes('undo') || problemLower.includes('next greater') || problemLower.includes('valid')) {
      examples = this.getStackExample();
    } else if (problemLower.includes('queue') || problemLower.includes('bfs') || problemLower.includes('level order') ||
      problemLower.includes('enqueue') || problemLower.includes('dequeue') || problemLower.includes('fifo') ||
      problemLower.includes('breadth first') || problemLower.includes('ticket') || problemLower.includes('schedule') ||
      problemLower.includes('round robin') || problemLower.includes('process') && problemLower.includes('order')) {
      examples = this.getQueueExample();
    } else if (problemLower.includes('two pointer') || problemLower.includes('pair') || (problemLower.includes('sum') && problemLower.includes('sorted'))) {
      examples = this.getTwoPointerExample();
    } else if (problemLower.includes('sliding') || problemLower.includes('window') || problemLower.includes('subarray') ||
      problemLower.includes('max sum') || problemLower.includes('min sum')) {
      examples = this.getSlidingWindowExample();
    } else if (problemLower.includes('sort') || problemLower.includes('bubble') || problemLower.includes('selection') ||
      problemLower.includes('quick') || problemLower.includes('merge') || problemLower.includes('partition') ||
      problemLower.includes('pivot')) {
      examples = this.getSortExample();
    } else if (problemLower.includes('binary search') || problemLower.includes('search') && problemLower.includes('sorted') ||
      problemLower.includes('find') && problemLower.includes('[')) {
      examples = this.getArrayComprehensiveExample();
    } else if (hasTree) {
      examples = this.getTreeComprehensiveExample(); // Use comprehensive for generic tree
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

  getTreeComprehensiveExample() {
    return `
=== COMPREHENSIVE BST VISUALIZATION GUIDE ===

LEVEL-ORDER ARRAY FORMAT (CRITICAL):
BST [4,2,6,1,3,5,7] represents:
         4           ← index 0 (root)
       /   \\
      2     6        ← indices 1, 2
     / \\   / \\
    1   3 5   7      ← indices 3, 4, 5, 6

ARRAY INDEXING:
- Root at index 0
- Left child of node at index i is at index (2*i + 1)
- Right child of node at index i is at index (2*i + 2)
- Use null for missing children

BST RULES (MUST FOLLOW):
1. LEFT < PARENT < RIGHT (always!)
2. INSERT: value < node → go LEFT, value > node → go RIGHT
3. SEARCH: value < node → go LEFT, value > node → go RIGHT
4. REMOVE leaf: just remove (set to null)
5. REMOVE 1-child: replace with that child
6. REMOVE 2-children: replace with INORDER SUCCESSOR (smallest in right subtree)

================================================================================
TRAVERSAL EXAMPLES
================================================================================

--- INORDER (Left, Root, Right) → Sorted output ---
BST [4,2,6,1,3,5,7] → Result: 1,2,3,4,5,6,7

{
  "structures": [{"id": "tree", "type": "tree", "label": "BST", "data": [4,2,6,1,3,5,7]}],
  "steps": [
    {"title": "Visit 1", "description": "Leftmost node first", "tree": [4,2,6,1,3,5,7], "result": [1]},
    {"title": "Visit 2", "description": "Parent of 1", "tree": [4,2,6,1,3,5,7], "result": [1,2]},
    {"title": "Visit 3", "description": "Right child of 2", "tree": [4,2,6,1,3,5,7], "result": [1,2,3]},
    {"title": "Visit 4", "description": "Root", "tree": [4,2,6,1,3,5,7], "result": [1,2,3,4]},
    {"title": "Visit 5", "description": "Left of 6", "tree": [4,2,6,1,3,5,7], "result": [1,2,3,4,5]},
    {"title": "Visit 6", "description": "Right subtree root", "tree": [4,2,6,1,3,5,7], "result": [1,2,3,4,5,6]},
    {"title": "Visit 7", "description": "Rightmost", "tree": [4,2,6,1,3,5,7], "result": [1,2,3,4,5,6,7]}
  ]
}

--- PREORDER (Root, Left, Right) ---
Result: 4,2,1,3,6,5,7

{
  "structures": [{"id": "tree", "type": "tree", "label": "BST", "data": [4,2,6,1,3,5,7]}],
  "steps": [
    {"title": "Visit 4", "description": "Root first", "tree": [4,2,6,1,3,5,7], "result": [4]},
    {"title": "Visit 2", "description": "Left of root", "tree": [4,2,6,1,3,5,7], "result": [4,2]},
    {"title": "Visit 1", "description": "Left of 2", "tree": [4,2,6,1,3,5,7], "result": [4,2,1]},
    {"title": "Visit 3", "description": "Right of 2", "tree": [4,2,6,1,3,5,7], "result": [4,2,1,3]},
    {"title": "Visit 6", "description": "Right of root", "tree": [4,2,6,1,3,5,7], "result": [4,2,1,3,6]},
    {"title": "Visit 5", "description": "Left of 6", "tree": [4,2,6,1,3,5,7], "result": [4,2,1,3,6,5]},
    {"title": "Visit 7", "description": "Right of 6", "tree": [4,2,6,1,3,5,7], "result": [4,2,1,3,6,5,7]}
  ]
}

================================================================================
INSERT EXAMPLES
================================================================================

--- Single Insert ---
Insert 8 into BST [4,2,6,1,3,5,7]:
Path: 8 > 4 (right), 8 > 6 (right), 8 > 7 (right of 7)

{
  "structures": [{"id": "tree", "type": "tree", "label": "BST", "data": [4,2,6,1,3,5,7]}],
  "steps": [
    {"title": "Initial BST", "description": "Given tree", "tree": [4,2,6,1,3,5,7]},
    {"title": "Insert 8", "description": "8 > 4 (right), 8 > 6 (right), 8 > 7 (right of 7)", "tree": [4,2,6,1,3,5,7,null,null,null,null,null,null,null,8]}
  ]
}

--- Insert 0 (leftmost) ---
Insert 0 into BST [4,2,6,1,3,5,7]:
Path: 0 < 4 (left), 0 < 2 (left), 0 < 1 (left of 1)

{
  "structures": [{"id": "tree", "type": "tree", "label": "BST", "data": [4,2,6,1,3,5,7]}],
  "steps": [
    {"title": "Initial BST", "description": "Given tree", "tree": [4,2,6,1,3,5,7]},
    {"title": "Insert 0", "description": "0 < 4 (left), 0 < 2 (left), 0 < 1 (left of 1)", "tree": [4,2,6,1,3,5,7,0]}
  ]
}

================================================================================
REMOVE EXAMPLES
================================================================================

--- Remove Leaf Node (node 1) ---
{
  "structures": [{"id": "tree", "type": "tree", "label": "BST", "data": [4,2,6,1,3,5,7]}],
  "steps": [
    {"title": "Initial BST", "description": "Given tree", "tree": [4,2,6,1,3,5,7]},
    {"title": "Remove 1", "description": "1 < 4 (left), 1 < 2 (left). 1 is leaf, remove", "tree": [4,2,6,null,3,5,7]}
  ]
}

--- Remove Node with 2 Children (node 2) ---
Inorder successor of 2 is 3 (smallest in right subtree of 2)
{
  "structures": [{"id": "tree", "type": "tree", "label": "BST", "data": [4,2,6,1,3,5,7]}],
  "steps": [
    {"title": "Initial BST", "description": "Given tree", "tree": [4,2,6,1,3,5,7]},
    {"title": "Find 2", "description": "2 < 4, go left. Found node 2", "tree": [4,2,6,1,3,5,7]},
    {"title": "Remove 2", "description": "2 has 2 children. Replace with inorder successor 3", "tree": [4,3,6,1,null,5,7]}
  ]
}

--- Remove Root (node 4) ---
Inorder successor of 4 is 5 (smallest in right subtree)
{
  "structures": [{"id": "tree", "type": "tree", "label": "BST", "data": [4,2,6,1,3,5,7]}],
  "steps": [
    {"title": "Initial BST", "description": "Given tree", "tree": [4,2,6,1,3,5,7]},
    {"title": "Remove 4", "description": "4 is root with 2 children. Replace with inorder successor 5", "tree": [5,2,6,1,3,null,7]}
  ]
}

================================================================================
MULTI-OPERATION EXAMPLE
================================================================================

In BST [4,2,6,1,3,5,7], insert 0 then remove 4 then insert 8:

{
  "structures": [{"id": "tree", "type": "tree", "label": "BST", "data": [4,2,6,1,3,5,7]}],
  "steps": [
    {"title": "Initial BST", "description": "Starting tree", "tree": [4,2,6,1,3,5,7]},
    {"title": "Insert 0", "description": "0 < 4 (left), 0 < 2 (left), 0 < 1 (left of 1)", "tree": [4,2,6,1,3,5,7,0]},
    {"title": "Remove 4", "description": "Remove root. Replace with inorder successor 5", "tree": [5,2,6,1,3,null,7,0]},
    {"title": "Insert 8", "description": "8 > 5 (right), 8 > 6 (right), 8 > 7 (right of 7)", "tree": [5,2,6,1,3,null,7,0,null,null,null,null,null,null,8]},
    {"title": "Done", "description": "All operations complete", "tree": [5,2,6,1,3,null,7,0,null,null,null,null,null,null,8]}
  ]
}

================================================================================
SEARCH EXAMPLE
================================================================================

Search for 5 in BST [4,2,6,1,3,5,7]:
{
  "structures": [{"id": "tree", "type": "tree", "label": "BST", "data": [4,2,6,1,3,5,7]}],
  "steps": [
    {"title": "Visit 4", "description": "5 > 4, go RIGHT", "tree": [4,2,6,1,3,5,7], "path": [4]},
    {"title": "Visit 6", "description": "5 < 6, go LEFT", "tree": [4,2,6,1,3,5,7], "path": [4,6]},
    {"title": "Found 5", "description": "Target found!", "tree": [4,2,6,1,3,5,7], "path": [4,6,5], "result": [5]}
  ]
}

================================================================================
TREE PROPERTIES
================================================================================

--- Height of tree ---
Height = max depth from root to any leaf
BST [4,2,6,1,3,5,7] has height 2 (root=0, children=1, grandchildren=2)

{
  "structures": [{"id": "tree", "type": "tree", "label": "BST", "data": [4,2,6,1,3,5,7]}],
  "steps": [
    {"title": "Check root", "description": "Root 4 at depth 0", "tree": [4,2,6,1,3,5,7], "variables": {"depth": 0}},
    {"title": "Check level 1", "description": "Nodes 2,6 at depth 1", "tree": [4,2,6,1,3,5,7], "variables": {"depth": 1}},
    {"title": "Check level 2", "description": "Nodes 1,3,5,7 at depth 2", "tree": [4,2,6,1,3,5,7], "variables": {"depth": 2}},
    {"title": "Height = 2", "description": "Max depth is 2", "tree": [4,2,6,1,3,5,7], "result": [2]}
  ]
}

--- Find Minimum ---
Minimum is leftmost node. In BST [4,2,6,1,3,5,7], min = 1

{
  "structures": [{"id": "tree", "type": "tree", "label": "BST", "data": [4,2,6,1,3,5,7]}],
  "steps": [
    {"title": "Start at root", "description": "At 4, go left", "tree": [4,2,6,1,3,5,7], "path": [4]},
    {"title": "Go left", "description": "At 2, go left", "tree": [4,2,6,1,3,5,7], "path": [4,2]},
    {"title": "Found min", "description": "1 has no left child, minimum found", "tree": [4,2,6,1,3,5,7], "path": [4,2,1], "result": [1]}
  ]
}

================================================================================
GENERATE YOUR RESPONSE NOW
================================================================================

IMPORTANT:
1. Use EXACT values from the user's problem
2. For INSERT/REMOVE, use format: "Title": "Insert X" or "Remove X"
3. For traversals, format: "Title": "Visit X"
4. Always include "tree" field with level-order array
5. Tree operations MUST follow BST rules (left < parent < right)
6. Return ONLY valid JSON, no extra text`;
  }

  getStackExample() {
    return `
=== COMPREHENSIVE STACK VISUALIZATION GUIDE ===

STACK FORMAT (LIFO - Last In, First Out):
     ┌─────┐
TOP →│  D  │ ← Push here, Pop from here
     ├─────┤
     │  C  │
     ├─────┤
     │  B  │
     ├─────┤
BOT →│  A  │
     └─────┘

OPERATIONS:
- Push: Add to TOP (end of array)
- Pop: Remove from TOP (end of array)
- Peek: View top element without removing
- Array format: [bottom, ..., top] - last element is TOP

================================================================================
CORE STACK OPERATIONS
================================================================================

--- Basic Push/Pop ---
Problem: Push 1,2,3 then pop twice

{
  "structures": [{"id": "stack", "type": "stack", "label": "Stack", "data": []}],
  "steps": [
    {"title": "Push 1", "description": "1 becomes bottom and top", "stack": [1]},
    {"title": "Push 2", "description": "2 is new top", "stack": [1,2]},
    {"title": "Push 3", "description": "3 is new top", "stack": [1,2,3]},
    {"title": "Pop", "description": "Remove 3 from top", "stack": [1,2], "result": [3]},
    {"title": "Pop", "description": "Remove 2 from top", "stack": [1], "result": [3,2]}
  ]
}

================================================================================
VALID PARENTHESES / BRACKET MATCHING
================================================================================

For bracket problems, READ THE USER INPUT and process each character.
Stack stores the ACTUAL brackets from the input string.

Example: User asks to check "(())" - you must process those exact 4 characters.

{
  "structures": [{"id": "stack", "type": "stack", "label": "Stack", "data": []}],
  "steps": [
    {"title": "Char 0: Push", "description": "Found opening ( - push it", "stack": ["("]},
    {"title": "Char 1: Push", "description": "Found opening ( - push it", "stack": ["(","("]},
    {"title": "Char 2: Match", "description": "Found ) - matches ( on top, pop", "stack": ["("]},
    {"title": "Char 3: Match", "description": "Found ) - matches ( on top, pop", "stack": []},
    {"title": "Result", "description": "Stack empty = Valid", "stack": [], "result": ["Valid"]}
  ]
}

================================================================================
REVERSE STRING
================================================================================

Problem: Reverse "abc" using stack

{
  "structures": [{"id": "stack", "type": "stack", "label": "Stack", "data": []}],
  "steps": [
    {"title": "Push 'a'", "description": "First char goes to bottom", "stack": ["a"]},
    {"title": "Push 'b'", "description": "Second char on top of 'a'", "stack": ["a","b"]},
    {"title": "Push 'c'", "description": "Last char is now top", "stack": ["a","b","c"]},
    {"title": "Pop 'c'", "description": "Pop top element", "stack": ["a","b"], "result": ["c"]},
    {"title": "Pop 'b'", "description": "Pop next element", "stack": ["a"], "result": ["c","b"]},
    {"title": "Pop 'a'", "description": "Pop last element", "stack": [], "result": ["c","b","a"]},
    {"title": "Done", "description": "Reversed string: 'cba'", "stack": [], "result": ["cba"]}
  ]
}

================================================================================
EXPRESSION EVALUATION
================================================================================

Problem: Evaluate postfix expression "23+"

{
  "structures": [{"id": "stack", "type": "stack", "label": "Operand Stack", "data": []}],
  "steps": [
    {"title": "Push 2", "description": "Number - push to stack", "stack": [2]},
    {"title": "Push 3", "description": "Number - push to stack", "stack": [2,3]},
    {"title": "Process '+'", "description": "Pop 3 and 2, compute 2+3=5, push result", "stack": [5], "result": [5]}
  ]
}

================================================================================
NEXT GREATER ELEMENT
================================================================================

Problem: Next greater element for [4,5,2,10]

{
  "structures": [
    {"id": "arr", "type": "array", "label": "Array", "data": [4,5,2,10]},
    {"id": "stack", "type": "stack", "label": "Stack", "data": []}
  ],
  "steps": [
    {"title": "Process 4", "description": "Stack empty, push 4", "array": [4,5,2,10], "stack": [4], "highlight": [0]},
    {"title": "Process 5", "description": "5 > 4, so NGE[4]=5, pop 4, push 5", "array": [4,5,2,10], "stack": [5], "result": [{"4":5}], "highlight": [1]},
    {"title": "Process 2", "description": "2 < 5, push 2", "array": [4,5,2,10], "stack": [5,2], "highlight": [2]},
    {"title": "Process 10", "description": "10 > 2 and 10 > 5, NGE[2]=10, NGE[5]=10", "array": [4,5,2,10], "stack": [10], "result": [{"4":5},{"5":10},{"2":10}], "highlight": [3]},
    {"title": "Done", "description": "Remaining: NGE[10]=-1", "array": [4,5,2,10], "stack": [], "result": [5,10,10,-1]}
  ]
}

================================================================================
FUNCTION CALL STACK
================================================================================

Problem: Trace factorial(3) recursion

{
  "structures": [{"id": "stack", "type": "stack", "label": "Call Stack", "data": []}],
  "steps": [
    {"title": "Call factorial(3)", "description": "Push frame for n=3", "stack": ["f(3)"]},
    {"title": "Call factorial(2)", "description": "3 != 0, call f(2)", "stack": ["f(3)","f(2)"]},
    {"title": "Call factorial(1)", "description": "2 != 0, call f(1)", "stack": ["f(3)","f(2)","f(1)"]},
    {"title": "Call factorial(0)", "description": "1 != 0, call f(0)", "stack": ["f(3)","f(2)","f(1)","f(0)"]},
    {"title": "Return 1", "description": "Base case: f(0)=1, pop", "stack": ["f(3)","f(2)","f(1)"], "result": [1]},
    {"title": "Return 1", "description": "f(1)=1*1=1, pop", "stack": ["f(3)","f(2)"], "result": [1]},
    {"title": "Return 2", "description": "f(2)=2*1=2, pop", "stack": ["f(3)"], "result": [2]},
    {"title": "Return 6", "description": "f(3)=3*2=6, pop", "stack": [], "result": [6]}
  ]
}

================================================================================
GENERATE YOUR RESPONSE NOW
================================================================================

IMPORTANT:
1. Use EXACT values from the user's problem
2. For Push: "title": "Push X"
3. For Pop: "title": "Pop" or "Pop X"
4. Stack array: [bottom, ..., top] - LAST element is TOP
5. For parentheses: push opening, pop on closing match
6. Return ONLY valid JSON, no extra text`;
  }

  getQueueExample() {
    return `
=== COMPREHENSIVE QUEUE VISUALIZATION GUIDE ===

QUEUE FORMAT (FIFO - First In, First Out):
Queue: [A, B, C, D]
        ↑           ↑
      FRONT       REAR

OPERATIONS:
- Enqueue: Add to REAR (end of array)
- Dequeue: Remove from FRONT (start of array)
- Front/Peek: View front element without removing

OUTPUT FORMAT:
- Use "queue" field for queue data (array, first element = FRONT)
- Use "result" for processed/dequeued elements
- Use "highlight" for indices to highlight
- Include meta.operation for "Enqueue X" or "Dequeue" display

================================================================================
CORE QUEUE OPERATIONS
================================================================================

--- Basic Enqueue/Dequeue ---
Problem: Enqueue 1,2,3 then dequeue twice

{
  "structures": [{"id": "queue", "type": "queue", "label": "Queue", "data": []}],
  "steps": [
    {"title": "Enqueue 1", "description": "Add 1 to rear", "queue": [1], "meta": {"operation": "Enqueue 1"}},
    {"title": "Enqueue 2", "description": "Add 2 to rear", "queue": [1,2], "meta": {"operation": "Enqueue 2"}},
    {"title": "Enqueue 3", "description": "Add 3 to rear", "queue": [1,2,3], "meta": {"operation": "Enqueue 3"}},
    {"title": "Dequeue", "description": "Remove 1 from front", "queue": [2,3], "result": [1], "meta": {"operation": "Dequeue → 1"}},
    {"title": "Dequeue", "description": "Remove 2 from front", "queue": [3], "result": [1,2], "meta": {"operation": "Dequeue → 2"}}
  ]
}

--- Queue State Transitions ---
{
  "structures": [{"id": "queue", "type": "queue", "label": "Queue", "data": []}],
  "steps": [
    {"title": "Empty Queue", "description": "Queue starts empty", "queue": []},
    {"title": "Enqueue A", "description": "A is both front and rear", "queue": ["A"]},
    {"title": "Enqueue B", "description": "A=front, B=rear", "queue": ["A","B"]},
    {"title": "Dequeue", "description": "Remove A, B is now front and rear", "queue": ["B"], "result": ["A"]},
    {"title": "Dequeue", "description": "Queue becomes empty", "queue": [], "result": ["A","B"]}
  ]
}

================================================================================
BFS / LEVEL ORDER TRAVERSAL
================================================================================

--- Level Order with Queue ---
Problem: Level order traversal of BST [4,2,6,1,3,5,7]

{
  "structures": [
    {"id": "tree", "type": "tree", "label": "BST", "data": [4,2,6,1,3,5,7]},
    {"id": "queue", "type": "queue", "label": "BFS Queue", "data": []}
  ],
  "steps": [
    {"title": "Start BFS", "description": "Enqueue root 4", "tree": [4,2,6,1,3,5,7], "queue": [4], "result": [], "meta": {"operation": "Enqueue 4"}},
    {"title": "Visit 4", "description": "Dequeue 4, enqueue children 2,6", "tree": [4,2,6,1,3,5,7], "queue": [2,6], "result": [4], "meta": {"operation": "Dequeue 4, Enqueue 2,6"}},
    {"title": "Visit 2", "description": "Dequeue 2, enqueue children 1,3", "tree": [4,2,6,1,3,5,7], "queue": [6,1,3], "result": [4,2], "meta": {"operation": "Dequeue 2, Enqueue 1,3"}},
    {"title": "Visit 6", "description": "Dequeue 6, enqueue children 5,7", "tree": [4,2,6,1,3,5,7], "queue": [1,3,5,7], "result": [4,2,6], "meta": {"operation": "Dequeue 6, Enqueue 5,7"}},
    {"title": "Visit 1", "description": "Dequeue 1, no children", "tree": [4,2,6,1,3,5,7], "queue": [3,5,7], "result": [4,2,6,1], "meta": {"operation": "Dequeue 1"}},
    {"title": "Visit 3", "description": "Dequeue 3, no children", "tree": [4,2,6,1,3,5,7], "queue": [5,7], "result": [4,2,6,1,3], "meta": {"operation": "Dequeue 3"}},
    {"title": "Visit 5", "description": "Dequeue 5, no children", "tree": [4,2,6,1,3,5,7], "queue": [7], "result": [4,2,6,1,3,5], "meta": {"operation": "Dequeue 5"}},
    {"title": "Visit 7", "description": "Dequeue 7, no children. BFS complete!", "tree": [4,2,6,1,3,5,7], "queue": [], "result": [4,2,6,1,3,5,7], "meta": {"operation": "Dequeue 7"}}
  ]
}

================================================================================
SIMULATION PROBLEMS
================================================================================

--- Ticket Counter / Task Processing ---
Problem: Process 5 customers in queue

{
  "structures": [{"id": "queue", "type": "queue", "label": "Customer Queue", "data": ["C1","C2","C3","C4","C5"]}],
  "steps": [
    {"title": "Initial Queue", "description": "5 customers waiting", "queue": ["C1","C2","C3","C4","C5"]},
    {"title": "Serve C1", "description": "Process customer 1", "queue": ["C2","C3","C4","C5"], "result": ["C1"], "meta": {"operation": "Process C1", "processing": true}},
    {"title": "Serve C2", "description": "Process customer 2", "queue": ["C3","C4","C5"], "result": ["C1","C2"], "meta": {"operation": "Process C2", "processing": true}},
    {"title": "Serve C3", "description": "Process customer 3", "queue": ["C4","C5"], "result": ["C1","C2","C3"], "meta": {"operation": "Process C3", "processing": true}},
    {"title": "Serve C4", "description": "Process customer 4", "queue": ["C5"], "result": ["C1","C2","C3","C4"], "meta": {"operation": "Process C4", "processing": true}},
    {"title": "Serve C5", "description": "All customers served", "queue": [], "result": ["C1","C2","C3","C4","C5"], "meta": {"operation": "Process C5", "processing": true}}
  ]
}

--- Round Robin Scheduling ---
Problem: Round robin with time quantum for tasks A,B,C

{
  "structures": [{"id": "queue", "type": "queue", "label": "Ready Queue", "data": ["A","B","C"]}],
  "steps": [
    {"title": "Initial", "description": "Tasks in ready queue", "queue": ["A","B","C"]},
    {"title": "Execute A", "description": "Run A for quantum, move to rear", "queue": ["B","C","A"], "meta": {"operation": "Execute A, re-enqueue"}},
    {"title": "Execute B", "description": "Run B for quantum, move to rear", "queue": ["C","A","B"], "meta": {"operation": "Execute B, re-enqueue"}},
    {"title": "Execute C", "description": "C completes", "queue": ["A","B"], "result": ["C"], "meta": {"operation": "C complete"}},
    {"title": "Execute A", "description": "A completes", "queue": ["B"], "result": ["C","A"], "meta": {"operation": "A complete"}},
    {"title": "Execute B", "description": "B completes. All done!", "queue": [], "result": ["C","A","B"], "meta": {"operation": "B complete"}}
  ]
}

================================================================================
SLIDING WINDOW (Queue Pattern)
================================================================================

--- First Negative in Each Window ---
Problem: First negative in each window of size 3 for [1,-2,3,-4,5,-6]

{
  "structures": [
    {"id": "arr", "type": "array", "label": "Array", "data": [1,-2,3,-4,5,-6]},
    {"id": "queue", "type": "queue", "label": "Negatives Queue", "data": []}
  ],
  "steps": [
    {"title": "Window [0-2]", "description": "Elements: 1,-2,3. First negative: -2", "array": [1,-2,3,-4,5,-6], "queue": [-2], "result": [-2], "highlight": [0,1,2]},
    {"title": "Window [1-3]", "description": "Elements: -2,3,-4. First negative: -2", "array": [1,-2,3,-4,5,-6], "queue": [-2,-4], "result": [-2,-2], "highlight": [1,2,3]},
    {"title": "Window [2-4]", "description": "Elements: 3,-4,5. -2 exits, first negative: -4", "array": [1,-2,3,-4,5,-6], "queue": [-4], "result": [-2,-2,-4], "highlight": [2,3,4]},
    {"title": "Window [3-5]", "description": "Elements: -4,5,-6. First negative: -4", "array": [1,-2,3,-4,5,-6], "queue": [-4,-6], "result": [-2,-2,-4,-4], "highlight": [3,4,5]}
  ]
}

================================================================================
GENERATE YOUR RESPONSE NOW
================================================================================

IMPORTANT:
1. Use EXACT values from the user's problem
2. For Enqueue: "title": "Enqueue X", add element to end of queue array
3. For Dequeue: "title": "Dequeue", remove first element, add to result
4. Always include "queue" field with current queue state
5. Include meta.operation for operation display
6. For BFS, include both "tree" and "queue" fields
7. Return ONLY valid JSON, no extra text`;
  }

  getTwoPointerExample() {
    return this.getArrayComprehensiveExample();
  }

  getSlidingWindowExample() {
    return this.getArrayComprehensiveExample();
  }

  getSortExample() {
    return this.getArrayComprehensiveExample();
  }

  getArrayComprehensiveExample() {
    return `
=== ARRAY ALGORITHM VISUALIZATION ===

FORMAT:
- "array": current array values
- "highlight": indices to highlight [i,j]
- "pointers": named markers {"left":0, "right":5}

--- SORTING EXAMPLE ---
Problem: Bubble sort [5,3,8]

{
  "structures": [{"id": "arr", "type": "array", "label": "Array", "data": [5,3,8]}],
  "steps": [
    {"title": "Compare 0,1", "description": "5>3, swap needed", "array": [5,3,8], "highlight": [0,1]},
    {"title": "Swap", "description": "Swapped", "array": [3,5,8], "highlight": [0,1]},
    {"title": "Compare 1,2", "description": "5<8, no swap", "array": [3,5,8], "highlight": [1,2]},
    {"title": "Sorted", "description": "Array is sorted", "array": [3,5,8], "result": [3,5,8]}
  ]
}

--- BINARY SEARCH EXAMPLE ---
Problem: Find 3 in [1,2,3,4,5]

{
  "structures": [{"id": "arr", "type": "array", "label": "Array", "data": [1,2,3,4,5]}],
  "steps": [
    {"title": "mid=2", "description": "arr[2]=3, found!", "array": [1,2,3,4,5], "pointers": {"left":0,"mid":2,"right":4}, "highlight": [2]},
    {"title": "Found", "description": "Found at index 2", "array": [1,2,3,4,5], "highlight": [2], "result": [2]}
  ]
}

RULES:
1. Use EXACT values from user's input
2. Show each compare/swap as separate step
3. Update "array" after each modification
4. Return ONLY valid JSON`;
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