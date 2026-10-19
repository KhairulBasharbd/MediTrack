import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Appointment } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { UrgencyBadge } from '../components/UrgencyBadge';
import { CardSkeleton } from '../components/LoadingSkeleton';
import {
  Calendar,
  Clock,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Phone,
  AlertCircle,
  Stethoscope,
  Sparkles,
  ClipboardList,
  Search,
  Trash2,
} from 'lucide-react';

export const DoctorDashboard: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [completingAppt, setCompletingAppt] = useState<Appointment | null>(null);
  const [consultationNotes, setConsultationNotes] = useState<string>('');

  useEffect(() => {
    fetchDoctorAppointments();
  }, []);

  const fetchDoctorAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.appointments.getAll();
      if (res.success && res.data) {
        setAppointments(res.data);
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: 'Could not fetch doctor appointments: ' + (err.response?.data?.message || err.message),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string, notes?: string) => {
    setActionLoadingId(id);
    setFeedback(null);
    try {
      const res = await api.appointments.updateStatus(id, newStatus, notes);
      if (res.success && res.data) {
        setAppointments((prev) =>
          prev.map((appt) => (appt.id === id ? { ...appt, status: res.data.status, notes: res.data.notes } : appt))
        );
        setFeedback({
          type: 'success',
          message: `Appointment status updated to ${newStatus}.`,
        });
        setCompletingAppt(null);
        setConsultationNotes('');
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Status transition failed.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Metrics calculation
  const totalCount = appointments.length;
  const pendingCount = appointments.filter((a) => a.status === 'PENDING').length;
  const confirmedCount = appointments.filter((a) => a.status === 'CONFIRMED').length;
  const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length;

  const handleDeleteAppointment = async (id: string) => {
    if (!window.confirm('Delete this appointment record?')) return;
    try {
      const res = await api.appointments.delete(id);
      if (res.success) {
        setAppointments((prev) => prev.filter((a) => a.id !== id));
        setFeedback({ type: 'success', message: 'Record deleted.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Delete failed.' });
    }
  };

  // Filtered queue with search
  const filteredAppointments = appointments.filter((appt) => {
    const matchesFilter = filter === 'ALL' || appt.status === filter;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      (appt.patient?.name || '').toLowerCase().includes(query) ||
      (appt.symptoms || '').toLowerCase().includes(query) ||
      (appt.aiCategory || '').toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`mb-5 p-3.5 sm:p-4 rounded-2xl flex items-center justify-between shadow-xs border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 ml-2 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Queue</p>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{totalCount}</p>
        </div>
        <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-amber-200 bg-amber-50/30 shadow-xs">
          <p className="text-[11px] sm:text-xs font-semibold text-amber-700 uppercase tracking-wider">Pending Action</p>
          <p className="text-xl sm:text-2xl font-bold text-amber-700 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-sky-200 bg-sky-50/30 shadow-xs">
          <p className="text-[11px] sm:text-xs font-semibold text-sky-700 uppercase tracking-wider">Confirmed</p>
          <p className="text-xl sm:text-2xl font-bold text-sky-700 mt-1">{confirmedCount}</p>
        </div>
        <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-xs">
          <p className="text-[11px] sm:text-xs font-semibold text-emerald-700 uppercase tracking-wider">Completed</p>
          <p className="text-xl sm:text-2xl font-bold text-emerald-700 mt-1">{completedCount}</p>
        </div>
      </div>

      {/* Main Appointment Management Queue */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-slate-200/80 shadow-xs sm:shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <ClipboardList className="w-5 h-5 text-sky-600 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Doctor's Clinical Queue</h2>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-48 md:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search patient or symptom..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 w-full"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium shrink-0">
              {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilter(st)}
                  className={`px-3 py-1.5 rounded-lg transition-all shrink-0 whitespace-nowrap ${
                    filter === st
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st.charAt(0) + st.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* List of Patients in Queue */}
        <div className="mt-6 space-y-4">
          {loading ? (
            <>
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : filteredAppointments.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Stethoscope className="w-8 h-8 mx-auto opacity-50 mb-2" />
              <p className="text-sm">No patient appointments found under this filter.</p>
            </div>
          ) : (
            filteredAppointments.map((appt) => {
              const dateObj = new Date(appt.scheduledAt);
              const formattedDate = dateObj.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              const formattedTime = dateObj.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              });

              const isActionLoading = actionLoadingId === appt.id;

              return (
                <div
                  key={appt.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-slate-300 shadow-xs transition-all space-y-4"
                >
                  {/* Top Bar: Patient Details & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-base">
                          {appt.patient?.name || 'Patient'}
                        </span>
                        {appt.aiUrgency && <UrgencyBadge urgency={appt.aiUrgency} />}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formattedDate}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {formattedTime}
                        </span>
                        {appt.patient?.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {appt.patient.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    <StatusBadge status={appt.status} />
                  </div>

                  {/* AI Clinical Triage Insight Box */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between font-semibold text-slate-700">
                      <span className="flex items-center gap-1.5 text-sky-800">
                        <Sparkles className="w-4 h-4 text-sky-600" />
                        AI Triage Analysis
                      </span>
                      {appt.aiCategory && (
                        <span className="text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                          Specialty: {appt.aiCategory}
                        </span>
                      )}
                    </div>

                    <p className="text-slate-800">
                      <strong className="text-slate-600">Reported Symptoms: </strong>
                      <span className="italic">"{appt.symptoms}"</span>
                    </p>

                    {appt.aiAdvice && (
                      <p className="text-slate-500 text-[11px] leading-relaxed pt-1 border-t border-slate-200/60">
                        {appt.aiAdvice}
                      </p>
                    )}
                  </div>

                  {/* Action Workflow Buttons (State Machine) */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2">
                    {appt.status === 'PENDING' && (
                      <>
                        <button
                          type="button"
                          disabled={isActionLoading}
                          onClick={() => handleUpdateStatus(appt.id, 'CANCELLED')}
                          className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl border border-rose-200 transition w-full sm:w-auto"
                        >
                          Decline / Cancel
                        </button>
                        <button
                          type="button"
                          disabled={isActionLoading}
                          onClick={() => handleUpdateStatus(appt.id, 'CONFIRMED')}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs shadow-sky-600/30 transition w-full sm:w-auto"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Confirm Appointment
                        </button>
                      </>
                    )}

                    {appt.status === 'CONFIRMED' && (
                      <>
                        <button
                          type="button"
                          disabled={isActionLoading}
                          onClick={() => handleUpdateStatus(appt.id, 'CANCELLED')}
                          className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl border border-rose-200 transition w-full sm:w-auto"
                        >
                          Cancel Appointment
                        </button>
                        <button
                          type="button"
                          disabled={isActionLoading}
                          onClick={() => {
                            setCompletingAppt(appt);
                            setConsultationNotes('');
                          }}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs shadow-emerald-600/30 transition w-full sm:w-auto"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Mark Consultation Completed
                        </button>
                      </>
                    )}

                    {appt.status === 'COMPLETED' && (
                      <span className="text-xs font-semibold text-emerald-700 flex items-center justify-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 w-full sm:w-auto">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Consultation Concluded (Locked)
                      </span>
                    )}

                    {appt.status === 'CANCELLED' && (
                      <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                        <span className="text-xs font-semibold text-rose-600 flex items-center gap-1 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                          <XCircle className="w-4 h-4 text-rose-600" />
                          Appointment Cancelled
                        </span>
                        <button
                          type="button"
                          disabled={isActionLoading}
                          onClick={() => handleDeleteAppointment(appt.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition shrink-0"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Display Clinical Notes if Available */}
                  {appt.notes && (
                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-950 space-y-1">
                      <span className="font-semibold text-emerald-800 flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        Doctor Consultation Notes / Advice:
                      </span>
                      <p className="whitespace-pre-wrap leading-relaxed break-words">{appt.notes}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Complete Consultation Modal */}
      {completingAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Conclude Consultation</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Patient: <span className="font-semibold text-slate-700">{completingAppt.patient?.name}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCompletingAppt(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="font-semibold text-slate-700">Patient Symptoms:</span>
              <p className="italic text-slate-800 break-words">"{completingAppt.symptoms}"</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Clinical Consultation Notes & Advice (Optional)
              </label>
              <textarea
                rows={4}
                placeholder="Enter diagnosis summary, prescription recommendations, or follow-up instructions for the patient..."
                value={consultationNotes}
                onChange={(e) => setConsultationNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCompletingAppt(null)}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoadingId === completingAppt.id}
                onClick={() =>
                  handleUpdateStatus(
                    completingAppt.id,
                    'COMPLETED',
                    consultationNotes.trim() || undefined
                  )
                }
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs shadow-emerald-600/30 transition text-center"
              >
                {actionLoadingId === completingAppt.id ? 'Saving...' : 'Save & Mark Completed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
