'use client';

import { motion } from 'framer-motion';
import type { DiceResult } from '@/types/game';

type Props = {
  dice: DiceResult | null;
  embedded?: boolean;
};

function DieFace({
  value,
  rolling,
  embedded,
}: {
  value?: number;
  rolling?: boolean;
  embedded?: boolean;
}) {
  const size = embedded ? 'w-11 h-11 sm:w-12 sm:h-12' : 'w-14 h-14 sm:w-16 sm:h-16';
  const text = embedded ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl';

  return (
    <div
      className={`${size} bg-gradient-to-br from-white to-gray-100 border-2 border-gray-200 rounded-lg shadow-md flex items-center justify-center ${
        rolling ? 'animate-pulse' : ''
      }`}
    >
      {value !== undefined ? (
        <span className={`${text} font-bold text-[#1B5E20]`}>{value}</span>
      ) : (
        <span className="text-xl">🎲</span>
      )}
    </div>
  );
}

export function DiceAnimation({ dice, embedded }: Props) {
  if (!dice) {
    return (
      <div className={`flex gap-3 justify-center items-center ${embedded ? '' : 'py-2'}`}>
        <DieFace rolling embedded={embedded} />
        <DieFace rolling embedded={embedded} />
      </div>
    );
  }

  return (
    <motion.div
      className={`flex gap-3 justify-center items-center ${embedded ? '' : 'py-2'}`}
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 0.5 }}>
        <DieFace value={dice.die1} embedded={embedded} />
      </motion.div>
      <motion.div animate={{ rotate: [0, -360] }} transition={{ duration: 0.5 }}>
        <DieFace value={dice.die2} embedded={embedded} />
      </motion.div>
      {embedded ? (
        <span className="text-sm font-bold text-[#FFD700]">= {dice.total}</span>
      ) : (
        <span className="text-sm font-semibold text-gray-500">= {dice.total}</span>
      )}
    </motion.div>
  );
}
