'use client';

import { useSyncExternalStore } from 'react';
import QRCode from 'react-qr-code';

interface QrCodeProps {
  value: string;
  label: string;
  size?: number;
}

const subscribe = () => () => undefined;

export function QrCode({ value, label, size = 160 }: QrCodeProps) {
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);
  if (!isClient || !value.startsWith('http')) return null;

  return (
    <figure className="inline-flex flex-col items-center gap-2">
      <div className="rounded-xl bg-white p-3">
        <QRCode value={value} size={size} bgColor="#ffffff" fgColor="#0b132b" />
      </div>
      <figcaption className="text-center text-sm text-cream/70">{label}</figcaption>
    </figure>
  );
}
