import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const rawSql = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/202608010001_initial_schema.sql'),
  'utf8',
);
const withoutComments = rawSql.replace(/--.*$/gmu, ' ');
const normalize = (value: string) => value.replace(/\s+/gu, ' ').trim().toLowerCase();
const sql = normalize(withoutComments);
const statements = withoutComments.split(';').map(normalize).filter(Boolean);

function expectSql(fragment: string) {
  expect(sql).toContain(normalize(fragment));
}

describe('Supabase migration security contract', () => {
  it('enables RLS and keeps every policy owner-scoped', () => {
    for (const table of ['dedications', 'reading_progress', 'bookmarks']) {
      expectSql(`alter table public.${table} enable row level security`);
    }

    const expectedPolicies = [
      ['dedications_owner_select', 'for select', 'using ((select auth.uid()) = created_by)'],
      ['dedications_owner_insert', 'for insert', 'with check ((select auth.uid()) = created_by)'],
      [
        'dedications_owner_update',
        'for update',
        'using ((select auth.uid()) = created_by)',
        'with check ((select auth.uid()) = created_by)',
      ],
      ['dedications_owner_delete', 'for delete', 'using ((select auth.uid()) = created_by)'],
      ['reading_progress_owner_select', 'for select', 'using ((select auth.uid()) = user_id)'],
      ['reading_progress_owner_insert', 'for insert', 'with check ((select auth.uid()) = user_id)'],
      [
        'reading_progress_owner_update',
        'for update',
        'using ((select auth.uid()) = user_id)',
        'with check ((select auth.uid()) = user_id)',
      ],
      ['reading_progress_owner_delete', 'for delete', 'using ((select auth.uid()) = user_id)'],
      ['bookmarks_owner_select', 'for select', 'using ((select auth.uid()) = user_id)'],
      ['bookmarks_owner_insert', 'for insert', 'with check ((select auth.uid()) = user_id)'],
      ['bookmarks_owner_delete', 'for delete', 'using ((select auth.uid()) = user_id)'],
    ];
    const policies = statements.filter((statement) => statement.startsWith('create policy '));

    expect(policies).toHaveLength(expectedPolicies.length);
    for (const [name, ...fragments] of expectedPolicies) {
      const policy = policies.find((statement) => statement.startsWith(`create policy ${name} `));
      expect(policy).toBeDefined();
      expect(policy).toMatch(/\bto authenticated\b/u);
      for (const fragment of fragments) expect(policy).toContain(fragment);
    }
    expect(policies.some((policy) => /\bto (?:anon|public)\b/u.test(policy))).toBe(false);
  });

  it('does not grant direct table access to anon or PUBLIC', () => {
    for (const table of ['dedications', 'reading_progress', 'bookmarks']) {
      expectSql(`revoke all on table public.${table} from public, anon, authenticated`);
    }
    const tableGrants = statements.filter(
      (statement) => statement.startsWith('grant ') && statement.includes(' on table public.'),
    );
    expect(tableGrants.length).toBeGreaterThan(0);
    expect(tableGrants.every((statement) => /\bto authenticated$/u.test(statement))).toBe(true);
    expect(tableGrants.some((statement) => /\bto (?:public|anon)(?:\b|,)/u.test(statement))).toBe(
      false,
    );
  });

  it('exposes one narrow exact-slug SECURITY DEFINER lookup', () => {
    const rpc = withoutComments.match(
      /create or replace function public\.get_public_dedication\(p_slug text\)([\s\S]*?)\$\$;/iu,
    )?.[0];
    expect(rpc).toBeDefined();

    const rpcSql = normalize(rpc!);
    const returnedColumns = rpc!.match(/returns table\s*\(([\s\S]*?)\)\s*language/iu)?.[1];
    expect(normalize(returnedColumns!)).toBe(
      'slug text, recipient_name text, recipient_status text, giver_name text, message text, theme_key text, created_at timestamptz',
    );
    expect(rpcSql).toContain('security definer');
    expect(rpcSql).toContain('set search_path = pg_catalog');
    expect(rpcSql).toContain("where p_slug ~ '^d_[a-f0-9]{32}$'");
    expect(rpcSql).toContain('and d.slug = p_slug');
    expect(rpcSql).toContain("and d.visibility = 'unlisted'");
    expect(rpcSql).toContain('and d.is_active');
    expect(rpcSql).toContain('limit 1');
    expect(sql.match(/\bsecurity definer\b/gu)).toHaveLength(1);
  });

  it('grants anon only the exact-slug RPC and preserves 128-bit slugs', () => {
    expectSql('revoke all on function public.get_public_dedication(text) from public');
    expectSql(
      'grant execute on function public.get_public_dedication(text) to anon, authenticated',
    );
    const anonGrants = statements.filter(
      (statement) => statement.startsWith('grant ') && /\bto anon(?:,|$)/u.test(statement),
    );
    expect(anonGrants).toEqual([
      'grant execute on function public.get_public_dedication(text) to anon, authenticated',
    ]);
    expectSql("select 'd_' || encode(gen_random_bytes(16), 'hex')");
    expectSql("check (slug ~ '^d_[a-f0-9]{32}$')");
  });
});
