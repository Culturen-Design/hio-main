import { createClient } from "@/lib/supabase/server";
import { ModuleRenderer } from "@hio/ui";
import { notFound } from "next/navigation";

// Public, read-only page. RLS allows anonymous SELECT on pages + sections.
export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: page } = await supabase
    .from("pages")
    .select("id, title")
    .eq("slug", slug)
    .maybeSingle();
  if (!page) notFound();

  const { data: sections } = await supabase
    .from("sections")
    .select("*")
    .eq("page_id", page.id)
    .order("order");

  return (
    <main style={{ fontFamily: "system-ui" }}>
      {(sections ?? []).map((s) => (
        <ModuleRenderer
          key={s.id}
          section={{ type: s.type, content: s.content, style_variant: s.style_variant }}
        />
      ))}
    </main>
  );
}
