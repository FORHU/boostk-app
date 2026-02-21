import { createServerFn } from "@tanstack/react-start";

const todos = [
  { id: 1, title: "Todo 1", userId: 1 },
  { id: 2, title: "Todo 2", userId: 1 },
  { id: 3, title: "Todo 3", userId: 2 },
  { id: 4, title: "Todo 4", userId: 2 },
  { id: 5, title: "Todo 5", userId: 3 },
  { id: 6, title: "Todo 6", userId: 3 },
  { id: 7, title: "Todo 7", userId: 4 },
  { id: 8, title: "Todo 8", userId: 4 },
  { id: 9, title: "Todo 9", userId: 5 },
  { id: 10, title: "Todo 10", userId: 5 },
];

export const getTodosByUser = createServerFn({ method: "GET" })
  .inputValidator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    return todos.filter((todo) => todo.userId === Number(userId));
  });

export const createTodo = createServerFn({ method: "POST" })
  .inputValidator((data: { title: string; userId: string }) => data)
  .handler(async ({ data }) => {
    todos.push({
      id: todos.length + 1,
      title: data.title,
      userId: Number(data.userId),
    });
    return todos;
  });
