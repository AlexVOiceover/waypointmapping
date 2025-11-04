import { useMapContext } from '@/context/MapContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ACTION_OPTIONS } from '@/lib/constants';

type SetterFunction = (value: number | boolean | string) => void;

/**
 * Component for displaying and editing flight parameters
 */
const FlightParametersPanel: React.FC = () => {
  const { flightParams } = useMapContext();
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
    setAllPointsAction
  } = flightParams;

  // Map field names to their setter functions and types
  const fieldSetters: Record<string, { setter: SetterFunction; type: 'number' | 'boolean' | 'string' }> = {
    altitude: { setter: setAltitude, type: 'number' },
    speed: { setter: setSpeed, type: 'number' },
    angle: { setter: setAngle, type: 'number' },
    focalLength: { setter: setFocalLength, type: 'number' },
    sensorWidth: { setter: setSensorWidth, type: 'number' },
    sensorHeight: { setter: setSensorHeight, type: 'number' },
    photoInterval: { setter: setPhotoInterval, type: 'number' },
    overlap: { setter: setOverlap, type: 'number' },
    inDistance: { setter: setInDistance, type: 'number' },
    isNorthSouth: { setter: setIsNorthSouth, type: 'boolean' },
    useEndpointsOnly: { setter: setUseEndpointsOnly, type: 'boolean' },
    allPointsAction: { setter: setAllPointsAction, type: 'string' },
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
    <div className="space-y-6 p-4">
      {/* Flight Parameters Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
          Flight Parameters
        </h3>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="altitude" className="text-foreground">
              Altitude (m)
            </Label>
            <Input
              id="altitude"
              type="number"
              placeholder="Altitude"
              value={altitude}
              onChange={(e) => onValueChange('altitude', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="speed" className="text-foreground">
              Speed (m/s)
            </Label>
            <Input
              id="speed"
              type="number"
              placeholder="Speed"
              value={speed}
              onChange={(e) => onValueChange('speed', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="angle" className="text-foreground">
              Gimbal Angle (°)
            </Label>
            <Input
              id="angle"
              type="number"
              placeholder="Angle"
              value={angle}
              onChange={(e) => onValueChange('angle', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Camera Settings Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
          Camera Settings
        </h3>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="focalLength" className="text-foreground">
              Focal Length (mm)
            </Label>
            <Input
              id="focalLength"
              type="number"
              placeholder="Focal Length"
              value={focalLength}
              onChange={(e) => onValueChange('focalLength', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sensorWidth" className="text-foreground">
              Sensor Width (mm)
            </Label>
            <Input
              id="sensorWidth"
              type="number"
              placeholder="Sensor Width"
              value={sensorWidth}
              onChange={(e) => onValueChange('sensorWidth', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sensorHeight" className="text-foreground">
              Sensor Height (mm)
            </Label>
            <Input
              id="sensorHeight"
              type="number"
              placeholder="Sensor Height"
              value={sensorHeight}
              onChange={(e) => onValueChange('sensorHeight', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Path Options Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
          Path Options
        </h3>

        <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="isNorthSouth"
            checked={isNorthSouth}
            onCheckedChange={(checked) => onValueChange('isNorthSouth', checked)}
          />
          <Label htmlFor="isNorthSouth">North-South Direction</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="useEndpointsOnly"
            checked={useEndpointsOnly}
            onCheckedChange={(checked) => onValueChange('useEndpointsOnly', checked)}
          />
          <Label htmlFor="useEndpointsOnly">Use Endpoints Only</Label>
        </div>
        </div>
      </div>

      {/* Photo Settings Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
          Photo Settings
        </h3>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="photoInterval" className="text-foreground">
              Photo Interval (s)
            </Label>
            <Input
              id="photoInterval"
              type="number"
              placeholder="Photo Interval"
              value={photoInterval}
              onChange={(e) => onValueChange('photoInterval', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="overlap" className="text-foreground">
              Overlap (%)
            </Label>
            <Input
              id="overlap"
              type="number"
              placeholder="Overlap"
              value={overlap}
              onChange={(e) => onValueChange('overlap', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inDistance" className="text-foreground">
              Line Spacing (m)
            </Label>
            <Input
              id="inDistance"
              type="number"
              placeholder="Line Spacing"
              value={inDistance}
              onChange={(e) => onValueChange('inDistance', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="allPointsAction" className="text-foreground">
              Waypoint Action
            </Label>
            <Select onValueChange={(value) => onValueChange('allPointsAction', value)} value={allPointsAction}>
              <SelectTrigger>
                <SelectValue placeholder="Select an action" />
              </SelectTrigger>
              <SelectContent>
                {ACTION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightParametersPanel;
