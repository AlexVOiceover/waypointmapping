import React from 'react';
import { Button } from '@/components/ui/button';
import { Square, Circle, Pencil, Hand, Map, Download, Trash2 } from 'lucide-react';

interface MapToolbarProps {
  onStopDrawing: () => void;
  onGenerateWaypoints: () => void;
  onGenerateKml: () => void;
  onDrawRectangle: () => void;
  onDrawCircle: () => void;
  onDrawPolyline: () => void;
  onClearShapes: () => void;
  startingIndex?: number;
}

/**
 * Component for map toolbar with drawing controls
 */
const MapToolbar: React.FC<MapToolbarProps> = ({
  onStopDrawing,
  onGenerateWaypoints,
  onGenerateKml,
  onDrawRectangle,
  onDrawCircle,
  onDrawPolyline,
  onClearShapes,
  startingIndex = 1
}) => {
  // Debug handler function to log button clicks
  const handleButtonClick = (action: string, handler: () => void) => {
    console.log(`Button clicked: ${action}`);
    if (typeof handler === 'function') {
      handler();
    } else {
      console.error(`Handler for ${action} is not a function:`, handler);
    }
  };

  return (
    <div className="absolute top-5 right-5 z-10 w-[180px] bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Drawing Tools Section */}
      <div className="space-y-2 p-3 border-b border-gray-200">
        <h4 className="text-xs font-semibold text-gray-700 mb-2">
          Drawing Tools
        </h4>
        <div className="flex flex-col gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleButtonClick('Draw Rectangle', onDrawRectangle)}
            className="w-full justify-start text-xs h-8 !bg-white hover:!bg-blue-50 !text-gray-900 !border-gray-300"
          >
            <Square className="mr-1.5 h-3.5 w-3.5 !text-gray-900" />
            Rectangle
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleButtonClick('Draw Circle', onDrawCircle)}
            className="w-full justify-start text-xs h-8 !bg-white hover:!bg-blue-50 !text-gray-900 !border-gray-300"
          >
            <Circle className="mr-1.5 h-3.5 w-3.5 !text-gray-900" />
            Circle
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleButtonClick('Draw Polyline', onDrawPolyline)}
            className="w-full justify-start text-xs h-8 !bg-white hover:!bg-blue-50 !text-gray-900 !border-gray-300"
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5 !text-gray-900" />
            Polyline
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleButtonClick('Stop Drawing', onStopDrawing)}
            className="w-full justify-start text-xs h-8 !bg-gray-200 !text-gray-900"
          >
            <Hand className="mr-1.5 h-3.5 w-3.5 !text-gray-900" />
            Stop Drawing
          </Button>
        </div>
      </div>

      {/* Actions Section */}
      <div className="space-y-2 p-3">
        <h4 className="text-xs font-semibold text-gray-700 mb-2">
          Actions
        </h4>
        <input type="hidden" id="in_startingIndex" value={startingIndex} />
        <div className="flex flex-col gap-1.5">
          <Button
            size="sm"
            onClick={() => handleButtonClick('Generate Waypoints', onGenerateWaypoints)}
            className="w-full justify-start text-xs h-8 !bg-blue-600 !text-white hover:!bg-blue-700"
          >
            <Map className="mr-1.5 h-3.5 w-3.5 !text-white" />
            Generate Waypoints
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleButtonClick('Export KML', onGenerateKml)}
            className="w-full justify-start text-xs h-8 !bg-white hover:!bg-blue-50 !text-gray-900 !border-gray-300"
          >
            <Download className="mr-1.5 h-3.5 w-3.5 !text-gray-900" />
            Export KML
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleButtonClick('Clear All', onClearShapes)}
            className="w-full justify-start text-xs h-8 !bg-red-600 !text-white hover:!bg-red-700"
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5 !text-white" />
            Clear All
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MapToolbar;
