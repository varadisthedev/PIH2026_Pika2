import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { RentalProvider } from './context/RentalContext.jsx';
import { LocationProvider } from './context/LocationContext.jsx';
import LocationModal from './components/LocationModal.jsx';
import AppRoutes from './routes/AppRoutes.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <RentalProvider>
          <LocationProvider>
            <AppRoutes />
            <LocationModal />
          </LocationProvider>
        </RentalProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}