import { Elysia, t } from "elysia";

export const testController = new Elysia({ prefix: "/test" })
  .get("/", () => "Test Controller")
  .get("/greet", ({ query }) => `Hello ${query.name}`, {
    query: t.Object({
      name: t.String(),
    }),
  })
  .get("/greet/:name", ({ params }) => `Hello ${params.name}`, {
    params: t.Object({
      name: t.String(),
    }),
  })
  .post("/greet", ({ body }) => `Hello ${body.name}`, {
    body: t.Object({
      name: t.String(),
    }),
  })
  .put("/greet/:name", ({ body, params }) => `Hello ${body.name} ${params.name}`, {
    params: t.Object({
      name: t.String(),
    }),
    body: t.Object({
      name: t.String(),
    }),
  })
  .delete("/greet/:name", ({ params }) => `Hello ${params.name}`, {
    params: t.Object({
      name: t.String(),
    }),
  });
