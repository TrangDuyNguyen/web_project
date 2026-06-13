'use client';

import { motion } from 'framer-motion';

type Props = {
  color: string;
  name: string;
  offset?: number;
};

export function PlayerToken({ color, name, offset = 0 }: Props) {
  return (
    <motion.div
      layout
      className="absolute w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-white shadow-md ring-1 ring-black/20 z-20"
      style={{ backgroundColor: color, top: 6 + offset * 7, left: 6 + offset * 7 }}
      title={name}
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    />
  );
}
