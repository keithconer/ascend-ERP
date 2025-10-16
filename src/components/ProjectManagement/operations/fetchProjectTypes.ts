// src/components/ProjectManagement/operations/fetchProjectTypes.ts
import { supabase } from "@/integrations/supabase/client";

export async function fetchProjectTypes() {
  const { data, error } = await supabase
    .from("m9_project_types")
    .select("project_type_id, type_name, description")
    .order("project_type_id", { ascending: true });

  if (error) {
    console.error("❌ Error fetching project types:", error.message);
    throw error;
  }

  return data || [];
}
