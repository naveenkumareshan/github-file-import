
import React, { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Navigation } from './Navigation';
import { Footer } from './Footer';
const ChatbotButton = lazy(() => import("@/components/JiyaChatbot/ChatbotButton"));

const StudentLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      <Suspense fallback={null}>
        <ChatbotButton />
      </Suspense>
    </div>
  );
};

export default StudentLayout;