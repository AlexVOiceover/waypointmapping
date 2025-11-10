import { useState } from 'react';
import PropTypes from 'prop-types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { badgeStyles } from '@/lib/styles';
import { cn } from '@/lib/utils';
import { WaypointActions, ACTION_OPTIONS, ACTION_ICONS, ACTION_BADGE_COLORS } from '@/lib/constants';

// Re-export for backward compatibility
export { WaypointActions };

const WaypointInfoBox = ({ waypoint, onSave, onRemove }) => {
    const [formData, setFormData] = useState({
        altitude: waypoint.altitude,
        speed: waypoint.speed,
        angle: waypoint.angle,
        heading: waypoint.heading,
        action: waypoint.action
    });

    // Handle form input changes
    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData({
            ...formData,
            [id]: id === 'action' ? value : parseFloat(value)
        });
    };

    // Handle Save button click
    const handleSave = () => {
        onSave({ id: waypoint.id, ...formData });
    };

    // Handle Remove button click
    const handleRemove = () => {
        onRemove(waypoint.id);
    };

    // Add a function to calculate distance to the next waypoint
    const calculateDistanceToNextWaypoint = () => {
        // This would normally come from props or context
        // For now, we'll just indicate it's not available
        return 'N/A';
    };

    // Add a function to format lat/lng for better readability
    const formatCoordinate = (coord) => {
        return coord.toFixed(6);
    };

    return (
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h4 className="mb-3 text-lg font-semibold text-gray-900">Edit Waypoint {waypoint.id}</h4>
            <div className="mb-2 text-sm text-gray-600">
                Location: {formatCoordinate(waypoint.lat)}, {formatCoordinate(waypoint.lng)}
            </div>

            {/* Add heading visualization */}
            <div className="flex items-center mb-3">
                <div 
                    className="text-2xl transition-transform"
                    style={{ transform: `rotate(${formData.heading}deg)` }}
                    title={`Heading: ${formData.heading}°`}
                >
                    ➤
                </div>
                <div className="ml-2">
                    <small className="text-sm text-gray-500">
                        Heading: {formData.heading}° | 
                        Distance to next: {calculateDistanceToNextWaypoint()}
                    </small>
                </div>
            </div>

            {/* Add a waypoint type indicator */}
            <div className={cn(badgeStyles.base, badgeStyles.blue, 'mb-3')}>
                {waypoint.isVertex ? 'Vertex Waypoint' : 'Intermediate Waypoint'}
            </div>

            <div className="space-y-3">
                <div className="space-y-2">
                    <Label htmlFor="altitude">Altitude (m)</Label>
                    <Input
                        id="altitude"
                        type="number"
                        value={formData.altitude}
                        onChange={handleChange}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="speed">Speed (m/s)</Label>
                    <Input
                        id="speed"
                        type="number"
                        value={formData.speed}
                        onChange={handleChange}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="angle">Gimbal Angle (degrees)</Label>
                    <Input
                        id="angle"
                        type="number"
                        value={formData.angle}
                        onChange={handleChange}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="heading">Heading (degrees North)</Label>
                    <Input
                        id="heading"
                        type="number"
                        value={formData.heading}
                        onChange={handleChange}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="action">Action</Label>
                    <div className="flex items-center gap-2">
                        <Select
                            id="action"
                            value={formData.action}
                            onChange={handleChange}
                        >
                            {ACTION_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </Select>
                        <div>
                            {ACTION_ICONS[formData.action] && (
                                <span className={cn(badgeStyles.base, badgeStyles[ACTION_BADGE_COLORS[formData.action]])}>
                                    {ACTION_ICONS[formData.action]}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-between mt-4 gap-2">
                <Button
                    onClick={handleSave}
                    className="flex-1"
                >
                    Save
                </Button>
                <Button
                    onClick={handleRemove}
                    variant="destructive"
                    className="flex-1"
                >
                    Remove
                </Button>
            </div>
        </div>
    );
};

// Add PropTypes for better type checking
WaypointInfoBox.propTypes = {
    waypoint: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        lat: PropTypes.number.isRequired,
        lng: PropTypes.number.isRequired,
        altitude: PropTypes.number.isRequired,
        speed: PropTypes.number.isRequired,
        angle: PropTypes.number.isRequired,
        heading: PropTypes.number.isRequired,
        action: PropTypes.string.isRequired,
        isVertex: PropTypes.bool
    }).isRequired,
    onSave: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired
};

export default WaypointInfoBox;
