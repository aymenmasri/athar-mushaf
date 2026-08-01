import Svg, { Circle, G, Path } from 'react-native-svg';

type GeometricMarkProps = {
  size?: number;
  color?: string;
  accent?: string;
  opacity?: number;
};

export function GeometricMark({
  size = 180,
  color = '#173E34',
  accent = '#AA8741',
  opacity = 1,
}: GeometricMarkProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200" accessibilityLabel="زخرفة هندسية">
      <G opacity={opacity}>
        <Circle cx="100" cy="100" r="72" fill="none" stroke={color} strokeWidth="1.5" />
        <Path
          d="M100 22 126 74 178 100 126 126 100 178 74 126 22 100 74 74Z"
          fill="none"
          stroke={color}
          strokeWidth="2"
        />
        <Path
          d="M100 42 116 84 158 100 116 116 100 158 84 116 42 100 84 84Z"
          fill="none"
          stroke={accent}
          strokeWidth="2"
        />
        <Circle cx="100" cy="100" r="13" fill={color} />
        <Circle cx="100" cy="100" r="5" fill={accent} />
      </G>
    </Svg>
  );
}
