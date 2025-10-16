// src/pages/ProjectManagement/ProjectManagementPage.tsx

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProjectsDashboard from '@/components/ProjectManagement/ProjectsDashboard';
import Shortcuts from '@/components/ProjectManagement/Shortcuts';
import ReportsAndMasters from '@/components/ProjectManagement/ReportsAndMasters';

export default function ProjectManagementPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Project Management</h1>
        <p className="text-muted-foreground">
          Oversee project progress, assign tasks, monitor teams, and evaluate outcomes
        </p>
      </div>

      {/* Dashboard Section */}
      <ProjectsDashboard />

      {/* Shortcuts Section */}
      <Shortcuts />

      {/* Reports and Masters Section */}
      <ReportsAndMasters />

    </div>
  );
}
