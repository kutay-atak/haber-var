// In-memory stand-in for the Supabase admin client. Supports the subset of the
// query builder the server code uses: select / eq / neq / in / order / range /
// single / maybeSingle / upsert, plus auth.admin.getUserById and listUsers.
// Nested selects ("profiles ( display_name )") are not interpreted: rows are
// returned as stored, so test data embeds the joined objects directly.

type Row = Record<string, unknown>;

export const db: Record<string, Row[]> = {};
export const users: Record<string, { email?: string; locale?: string; created_at?: string; last_sign_in_at?: string; providers?: string[] }> = {};

/** Replaces every table with the given rows (deep-copied so tests cannot leak into each other). */
export function reset(tables: Record<string, Row[]>, people: typeof users = {}) {
  for (const key of Object.keys(db)) delete db[key];
  for (const [table, rows] of Object.entries(tables)) db[table] = structuredClone(rows);
  for (const key of Object.keys(users)) delete users[key];
  Object.assign(users, structuredClone(people));
}

function query(table: string) {
  let rows = [...(db[table] ?? [])];
  let range: [number, number] | null = null;
  // Chainable like the real builder; typed loosely on purpose, the tests only need it to behave.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder: any = {
    select: () => builder,
    eq: (column: string, value: unknown) => ((rows = rows.filter((row) => row[column] === value)), builder),
    neq: (column: string, value: unknown) => ((rows = rows.filter((row) => row[column] !== value)), builder),
    in: (column: string, values: unknown[]) => ((rows = rows.filter((row) => values.includes(row[column]))), builder),
    order: (column: string, options: { ascending?: boolean } = {}) => {
      if (rows.length && !(column in rows[0])) throw new Error(`column ${table}.${column} does not exist`);
      const direction = options.ascending === false ? -1 : 1;
      rows = rows.sort((a, b) => {
        const [x, y] = [a[column] as string | number, b[column] as string | number];
        return (x < y ? -1 : x > y ? 1 : 0) * direction;
      });
      return builder;
    },
    range: (from: number, to: number) => ((range = [from, to]), builder),
    single: async () => ({ data: rows[0] ?? null, error: rows.length === 1 ? null : { message: `expected one row in ${table}, got ${rows.length}` } }),
    maybeSingle: async () => ({ data: rows[0] ?? null, error: null }),
    upsert: async (row: Row, options: { onConflict?: string } = {}) => {
      const key = options.onConflict ?? "id";
      const list = (db[table] ??= []);
      const index = list.findIndex((existing) => existing[key] === row[key]);
      if (index >= 0) list[index] = { ...list[index], ...row };
      else list.push({ ...row });
      return { error: null };
    },
    then: (resolve: (value: { data: Row[]; error: null }) => unknown) =>
      resolve({ data: range ? rows.slice(range[0], range[1] + 1) : rows, error: null }),
  };
  return builder;
}

export function createAdminClient() {
  return {
    from: query,
    auth: {
      admin: {
        getUserById: async (id: string) => ({ data: { user: { user_metadata: { locale: users[id]?.locale } } } }),
        listUsers: async ({ page = 1, perPage = 50 }: { page?: number; perPage?: number } = {}) => {
          const all = Object.entries(users).map(([id, u]) => ({
            id,
            email: u.email,
            created_at: u.created_at,
            last_sign_in_at: u.last_sign_in_at,
            app_metadata: { providers: u.providers },
            user_metadata: { locale: u.locale },
          }));
          return { data: { users: all.slice((page - 1) * perPage, page * perPage) }, error: null };
        },
      },
    },
  };
}
