import { Polyline } from '@react-google-maps/api';

const POLYLINE_OPTIONS = {
  strokeColor: '#FF0000',
  strokeWeight: 2,
  clickable: true,
  editable: true,
  zIndex: 1,
};

interface DrawingIndicatorsProps {
  activeDrawingMode: string | null;
  circleCenter: google.maps.LatLngLiteral | null;
  drawingPoints: google.maps.LatLngLiteral[];
}

export const DrawingIndicators: React.FC<DrawingIndicatorsProps> = ({
  activeDrawingMode,
  circleCenter,
  drawingPoints
}) => {
  return (
    <>
      {/* Circle drawing indicator */}
      {activeDrawingMode === 'circle' && circleCenter && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255, 152, 0, 0.9)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '4px',
          pointerEvents: 'none',
          zIndex: 1000
        }}>
          Click to set radius
        </div>
      )}

      {/* Polyline drawing indicator */}
      {activeDrawingMode === 'polyline' && drawingPoints.length > 0 && (
        <>
          <Polyline
            path={drawingPoints}
            options={{ ...POLYLINE_OPTIONS, strokeOpacity: 0.6 }}
          />
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(255, 0, 0, 0.9)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            pointerEvents: 'none',
            zIndex: 1000
          }}>
            Click to add points • Enter to finish • Esc to cancel
          </div>
        </>
      )}
    </>
  );
};
