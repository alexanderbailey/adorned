import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Builder, type BuilderItem } from "./Builder";

export default async function BuilderPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: items } = await supabase
    .from("items")
    .select("id, cutout_image_url, thumb_image_url, category, subcategory, primary_color_hex")
    .eq("user_id", user.id)
    .eq("archived", false)
    .order("created_at", { ascending: false });

  return <Builder items={(items ?? []) as BuilderItem[]} />;
}
