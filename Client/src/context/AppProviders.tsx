import { ReactNode } from 'react';
import { FlightParamsProvider } from './FlightParamsContext';
import { ShapeProvider } from './ShapeContext';
import { MapProvider } from './MapContext';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Combined context providers for the application.
 * Order matters: MapProvider depends on ShapeProvider.
 * FlightParamsProvider is independent.
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <FlightParamsProvider>
      <ShapeProvider>
        <MapProvider>
          {children}
        </MapProvider>
      </ShapeProvider>
    </FlightParamsProvider>
  );
};
