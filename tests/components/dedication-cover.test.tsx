import { act, render } from '@testing-library/react-native';

import { DedicationCover } from '@/components/dedication/dedication-cover';
import { ReadingProvider } from '@/providers/reading-provider';

describe('DedicationCover', () => {
  it('renders user content and status without interpreting it as Quran data', async () => {
    const screen = render(
      <ReadingProvider>
        <DedicationCover
          compact
          title="إهداء إلى روح والدينا"
          giverLabel="من ابنيكما: أيمن وحاتم المصري"
          dedication={{
            recipientName: 'محمود ووحيدة المصري',
            giverName: 'أيمن وحاتم المصري',
            message:
              'اللهم ارحمهما واغفر لهما، واجعل القرآن نورًا لهما في قبريهما، ورفعةً في درجاتهما، واجزهما عنا خير الجزاء، واجمعنا بهما في جنات النعيم.',
            recipientStatus: 'deceased',
            themeKey: 'emerald',
          }}
        />
      </ReadingProvider>,
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('إهداء إلى روح والدينا')).toBeTruthy();
    expect(screen.getByText('محمود ووحيدة المصري')).toBeTruthy();
    expect(
      screen.getByText(
        'اللهم ارحمهما واغفر لهما، واجعل القرآن نورًا لهما في قبريهما، ورفعةً في درجاتهما، واجزهما عنا خير الجزاء، واجمعنا بهما في جنات النعيم.',
      ),
    ).toBeTruthy();
    expect(screen.getByText('من ابنيكما: أيمن وحاتم المصري')).toBeTruthy();
  });
});
