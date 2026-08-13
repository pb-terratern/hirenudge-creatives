import { Sparkles } from "lucide-react";

import { signIn } from "@/auth";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center p-5">
      <section className="surface w-full max-w-md p-8 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--coral)]"><Sparkles size={20} /></span>
        <p className="eyebrow mt-6">Private workspace</p>
        <h1 className="mt-3 font-[var(--font-serif)] text-4xl">HireNudge Content Studio</h1>
        <p className="subtle mt-4 leading-7">Sign in with the allowlisted owner account to manage ideas, drafts and operational sync.</p>
        <form action={async () => { "use server"; await signIn("google", { redirectTo: "/ideas" }); }}>
          <button type="submit" className="primary-button mt-7 w-full">Continue with Google</button>
        </form>
      </section>
    </main>
  );
}
