import React, { useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select } from '@/components/ui/select';
import type { FlightParameters } from '@/types';

interface FlightParametersPanelProps {
  flightParameters: FlightParameters;
  onValueChange: (field: string, value: string) => void;
}

/**
 * Component for displaying and editing flight parameters
 */
const FlightParametersPanel: React.FC<FlightParametersPanelProps> = ({
  flightParameters,
  onValueChange
}) => {
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
    setUseEndpointsOnly,
    setIsNorthSouth
  } = flightParameters;

  const checkboxRef = useRef<HTMLInputElement>(null);
  const northSouthCheckboxRef = useRef<HTMLInputElement>(null);

  // Direct DOM manipulation to force checkbox state
  const handleEndpointsOnlyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    console.log(`Direct checkbox change to: ${newValue} (${typeof newValue})`);

    // Force the checkbox checked state via DOM - do this first
    if (checkboxRef.current) {
      checkboxRef.current.checked = newValue;
    }

    // Then update the React state with the explicit boolean value
    setUseEndpointsOnly(newValue === true);

    console.log('After setting, checkbox.checked =', checkboxRef.current?.checked);
  };

  // Direct DOM manipulation to force North-South checkbox state
  const handleNorthSouthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    console.log(`North-South checkbox change to: ${newValue} (${typeof newValue})`);

    // Force the checkbox checked state via DOM - do this first
    if (northSouthCheckboxRef.current) {
      northSouthCheckboxRef.current.checked = newValue;
    }

    // Then update the React state with the explicit boolean value
    setIsNorthSouth(newValue === true);

    console.log('After setting, N-S checkbox.checked =', northSouthCheckboxRef.current?.checked);
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
          <Checkbox
            ref={northSouthCheckboxRef}
            checked={isNorthSouth}
            onChange={handleNorthSouthChange}
            label="North-South Direction"
          />

          <Checkbox
            ref={checkboxRef}
            checked={useEndpointsOnly}
            onChange={handleEndpointsOnlyChange}
            label="Use Endpoints Only"
          />
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
            <Select
              id="allPointsAction"
              value={allPointsAction}
              onChange={(e) => onValueChange('allPointsAction', e.target.value)}
            >
              <option value="noAction">No Action</option>
              <option value="takePhoto">Take Photo</option>
              <option value="startRecord">Start Recording</option>
              <option value="stopRecord">Stop Recording</option>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightParametersPanel;
