import { themes } from '@/constants/theme';
import { useReading } from '@/providers/reading-provider';

export function useAtharTheme() {
  const { preferences } = useReading();
  return themes[preferences.theme];
}
