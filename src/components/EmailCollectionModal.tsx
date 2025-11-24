import { useState, useEffect } from 'react';
import { X, Mail, Loader2 } from 'lucide-react';
import { validateEmailFormat, normalizeEmail } from '../lib/utils/emailValidation';

export interface EmailCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string) => Promise<void>;
  title?: string;
  message?: string;
}

export default function EmailCollectionModal({
  isOpen,
  onClose,
  onSubmit,
  title = 'Stay Connected',
  message = "We'll notify you when your trainer responds. Your email will only be used for important updates.",
}: EmailCollectionModalProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setError('');
      setConsent(false);
    }
  }, [isOpen]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateEmailFormat(email);
    if (!validation.valid) {
      setError(validation.error || 'Invalid email');
      return;
    }

    if (!consent) {
      setError('Please accept the notification consent');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const normalizedEmail = normalizeEmail(email);
      await onSubmit(normalizedEmail);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save email. Please try again.');
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

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fadeIn">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-lg">
              <Mail className="w-6 h-6 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900">{title}</h2>
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

        <p className="text-neutral-600 mb-6 text-sm">{message}</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="your.email@example.com"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                error
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-neutral-300 focus:ring-emerald-500 focus:border-emerald-500'
              }`}
              disabled={isSubmitting}
              autoFocus
              required
            />
            {error && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <span>⚠</span> {error}
              </p>
            )}
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
                I agree to receive notifications about my training sessions and messages
              </span>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 border border-neutral-300 rounded-lg font-semibold hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !email.trim() || !consent}
              className="flex-1 bg-emerald-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Continue'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
