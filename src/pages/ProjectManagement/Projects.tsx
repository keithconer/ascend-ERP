import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ProjectsModal from "@/components/ProjectManagement/ProjectsModal";

export default function Projects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [projectTypes, setProjectTypes] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
    loadProjectTypes();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("m9_projects")
      .select(`
        project_id,
        project_code,
        project_name,
        status,
        expected_end_date,
        estimated_cost,
        project_type_id,
        m9_project_types(type_name)
      `)
      .order("created_at", { ascending: false });

    if (error) console.error("Error loading projects:", error);
    else setProjects(data || []);

    setLoading(false);
  };

  const loadProjectTypes = async () => {
    const { data, error } = await supabase
      .from("m9_project_types")
      .select("project_type_id, type_name")
      .eq("is_active", true)
      .order("type_name", { ascending: true });

    if (error) console.error("Error loading project types:", error);
    else setProjectTypes(data || []);
  };

  const handleModalClose = () => {
    setShowModal(false);
    loadProjects(); // refresh after closing modal
  };

  // ✅ Status color styles
  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case "not started":
        return "text-gray-700 bg-gray-200/60";
      case "in progress":
        return "text-blue-700 bg-blue-200/60";
      case "on hold":
        return "text-yellow-700 bg-yellow-200/60";
      case "completed":
        return "text-green-700 bg-green-200/60";
      default:
        return "text-muted-foreground bg-muted/60";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/projects")}
            className="rounded-full"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground ml-4">Projects</h1>
            <p className="text-muted-foreground ml-4">
              List of all projects in the system
            </p>
          </div>
        </div>

        <Button
          className="mt-4 sm:mt-0 flex items-center gap-2"
          onClick={() => setShowModal(true)}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Project
        </Button>
      </div>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle>Project List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : projects.length === 0 ? (
            <p className="text-muted-foreground">No projects found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Project Type</TableHead>
                  <TableHead>Expected End Date</TableHead>
                  <TableHead>Estimated Cost</TableHead>
                  <TableHead>Code</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((proj) => (
                  <TableRow
                    key={proj.project_id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => navigate(`/projects/${proj.project_id}`)}
                  >
                    <TableCell>{proj.project_name}</TableCell>

                    {/* ✅ Colored status badge */}
                    <TableCell>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(
                          proj.status
                        )}`}
                      >
                        {proj.status || "Not Started"}
                      </span>
                    </TableCell>

                    <TableCell>{proj.m9_project_types?.type_name || "—"}</TableCell>
                    <TableCell>
                      {proj.expected_end_date
                        ? new Date(proj.expected_end_date).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {proj.estimated_cost
                        ? `₱${Number(proj.estimated_cost).toLocaleString()}`
                        : "—"}
                    </TableCell>
                    <TableCell className="font-mono">{proj.project_code}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <ProjectsModal
        open={showModal}
        onClose={handleModalClose}
        projectTypes={projectTypes}
      />
    </div>
  );
}
