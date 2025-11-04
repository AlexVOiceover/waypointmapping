import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Square, Circle, Pencil, Hand, Map, Download, Trash2, ChevronDown, ChevronRight } from 'lucide-react';

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
 * Simplified map toolbar with drawing controls
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
  const [openSections, setOpenSections] = useState({
    drawingTools: true,
    actions: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="absolute top-24 right-5 z-1000 w-240px bg-white rounded-xl shadow-xl border border-gray-300">
      {/* Drawing Tools Section */}
      <div className="p-4 bg-blue-50 border-b border-gray-200">
        <button
          onClick={() => toggleSection('drawingTools')}
          className="text-sm font-bold text-gray-900 mb-3 flex items-center justify-between w-full hover:text-blue-600 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-blue-600" />
            <span className="text-gray-900">Drawing Tools</span>
          </div>
          {openSections.drawingTools ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>
        {openSections.drawingTools && <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onDrawRectangle}
            className="w-full justify-start"
          >
            <Square className="mr-2 h-4 w-4 text-blue-600" />
            Rectangle
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDrawCircle}
            className="w-full justify-start"
          >
            <Circle className="mr-2 h-4 w-4 text-blue-600" />
            Circle
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDrawPolyline}
            className="w-full justify-start"
          >
            <Pencil className="mr-2 h-4 w-4 text-blue-600" />
            Polyline
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onStopDrawing}
            className="w-full justify-start"
          >
            <Hand className="mr-2 h-4 w-4" />
            Stop Drawing
          </Button>
        </div>}
      </div>

      {/* Actions Section */}
      <div className="p-4 bg-green-50">
        <button
          onClick={() => toggleSection('actions')}
          className="text-sm font-bold text-gray-900 mb-3 flex items-center justify-between w-full hover:text-green-600 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Map className="h-4 w-4 text-green-600" />
            <span className="text-gray-900">Actions</span>
          </div>
          {openSections.actions ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>
        <input type="hidden" id="in_startingIndex" value={startingIndex} />
        {openSections.actions && <div className="flex flex-col gap-2">
          <Button
            size="sm"
            onClick={onGenerateWaypoints}
            className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Map className="mr-2 h-4 w-4" />
            Generate Waypoints
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onGenerateKml}
            className="w-full justify-start"
          >
            <Download className="mr-2 h-4 w-4 text-green-600" />
            Export KML
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onClearShapes}
            className="w-full justify-start"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All
          </Button>
        </div>}
      </div>
    </div>
  );
};

MapToolbar.displayName = 'MapToolbar';

export default MapToolbar;
