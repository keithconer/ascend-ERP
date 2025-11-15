import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {ProjectsManagement} from "@/components/ProjectManagement/ProjectsManagement";
import {ResourceManagement} from "@/components/ProjectManagement/ResourceManagement";
import {TasksManagement} from "@/components/ProjectManagement/TasksManagement";
import { GanttChart } from "@/components/ProjectManagement/GanttChart";



const ProjectManagementPage = () => {
  const [activeTab, setActiveTab] = useState("projects");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Project Management</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="projects">Projects Management</TabsTrigger>
          <TabsTrigger value="resource">Resource Management</TabsTrigger>
          <TabsTrigger value="tasks">Tasks Management</TabsTrigger>
          <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          <ProjectsManagement />
        </TabsContent>

        <TabsContent value="resource">
          <ResourceManagement />
        </TabsContent>

        <TabsContent value="tasks">
          <TasksManagement />
        </TabsContent>

        <TabsContent value="gantt">
          <GanttChart />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectManagementPage;
