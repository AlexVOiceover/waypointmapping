import { useCallback } from 'react';
import PropTypes from 'prop-types';

const LocationButton = ({ map, setLatitude, setLongitude }) => {
  const handleCenterLocation = useCallback(() => {
    if (!map) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          // Update latitude and longitude fields
          if (setLatitude) {
            setLatitude(pos.lat.toFixed(6));
          }
          if (setLongitude) {
            setLongitude(pos.lng.toFixed(6));
          }

          map.setCenter(pos);
          map.setZoom(15);
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert("Error: The Geolocation service failed.");
        }
      );
    } else {
      alert("Error: Your browser doesn't support geolocation.");
    }
  }, [map, setLatitude, setLongitude]);

  // Don't render button until map is loaded
  if (!map) {
    return null;
  }

  return (
    <button
      className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-md p-2 hover:bg-gray-100 focus:outline-none z-30"
      onClick={handleCenterLocation}
      title="Center on my location"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
        />
      </svg>
    </button>
  );
};

LocationButton.propTypes = {
  map: PropTypes.object,
  setLatitude: PropTypes.func,
  setLongitude: PropTypes.func,
};

export default LocationButton;
