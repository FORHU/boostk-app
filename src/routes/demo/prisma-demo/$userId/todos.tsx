import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { prisma } from "prisma/db";

/**
 * Server function to fetch todos filtered by userId
 */
const getTodosByUser = createServerFn({ method: "GET" })
  .inputValidator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    return await prisma.todo.findMany({
      where: {
        userId: userId, // Matches the Int ID from your User model
      },
      orderBy: { createdAt: "desc" },
    });
  });

/**
 * Server function to create a todo linked to a specific user
 */
const createTodo = createServerFn({ method: "POST" })
  .inputValidator((data: { title: string; userId: string }) => data)
  .handler(async ({ data }) => {
    return await prisma.todo.create({
      data: {
        title: data.title,
        userId: data.userId,
      },
    });
  });

export const Route = createFileRoute("/demo/prisma-demo/$userId/todos")({
  component: TodosPage,
  // Loader passes the URL param to the server function
  loader: async ({ params }) => {
    const todos = await getTodosByUser({ data: params.userId });
    return { todos };
  },
});

function TodosPage() {
  const { userId } = Route.useParams();
  const { todos } = Route.useLoaderData();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;

    if (!title) return;

    try {
      await createTodo({
        data: {
          title,
          userId,
        },
      });
      router.invalidate();
      e.currentTarget.reset();
    } catch (error) {
      console.error("Failed to create todo:", error);
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen p-4 text-white"
      style={{
        background: "linear-gradient(135deg, #0c1a2b 0%, #1a2332 50%, #16202e 100%)",
      }}
    >
      <div
        className="w-full max-w-2xl p-8 rounded-xl shadow-2xl border border-white/10"
        style={{
          background: "linear-gradient(135deg, rgba(22, 32, 46, 0.95) 0%, rgba(12, 26, 43, 0.95) 100%)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-linear-to-r from-indigo-300 to-purple-300 text-transparent bg-clip-text">
            User #{userId}'s Tasks
          </h1>
          <p className="text-indigo-300/60 text-sm">Managing todos for this specific profile</p>
        </div>

        <ul className="space-y-3 mb-6">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="rounded-lg p-4 border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-lg">{todo.title}</span>
                <span className="text-xs text-indigo-400">Todo ID: {todo.id}</span>
              </div>
            </li>
          ))}
          {todos.length === 0 && <li className="text-center py-8 text-indigo-300/70">No tasks for this user.</li>}
        </ul>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            name="title"
            placeholder="What needs to be done?"
            className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-linear-to-r from-indigo-600 to-purple-600 rounded-lg font-bold hover:scale-105 transition-transform"
          >
            Add Task
          </button>
        </form>
      </div>
    </div>
  );
}
