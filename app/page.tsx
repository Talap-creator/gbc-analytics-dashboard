import { getSupabaseBrowserClient } from "@/lib/supabase";
import Dashboard from "./dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  // Fetch orders server-side for initial render
  const supabase = getSupabaseBrowserClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .order("created_at_retailcrm", { ascending: true });

  return <Dashboard orders={orders || []} />;
}
