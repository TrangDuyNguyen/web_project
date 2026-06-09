import type { GameEvent } from '@/types/game';

let counter = 0;

export function createEvent(message: string, type: GameEvent['type'] = 'info'): GameEvent {
  return {
    id: `evt-${Date.now()}-${counter++}`,
    timestamp: Date.now(),
    message,
    type,
  };
}
