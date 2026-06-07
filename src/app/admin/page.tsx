'use client';

import { useState, useEffect } from 'react';
import type { Workstation } from '@/types';

export default function AdminPage() {
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetch('/api/workstations')
      .then(r => r.json())
      .then(data => {
        setWorkstations(Array.isArray(data) ? data : []);
        setFetching(false);
      });
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');

    const res = await fetch('/api/workstations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        location: location.trim(),
        description: description.trim(),
      }),
    });

    if (res.ok) {
      const ws: Workstation = await res.json();
      setWorkstations(prev => [...prev, ws].sort((a, b) => a.name.localeCompare(b.name)));
      setName('');
      setLocation('');
      setDescription('');
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to add workstation.');
    }

    setLoading(false);
  }

  async function handleDelete(id: string, wsName: string) {
    if (!confirm(`Delete "${wsName}"? All reservations for this desk will also be removed.`)) return;

    const res = await fetch(`/api/workstations?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setWorkstations(prev => prev.filter(w => w.id !== id));
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm select-none">
              W
            </div>
            <span className="text-base font-semibold text-gray-900">Manage Desks</span>
          </div>
          <a href="/" className="btn-secondary text-sm">
            ← Reservations
          </a>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Add form */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Add a new desk</h2>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="label">Desk name *</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Desk A1, Window Seat 3"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Location</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Floor 2, Open Space North"
                value={location}
                onChange={e => setLocation(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Notes</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Standing desk, dual monitors, near window"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="btn-primary w-full"
            >
              {loading ? 'Adding…' : 'Add Desk'}
            </button>
          </form>
        </div>

        {/* Workstation list */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">All desks</h2>
            <span className="text-sm text-gray-400">{workstations.length} total</span>
          </div>

          {fetching ? (
            <p className="text-sm text-gray-400 text-center py-4">Loading…</p>
          ) : workstations.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              No desks added yet. Use the form above to add your first one.
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {workstations.map(ws => (
                <div key={ws.id} className="flex items-center justify-between py-3 gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm">{ws.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5 space-x-2">
                      {ws.location && <span>{ws.location}</span>}
                      {ws.location && ws.description && <span>·</span>}
                      {ws.description && <span>{ws.description}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(ws.id, ws.name)}
                    className="shrink-0 text-sm text-red-500 hover:text-red-700 font-medium px-2.5 py-1 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-center text-gray-400 pb-4">
          Removing a desk will cancel all its existing reservations.
        </p>
      </div>
    </div>
  );
}
