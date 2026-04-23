import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../app.js'
import { db } from '../db/connection.js'
import { todos } from '../db/schema.js'

let app: FastifyInstance

beforeEach(async () => {
  // Clean todos table before each test for isolation
  await db.delete(todos)
  app = await buildApp()
})

afterEach(async () => {
  await app.close()
})

describe('POST /api/todos', () => {
  it('returns 201 with the created todo', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { description: 'Buy milk' },
    })

    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.id).toBeDefined()
    expect(body.description).toBe('Buy milk')
    expect(body.status).toBe('draft')
    expect(body.tags).toEqual([])
    expect(body.createdAt).toBeDefined()
    expect(body.updatedAt).toBeDefined()
  })

  it('returns 201 with tags serialised as string[]', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { description: 'Tagged todo', tags: ['work', 'urgent'] },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().tags).toEqual(['work', 'urgent'])
  })

  it('returns 400 when description is missing', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/todos',
      payload: {},
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error.code).toBe("VALIDATION_ERROR");
  })

  it('returns 400 when description is empty string', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { description: '' },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error.code).toBe("VALIDATION_ERROR");
  })
})

describe('GET /api/todos', () => {
  it('returns 200 with paginated envelope', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { description: 'Todo A' },
    })
    await app.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { description: 'Todo B' },
    })

    const res = await app.inject({ method: 'GET', url: '/api/todos' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(2)
    expect(body.pagination.total).toBe(2)
    expect(body.pagination.hasMore).toBe(false)
    expect(body.pagination.page).toBe(1)
    expect(body.pagination.limit).toBe(50)
  })

  it('returns todos ordered by createdAt descending', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { description: 'First' },
    })
    // Small delay to ensure distinct timestamps
    await new Promise((r) => setTimeout(r, 10))
    await app.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { description: 'Second' },
    })

    const res = await app.inject({ method: 'GET', url: '/api/todos' })
    const data = res.json().data

    expect(data[0].description).toBe('Second')
    expect(data[1].description).toBe('First')
  })

  it("returns 400 for invalid status query param", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/todos?status=bogus",
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("VALIDATION_ERROR");
  });

  it('filters by status', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { description: 'Draft todo' },
    })

    const res = await app.inject({
      method: 'GET',
      url: '/api/todos?status=draft',
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveLength(1)

    const emptyRes = await app.inject({
      method: 'GET',
      url: '/api/todos?status=ready',
    })
    expect(emptyRes.json().data).toHaveLength(0)
  })

  it('paginates results correctly', async () => {
    for (let i = 0; i < 5; i++) {
      await app.inject({
        method: 'POST',
        url: '/api/todos',
        payload: { description: `Todo ${i}` },
      })
    }

    const res = await app.inject({
      method: 'GET',
      url: '/api/todos?page=1&limit=3',
    })

    const body = res.json()
    expect(body.data).toHaveLength(3)
    expect(body.pagination.total).toBe(5)
    expect(body.pagination.hasMore).toBe(true)
  })

  it('returns empty data array when no todos', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/todos' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data).toEqual([])
    expect(res.json().pagination.total).toBe(0)
  })

  it('deserialises tags to string[]', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { description: 'Tagged', tags: ['a', 'b'] },
    })

    const res = await app.inject({ method: 'GET', url: '/api/todos' })
    expect(res.json().data[0].tags).toEqual(['a', 'b'])
  })
})

describe('DELETE /api/todos/:id', () => {
  it('returns 204 and removes the todo', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { description: 'To delete' },
    })
    const { id } = createRes.json()

    const deleteRes = await app.inject({
      method: 'DELETE',
      url: `/api/todos/${id}`,
    })
    expect(deleteRes.statusCode).toBe(204)

    const getRes = await app.inject({ method: 'GET', url: '/api/todos' })
    expect(getRes.json().data).toHaveLength(0)
  })

  it('returns 404 with NOT_FOUND error for unknown id', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/todos/non-existent-id',
    })

    expect(res.statusCode).toBe(404)
    expect(res.json()).toEqual({
      error: { code: 'NOT_FOUND', message: 'Todo not found' },
    })
  })
})

describe('Data persistence', () => {
  it('todos survive app close and reopen', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { description: 'Persistent todo' },
    })
    await app.close()

    // Reopen the app
    app = await buildApp()
    const res = await app.inject({ method: 'GET', url: '/api/todos' })
    expect(res.json().data[0].description).toBe('Persistent todo')
  })
})

describe("PATCH /api/todos/:id", () => {
  it("returns 200 with updated todo when status is valid", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/api/todos",
      payload: { description: "Test todo" },
    });
    const { id } = created.json();

    const res = await app.inject({
      method: "PATCH",
      url: `/api/todos/${id}`,
      payload: { status: "in_progress" },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.id).toBe(id);
    expect(body.status).toBe("in_progress");
    expect(body.description).toBe("Test todo");
    expect(body.createdAt).toBeDefined();
    expect(body.updatedAt).toBeDefined();
  });

  it("updatedAt is greater than createdAt after update", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/api/todos",
      payload: { description: "Timestamp test" },
    });
    const { id, createdAt } = created.json();

    await new Promise((r) => setTimeout(r, 5));

    const res = await app.inject({
      method: "PATCH",
      url: `/api/todos/${id}`,
      payload: { status: "ready" },
    });

    expect(res.statusCode).toBe(200);
    const { updatedAt } = res.json();
    expect(new Date(updatedAt).getTime()).toBeGreaterThan(
      new Date(createdAt).getTime(),
    );
  });

  it("returns 400 when status value is invalid", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/api/todos",
      payload: { description: "Test todo" },
    });
    const { id } = created.json();

    const res = await app.inject({
      method: "PATCH",
      url: `/api/todos/${id}`,
      payload: { status: "done" },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when status field is missing", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/api/todos",
      payload: { description: "Test todo" },
    });
    const { id } = created.json();

    const res = await app.inject({
      method: "PATCH",
      url: `/api/todos/${id}`,
      payload: {},
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 when id does not exist", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/api/todos/nonexistent-id",
      payload: { status: "ready" },
    });

    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe("NOT_FOUND");
  });
});
