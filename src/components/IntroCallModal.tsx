import { useState, useEffect } from 'react';
import { X, Calendar, Clock, Mail, MessageSquare, Loader2, CheckCircle } from 'lucide-react';
import { validateEmailFormat, normalizeEmail } from '../lib/utils/emailValidation';

export interface IntroCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: IntroCallData) => Promise<void>;
  expertId: number;
  expertName: string;
  clientProfileId: string;
}

export interface IntroCallData {
  email: string;
  preferredDate?: string;
  preferredTime?: string;
  notes?: string;
}

export default function IntroCallModal({
  isOpen,
  onClose,
  onSubmit,
  expertId,
  expertName,
  clientProfileId,
}: IntroCallModalProps) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep(1);
        setEmail('');
        setPreferredDate('');
        setPreferredTime('');
        setNotes('');
        setError('');
        setConsent(false);
        setIsSuccess(false);
      }, 300);
    }
  }, [isOpen]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError('');
  };

  const handleNextStep = () => {
    const validation = validateEmailFormat(email);
    if (!validation.valid) {
      setError(validation.error || 'Invalid email');
      return;
    }

    if (!consent) {
      setError('Please accept the notification consent');
      return;
    }

    setError('');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setError('');

    try {
      const normalizedEmail = normalizeEmail(email);
      await onSubmit({
        email: normalizedEmail,
        preferredDate: preferredDate || undefined,
        preferredTime: preferredTime || undefined,
        notes: notes || undefined,
      });
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to schedule intro call. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  if (isSuccess) {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center animate-fadeIn">
          <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">All Set!</h2>
          <p className="text-neutral-600">
            Your intro call request has been sent. We'll reach out to you at{' '}
            <span className="font-semibold text-neutral-900">{email}</span> soon!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 animate-fadeIn">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-1">
              Book Intro Call
            </h2>
            <p className="text-sm text-neutral-600">
              with {expertName}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-neutral-400 hover:text-neutral-600 transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step >= 1 ? 'bg-emerald-600 text-white' : 'bg-neutral-200 text-neutral-500'
            }`}>
              1
            </div>
            <div className={`w-16 h-1 ${step >= 2 ? 'bg-emerald-600' : 'bg-neutral-200'}`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step >= 2 ? 'bg-emerald-600 text-white' : 'bg-neutral-200 text-neutral-500'
            }`}>
              2
            </div>
          </div>
        </div>

        {step === 1 ? (
          <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="your.email@example.com"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  error
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-neutral-300 focus:ring-emerald-500'
                }`}
                disabled={isSubmitting}
                autoFocus
                required
              />
              <p className="mt-1 text-xs text-neutral-500">
                We'll contact you at this email to schedule your intro call
              </p>
            </div>

            <div className="mb-6">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 w-4 h-4 text-emerald-600 border-neutral-300 rounded focus:ring-emerald-500"
                  disabled={isSubmitting}
                />
                <span className="text-sm text-neutral-600">
                  I agree to receive notifications about my intro call and training sessions
                </span>
              </label>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 border border-neutral-300 rounded-lg font-semibold hover:bg-neutral-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !email.trim() || !consent}
                className="flex-1 bg-emerald-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 mb-6">
              <div>
                <label htmlFor="preferred-date" className="block text-sm font-medium text-neutral-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Preferred Date (Optional)
                </label>
                <input
                  type="date"
                  id="preferred-date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="preferred-time" className="block text-sm font-medium text-neutral-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Preferred Time (Optional)
                </label>
                <input
                  type="text"
                  id="preferred-time"
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  placeholder="e.g., 2:00 PM or Afternoon"
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-neutral-700 mb-2">
                  <MessageSquare className="w-4 h-4 inline mr-1" />
                  Additional Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any specific questions or topics you'd like to discuss?"
                  rows={3}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 border border-neutral-300 rounded-lg font-semibold hover:bg-neutral-50 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-emerald-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Schedule Call'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
