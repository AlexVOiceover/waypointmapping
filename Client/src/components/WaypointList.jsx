import PropTypes from 'prop-types';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { tableStyles, iconStyles } from '@/lib/styles';
import { cn } from '@/lib/utils';
import { ACTION_OPTIONS, ACTION_ICONS } from '@/lib/constants';

// Function to calculate row class based on waypoint type
const getRowClass = (waypoint, index, waypoints) => {
  const isVertex = waypoint.isVertex || 
    index === 0 || 
    index === waypoints.length - 1 || 
    (index > 0 && index < waypoints.length - 1 && hasSignificantHeadingChange(waypoints[index-1], waypoint, waypoints[index+1]));
  
  return isVertex ? 'bg-yellow-50' : '';
};

// Function to check if there's a significant heading change (to detect vertices)
const hasSignificantHeadingChange = (prev, current, next) => {
  if (!prev || !next) return false;
  
  const angle1 = Math.atan2(current.lat - prev.lat, current.lng - prev.lng) * 180 / Math.PI;
  const angle2 = Math.atan2(next.lat - current.lat, next.lng - current.lng) * 180 / Math.PI;
  
  const change = Math.abs((angle2 - angle1 + 180) % 360 - 180);
  return change > 15;
};

const WaypointList = ({ waypoints, onUpdate, onDelete }) => {
  const handleFieldChange = (id, field, value) => {
    onUpdate(id, { [field]: field === 'action' ? value : parseFloat(value) });
  };

  const handleDelete = (id) => {
    onDelete(id);
  };

  return (
    <div className="mt-4">
      <h4 className="mb-3 text-lg font-semibold text-gray-900">Waypoints</h4>
      {waypoints.length === 0 ? (
        <p className="text-gray-500">No waypoints available</p>
      ) : (
        <div className={tableStyles.container}>
          <table className={tableStyles.table}>
            <thead className={tableStyles.thead}>
              <tr>
                <th className={tableStyles.th}>ID</th>
                <th className={tableStyles.th}>Lat</th>
                <th className={tableStyles.th}>Lng</th>
                <th className={tableStyles.th}>Alt (m)</th>
                <th className={tableStyles.th}>Speed</th>
                <th className={tableStyles.th}>Heading</th>
                <th className={tableStyles.th}>G. Angle</th>
                <th className={tableStyles.th}>Action</th>
                <th className={tableStyles.th}>Actions</th>
              </tr>
            </thead>
            <tbody className={tableStyles.tbody}>
              {waypoints.map((wp, index) => (
                <tr key={wp.id} className={cn(getRowClass(wp, index, waypoints), tableStyles.rowHover)}>
                  <td className={tableStyles.cellText}>{wp.id}</td>
                  <td className={tableStyles.cellSubtext}>{wp.lat.toFixed(6)}</td>
                  <td className={tableStyles.cellSubtext}>{wp.lng.toFixed(6)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <Input
                      type="number"
                      className="w-20 h-7 text-xs"
                      value={wp.altitude}
                      onChange={(e) => handleFieldChange(wp.id, 'altitude', e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <Input
                      type="number"
                      className="w-16 h-7 text-xs"
                      value={wp.speed}
                      onChange={(e) => handleFieldChange(wp.id, 'speed', e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <div 
                        className="text-sm transition-transform" 
                        style={{ transform: `rotate(${wp.heading}deg)` }}
                      >
                        ➤
                      </div>
                      <Input
                        type="number"
                        className="w-16 h-7 text-xs"
                        value={wp.heading}
                        onChange={(e) => handleFieldChange(wp.id, 'heading', e.target.value)}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <Input
                      type="number"
                      className="w-16 h-7 text-xs"
                      value={wp.angle}
                      onChange={(e) => handleFieldChange(wp.id, 'angle', e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Select
                        value={wp.action}
                        className="w-32 h-7 text-xs"
                        onChange={(e) => handleFieldChange(wp.id, 'action', e.target.value)}
                      >
                        {ACTION_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                      <span className="text-sm">
                        {ACTION_ICONS[wp.action]}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleDelete(wp.id)}
                      >
                        <Trash2 className={iconStyles.small} />
                      </Button>
                      <span 
                        className="inline-block px-1.5 py-0.5 text-xs font-medium text-white rounded"
                        style={{
                          backgroundColor: index === 0 || index === waypoints.length - 1 ? '#FF4500' : 
                            getRowClass(wp, index, waypoints) ? '#FFC107' : '#3CB371'
                        }}
                        title={
                          index === 0 ? 'Start Point' : 
                          index === waypoints.length - 1 ? 'End Point' :
                          getRowClass(wp, index, waypoints) ? 'Vertex' : 'Intermediate'
                        }
                      >
                        {index === 0 ? 'S' : 
                         index === waypoints.length - 1 ? 'E' : 
                         getRowClass(wp, index, waypoints) ? 'V' : 'I'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

WaypointList.propTypes = {
  waypoints: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      lat: PropTypes.number.isRequired,
      lng: PropTypes.number.isRequired,
      altitude: PropTypes.number.isRequired,
      speed: PropTypes.number.isRequired,
      angle: PropTypes.number.isRequired,
      heading: PropTypes.number.isRequired,
      action: PropTypes.string.isRequired
    })
  ).isRequired,
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

export default WaypointList;
