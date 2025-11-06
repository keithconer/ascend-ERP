import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ProjectsTab from "@/components/ProjectManagement/ProjectsTab";
import TasksTab from "@/components/ProjectManagement/TasksTab";
import GanttChartTab from "@/components/ProjectManagement/GanttChartTab";

const ProjectManagementPage = () => {
  const [activeTab, setActiveTab] = useState("projects");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Project Management</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          <ProjectsTab />
        </TabsContent>

        <TabsContent value="tasks">
          <TasksTab />
        </TabsContent>

        <TabsContent value="gantt">
          <GanttChartTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectManagementPage;
