import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Appointment, Doctor, TimeSlot, TriageResult } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { UrgencyBadge } from '../components/UrgencyBadge';
import { CardSkeleton, SlotsSkeleton } from '../components/LoadingSkeleton';
import {
  Calendar,
  Clock,
  Sparkles,
  Stethoscope,
  AlertCircle,
  CheckCircle2,
  XCircle,
  PlusCircle,
  History,
  Info,
  Trash2,
  Search,
} from 'lucide-react';

export const PatientDashboard: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Booking form states
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toLocaleDateString('en-CA');
  });
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlotIso, setSelectedSlotIso] = useState<string>('');
  const [symptoms, setSymptoms] = useState<string>('');
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);

  // AI Triage preview state
  const [previewTriage, setPreviewTriage] = useState<TriageResult | null>(null);
  const [triageLoading, setTriageLoading] = useState<boolean>(false);

  // Submission feedback
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [apptsRes, docsRes] = await Promise.all([
        api.appointments.getAll(),
        api.doctors.getAll(),
      ]);

      if (apptsRes.success && apptsRes.data) {
        setAppointments(apptsRes.data);
      }
      if (docsRes.success && docsRes.data) {
        setDoctors(docsRes.data);
        if (docsRes.data.length > 0 && !selectedDoctorId) {
          setSelectedDoctorId(docsRes.data[0].id);
        }
      }
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setFeedback({
        type: 'error',
        message: 'Could not connect to API server. Please verify backend is running.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch slots whenever doctor or date changes
  useEffect(() => {
    if (!selectedDoctorId || !selectedDate) return;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const res = await api.appointments.getSlots(selectedDoctorId, selectedDate);
        if (res.success && res.data) {
          setAvailableSlots(res.data.slots);
          // Auto select first available slot
          const firstAvailable = res.data.slots.find((s) => s.available);
          setSelectedSlotIso(firstAvailable ? firstAvailable.isoString : '');
        }
      } catch (err) {
        console.error('Error fetching slots:', err);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDoctorId, selectedDate]);

  // Run AI Triage analysis on demand
  const handleRunTriage = async () => {
    if (!symptoms.trim() || symptoms.trim().length < 5) {
      setFeedback({
        type: 'error',
        message: 'Please describe your symptoms in at least 5 characters for AI analysis.',
      });
      return;
    }

    setTriageLoading(true);
    setFeedback(null);
    try {
      const res = await api.appointments.previewTriage(symptoms);
      if (res.success && res.data) {
        setPreviewTriage(res.data);
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: 'AI Triage preview failed: ' + (err.response?.data?.message || err.message),
      });
    } finally {
      setTriageLoading(false);
    }
  };

  // Submit appointment booking
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId || !selectedSlotIso || !symptoms.trim()) {
      setFeedback({
        type: 'error',
        message: 'Please select a doctor, available time slot, and describe symptoms.',
      });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await api.appointments.create({
        doctorId: selectedDoctorId,
        scheduledAt: selectedSlotIso,
        symptoms: symptoms.trim(),
      });

      if (res.success && res.data) {
        setFeedback({
          type: 'success',
          message: 'Appointment booked successfully with AI clinical triage!',
        });
        setAppointments((prev) => [res.data, ...prev]);
        setSymptoms('');
        setPreviewTriage(null);

        // Refresh slots for the day
        const slotRes = await api.appointments.getSlots(selectedDoctorId, selectedDate);
        if (slotRes.success && slotRes.data) {
          setAvailableSlots(slotRes.data.slots);
        }
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Booking failed. Slot may be occupied.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel pending appointment (with optional cancellation reason)
  const handleCancelAppointment = async (id: string) => {
    const reason = window.prompt('Please provide a cancellation reason (optional):');
    if (reason === null) return; // User clicked Cancel on prompt dialog

    try {
      const res = await api.appointments.updateStatus(id, 'CANCELLED', reason.trim() || undefined);
      if (res.success && res.data) {
        setAppointments((prev) =>
          prev.map((appt) => (appt.id === id ? { ...appt, status: 'CANCELLED', notes: res.data.notes } : appt))
        );
        setFeedback({
          type: 'success',
          message: 'Appointment successfully cancelled.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Could not cancel appointment.',
      });
    }
  };

  // Delete cancelled appointment (CRUD - Delete)
  const handleDeleteAppointment = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this appointment record?')) return;

    try {
      const res = await api.appointments.delete(id);
      if (res.success) {
        setAppointments((prev) => prev.filter((appt) => appt.id !== id));
        setFeedback({
          type: 'success',
          message: 'Appointment record successfully deleted.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Could not delete appointment.',
      });
    }
  };

  // Filtered appointments with status and live search
  const filteredAppointments = appointments.filter((appt) => {
    const matchesFilter = filterStatus === 'ALL' || appt.status === filterStatus;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      (appt.doctor?.name || '').toLowerCase().includes(query) ||
      (appt.doctor?.specialization || '').toLowerCase().includes(query) ||
      (appt.symptoms || '').toLowerCase().includes(query) ||
      (appt.aiCategory || '').toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`mb-5 p-3.5 sm:p-4 rounded-2xl flex items-center justify-between shadow-xs border transition-all ${
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

      {/* Main Grid: Left Column Booking, Right Column History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: Book Appointment Form & AI Triage (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-slate-200/80 shadow-xs sm:shadow-sm">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-6">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">Book Appointment</h2>
              <p className="text-xs text-slate-500">Includes real-time AI Symptom Triage</p>
            </div>
          </div>

          <form onSubmit={handleBookAppointment} className="space-y-5">
            {/* 1. Doctor Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
                Select Doctor & Specialty
              </label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} — {doc.specialization || 'Clinical Medicine'}
                  </option>
                ))}
              </select>

              {/* Selected Doctor Info Badge */}
              {selectedDoctor && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-sky-50/60 border border-sky-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      {selectedDoctor.name.replace('Dr. ', '').charAt(0) || 'D'}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 leading-tight">{selectedDoctor.name}</p>
                      <p className="text-[11px] text-sky-700 font-medium">{selectedDoctor.specialization || 'Clinical Medicine'}</p>
                    </div>
                  </div>
                  {selectedDoctor.phone && (
                    <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      {selectedDoctor.phone}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 2. Date Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-600" />
                Appointment Date
              </label>
              <input
                type="date"
                required
                value={selectedDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
              </input>
            </div>

            {/* 3. Slot Selector */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-600" />
                  Available 30-Min Time Slots
                </label>
                <span className="text-[11px] text-slate-400">Conflict detection active</span>
              </div>

              {loadingSlots ? (
                <SlotsSkeleton />
              ) : availableSlots.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center bg-slate-50 rounded-xl border border-slate-200">
                  No slots available for this date.
                </p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setSelectedSlotIso(slot.isoString)}
                      className={`py-2 px-1 text-xs font-semibold rounded-xl border transition-all ${
                        !slot.available
                          ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed line-through'
                          : selectedSlotIso === slot.isoString
                          ? 'bg-sky-600 text-white border-sky-600 shadow-sm shadow-sky-600/30'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-sky-400 hover:bg-sky-50/50'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Symptoms Textarea */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Describe Your Symptoms (for AI Triage)
                </label>
                <button
                  type="button"
                  onClick={handleRunTriage}
                  disabled={triageLoading || symptoms.length < 5}
                  className="text-[11px] font-bold text-sky-600 hover:text-sky-800 disabled:opacity-40"
                >
                  {triageLoading ? 'Analyzing...' : 'Preview AI Urgency'}
                </button>
              </div>
              <textarea
                rows={3}
                required
                placeholder="e.g., Severe chest discomfort and occasional shortness of breath during light walks since yesterday..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* AI Preview Result Card */}
            {previewTriage && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-indigo-50 border border-sky-200 shadow-xs space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-sky-600" />
                    AI Triage Assessment
                  </span>
                  <UrgencyBadge urgency={previewTriage.urgency} />
                </div>
                <div className="text-xs text-slate-700">
                  <p>
                    <span className="font-semibold text-slate-900">Suggested Specialty: </span>
                    {previewTriage.category}
                  </p>
                  <p className="mt-1 text-slate-600 leading-relaxed text-[11px]">
                    {previewTriage.advice}
                  </p>
                </div>

                {/* Engine Source Badge (Live Gemini vs Offline Fallback) */}
                <div className="pt-2 border-t border-sky-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-semibold">Triage Engine:</span>
                  {previewTriage.source?.includes('gemini') ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Google Gemini AI (Live)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-amber-100 text-amber-800 border border-amber-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      Clinical Rule Fallback (Offline)
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !selectedSlotIso}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-600/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 transition"
            >
              {submitting ? 'Confirming with AI Triage...' : 'Confirm Appointment Booking'}
            </button>
          </form>
        </div>

        {/* Right Column: Appointments List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-xs sm:shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-slate-700 shrink-0" />
                <h2 className="text-base sm:text-lg font-bold text-slate-900">My Appointments</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 shrink-0">
                  {appointments.length}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
                {/* Search Input */}
                <div className="relative w-full sm:w-48 md:w-52">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search doctor or symptom..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 w-full"
                  />
                </div>

                {/* Status Filter Tabs */}
                <div className="flex overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium shrink-0">
                  {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setFilterStatus(st)}
                      className={`px-2.5 py-1 rounded-lg transition-all shrink-0 whitespace-nowrap ${
                        filterStatus === st
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

            {/* Appointment Cards */}
            <div className="mt-5 space-y-4">
              {loading ? (
                <>
                  <CardSkeleton />
                  <CardSkeleton />
                </>
              ) : filteredAppointments.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Info className="w-8 h-8 mx-auto opacity-50" />
                  <p className="text-sm">No appointments found matching this status.</p>
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

                  return (
                    <div
                      key={appt.id}
                      className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-slate-300 shadow-xs transition-all space-y-3"
                    >
                      {/* Top Row: Doctor info & Status */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">
                              {appt.doctor?.name || 'Assigned Doctor'}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-medium shrink-0">
                              {appt.doctor?.specialization || 'Clinical'}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1 shrink-0">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {formattedDate}
                            </span>
                            <span className="flex items-center gap-1 shrink-0 font-medium text-slate-600">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {formattedTime}
                            </span>
                          </div>
                        </div>

                        <StatusBadge status={appt.status} />
                      </div>

                      {/* Symptoms & AI Triage box */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-500 font-semibold shrink-0">Patient Symptoms:</span>
                          {appt.aiUrgency && <UrgencyBadge urgency={appt.aiUrgency} />}
                        </div>
                        <p className="text-slate-800 italic break-words">"{appt.symptoms}"</p>

                        {appt.aiCategory && (
                          <div className="pt-1.5 border-t border-slate-200/70 text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-1">
                            <span>
                              <strong className="text-slate-700">AI Category:</strong> {appt.aiCategory}
                            </span>
                            {appt.status === 'PENDING' && (
                              <span className="text-amber-600 font-medium">Awaiting Doctor Confirmation</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Doctor Consultation Notes / Prescription Advice */}
                      {appt.notes && (
                        <div className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                          appt.status === 'COMPLETED'
                            ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}>
                          <div className={`flex items-center gap-1.5 font-bold ${
                            appt.status === 'COMPLETED' ? 'text-emerald-800' : 'text-slate-700'
                          }`}>
                            <Stethoscope className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            {appt.status === 'COMPLETED' ? "Doctor's Consultation Notes & Advice:" : 'Appointment Note / Reason:'}
                          </div>
                          <p className="font-medium whitespace-pre-wrap leading-relaxed break-words">
                            {appt.notes}
                          </p>
                        </div>
                      )}

                      {/* Bottom actions: Cancel if PENDING, Delete if CANCELLED */}
                      <div className="pt-2 flex flex-col sm:flex-row justify-end gap-2">
                        {appt.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => handleCancelAppointment(appt.id)}
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl border border-rose-200 transition w-full sm:w-auto"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Cancel Appointment
                          </button>
                        )}
                        {appt.status === 'CANCELLED' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteAppointment(appt.id)}
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-slate-200 transition w-full sm:w-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete Record
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
