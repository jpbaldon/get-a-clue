'use client';

import { useState } from 'react';

import { claimHostDevice, getHostDeviceId, type HostDeviceRole } from '@/lib/game';

import { Button } from './ui';

interface HostPairingProps {
  code: string;
  hostId: string;
  boardReady: boolean;
  controlReady: boolean;
  origin: string;
}

export function HostPairing({ code, hostId, boardReady, controlReady, origin }: HostPairingProps) {
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const boardUrl = `${origin}/host/${code}/board`;
  const controlUrl = `${origin}/host/${code}/control`;
  const ready = boardReady && controlReady;

  const copy = async (label: string, url: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(label);
  };

  const claim = async (role: HostDeviceRole) => {
    try {
      setError('');
      await claimHostDevice(code, hostId, role, getHostDeviceId());
      window.location.assign(role === 'board' ? boardUrl : controlUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not claim this screen.');
    }
  };

  return (
    <section className="mx-auto max-w-3xl space-y-5 rounded-2xl border border-gold/30 bg-white/5 p-6">
      <h1 className="text-4xl font-black text-gold">Two host screens</h1>
      <p className="text-cream/80">
        Share the board screen on Discord. Use a second device for answers and judging. Sign in with the same
        Google account on both. Two tabs in this browser are the same device.
      </p>
      <p className="text-center text-5xl font-black tracking-widest text-gold">{code}</p>
      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-cream/15 p-4">
          <h2 className="mb-2 text-2xl font-black">Board</h2>
          <p className="mb-3 text-sm text-cream/70">{boardReady ? 'Connected' : 'Not connected'}</p>
          <p className="mb-3 break-all text-xs text-cream/60">{boardUrl}</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void claim('board')}>This is the board</Button>
            <Button variant="secondary" onClick={() => void copy('board', boardUrl)}>
              {copied === 'board' ? 'Copied' : 'Copy URL'}
            </Button>
          </div>
        </article>
        <article className="rounded-xl border border-cream/15 p-4">
          <h2 className="mb-2 text-2xl font-black">Controls</h2>
          <p className="mb-3 text-sm text-cream/70">{controlReady ? 'Connected' : 'Not connected'}</p>
          <p className="mb-3 break-all text-xs text-cream/60">{controlUrl}</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void claim('control')}>This is the control screen</Button>
            <Button variant="secondary" onClick={() => void copy('control', controlUrl)}>
              {copied === 'control' ? 'Copied' : 'Copy URL'}
            </Button>
          </div>
        </article>
      </div>
      <p className={ready ? 'font-bold text-gold' : 'text-cream/70'}>
        {ready
          ? 'Both screens are ready. Use Controls to start when contestants have joined.'
          : 'Waiting for two different devices.'}
      </p>
      {error ? <p className="rounded-xl bg-red-900/50 p-3 text-red-100">{error}</p> : null}
    </section>
  );
}
