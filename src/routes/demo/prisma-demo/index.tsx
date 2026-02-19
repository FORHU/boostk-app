import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { prisma } from "prisma/db";
import { useState } from "react";
import { auth } from "@/lib/auth";

const getUsers = createServerFn({ method: "GET" }).handler(async () => {
  return await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });
});

const createUser = createServerFn({ method: "POST" })
  .inputValidator((data: { name: string; email: string; password: string }) => data)
  .handler(async ({ data }) => {
    return await auth.api.signUpEmail({
      body: {
        email: data.email,
        password: data.password,
        name: data.name,
      },
    });
  });

export const Route = createFileRoute("/demo/prisma-demo/")({
  component: PrismaDemoPage,
  loader: async () => await getUsers(),
});

function PrismaDemoPage() {
  const router = useRouter();
  const users = Route.useLoaderData();
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending) return;

    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      setIsPending(true);
      await createUser({ data: { name, email, password } });

      form.reset();
      await router.invalidate();
    } catch (error) {
      console.error("Failed to create user:", error);
      alert("Error creating user. Check console.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen p-4 text-white font-sans selection:bg-indigo-500/30"
      style={{ background: "linear-gradient(135deg, #0c1a2b 0%, #1a2332 50%, #16202e 100%)" }}
    >
      <div
        className="w-full max-w-2xl p-8 rounded-xl shadow-2xl border border-white/10"
        style={{
          background: "linear-gradient(135deg, rgba(22, 32, 46, 0.95) 0%, rgba(12, 26, 43, 0.95) 100%)",
          backdropFilter: "blur(10px)",
        }}
      >
        {/* Header Section */}
        <div className="flex items-center justify-center gap-4 mb-8 p-4 rounded-lg border border-indigo-500/20 bg-indigo-500/5">
          <div className="relative group">
            <div className="absolute -inset-2 bg-linear-to-r from-indigo-500 to-purple-500 rounded-lg blur opacity-40 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative bg-slate-900 p-2 rounded-lg border border-white/10">
              <img src="/prisma.svg" alt="Prisma" className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-linear-to-r from-indigo-300 to-purple-300 text-transparent bg-clip-text">
            User Directory
          </h1>
        </div>

        {/* User List */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-indigo-400 mb-4 px-1">
            Registered Users ({users.length})
          </h2>
          <ul className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {users.map((user) => (
              <li
                key={user.id}
                className="group rounded-lg border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 transition-all"
              >
                <Link
                  to="/demo/prisma-demo/$userId/todos"
                  params={{ userId: user.id }}
                  className="flex items-center justify-between p-4 w-full"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-white group-hover:text-indigo-200 transition-colors">
                      {user.name}
                    </span>
                    <span className="text-sm text-indigo-300/50">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="hidden sm:block text-[10px] font-mono text-indigo-500/50 bg-black/20 px-2 py-1 rounded">
                      ID: {user.publicId}
                    </span>
                    <span className="text-indigo-400 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Link>
              </li>
            ))}
            {users.length === 0 && (
              <li className="text-center py-10 border border-dashed border-white/10 rounded-lg text-indigo-300/40">
                No users found.
              </li>
            )}
          </ul>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-6 border-t border-white/5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              required
              className="w-full px-4 py-3 rounded-lg bg-indigo-500/5 border border-indigo-500/20 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-indigo-300/30"
            />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              required
              className="w-full px-4 py-3 rounded-lg bg-indigo-500/5 border border-indigo-500/20 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-indigo-300/30"
            />
          </div>
          <input
            type="password"
            name="password"
            placeholder="Secure Password"
            required
            className="w-full px-4 py-3 rounded-lg bg-indigo-500/5 border border-indigo-500/20 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-indigo-300/30"
          />
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 font-bold rounded-lg bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Creating..." : "Add User to Database"}
          </button>
        </form>
      </div>
    </div>
  );
}
