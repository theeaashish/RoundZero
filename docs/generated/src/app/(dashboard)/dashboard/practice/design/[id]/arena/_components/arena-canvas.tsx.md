# ArenaCanvas Documentation

The `ArenaCanvas` component is the core interactive workspace for system design practice. It provides a visual drag-and-drop interface built on top of **React Flow**, allowing users to architect system designs, save their progress, and submit them for AI-driven evaluation.

## Overview
The component manages the state of a system design diagram, including nodes (components) and edges (data flows). It features automatic persistence, real-time evaluation, and a sidebar for component selection.

## Key Components

### 1. `ArenaCanvas` (Wrapper)
The entry point component. It handles client-side mounting to ensure compatibility with `ReactFlowProvider` and provides a loading state while the environment initializes.

### 2. `ArenaInner` (Logic Layer)
The main functional component that orchestrates the design environment:
*   **State Management**: Uses `useNodesState` and `useEdgesState` to track the canvas layout.
*   **Persistence**: Implements a debounced autosave mechanism that syncs the canvas state to the backend via `orpc`.
*   **Interaction**:
    *   **Drag-and-Drop**: Allows users to drag components from the `NodeSidebar` onto the canvas.
    *   **Selection**: Uses `useOnSelectionChange` to track active nodes/edges for inspection.
    *   **Keyboard Shortcuts**: Supports deleting selected elements via `Backspace` or `Delete`.
*   **Evaluation**: Integrates with the `evaluateArchitecture` mutation to send the current graph structure to an AI service for feedback.

## Features

*   **Autosave**: Automatically persists changes to the backend after a 1.4-second debounce period.
*   **Node Inspection**: Works in tandem with `NodeInspector` to allow users to modify properties of selected nodes or edges.
*   **Evaluation Feedback**: Displays results via `EvaluationResultsSheet` once the AI evaluation is complete.
*   **Optimized Updates**: Uses `updateNodeData` and `updateEdgeData` (XYFlow internal methods) for efficient state updates instead of full array re-renders.

## Dependencies
*   **`@xyflow/react`**: Powers the interactive graph canvas.
*   **`@tanstack/react-query`**: Manages server state (fetching attempts, submitting evaluations).
*   **`orpc`**: The RPC client used for API communication.
*   **`zod`**: Used for schema validation of the architecture JSON.

## Usage Example

The component is designed to be used within a dashboard route, requiring a `problemId` to fetch the specific design challenge:

```tsx
<ArenaCanvas problemId="system-design-123" />
```

## Key Internal Methods

| Method | Description |
| :--- | :--- |
| `onDrop` | Handles dropping new nodes from the sidebar onto the canvas. |
| `onConnect` | Creates a new edge between nodes with default `SYNC` flow type. |
| `saveCanvas` | Manually triggers a save request to the backend. |
| `handleEvaluate` | Validates the current canvas and triggers the AI evaluation mutation. |

## UI Components
*   **`NodeSidebar`**: Provides the palette of available system components.
*   **`NodeInspector`**: Context-aware panel for editing selected node/edge data.
*   **`EvaluationResultsSheet`**: A slide-out panel displaying AI feedback on the architecture.