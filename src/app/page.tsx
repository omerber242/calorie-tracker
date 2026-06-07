'use client';

import { useState, useEffect } from 'react';
import type { Workstation, Reservation } from '@/types';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function getMonday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const dy = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${dy}`;
}

function formatShort(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ReservationPage() {
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [myName, setMyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [modal, setModal] = useState<{
    type: 'book' | 'view';
    workstation: Workstation;
    date: Date;
    reservation?: Reservation;
  } | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [modalError, setModalError] = useState('');

  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));
  const todayStr = toDateStr(new Date());

  useEffect(() => {
    const saved = localStorage.getItem('ws_my_name');
    if (saved) setMyName(saved);
  }, []);

  useEffect(() => {
    const from = toDateStr(weekDays[0]);
    const to = toDateStr(weekDays[4]);
    setDataLoading(true);

    Promise.all([
      fetch('/api/workstations').then(r => r.json()),
      fetch(`/api/reservations?from=${from}&to=${to}`).then(r => r.json()),
    ]).then(([ws, res]) => {
      setWorkstations(Array.isArray(ws) ? ws : []);
      setReservations(Array.isArray(res) ? res : []);
      setDataLoading(false);
    });
  }, [weekStart]); // eslint-disable-line react-hooks/exhaustive-deps

  function getReservation(workstationId: string, date: Date): Reservation | undefined {
    return reservations.find(
      r => r.workstation_id === workstationId && r.date === toDateStr(date)
    );
  }

  function openBook(ws: Workstation, day: Date) {
    setNameInput(myName);
    setModalError('');
    setModal({ type: 'book', workstation: ws, date: day });
  }

  function openView(ws: Workstation, day: Date, res: Reservation) {
    setModal({ type: 'view', workstation: ws, date: day, reservation: res });
  }

  async function handleBook() {
    if (!modal || !nameInput.trim()) return;
    setLoading(true);
    setModalError('');

    const name = nameInput.trim();
    const res = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workstation_id: modal.workstation.id,
        person_name: name,
        date: toDateStr(modal.date),
      }),
    });

    if (res.ok) {
      const newRes: Reservation = await res.json();
      setReservations(prev => [...prev, newRes]);
      localStorage.setItem('ws_my_name', name);
      setMyName(name);
      setModal(null);
    } else {
      const data = await res.json();
      setModalError(data.error || 'Failed to reserve. Please try again.');
    }

    setLoading(false);
  }

  async function handleCancel() {
    if (!modal?.reservation) return;
    setLoading(true);

    const res = await fetch(`/api/reservations?id=${modal.reservation.id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setReservations(prev => prev.filter(r => r.id !== modal.reservation!.id));
      setModal(null);
    }

    setLoading(false);
  }

  const monthLabel = weekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm select-none">
              W
            </div>
            <span className="text-base font-semibold text-gray-900">WorkSpace</span>
          </div>
          <div className="flex items-center gap-3">
            {myName && (
              <span className="text-sm text-gray-500 hidden sm:inline">
                Hi,{' '}
                <button
                  className="font-medium text-gray-700 hover:text-blue-600 transition-colors"
                  onClick={() => {
                    const n = prompt('Change your name:', myName);
                    if (n?.trim()) {
                      localStorage.setItem('ws_my_name', n.trim());
                      setMyName(n.trim());
                    }
                  }}
                >
                  {myName}
                </button>
              </span>
            )}
            <a
              href="/admin"
              className="btn-secondary text-sm"
            >
              Manage Desks
            </a>
          </div>
        </div>
      </header>

      {/* Week nav */}
      <div className="max-w-7xl mx-auto px-4 pt-4 pb-2 flex items-center gap-3">
        <button
          onClick={() => setWeekStart(d => addDays(d, -7))}
          className="btn-secondary px-3 py-1.5 text-sm"
        >
          ← Prev
        </button>
        <div className="flex-1 text-center">
          <div className="font-semibold text-gray-900 text-sm sm:text-base">{monthLabel}</div>
          <div className="text-xs text-gray-400">
            {formatShort(weekDays[0])} – {formatShort(weekDays[4])}
          </div>
        </div>
        <button
          onClick={() => setWeekStart(getMonday(new Date()))}
          className="btn-secondary px-3 py-1.5 text-sm hidden sm:inline-flex"
        >
          Today
        </button>
        <button
          onClick={() => setWeekStart(d => addDays(d, 7))}
          className="btn-secondary px-3 py-1.5 text-sm"
        >
          Next →
        </button>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-10">
        {dataLoading ? (
          <div className="text-center py-20 text-gray-400 text-sm">Loading…</div>
        ) : workstations.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-3 select-none">🏢</div>
            <p className="font-medium text-gray-700">No workstations configured</p>
            <p className="text-sm text-gray-400 mt-1">
              Go to{' '}
              <a href="/admin" className="text-blue-600 underline hover:text-blue-700">
                Manage Desks
              </a>{' '}
              to add your first workstation.
            </p>
          </div>
        ) : (
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-36 sm:w-44">
                      Desk
                    </th>
                    {weekDays.map((day, i) => {
                      const isToday = toDateStr(day) === todayStr;
                      return (
                        <th
                          key={toDateStr(day)}
                          className={`px-2 py-3 text-center min-w-[100px] ${isToday ? 'bg-blue-50' : ''}`}
                        >
                          <div className={`text-xs font-semibold uppercase tracking-wider ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>
                            {DAY_NAMES[i]}
                          </div>
                          <div className={`text-lg font-bold leading-tight ${isToday ? 'text-blue-600' : 'text-gray-800'}`}>
                            {day.getDate()}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {workstations.map((ws, idx) => (
                    <tr key={ws.id} className={idx % 2 === 1 ? 'bg-gray-50/60' : ''}>
                      <td className="px-4 py-3 border-b border-gray-100 align-middle">
                        <div className="font-medium text-gray-900 text-sm leading-tight">{ws.name}</div>
                        {ws.location && (
                          <div className="text-xs text-gray-400 mt-0.5">{ws.location}</div>
                        )}
                      </td>
                      {weekDays.map(day => {
                        const dayStr = toDateStr(day);
                        const isToday = dayStr === todayStr;
                        const isPast = dayStr < todayStr;
                        const reservation = getReservation(ws.id, day);
                        const isMe = reservation?.person_name === myName && myName !== '';

                        return (
                          <td
                            key={dayStr}
                            className={`px-2 py-2 border-b border-gray-100 text-center align-middle ${isToday ? 'bg-blue-50/40' : ''}`}
                          >
                            {reservation ? (
                              <button
                                onClick={() => openView(ws, day, reservation)}
                                title={`${reservation.person_name} — click to view`}
                                className={`w-full px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                  isMe
                                    ? 'bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                                }`}
                              >
                                <span className="block truncate">{reservation.person_name}</span>
                              </button>
                            ) : isPast ? (
                              <span className="text-gray-300 text-base select-none">—</span>
                            ) : (
                              <button
                                onClick={() => openBook(ws, day)}
                                className="w-full px-2 py-1.5 rounded-lg text-xs font-medium text-emerald-600 border border-dashed border-emerald-300 hover:bg-emerald-50 hover:border-emerald-400 transition-all"
                              >
                                Available
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex flex-wrap gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded border border-dashed border-emerald-400 bg-emerald-50" />
                Available
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded bg-blue-100 border border-blue-300" />
                Your reservation
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded bg-slate-100 border border-slate-200" />
                Taken
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4"
          onClick={e => e.target === e.currentTarget && setModal(null)}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="px-5 pt-5 pb-4">
              {modal.type === 'book' ? (
                <>
                  <h2 className="text-base font-semibold text-gray-900">Reserve a desk</h2>
                  <p className="text-sm text-gray-500 mt-0.5 mb-4">
                    <strong>{modal.workstation.name}</strong>
                    {modal.workstation.location && ` · ${modal.workstation.location}`}
                    {' · '}
                    {modal.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                  <label className="label">Your name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Enter your name"
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleBook()}
                    autoFocus
                  />
                  {modalError && (
                    <p className="text-red-500 text-sm mt-2">{modalError}</p>
                  )}
                </>
              ) : (
                <>
                  <h2 className="text-base font-semibold text-gray-900">Desk reservation</h2>
                  <p className="text-sm text-gray-500 mt-0.5 mb-4">
                    <strong>{modal.workstation.name}</strong>
                    {modal.workstation.location && ` · ${modal.workstation.location}`}
                    {' · '}
                    {modal.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                  <div className="bg-blue-50 rounded-lg px-4 py-3">
                    <p className="text-sm text-blue-900">
                      Reserved by{' '}
                      <span className="font-semibold">{modal.reservation?.person_name}</span>
                    </p>
                  </div>
                </>
              )}
            </div>
            <div className="px-5 pb-5 flex gap-2">
              <button
                onClick={() => setModal(null)}
                className="btn-secondary flex-1"
              >
                Close
              </button>
              {modal.type === 'book' ? (
                <button
                  onClick={handleBook}
                  disabled={loading || !nameInput.trim()}
                  className="btn-primary flex-1"
                >
                  {loading ? 'Reserving…' : 'Reserve Desk'}
                </button>
              ) : (
                modal.reservation?.person_name === myName && myName !== '' && (
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 font-medium px-4 py-2 rounded-lg border border-red-200 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Cancelling…' : 'Cancel Reservation'}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
