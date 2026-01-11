
import React, { useMemo } from 'react';
import { ParticlePosition } from '../types';

interface ParticleBoxProps {
  redCount: number;
  blueCount: number;
  label: string;
  subLabel: string;
}

const ParticleBox: React.FC<ParticleBoxProps> = ({ redCount, blueCount, label, subLabel }) => {
  const positions = useMemo(() => {
    const posList: ParticlePosition[] = [];
    const width = 250;
    const height = 150;
    const padding = 15;
    const radius = 24;

    const generatePos = () => {
      let attempts = 0;
      while (attempts < 100) {
        const x = Math.random() * (width - radius) + padding;
        const y = Math.random() * (height - radius) + padding;
        
        let overlaps = false;
        for (const pos of posList) {
          const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
          if (dist < radius + 2) {
            overlaps = true;
            break;
          }
        }
        
        if (!overlaps) return { x, y, delay: (Math.random() * 2).toFixed(1) + 's' };
        attempts++;
      }
      return { x: Math.random() * width, y: Math.random() * height, delay: '0s' };
    };

    for (let i = 0; i < redCount + blueCount; i++) {
      posList.push(generatePos());
    }
    return posList;
  }, [redCount, blueCount]);

  return (
    <div className="text-center w-full max-w-[280px] mx-auto">
      <div className="h-[180px] bg-gradient-to-b from-gray-50 to-gray-200 border-[3px] border-gray-600 rounded-xl relative overflow-hidden shadow-inner">
        {positions.slice(0, redCount).map((pos, i) => (
          <div
            key={`red-${i}`}
            className="particle w-6 h-6 rounded-full absolute bg-gradient-to-br from-[#ff6b6b] to-[#c0392b] floating shadow-lg"
            style={{ left: pos.x, top: pos.y, animationDelay: pos.delay }}
          />
        ))}
        {positions.slice(redCount, redCount + blueCount).map((pos, i) => (
          <div
            key={`blue-${i}`}
            className="particle w-6 h-6 rounded-full absolute bg-gradient-to-br from-[#74b9ff] to-[#0984e3] floating shadow-lg"
            style={{ left: pos.x, top: pos.y, animationDelay: pos.delay }}
          />
        ))}
      </div>
      <div className="mt-2 bg-gray-800 text-white py-1.5 px-4 rounded-lg inline-block shadow-md">
        <span className="font-bold text-sm">{label}</span>
        <span className="text-xs opacity-80 ml-1">({subLabel})</span>
      </div>
      <p className="text-xs text-gray-600 mt-1 italic font-medium">
        {redCount} merah, {blueCount} biru
      </p>
    </div>
  );
};

export default ParticleBox;
