import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const todos = sqliteTable('todos', {
  id: text('id').primaryKey(),
  description: text('description').notNull(),
  status: text('status', {
    enum: ['draft', 'ready', 'in_progress', 'backlog', 'completed'],
  })
    .notNull()
    .default('draft'),
  tags: text('tags').notNull().default(''),
  // Stored as unix milliseconds (integer) for sub-second precision
  createdAt: integer('created_at')
    .notNull()
    .$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at')
    .notNull()
    .$defaultFn(() => Date.now()),
})
