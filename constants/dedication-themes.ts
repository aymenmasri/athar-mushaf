export type DedicationThemeKey = 'emerald' | 'indigo' | 'clay';

export type DedicationTheme = {
  key: DedicationThemeKey;
  label: string;
  background: string;
  surface: string;
  primary: string;
  accent: string;
  text: string;
};

export const dedicationThemes: DedicationTheme[] = [
  {
    key: 'emerald',
    label: 'زمردي',
    background: '#153F34',
    surface: '#F9F5E9',
    primary: '#153F34',
    accent: '#C1A35D',
    text: '#1C2824',
  },
  {
    key: 'indigo',
    label: 'نيلي',
    background: '#27344D',
    surface: '#F5F1E8',
    primary: '#27344D',
    accent: '#B99655',
    text: '#222A38',
  },
  {
    key: 'clay',
    label: 'طيني',
    background: '#744A3D',
    surface: '#FAF1E8',
    primary: '#744A3D',
    accent: '#C49C60',
    text: '#352823',
  },
];

export function getDedicationTheme(key: string): DedicationTheme {
  return dedicationThemes.find((theme) => theme.key === key) ?? dedicationThemes[0]!;
}
