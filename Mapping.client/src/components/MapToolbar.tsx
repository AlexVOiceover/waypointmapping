import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Square, Circle, Pencil, Hand, Map, Download, Trash2, ChevronDown, ChevronRight, Mountain } from 'lucide-react';

interface MapToolbarProps {
  onStopDrawing: () => void;
  onGenerateWaypoints: () => void;
  onGenerateKml: () => void;
  onDrawRectangle: () => void;
  onDrawCircle: () => void;
  onDrawPolyline: () => void;
  onClearShapes: () => void;
  onProbeHeight: () => void;
  onClearProbeHeight: () => void;
  isProbeHeightActive?: boolean;
  activeDrawingMode?: string | null;
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
  onProbeHeight,
  onClearProbeHeight,
  isProbeHeightActive = false,
  activeDrawingMode = null,
  startingIndex = 1
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState({
    drawingTools: true,
    actions: true,
    tools: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="absolute right-0 top-0 z-50 bg-gray-100 hover:bg-gray-200 p-3 rounded-l-lg shadow-lg transition-colors border border-r-0 border-gray-300"
        title="Show toolbar"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      </button>
    );
  }

  return (
    <div className="absolute top-0 right-0 z-1000 w-60 bg-white rounded-none shadow-lg border-l border-gray-300">
      {/* Collapse Button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <h3 className="font-semibold text-gray-900">Tools</h3>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Hide toolbar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Content Wrapper */}
      <div>
        {/* Drawing Tools Section */}
        <div className="bg-blue-50 border-2 border-blue-300 p-4">
          <button
            onClick={() => toggleSection('drawingTools')}
            className="text-sm font-bold text-gray-900 flex items-center justify-between w-full hover:text-blue-600 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-blue-600" />
              <span className="text-gray-900">Drawing Tools</span>
            </div>
            {openSections.drawingTools ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
          {openSections.drawingTools && <div className="flex flex-col gap-2">
            <Button
              variant={activeDrawingMode === 'rectangle' ? 'default' : 'outline'}
              size="sm"
              onClick={onDrawRectangle}
              className={`w-full justify-start cursor-crosshair ${activeDrawingMode === 'rectangle' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
              title="Draw a rectangle"
            >
              <Square className={`mr-2 h-4 w-4 ${activeDrawingMode === 'rectangle' ? 'text-white' : 'text-blue-600'}`} />
              Rectangle
            </Button>
            <Button
              variant={activeDrawingMode === 'circle' ? 'default' : 'outline'}
              size="sm"
              onClick={onDrawCircle}
              className={`w-full justify-start cursor-crosshair ${activeDrawingMode === 'circle' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
              title="Draw a circle"
            >
              <Circle className={`mr-2 h-4 w-4 ${activeDrawingMode === 'circle' ? 'text-white' : 'text-blue-600'}`} />
              Circle
            </Button>
            <Button
              variant={activeDrawingMode === 'polyline' ? 'default' : 'outline'}
              size="sm"
              onClick={onDrawPolyline}
              className={`w-full justify-start cursor-crosshair ${activeDrawingMode === 'polyline' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
              title="Draw a polyline"
            >
              <Pencil className={`mr-2 h-4 w-4 ${activeDrawingMode === 'polyline' ? 'text-white' : 'text-blue-600'}`} />
              Polyline
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onStopDrawing}
              className="w-full justify-start cursor-pointer"
              title="Stop drawing mode"
            >
              <Hand className="mr-2 h-4 w-4" />
              Stop Drawing
            </Button>
          </div>}
        </div>

        {/* Actions Section */}
        <div className="bg-green-50 border-2 border-green-300 p-4">
          <button
            onClick={() => toggleSection('actions')}
            className="text-sm font-bold text-gray-900 flex items-center justify-between w-full hover:text-green-600 transition-colors"
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
              variant="outline"
              size="sm"
              onClick={onGenerateWaypoints}
              className="w-full justify-start cursor-pointer"
              title="Generate waypoints from drawn shape"
            >
              <Map className="mr-2 h-4 w-4 text-green-600" />
              Generate Waypoints
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onGenerateKml}
              className="w-full justify-start cursor-pointer"
              title="Export waypoints as KML file"
            >
              <Download className="mr-2 h-4 w-4 text-green-600" />
              Export KML
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onClearShapes}
              className="w-full justify-start cursor-pointer"
              title="Clear all shapes and waypoints"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All
            </Button>
          </div>}
        </div>

        {/* Tools Section */}
        <div className="bg-purple-50 border-2 border-purple-300 p-4">
          <button
            onClick={() => toggleSection('tools')}
            className="text-sm font-bold text-gray-900 flex items-center justify-between w-full hover:text-purple-600 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Mountain className="h-4 w-4 text-purple-600" />
              <span className="text-gray-900">Tools</span>
            </div>
            {openSections.tools ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
          {openSections.tools && <div className="flex flex-col gap-2">
            <Button
              variant={isProbeHeightActive ? "default" : "outline"}
              size="sm"
              onClick={onProbeHeight}
              className={`w-full justify-start ${isProbeHeightActive ? 'bg-purple-600 hover:bg-purple-700 text-white cursor-crosshair' : 'cursor-pointer'}`}
              title={isProbeHeightActive ? 'Stop probing elevation' : 'Click map to probe elevation'}
            >
              <Mountain className={`mr-2 h-4 w-4 ${isProbeHeightActive ? 'text-white' : 'text-purple-600'}`} />
              {isProbeHeightActive ? 'Stop Probe Height' : 'Probe Height'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearProbeHeight}
              className="w-full justify-start cursor-pointer"
              title="Clear all elevation probe markers"
            >
              <Trash2 className="mr-2 h-4 w-4 text-red-600" />
              Clear Probe Markers
            </Button>
          </div>}
        </div>
      </div>
    </div>
  );
};

MapToolbar.displayName = 'MapToolbar';

export default MapToolbar;
