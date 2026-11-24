import React from 'react';
import { Outlet } from 'react-router-dom';

export default function RootLayout() {
  return (
    <div className="min-h-screen w-full bg-white dark:bg-[#212121] text-gray-900 dark:text-gray-100 flex flex-col antialiased">
      <Outlet />
    </div>
  );
}
