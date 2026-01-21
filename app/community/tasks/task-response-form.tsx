'use client';

import { useState } from 'react';

type Props = {
  taskId: string;
};

const responses = [
  { value: 'seen', label: 'Gördüm' },
  { value: 'not_seen', label: 'Görmedim' },
  { value: 'maybe', label: 'Belki' },
] as const;

export function TaskResponseForm({ taskId }: Props) {
  const [responseType, setResponseType] = useState<(typeof responses)[number]['value']>('seen');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const submit = async () => {
    setStatus('sending');
    const res = await fetch('/api/tasks/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, responseType, message }),
    });

    setStatus(res.ok ? 'sent' : 'error');
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        {responses.map((item) => (
          <button
            key={item.value}
            type="button"
            className={`rounded-full border px-3 py-1 text-xs ${
              responseType === item.value ? 'bg-black text-white' : 'bg-white'
            }`}
            onClick={() => setResponseType(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <textarea
        className="w-full rounded-md border p-2 text-sm"
        rows={3}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Notunuzu ekleyin"
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white"
          onClick={submit}
          disabled={status === 'sending'}
        >
          Yanıt gönder
        </button>
        {status === 'sent' ? <span className="text-xs text-green-600">Gönderildi</span> : null}
        {status === 'error' ? (
          <span className="text-xs text-red-600">Gönderilemedi</span>
        ) : null}
      </div>
    </div>
  );
}
