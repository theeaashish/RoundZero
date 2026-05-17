# NodeSidebar Component

The `NodeSidebar` component is a specialized UI panel used within the architecture design arena. It provides a searchable, categorized library of system components that users can drag and drop onto the `ReactFlow` canvas.

## Purpose
This component serves as the primary interface for users to discover and add architectural nodes (e.g., databases, load balancers, services) to their design. It handles the drag-and-drop data transfer protocol required by the canvas to instantiate new nodes.

## Key Features
*   **Drag-and-Drop Integration:** Implements `onDragStart` to pass node metadata (`type`, `label`, `details`) to the canvas via the `dataTransfer` API.
*   **Categorized Library:** Groups components by category (e.g., Compute, Storage, Networking) using `NODE_CATEGORIES` and `DESIGN_NODES`.
*   **Search Functionality:** Real-time filtering of components based on label, type, or details.
*   **Collapsible Sections:** Users can toggle the visibility of specific categories to manage screen real estate.
*   **Optimized Rendering:** Uses `useMemo` to group nodes efficiently, ensuring high performance even with large component libraries.

## Component Structure

### State Management
*   `search`: Tracks the current user input for filtering nodes.
*   `collapsed`: A dictionary mapping category IDs to their visibility state.

### Data Flow
1.  **Filtering:** The `filteredNodes` variable computes the subset of nodes matching the search query.
2.  **Grouping:** The `groupedNodes` memoized object organizes the filtered list into categories for rendering.
3.  **Interaction:**
    *   **Toggle:** Clicking a category header updates the `collapsed` state.
    *   **Drag:** The `onDragStart` function attaches the necessary `application/reactflow/*` data types to the event, which the `ArenaCanvas` consumes during the `onDrop` event.

## Usage
The `NodeSidebar` is intended to be used as a sidebar component within the `ArenaCanvas` layout:

```tsx
import { NodeSidebar } from "./node-sidebar";

export function ArenaLayout() {
  return (
    <div className="flex h-screen">
      <NodeSidebar />
      <div className="flex-1">
        {/* ReactFlow Canvas */}
      </div>
    </div>
  );
}
```

## Dependencies
*   **`@/lib/design-nodes`**: Provides the source data for `DESIGN_NODES` and `NODE_CATEGORIES`.
*   **`lucide-react`**: Provides UI icons for categories and search.
*   **`@/components/ui/scroll-area`**: Used for handling overflow in the sidebar.
*   **`@xyflow/react`**: The underlying framework for the canvas that consumes the drag-and-drop data.