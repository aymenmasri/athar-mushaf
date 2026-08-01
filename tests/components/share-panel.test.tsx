import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import * as Linking from 'expo-linking';

import { SharePanel } from '@/components/dedication/share-panel';
import { buildWhatsAppUrl } from '@/lib/sharing';
import { ReadingProvider } from '@/providers/reading-provider';

const mockQRCode = jest.fn();

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    Ionicons: (props: Record<string, unknown>) =>
      React.createElement(View, { ...props, testID: `icon-${String(props.name)}` }),
  };
});

jest.mock('react-native-qrcode-svg', () => {
  const React = require('react');
  const { View } = require('react-native');

  return function MockQRCode(props: Record<string, unknown>) {
    mockQRCode(props);
    return React.createElement(View, { testID: 'mock-qr-code' });
  };
});

const REMOTE_SLUG = 'd_0123456789abcdef0123456789abcdef';
const PUBLIC_ORIGIN = 'https://athar.example';
const PUBLIC_URL = `${PUBLIC_ORIGIN}/dedication/${REMOTE_SLUG}`;

function renderPanel(props: React.ComponentProps<typeof SharePanel>) {
  return render(
    <ReadingProvider>
      <SharePanel {...props} />
    </ReadingProvider>,
  );
}

describe('SharePanel publication boundary', () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_APP_URL = PUBLIC_ORIGIN;
    mockQRCode.mockClear();
    jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  });

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_APP_URL;
    jest.restoreAllMocks();
  });

  it('offers no QR code, WhatsApp action, copy action, or public URL for a local dedication', async () => {
    const screen = renderPanel({ slug: 'local-1234567890abcdef', localOnly: true });

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('هذا الإهداء محفوظ على هذا الجهاز فقط ولا يمكن مشاركته.')).toBeTruthy();
    expect(screen.queryByTestId('public-dedication-qr')).toBeNull();
    expect(screen.queryByTestId('mock-qr-code')).toBeNull();
    expect(screen.queryByText('واتساب')).toBeNull();
    expect(screen.queryByText('نسخ الرابط')).toBeNull();
    expect(screen.queryByText(/\/dedication\/local-/u)).toBeNull();
    expect(mockQRCode).not.toHaveBeenCalled();
  });

  it('encodes the exact remote URL in the QR code and opens the matching WhatsApp URL', async () => {
    const screen = renderPanel({ slug: REMOTE_SLUG });

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText(PUBLIC_URL)).toBeTruthy();
    expect(screen.getByTestId('public-dedication-qr')).toBeTruthy();
    expect(mockQRCode).toHaveBeenCalledWith(
      expect.objectContaining({
        value: PUBLIC_URL,
        size: 164,
      }),
    );

    fireEvent.press(screen.getByRole('button', { name: 'واتساب' }));

    await waitFor(() => {
      expect(Linking.openURL).toHaveBeenCalledWith(buildWhatsAppUrl(PUBLIC_URL));
    });
  });
});
