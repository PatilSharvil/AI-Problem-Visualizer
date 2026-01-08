export const mockFrames = [
    {
        "frame_id": "step_0",
        "phase_id": "initialization",
        "title": "Problem Initialization",
        "description": "Initialize two pointers at the start and end of the array to find the target sum.",
        "state": { "left": 0, "right": 5, "current_sum": 0 },
        "visual_elements": [
            {
                "type": "array",
                "data": [2, 7, 11, 15, 18, 22],
                "highlighted_indices": [],
                "position": { "x": 100, "y": 100 }
            },
            {
                "type": "variable",
                "data": { "value": 0, "label": "L" },
                "highlighted_indices": [],
                "position": { "x": 110, "y": 180 }
            },
            {
                "type": "variable",
                "data": { "value": 5, "label": "R" },
                "highlighted_indices": [],
                "position": { "x": 410, "y": 180 }
            },
            {
                "type": "text",
                "data": "Target: 26",
                "highlighted_indices": [],
                "position": { "x": 300, "y": 50 }
            }
        ],
        "explanation": "We start with a sorted array. We want to find two numbers that add up to 26."
    },
    {
        "frame_id": "step_1",
        "phase_id": "search",
        "title": "Check Sum",
        "description": "Calculate sum of elements at Left and Right pointers.",
        "state": { "left": 0, "right": 5, "current_sum": 24 },
        "visual_elements": [
            {
                "type": "array",
                "data": [2, 7, 11, 15, 18, 22],
                "highlighted_indices": [0, 5],
                "position": { "x": 100, "y": 100 }
            },
            {
                "type": "variable",
                "data": { "value": 0, "label": "L" },
                "highlighted_indices": [],
                "position": { "x": 110, "y": 180 }
            },
            {
                "type": "variable",
                "data": { "value": 5, "label": "R" },
                "highlighted_indices": [],
                "position": { "x": 410, "y": 180 }
            },
            {
                "type": "text",
                "data": "2 + 22 = 24 (< 26)",
                "highlighted_indices": [],
                "position": { "x": 300, "y": 250 }
            }
        ],
        "explanation": "The sum is 24, which is less than our target 26. Since the array is sorted, we need a larger sum, so we move the Left pointer to the right."
    },
    {
        "frame_id": "step_2",
        "phase_id": "adjustment",
        "title": "Move Left Pointer",
        "description": "Increment Left pointer to increase the sum.",
        "state": { "left": 1, "right": 5, "current_sum": 0 },
        "visual_elements": [
            {
                "type": "array",
                "data": [2, 7, 11, 15, 18, 22],
                "highlighted_indices": [1],
                "position": { "x": 100, "y": 100 }
            },
            {
                "type": "variable",
                "data": { "value": 1, "label": "L" },
                "highlighted_indices": [],
                "position": { "x": 170, "y": 180 }
            },
            {
                "type": "variable",
                "data": { "value": 5, "label": "R" },
                "highlighted_indices": [],
                "position": { "x": 410, "y": 180 }
            }
        ],
        "explanation": "We move L to index 1. Now we will check the new sum."
    },
    {
        "frame_id": "step_3",
        "phase_id": "found",
        "title": "Match Found",
        "description": "Check new sum.",
        "state": { "left": 1, "right": 5, "current_sum": 29 },
        "visual_elements": [
            {
                "type": "array",
                "data": [2, 7, 11, 15, 18, 22],
                "highlighted_indices": [1, 5],
                "position": { "x": 100, "y": 100 }
            },
            {
                "type": "variable",
                "data": { "value": 1, "label": "L" },
                "highlighted_indices": [],
                "position": { "x": 170, "y": 180 }
            },
            {
                "type": "variable",
                "data": { "value": 5, "label": "R" },
                "highlighted_indices": [],
                "position": { "x": 410, "y": 180 }
            },
            {
                "type": "text",
                "data": "7 + 22 = 29 (> 26)",
                "highlighted_indices": [],
                "position": { "x": 300, "y": 250 }
            }
        ],
        "explanation": "Sum is 29, which is too big. Move Right pointer to the left."
    }
];

export const mockBinarySearchFrames = [
    {
        "frame_id": "bs_0",
        "phase_id": "init",
        "title": "Binary Search Initialization",
        "description": "Initialize Low and High pointers.",
        "state": { "low": 0, "high": 6, "mid": null },
        "visual_elements": [
            {
                "type": "array",
                "data": [1, 3, 5, 7, 9, 11, 13],
                "highlighted_indices": [],
                "position": { "x": 100, "y": 100 }
            },
            { "type": "variable", "data": { "value": 0, "label": "Low" }, "highlighted_indices": [], "position": { "x": 100, "y": 180 } },
            { "type": "variable", "data": { "value": 6, "label": "High" }, "highlighted_indices": [], "position": { "x": 460, "y": 180 } },
            { "type": "text", "data": "Target: 7", "highlighted_indices": [], "position": { "x": 300, "y": 50 } }
        ],
        "explanation": "We are searching for 7 in a sorted array."
    },
    {
        "frame_id": "bs_1",
        "phase_id": "calc_mid",
        "title": "Calculate Mid",
        "description": "Mid = floor((Low + High) / 2)",
        "state": { "low": 0, "high": 6, "mid": 3 },
        "visual_elements": [
            {
                "type": "array",
                "data": [1, 3, 5, 7, 9, 11, 13],
                "highlighted_indices": [3],
                "position": { "x": 100, "y": 100 }
            },
            { "type": "variable", "data": { "value": 0, "label": "Low" }, "highlighted_indices": [], "position": { "x": 100, "y": 180 } },
            { "type": "variable", "data": { "value": 6, "label": "High" }, "highlighted_indices": [], "position": { "x": 460, "y": 180 } },
            { "type": "variable", "data": { "value": 3, "label": "Mid" }, "highlighted_indices": [], "position": { "x": 280, "y": 180 } },
            { "type": "text", "data": "arr[3] = 7", "highlighted_indices": [], "position": { "x": 300, "y": 250 } }
        ],
        "explanation": "Mid index is 3. The value at index 3 is 7."
    },
    {
        "frame_id": "bs_2",
        "phase_id": "found",
        "title": "Target Found",
        "description": "arr[Mid] == Target",
        "state": { "low": 0, "high": 6, "mid": 3 },
        "visual_elements": [
            {
                "type": "array",
                "data": [1, 3, 5, 7, 9, 11, 13],
                "highlighted_indices": [3],
                "position": { "x": 100, "y": 100 }
            },
            { "type": "text", "data": "Found 7 at index 3!", "highlighted_indices": [], "position": { "x": 300, "y": 250 } }
        ],
        "explanation": "We found the target!"
    }
];
