import { act, render } from '@testing-library/react-native';

import { AppText } from '@/components/common/app-text';
import { ReadingProvider } from '@/providers/reading-provider';

describe('Arabic RTL theme', () => {
  it('applies RTL writing direction to shared text', async () => {
    const screen = render(
      <ReadingProvider>
        <AppText>أثر</AppText>
      </ReadingProvider>,
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByText('أثر')).toHaveStyle({ writingDirection: 'rtl', textAlign: 'right' });
  });
});
