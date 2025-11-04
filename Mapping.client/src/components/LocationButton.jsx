import { useCallback } from 'react';
import PropTypes from 'prop-types';

const LocationButton = ({ map }) => {
  const handleCenterLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
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
  }, [map]);

  return (
    <button
      className="absolute bottom-10 right-10 bg-white rounded-full shadow-md p-2 hover:bg-gray-100 focus:outline-none"
      onClick={handleCenterLocation}
      title="Center on my location"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
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
  map: PropTypes.object.isRequired,
};

export default LocationButton;
