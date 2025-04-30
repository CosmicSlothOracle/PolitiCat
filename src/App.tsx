import React from "react";
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import { InGamePage } from './components/InGamePage';

// Create router with future flags
const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <LandingPage />
    },
    {
      path: "/play",
      element: <InGamePage />
    }
  ],
  {
    future: {
      // Only use flags that are available in version 6.30.0
      v7_relativeSplatPath: true
    }
  }
);

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;
