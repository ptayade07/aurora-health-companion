import React from 'react';
import Svg, { Rect } from 'react-native-svg';
import { type CompanionType, type CompanionMood, getCompanion } from '../lib/companion';

type Props = {
  companionId: CompanionType;
  mood: CompanionMood;
  size?: number; // display width; height = size (square container, sprite is 8×8)
};

function eyeRects(mood: CompanionMood, col: number, row: number): React.ReactElement[] {
  const k = `${col}-${row}`;
  switch (mood) {
    case 'sleeping':
      return [
        <Rect key={k} x={col + 0.1} y={row + 0.35} width={0.8} height={0.3} fill="#1A1A1A" rx={0.15} />,
      ];
    case 'tired':
      return [
        <Rect key={k} x={col} y={row} width={1} height={0.6} fill="#1A1A1A" rx={0.1} />,
      ];
    case 'calm':
      return [
        <Rect key={`${k}a`} x={col} y={row} width={1} height={1} fill="#1A1A1A" rx={0.1} />,
        <Rect key={`${k}b`} x={col + 0.55} y={row + 0.1} width={0.3} height={0.3} fill="white" />,
      ];
    case 'curious':
      return [
        <Rect key={`${k}a`} x={col - 0.1} y={row - 0.15} width={1.2} height={1.3} fill="#1A1A1A" rx={0.1} />,
        <Rect key={`${k}b`} x={col + 0.5} y={row + 0.05} width={0.4} height={0.4} fill="white" />,
      ];
    case 'happy':
      // bottom half only = squinting upward
      return [
        <Rect key={k} x={col} y={row + 0.45} width={1} height={0.55} fill="#1A1A1A" rx={0.1} />,
      ];
    case 'excited':
      return [
        <Rect key={`${k}a`} x={col} y={row} width={1} height={1} fill="#1A1A1A" rx={0.1} />,
        <Rect key={`${k}b`} x={col + 0.55} y={row + 0.1} width={0.35} height={0.35} fill="white" />,
        <Rect key={`${k}c`} x={col + 0.3} y={row - 0.5} width={0.4} height={0.4} fill="#FFE55C" rx={0.1} />,
      ];
    case 'celebrating':
      // gold cross/star eyes
      return [
        <Rect key={`${k}h`} x={col + 0.05} y={row + 0.3} width={0.9} height={0.35} fill="#FFD700" />,
        <Rect key={`${k}v`} x={col + 0.3} y={row + 0.05} width={0.35} height={0.9} fill="#FFD700" />,
      ];
  }
}

export default function PixelCompanion({ companionId, mood, size = 64 }: Props) {
  const companion = getCompanion(companionId);
  const { palette, sprite, eyeRow, eyeLeftCol, eyeRightCol, eyeBgColor } = companion;

  const basePixels: React.ReactElement[] = [];
  sprite.forEach((row, y) => {
    [...row].forEach((char, x) => {
      let key = char;
      // render eye bg color at 'E' positions so eye sits on correct face color
      if (char === 'E') key = eyeBgColor;
      if (key === '.') return;
      const fill = palette[key];
      if (!fill) return;
      basePixels.push(
        <Rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />
      );
    });
  });

  const leftEye = eyeRects(mood, eyeLeftCol, eyeRow);
  const rightEye = eyeRects(mood, eyeRightCol, eyeRow);

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 8 8"
      style={{ imageRendering: 'pixelated' } as any}
    >
      {basePixels}
      {leftEye}
      {rightEye}
    </Svg>
  );
}
