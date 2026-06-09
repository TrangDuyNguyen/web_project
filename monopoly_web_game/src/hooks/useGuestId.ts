'use client';

import { useEffect, useState } from 'react';

export function useGuestId(): string {
  const [guestId, setGuestId] = useState('');

  useEffect(() => {
    let id = localStorage.getItem('monopoly_guest_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('monopoly_guest_id', id);
    }
    setGuestId(id);
  }, []);

  return guestId;
}
