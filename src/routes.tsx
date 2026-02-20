import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import NotFound from './pages/NotFound';

const router = createBrowserRouter([
  {
    path: '*',
    element: <NotFound />,
  },
]);

export default router;
