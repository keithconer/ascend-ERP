import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import ProjectTasks from "./ProjectTasks"; // ✅ Import new component

// Fetch all projects
const fetchProjects = async () => {
  const { data, error } = await supabase
    .from("m9_projects")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
};

// Generate the next project code
const generateProjectCode = (projects: any[]) => {
  if (!projects || projects.length === 0) return "PROJ-0001";
  const codes = projects
    .map((p) => parseInt(p.project_code?.replace("PROJ-", "") || "0", 10))
    .filter((n) => !isNaN(n));
  const nextNumber = Math.max(...codes, 0) + 1;
  return `PROJ-${nextNumber.toString().padStart(4, "0")}`;
};

const ProjectsTab = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editProject, setEditProject] = useState<any>(null);
  const [newProjectCode, setNewProjectCode] = useState("PROJ-0001");

  // ✅ new state for viewing tasks
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });

  // Update project code when projects change
  React.useEffect(() => {
    if (projects) {
      setNewProjectCode(generateProjectCode(projects));
    }
  }, [projects]);

  const addProjectMutation = useMutation({
    mutationFn: async (project: any) => {
      const { data, error } = await supabase.from("m9_projects").insert([project]);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Project added successfully!");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsDialogOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateProjectMutation = useMutation({
    mutationFn: async (project: any) => {
      const { project_id, ...fieldsToUpdate } = project;
      const { data, error } = await supabase
        .from("m9_projects")
        .update(fieldsToUpdate)
        .eq("project_id", project_id);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Project updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsDialogOpen(false);
      setEditProject(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteProject = async (project_id: number) => {
    const { error } = await supabase.from("m9_projects").delete().eq("project_id", project_id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Project deleted");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    }
  };

  const filteredProjects = (projects || []).filter((proj: any) =>
    proj.project_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddProjectClick = () => {
    setEditProject(null);
    if (projects) {
      setNewProjectCode(generateProjectCode(projects));
    }
    setIsDialogOpen(true);
  };

  // ✅ if a project is selected, show the ProjectTasks view
  if (selectedProject) {
    return (
      <ProjectTasks
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search project..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={handleAddProjectClick}>Add Project</Button>
      </div>

      {/* Projects List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <p>Loading projects...</p>
        ) : filteredProjects.length > 0 ? (
          filteredProjects.map((project: any) => (
            <Card key={project.project_id}>
              <CardHeader>
                <CardTitle>{project.project_name}</CardTitle>
                <CardDescription>{project.project_code}</CardDescription>
              </CardHeader>
              <CardContent>
                <p>
                  <strong>Status:</strong>{" "}
                  <Badge>{project.status || "Unknown"}</Badge>
                </p>
                <p>
                  <strong>Expected End:</strong>{" "}
                  {project.expected_end_date || "N/A"}
                </p>
                <p>
                  <strong>Estimated Cost:</strong> ₱{project.estimated_cost || "0"}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedProject(project)} // ✅ Open tasks view
                >
                  View Tasks
                </Button>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditProject(project);
                      setIsDialogOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteProject(project.project_id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))
        ) : (
          <p className="text-muted-foreground">No projects found.</p>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editProject ? "Edit Project" : "Add New Project"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const formData = new FormData(form);
              const project = {
                project_code: formData.get("project_code") as string,
                project_name: formData.get("project_name") as string,
                status: formData.get("status") as string,
                expected_end_date: formData.get("expected_end_date") as string,
                estimated_cost: parseFloat(formData.get("estimated_cost") as string) || 0,
                updated_at: new Date().toISOString(),
              };

              if (editProject) {
                updateProjectMutation.mutate({
                  ...project,
                  project_id: editProject.project_id,
                });
              } else {
                addProjectMutation.mutate({
                  ...project,
                  created_at: new Date().toISOString(),
                });
              }
            }}
            className="space-y-4"
          >
            <div>
              <Label>Project Code</Label>
              <Input
                name="project_code"
                value={editProject ? editProject.project_code : newProjectCode}
                readOnly
              />
            </div>
            <div>
              <Label>Project Name</Label>
              <Input
                name="project_name"
                defaultValue={editProject?.project_name || ""}
                required
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                name="status"
                defaultValue={editProject?.status || "Not Started"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Not Started">Not Started</SelectItem>
                  <SelectItem value="On going">On going</SelectItem>
                  <SelectItem value="Incomplete">Incomplete</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Expected End Date</Label>
              <Input
                type="date"
                name="expected_end_date"
                defaultValue={editProject?.expected_end_date || ""}
              />
            </div>
            <div>
              <Label>Estimated Cost</Label>
              <Input
                type="number"
                name="estimated_cost"
                defaultValue={editProject?.estimated_cost || ""}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editProject ? "Save Changes" : "Add Project"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectsTab;
