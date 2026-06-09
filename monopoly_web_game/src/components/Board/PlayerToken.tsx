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
      className="absolute w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-white shadow"
      style={{ backgroundColor: color, top: 4 + offset * 6, left: 4 + offset * 6 }}
      title={name}
    />
  );
}
