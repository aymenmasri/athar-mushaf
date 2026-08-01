import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/202608020001_recipient_status_alive.sql'),
  'utf8',
)
  .replace(/--.*$/gmu, ' ')
  .replace(/\s+/gu, ' ')
  .trim()
  .toLowerCase();

describe('recipient status migration', () => {
  it('migrates existing living rows before enforcing the alive vocabulary', () => {
    const dropConstraint = migration.indexOf(
      'drop constraint if exists dedications_recipient_status_allowed',
    );
    const dataMigration = migration.indexOf(
      "update public.dedications set recipient_status = 'alive' where recipient_status = 'living'",
    );
    const addConstraint = migration.indexOf(
      "add constraint dedications_recipient_status_allowed check (recipient_status in ('alive', 'deceased', 'unspecified'))",
    );

    expect(dropConstraint).toBeGreaterThan(-1);
    expect(dataMigration).toBeGreaterThan(dropConstraint);
    expect(addConstraint).toBeGreaterThan(dataMigration);
  });

  it('keeps the change transactional', () => {
    expect(migration).toMatch(/^begin;/u);
    expect(migration).toMatch(/commit;$/u);
  });
});
