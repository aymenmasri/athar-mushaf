import type { BrowserContext, Route } from '@playwright/test';

type ClientName = 'creator' | 'reader';

type DedicationInsert = {
  giver_name: string;
  message: string;
  recipient_name: string;
  recipient_status: 'alive' | 'deceased' | 'unspecified';
  theme_key: string;
};

type DedicationRow = DedicationInsert & {
  created_at: string;
  created_by: string;
  id: string;
  is_active: boolean;
  slug: string;
  updated_at: string;
  visibility: 'unlisted';
};

const API_ORIGIN = 'https://e2e.supabase.co';
const CORS_HEADERS = {
  'access-control-allow-headers':
    'authorization, apikey, content-profile, content-type, x-client-info',
  'access-control-allow-methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'access-control-allow-origin': '*',
  'content-type': 'application/json; charset=utf-8',
};

function encodeJwtPart(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  });
}

function queryValue(url: URL, key: string): string | null {
  const value = url.searchParams.get(key);
  return value?.startsWith('eq.') ? value.slice(3) : value;
}

/**
 * A deliberately small PostgREST/GoTrue double used only by the browser suite.
 * Every attached BrowserContext gets its own auth identity while all contexts
 * read the same in-memory dedication rows, like independent real browsers.
 */
export class FakeSupabase {
  private readonly rows = new Map<string, DedicationRow>();
  private readonly signIns = new Map<ClientName, number>();
  private sequence = 0;

  async attach(context: BrowserContext, clientName: ClientName): Promise<void> {
    await context.route(`${API_ORIGIN}/**`, (route) => this.handle(route, clientName));
  }

  signInCount(clientName: ClientName): number {
    return this.signIns.get(clientName) ?? 0;
  }

  private userId(clientName: ClientName): string {
    return clientName === 'creator'
      ? '10000000-0000-4000-8000-000000000001'
      : '20000000-0000-4000-8000-000000000002';
  }

  private user(clientName: ClientName) {
    const now = '2026-08-02T12:00:00.000Z';
    return {
      id: this.userId(clientName),
      aud: 'authenticated',
      role: 'authenticated',
      email: '',
      phone: '',
      app_metadata: { provider: 'anonymous', providers: ['anonymous'] },
      user_metadata: {},
      identities: [],
      is_anonymous: true,
      created_at: now,
      updated_at: now,
    };
  }

  private session(clientName: ClientName) {
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + 60 * 60;
    const user = this.user(clientName);
    const accessToken = [
      encodeJwtPart({ alg: 'HS256', typ: 'JWT' }),
      encodeJwtPart({
        aud: 'authenticated',
        exp: expiresAt,
        iat: issuedAt,
        role: 'authenticated',
        sub: user.id,
      }),
      'e2e-signature',
    ].join('.');

    return {
      access_token: accessToken,
      token_type: 'bearer',
      expires_in: 60 * 60,
      expires_at: expiresAt,
      refresh_token: `e2e-refresh-${clientName}`,
      user,
    };
  }

  private createDedication(clientName: ClientName, insert: DedicationInsert): DedicationRow {
    this.sequence += 1;
    const suffix = this.sequence.toString(16).padStart(32, '0');
    const idSuffix = this.sequence.toString(16).padStart(12, '0');
    const now = '2026-08-02T12:00:00.000Z';
    const row: DedicationRow = {
      ...insert,
      id: `30000000-0000-4000-8000-${idSuffix}`,
      slug: `d_${suffix}`,
      created_by: this.userId(clientName),
      visibility: 'unlisted',
      is_active: true,
      created_at: now,
      updated_at: now,
    };
    this.rows.set(row.slug, row);
    return row;
  }

  private publicRow(row: DedicationRow) {
    return {
      slug: row.slug,
      recipient_name: row.recipient_name,
      recipient_status: row.recipient_status,
      giver_name: row.giver_name,
      message: row.message,
      theme_key: row.theme_key,
      created_at: row.created_at,
    };
  }

  private async handle(route: Route, clientName: ClientName): Promise<void> {
    const request = route.request();
    const url = new URL(request.url());

    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS_HEADERS });
      return;
    }

    if (url.pathname === '/auth/v1/signup' && request.method() === 'POST') {
      this.signIns.set(clientName, this.signInCount(clientName) + 1);
      await json(route, this.session(clientName));
      return;
    }

    if (url.pathname === '/auth/v1/user' && request.method() === 'GET') {
      await json(route, this.user(clientName));
      return;
    }

    if (url.pathname === '/rest/v1/dedications' && request.method() === 'POST') {
      const insert = request.postDataJSON() as DedicationInsert | DedicationInsert[];
      const values = Array.isArray(insert) ? insert[0] : insert;
      if (!values) {
        await json(route, { message: 'Missing dedication payload' }, 400);
        return;
      }
      await json(route, this.createDedication(clientName, values), 201);
      return;
    }

    if (url.pathname === '/rest/v1/dedications' && request.method() === 'GET') {
      const slug = queryValue(url, 'slug');
      const createdBy = queryValue(url, 'created_by');
      const row = slug ? this.rows.get(slug) : undefined;
      await json(route, row && row.created_by === createdBy ? [row] : []);
      return;
    }

    if (url.pathname === '/rest/v1/rpc/get_public_dedication' && request.method() === 'POST') {
      const { p_slug: slug } = request.postDataJSON() as { p_slug?: string };
      const row = slug ? this.rows.get(slug) : undefined;
      await json(route, row?.is_active ? [this.publicRow(row)] : []);
      return;
    }

    await json(
      route,
      { message: `Unhandled fake Supabase request: ${request.method()} ${url.pathname}` },
      501,
    );
  }
}
