import { useState } from 'react';
import { useMapContext } from '@/context/MapContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select } from '@/components/ui/select';
import { ACTION_OPTIONS } from '@/lib/constants';
import { ChevronDown, ChevronRight, Settings, Camera, Route, Image } from 'lucide-react';

/**
 * Component for displaying and editing flight parameters
 */
const FlightParametersPanel: React.FC = () => {
  const { flightParams } = useMapContext();
  const [openSections, setOpenSections] = useState({
    flightParams: true,
    cameraSettings: true,
    pathOptions: true,
    photoSettings: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  const {
    altitude,
    speed,
    angle,
    focalLength,
    sensorWidth,
    sensorHeight,
    photoInterval,
    overlap,
    inDistance,
    isNorthSouth,
    useEndpointsOnly,
    allPointsAction,
    accountForTerrain,
    setAltitude,
    setSpeed,
    setAngle,
    setFocalLength,
    setSensorWidth,
    setSensorHeight,
    setPhotoInterval,
    setOverlap,
    setInDistance,
    setIsNorthSouth,
    setUseEndpointsOnly,
    setAllPointsAction,
    setAccountForTerrain
  } = flightParams;

  // Map field names to their setter functions and types
  const fieldSetters: Record<string, { setter: (value: unknown) => void; type: 'number' | 'boolean' | 'string' }> = {
    altitude: { setter: setAltitude as (value: unknown) => void, type: 'number' },
    speed: { setter: setSpeed as (value: unknown) => void, type: 'number' },
    angle: { setter: setAngle as (value: unknown) => void, type: 'number' },
    focalLength: { setter: setFocalLength as (value: unknown) => void, type: 'number' },
    sensorWidth: { setter: setSensorWidth as (value: unknown) => void, type: 'number' },
    sensorHeight: { setter: setSensorHeight as (value: unknown) => void, type: 'number' },
    photoInterval: { setter: setPhotoInterval as (value: unknown) => void, type: 'number' },
    overlap: { setter: setOverlap as (value: unknown) => void, type: 'number' },
    inDistance: { setter: setInDistance as (value: unknown) => void, type: 'number' },
    isNorthSouth: { setter: setIsNorthSouth as (value: unknown) => void, type: 'boolean' },
    useEndpointsOnly: { setter: setUseEndpointsOnly as (value: unknown) => void, type: 'boolean' },
    allPointsAction: { setter: setAllPointsAction as (value: unknown) => void, type: 'string' },
    accountForTerrain: { setter: setAccountForTerrain as (value: unknown) => void, type: 'boolean' },
  };

  const onValueChange = (field: string, value: string | boolean) => {
    const fieldConfig = fieldSetters[field];
    if (!fieldConfig) return;

    const { setter, type } = fieldConfig;

    if (type === 'number') {
      setter(Number(value));
    } else if (type === 'boolean') {
      setter(Boolean(value));
    } else {
      setter(String(value));
    }
  };



  return (
    <div>
      {/* Flight Parameters Section */}
      <div className="bg-yellow-50 border-2 border-yellow-300 p-4">
        <button
          onClick={() => toggleSection('flightParams')}
          className="text-sm font-bold text-gray-900 flex items-center justify-between w-full hover:text-yellow-600 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-yellow-600" />
            <span className="text-gray-900">Flight Parameters</span>
          </div>
          {openSections.flightParams ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>

        {openSections.flightParams && <div className="flex flex-col gap-3 pt-3">
          <div className="space-y-2">
            <Label htmlFor="altitude" className="text-sm text-foreground">
              Altitude (m)
            </Label>
            <Input
              id="altitude"
              type="number"
              placeholder="Altitude"
              value={altitude}
              onChange={(e) => onValueChange('altitude', e.target.value)}
              className="text-sm"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="accountForTerrain"
              checked={accountForTerrain}
              onCheckedChange={(checked) => onValueChange('accountForTerrain', checked)}
            />
            <Label htmlFor="accountForTerrain" className="text-sm">Account for Terrain</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="speed" className="text-sm text-foreground">
              Speed (m/s)
            </Label>
            <Input
              id="speed"
              type="number"
              placeholder="Speed"
              value={speed}
              onChange={(e) => onValueChange('speed', e.target.value)}
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="angle" className="text-sm text-foreground">
              Gimbal Angle (°)
            </Label>
            <Input
              id="angle"
              type="number"
              placeholder="Angle"
              value={angle}
              onChange={(e) => onValueChange('angle', e.target.value)}
              className="text-sm"
            />
          </div>
        </div>}
      </div>

      {/* Camera Settings Section */}
      <div className="bg-indigo-50 border-2 border-indigo-300 p-4">
        <button
          onClick={() => toggleSection('cameraSettings')}
          className="text-sm font-bold text-gray-900 flex items-center justify-between w-full hover:text-indigo-600 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-indigo-600" />
            <span className="text-gray-900">Camera Settings</span>
          </div>
          {openSections.cameraSettings ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>

        {openSections.cameraSettings && <div className="flex flex-col gap-3 pt-3">
          <div className="space-y-2">
            <Label htmlFor="focalLength" className="text-sm text-foreground">
              Focal Length (mm)
            </Label>
            <Input
              id="focalLength"
              type="number"
              placeholder="Focal Length"
              value={focalLength}
              onChange={(e) => onValueChange('focalLength', e.target.value)}
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sensorWidth" className="text-sm text-foreground">
              Sensor Width (mm)
            </Label>
            <Input
              id="sensorWidth"
              type="number"
              placeholder="Sensor Width"
              value={sensorWidth}
              onChange={(e) => onValueChange('sensorWidth', e.target.value)}
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sensorHeight" className="text-sm text-foreground">
              Sensor Height (mm)
            </Label>
            <Input
              id="sensorHeight"
              type="number"
              placeholder="Sensor Height"
              value={sensorHeight}
              onChange={(e) => onValueChange('sensorHeight', e.target.value)}
              className="text-sm"
            />
          </div>
        </div>}
      </div>

      {/* Path Options Section */}
      <div className="bg-orange-50 border-2 border-orange-300 p-4">
        <button
          onClick={() => toggleSection('pathOptions')}
          className="text-sm font-bold text-gray-900 flex items-center justify-between w-full hover:text-orange-600 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Route className="h-4 w-4 text-orange-600" />
            <span className="text-gray-900">Path Options</span>
          </div>
          {openSections.pathOptions ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>

        {openSections.pathOptions && <div className="flex flex-col gap-3 pt-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isNorthSouth"
              checked={isNorthSouth}
              onCheckedChange={(checked) => onValueChange('isNorthSouth', checked)}
            />
            <Label htmlFor="isNorthSouth" className="text-sm">North-South Direction</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="useEndpointsOnly"
              checked={useEndpointsOnly}
              onCheckedChange={(checked) => onValueChange('useEndpointsOnly', checked)}
            />
            <Label htmlFor="useEndpointsOnly" className="text-sm">Use Endpoints Only</Label>
          </div>
        </div>}
      </div>

      {/* Photo Settings Section */}
      <div className="bg-pink-50 border-2 border-pink-300 p-4">
        <button
          onClick={() => toggleSection('photoSettings')}
          className="text-sm font-bold text-gray-900 flex items-center justify-between w-full hover:text-pink-600 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Image className="h-4 w-4 text-pink-600" />
            <span className="text-gray-900">Photo Settings</span>
          </div>
          {openSections.photoSettings ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>

        {openSections.photoSettings && <div className="flex flex-col gap-3 pt-3">
          <div className="space-y-2">
            <Label htmlFor="photoInterval" className="text-sm text-foreground">
              Photo Interval (s)
            </Label>
            <Input
              id="photoInterval"
              type="number"
              placeholder="Photo Interval"
              value={photoInterval}
              onChange={(e) => onValueChange('photoInterval', e.target.value)}
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="overlap" className="text-sm text-foreground">
              Overlap (%)
            </Label>
            <Input
              id="overlap"
              type="number"
              placeholder="Overlap"
              value={overlap}
              onChange={(e) => onValueChange('overlap', e.target.value)}
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inDistance" className="text-sm text-foreground">
              Line Spacing (m)
            </Label>
            <Input
              id="inDistance"
              type="number"
              placeholder="Line Spacing"
              value={inDistance}
              onChange={(e) => onValueChange('inDistance', e.target.value)}
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="allPointsAction" className="text-sm text-foreground">
              Waypoint Action
            </Label>
            <Select
              onValueChange={(value) => onValueChange('allPointsAction', value)}
              value={allPointsAction}
            >
              {ACTION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>}
      </div>
    </div>
  );
};

export default FlightParametersPanel;
