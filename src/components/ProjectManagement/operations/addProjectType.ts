// src/components/ProjectManagement/operations/addProjectType.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

export async function addProjectType(data: { type_name: string; description: string }) {
  try {
    const { data: inserted, error } = await supabase
      .from("m9_project_types")
      .insert([
        {
          type_name: data.type_name,
          description: data.description,
          is_active: true,
        },
      ])
      .select("*")
      .single();

    if (error) throw error;
    return inserted;
  } catch (error) {
    console.error("Error adding project type:", error);
    throw error;
  }
}
