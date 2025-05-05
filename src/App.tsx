import * as React from "react";
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import { InGamePage } from './components/InGamePage';
import { P2PGamePage } from './components/P2PGamePage';
import BrandIntro from './components/BrandIntro';
import BeatEmUpQTE from './components/BeatEmUpQTE';

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
    },
    {
      path: "/multiplayer",
      element: <P2PGamePage />
    },
    {
      path: "/qte-test",
      element: <BeatEmUpQTE />
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
  const [showIntro, setShowIntro] = React.useState(() => {
    return !sessionStorage.getItem('brandIntroSeen');
  });

  const handleIntroFinish = () => {
    setShowIntro(false);
    sessionStorage.setItem('brandIntroSeen', 'true');
  };

  return (
    <>
      {showIntro ? (
        <BrandIntro onFinish={handleIntroFinish} />
      ) : (
        <RouterProvider router={router} />
      )}
    </>
  );
};

export default App;
