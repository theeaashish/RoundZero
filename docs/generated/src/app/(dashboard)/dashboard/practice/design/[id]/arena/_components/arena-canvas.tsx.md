# ArenaCanvas Component

The `ArenaCanvas` component is the core interactive workspace for system design challenges. It provides a visual graph editor where users can drag and drop components, connect them, and submit their architecture for AI-driven evaluation.

## Overview

The component is built using `@xyflow/react` and is designed to handle complex state management for system architecture diagrams. It features automatic persistence, real-time feedback, and a context-aware inspector for modifying node and edge properties.

## Key Components

### 1. `ArenaCanvas` (Wrapper)
The entry point component. It ensures client-side mounting compatibility by wrapping the inner logic in a `ReactFlowProvider` and providing a loading state during initialization.

### 2. `ArenaInner` (Logic Layer)
The primary functional component that orchestrates the design environment:
*   **State Management**: Tracks nodes and edges using `useNodesState` and `useEdgesState`.
*   **Persistence**: Implements a debounced autosave mechanism (1.4s) that syncs the canvas state to the backend via `orpc`.
*   **Interaction**:
    *   **Drag-and-Drop**: Supports dragging components from the `NodeSidebar` onto the canvas.
    *   **Selection**: Uses `useOnSelectionChange` to track active elements for the `NodeInspector`.
    *   **Keyboard Shortcuts**: Handles deletion of selected elements via `Backspace` or `Delete`.
*   **Evaluation**: Integrates with the `evaluateArchitecture` mutation to send the current graph structure to an AI service for feedback.

## Key Internal Methods

| Method | Description |
| :--- | :--- |
| `onDrop` | Handles dropping new nodes from the sidebar onto the canvas. |
| `onConnect` | Creates a new edge between nodes with default `SYNC` flow type. |
| `saveCanvas` | Manually triggers a save request to the backend. |
| `handleEvaluate` | Validates the current canvas and triggers the AI evaluation mutation. |
| `updateNode` / `updateEdge` | Efficiently updates element data using XYFlow's internal Map-based lookup. |

## Features

*   **Autosave**: Automatically persists changes to the backend after a 1.4-second debounce period.
*   **Node Inspection**: Works in tandem with `NodeInspector` to allow users to modify properties of selected nodes or edges.
*   **Evaluation Feedback**: Displays results via `EvaluationResultsSheet` once the AI evaluation is complete.
*   **Optimized Updates**: Uses `updateNodeData` and `updateEdgeData` for efficient state updates instead of full array re-renders.

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