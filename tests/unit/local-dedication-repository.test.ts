import {
  createLocalDedication,
  deleteLocalDedication,
  getLocalDedication,
  getOwnedLocalDedication,
  updateLocalDedication,
} from '@/lib/dedication/local-repository';

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => '12345678-1234-4234-8234-123456789abc'),
}));

const draft = {
  recipientName: 'مريم العلي',
  giverName: 'سليم العلي',
  message: 'رسالة خاصة للاختبار.',
  recipientStatus: 'living' as const,
  themeKey: 'emerald',
};

describe('local dedication lifecycle', () => {
  it('hides a disabled dedication and removes it completely for its owner', async () => {
    const created = await createLocalDedication(draft);
    await expect(getLocalDedication(created.slug)).resolves.toMatchObject({ isActive: true });

    await expect(updateLocalDedication(created.slug, { isActive: false })).resolves.toMatchObject({
      isActive: false,
    });
    await expect(getLocalDedication(created.slug)).resolves.toBeNull();
    await expect(getOwnedLocalDedication(created.slug)).resolves.toMatchObject({ isActive: false });

    await expect(deleteLocalDedication(created.slug)).resolves.toBe(true);
    await expect(getOwnedLocalDedication(created.slug)).resolves.toBeNull();
    await expect(deleteLocalDedication(created.slug)).resolves.toBe(false);
  });
});
