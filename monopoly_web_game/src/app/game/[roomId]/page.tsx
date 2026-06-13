import { Suspense } from 'react';
import GamePageClient from './GamePageClient';

type Props = { params: Promise<{ roomId: string }> };

export default function GamePage(props: Props) {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-500">Đang tải...</div>}>
      <GamePageClient {...props} />
    </Suspense>
  );
}
