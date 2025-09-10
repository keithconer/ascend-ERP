import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface ERPLayoutProps {
  children: ReactNode;
}

export const ERPLayout = ({ children }: ERPLayoutProps) => {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-6">
        {children}
      </main>
    </div>
  );
};