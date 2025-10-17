// src/pages/ProjectManagement/ProjectTypeDetail.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, PlusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function ProjectTypeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [projectType, setProjectType] = useState<any>(null);
  const [description, setDescription] = useState("");
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      const numericId = Number(id);

      const { data, error } = await supabase
        .from("m9_project_types")
        .select("*")
        .eq("project_type_id", numericId)
        .single();

      if (error) console.error("Error loading project type:", error);
      else {
        setProjectType(data);
        setDescription(data.description || "");
      }

      const { data: commentData, error: commentError } = await supabase
        .from("m9_project_type_comments")
        .select("*")
        .eq("project_type_id", numericId)
        .order("created_at", { ascending: false });

      if (commentError) console.error("Error loading comments:", commentError);
      else if (commentData) setComments(commentData);
    };

    loadData();
  }, [id]);

  const handleDescriptionUpdate = async () => {
    if (!id) return;
    const numericId = Number(id);

    const { error } = await supabase
      .from("m9_project_types")
      .update({ description })
      .eq("project_type_id", numericId);

    if (error) alert("Failed to update description.");
    else alert("Description updated successfully!");
  };

  const handleAddComment = async () => {
    if (!comment.trim() || !id) return;
    const numericId = Number(id);

    const { data, error } = await supabase
      .from("m9_project_type_comments")
      .insert([
        {
          project_type_id: numericId,
          comment_text: comment,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error adding comment:", error);
      alert("Failed to add comment.");
    } else {
      setComments((prev) => [data, ...prev]);
      setComment("");
    }
  };

  if (!projectType)
    return (
      <div className="p-6">
        <p>Loading project type...</p>
      </div>
    );

  return (
    <div className="flex flex-col min-h-screen">
      {/* ======= HEADER (Full width) ======= */}
      <div className="w-full bg-background shadow-sm px-6 py-4 flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/projects/project-type")}
          className="rounded-full"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold">{projectType.type_name}</h1>
      </div>

      {/* ======= CONTENT (Below header) ======= */}
      <div className="flex flex-col lg:flex-row gap-6 p-6">
        {/* Left Sidebar */}
        <div className="w-full lg:w-1/4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                "Assigned To",
                "Attachment",
                "Reviews",
                "Shared With",
                "Tags",
              ].map((label) => (
                <div
                  key={label}
                  className="flex justify-between items-center"
                >
                  <span>{label}</span>
                  <Button size="icon" variant="outline">
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="w-full lg:w-3/4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
              <Button onClick={handleDescriptionUpdate} className="mt-3">
                Save Changes
              </Button>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <Button onClick={handleAddComment}>Post</Button>
              </div>

              <div className="space-y-2">
                {comments.length === 0 ? (
                  <p className="text-muted-foreground">No comments yet.</p>
                ) : (
                  comments.map((c) => (
                    <div
                      key={c.comment_id}
                      className="p-3 border rounded-md bg-muted/30"
                    >
                      <p className="text-sm text-foreground">
                        {c.comment_text}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(c.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
