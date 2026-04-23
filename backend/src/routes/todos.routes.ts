import type { FastifyInstance } from 'fastify'
import { db } from '../db/connection.js'
import { todos } from '../db/schema.js'
import { serializeTags, deserializeTags } from '../utils/tags.js'
import type { CreateTodoBody, PatchTodoBody } from "../types/todo.js";
import { eq, desc, count } from 'drizzle-orm'

const STATUS_ENUM = todos.status.enumValues;

export async function todosRoutes(app: FastifyInstance) {
  // GET /api/todos
  app.get(
    "/todos",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            status: { type: "string", enum: STATUS_ENUM },
            page: { type: "integer", minimum: 1, maximum: 10000, default: 1 },
            limit: { type: "integer", minimum: 1, maximum: 100, default: 50 },
          },
          additionalProperties: false,
        },
      },
    },
    async (request) => {
      const {
        status,
        page = 1,
        limit = 50,
      } = request.query as {
        status?: (typeof STATUS_ENUM)[number];
        page?: number;
        limit?: number;
      };
      const offset = (page - 1) * limit;

      const baseQuery = db.select().from(todos);
      const countQuery = db.select({ count: count() }).from(todos);

      const rows = status
        ? await baseQuery
            .where(eq(todos.status, status))
            .orderBy(desc(todos.createdAt))
            .limit(limit)
            .offset(offset)
        : await baseQuery
            .orderBy(desc(todos.createdAt))
            .limit(limit)
            .offset(offset);

      const [{ count: total }] = status
        ? await countQuery.where(eq(todos.status, status))
        : await countQuery;

      return {
        data: rows.map((row) => ({
          id: row.id,
          description: row.description,
          status: row.status,
          tags: deserializeTags(row.tags),
          createdAt: new Date(row.createdAt).toISOString(),
          updatedAt: new Date(row.updatedAt).toISOString(),
        })),
        pagination: {
          page,
          limit,
          total: Number(total),
          hasMore: offset + rows.length < Number(total),
        },
      };
    },
  );

  // POST /api/todos
  app.post(
    "/todos",
    {
      schema: {
        body: {
          type: "object",
          required: ["description"],
          properties: {
            description: {
              type: "string",
              minLength: 1,
              maxLength: 500,
              pattern: "\\S",
            },
            tags: {
              type: "array",
              items: { type: "string", minLength: 1, pattern: "^[^,]+$" },
              default: [],
            },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const body = request.body as CreateTodoBody;
      const nowMs = Date.now();

      const [created] = await db
        .insert(todos)
        .values({
          id: crypto.randomUUID(),
          description: body.description,
          status: "draft",
          tags: serializeTags(body.tags ?? []),
          createdAt: nowMs,
          updatedAt: nowMs,
        })
        .returning();

      reply.code(201);
      return {
        id: created.id,
        description: created.description,
        status: created.status,
        tags: deserializeTags(created.tags),
        createdAt: new Date(created.createdAt).toISOString(),
        updatedAt: new Date(created.updatedAt).toISOString(),
      };
    },
  );

  // DELETE /api/todos/:id
  app.delete(
    "/todos/:id",
    {
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string" },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const deleted = await db
        .delete(todos)
        .where(eq(todos.id, id))
        .returning();

      if (deleted.length === 0) {
        return reply.code(404).send({
          error: { code: "NOT_FOUND", message: "Todo not found" },
        });
      }

      return reply.code(204).send();
    },
  );

  // PATCH /api/todos/:id
  app.patch(
    "/todos/:id",
    {
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string" },
          },
          additionalProperties: false,
        },
        body: {
          type: "object",
          required: ["status"],
          properties: {
            status: { type: "string", enum: STATUS_ENUM },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { status } = request.body as PatchTodoBody;

      const existing = await db
        .select()
        .from(todos)
        .where(eq(todos.id, id))
        .limit(1);

      if (existing.length === 0) {
        return reply.code(404).send({
          error: { code: "NOT_FOUND", message: "Todo not found" },
        });
      }

      const [updated] = await db
        .update(todos)
        .set({ status, updatedAt: Date.now() })
        .where(eq(todos.id, id))
        .returning();

      return {
        id: updated.id,
        description: updated.description,
        status: updated.status,
        tags: deserializeTags(updated.tags),
        createdAt: new Date(updated.createdAt).toISOString(),
        updatedAt: new Date(updated.updatedAt).toISOString(),
      };
    },
  );
}
