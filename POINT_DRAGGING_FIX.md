# Point Dragging Fix - EditModeDraggable Component

## Problem Identified
You were unable to select and drag points in the EditModeDraggable component because **Plotly.js does not natively support dragging data points**. The `editable: true` config only allows editing annotations, shapes, and axis titles - not the actual data points.

## Solution Implemented
Created a **custom point dragging implementation** using:
1. **plotly_click** event to detect when a point is clicked
2. **mousemove** event listener to track mouse movement while dragging
3. **mouseup** event listener to end the drag operation

## How It Works

### 1. Click Detection
When you click on a point:
- The `plotly_click` event captures the point's information
- We store the clicked point's series, index, and starting value
- We record the starting Y position of the mouse

### 2. Drag Tracking
While you move the mouse with the button held down:
- We calculate the vertical distance moved (deltaY)
- Convert pixel movement to value change based on the Y-axis scale
- Update the data point in real-time

### 3. Release
When you release the mouse button:
- The drag operation ends
- The modified value is saved
- The "Modified" indicator appears in the header

## Key Improvements Made

### Visual Enhancements
- ✅ **Larger markers**: Increased from 8px to 12px for easier clicking
- ✅ **Thicker marker borders**: Changed from 1px to 2px for better visibility
- ✅ **Crosshair cursor**: Added `cursor-crosshair` to indicate interactivity
- ✅ **Clearer title**: Updated to explain the click-and-drag interaction

### Functional Improvements
- ✅ **Disabled pan mode by default**: Set `dragmode: false` to prevent conflicts
- ✅ **Added Pan tool to toolbar**: Users can still pan using the toolbar button
- ✅ **Real-time updates**: Points update as you drag, not after release
- ✅ **Proper cleanup**: Event listeners are removed when component unmounts

### Instructions Updated
The help section now clearly explains:
1. Click on any point to select it
2. Drag up or down to change its value
3. Release the mouse to finish editing
4. Use the Pan tool in the toolbar to navigate without editing

## How to Use

1. **Load a DCRM file** in the main viewer
2. **Select one or more Y-axis series** to edit
3. **Click "Edit Mode"** button to navigate to `/edit`
4. **Click on any data point** on the graph
5. **Hold and drag vertically** to adjust the value
6. **Release** to confirm the change
7. Use **Smooth** to apply smoothing to the visible range
8. Use **Reset** to restore original values
9. Use **Export CSV** to download modified data

## Technical Details

### Event Flow
```
User clicks point → plotly_click fires → Store point info + start position
User moves mouse → mousemove fires → Calculate delta → Update data
User releases → mouseup fires → Clear drag state
```

### Coordinate Conversion
```javascript
// Convert pixel movement to value change
const yRange = yaxis.range[1] - yaxis.range[0];
const plotHeight = plotElement.clientHeight - margins;
const valuePerPixel = yRange / plotHeight;
const deltaValue = deltaY * valuePerPixel;
```

### Unit Conversion
The system properly handles unit conversions:
- Display units (ms, mA, uA, mm, etc.)
- Base units (s, A, m, Ohm)
- Conversions are applied when reading and writing values

## Files Modified
1. `/src/components/EditModeDraggable.tsx` - Main implementation
2. `/src/plotly.d.ts` - Type declarations (created)

## Build Status
✅ **All TypeScript errors fixed**
✅ **Build successful**
✅ **Ready for testing**
