import { createClient } from "@supabase/supabase-js";
import videos from "./demo-videos.json" assert { type: "json" };

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error(
    "Missing env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

// Strip non-UUID ids from demo data and upsert by youtube_id
const cleaned = videos.map(({ id, ...rest }) => rest);

const { data, error } = await supabase
  .from("videos")
  .upsert(cleaned, { onConflict: "youtube_id" })
  .select("id");

if (error) {
  console.error("Seed failed:", error.message);
  process.exit(1);
}

console.log(`Seeded ${data?.length ?? 0} videos.`);
