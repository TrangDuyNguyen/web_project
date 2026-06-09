'use client';

import { motion } from 'framer-motion';
import type { DiceResult } from '@/types/game';

type Props = { dice: DiceResult | null };

export function DiceAnimation({ dice }: Props) {
  if (!dice) {
    return (
      <div className="flex gap-3 justify-center">
        <div className="w-12 h-12 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center text-xl">🎲</div>
        <div className="w-12 h-12 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center text-xl">🎲</div>
      </div>
    );
  }

  return (
    <motion.div className="flex gap-3 justify-center" initial={{ rotate: 0 }} animate={{ rotate: 360 }} transition={{ duration: 0.8 }}>
      <div className="w-12 h-12 bg-white border-2 border-[#1B5E20] rounded-lg flex items-center justify-center text-2xl font-bold">
        {dice.die1}
      </div>
      <div className="w-12 h-12 bg-white border-2 border-[#1B5E20] rounded-lg flex items-center justify-center text-2xl font-bold">
        {dice.die2}
      </div>
    </motion.div>
  );
}
