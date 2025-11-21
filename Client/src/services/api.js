import axios from 'axios'; 
const apiBaseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || '';

if (!import.meta || !import.meta.env || !import.meta.env.VITE_API_BASE_URL) {
    console.warn('VITE_API_BASE_URL is not defined or empty. Using default value: ');
}

const api = axios.create({
  baseURL: `${apiBaseUrl}/api/`,
});

// API call for generating waypoints
export const generateWaypoints = async (request) => {
  try {
    const response = await api.post('/waypoints/generate', request);
    return response.data; // Returns a list of generated waypoints
  }
  catch (error) {
    throw error.response?.data || 'Failed to generate waypoints';
  }
};

// API call for updating a waypoint
export const updateWaypoint = async (id, updatedWaypoint) => {
  try {
    const response = await api.put(`/waypoints/${id}`, updatedWaypoint);
    return response.data; // Returns the updated waypoint
  }
  catch (error) {
    throw error.response?.data || 'Failed to update waypoint';
  }
};

// API call for deleting a waypoint
export const deleteWaypoint = async (id) => {
  try {
    const response = await api.delete(`/waypoints/${id}`);
    return response.data; // Returns data related to the deleted waypoint
  }
  catch (error) {
    throw error.response?.data || 'Failed to delete waypoint';
  }
};
