import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="px-6 py-8 space-y-6">
      <h1 className="text-xl font-light tracking-wider uppercase text-charcoal">
        Profile
      </h1>
      <p className="text-sm text-mid">{user.email}</p>

      <form
        action={async () => {
          "use server";
          const supabase = await createClient();
          await supabase.auth.signOut();
          redirect("/login");
        }}
      >
        <button
          type="submit"
          className="text-sm text-mid underline underline-offset-2"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
