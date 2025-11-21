import { createContext, useContext, ReactNode } from 'react';
import { useFlightParameters } from '../hooks/useFlightParameters';

// Type for the context value
type FlightParamsContextValue = ReturnType<typeof useFlightParameters>;

interface FlightParamsProviderProps {
  children: ReactNode;
}

// Create the context
const FlightParamsContext = createContext<FlightParamsContextValue | undefined>(undefined);

// Context provider component
export const FlightParamsProvider: React.FC<FlightParamsProviderProps> = ({ children }) => {
  const flightParams = useFlightParameters();

  return (
    <FlightParamsContext.Provider value={flightParams}>
      {children}
    </FlightParamsContext.Provider>
  );
};

// Custom hook to use the flight params context
export const useFlightParamsContext = (): FlightParamsContextValue => {
  const context = useContext(FlightParamsContext);
  if (context === undefined) {
    throw new Error('useFlightParamsContext must be used within a FlightParamsProvider');
  }
  return context;
};

export default FlightParamsContext;
