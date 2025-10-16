// src/pages/ProjectManagement/ProjectType.tsx

import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, ArrowLeft } from "lucide-react";

import ProjectTypeModal from "@/components/ProjectManagement/ProjectTypeModal";
import { fetchProjectTypes } from "@/components/ProjectManagement/operations/fetchProjectTypes";
import { addProjectType } from "@/components/ProjectManagement/operations/addProjectType";

export default function ProjectType() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [projectTypes, setProjectTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjectTypes = async () => {
      try {
        const data = await fetchProjectTypes();
        setProjectTypes(data);
      } catch (err) {
        console.error("Error fetching project types:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProjectTypes();
  }, []);

  const handleAdd = async (newType: { type_name: string; description: string }) => {
    try {
        const inserted = await addProjectType(newType);
        setProjectTypes((prev) => [...prev, inserted]);
        setShowModal(false);
    } catch (err) {
        console.error("Error adding project type:", err);
        alert("Failed to add project type. Please try again.");
    }
  };    

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/projects")}
            className="rounded-full"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Project Type</h1>
            <p className="text-muted-foreground">
              Manage and categorize your organization’s project types.
            </p>
          </div>
        </div>

        <Button className="mt-4 sm:mt-0 flex items-center gap-2" onClick={() => setShowModal(true)}>
          <PlusCircle className="w-4 h-4" />
          Add Project Type
        </Button>
      </div>

      {/* Project Type Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">List of Project Types</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : projectTypes.length === 0 ? (
            <p className="text-muted-foreground">No project types found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectTypes.map((type) => (
                  <TableRow key={type.project_type_id}>
                    <TableCell>{type.project_type_id}</TableCell>
                    <TableCell className="font-medium">{type.type_name}</TableCell>
                    <TableCell>{type.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal for Adding Project Type */}
      <ProjectTypeModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleAdd}
      />
    </div>
  );
}
