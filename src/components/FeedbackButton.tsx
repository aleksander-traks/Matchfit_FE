import { useState } from 'react';
import { MessageSquare, Star, X, Send, Check } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { storage } from '../lib/storage';
import { pl } from '../lib/i18n/pl';

type PanelState = 'closed' | 'open' | 'submitted';

export default function FeedbackButton() {
  const location = useLocation();
  const [panel, setPanel] = useState<PanelState>('closed');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const open = () => {
    setPanel('open');
    setRating(0);
    setHoverRating(0);
    setMessage('');
    setError('');
  };

  const close = () => {
    setPanel('closed');
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setError(pl.feedback.ratingRequired);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.submitFeedback({
        page: location.pathname,
        rating,
        message: message.trim(),
        clientProfileId: storage.getProfileId() ?? undefined,
      });
      setPanel('submitted');
      setTimeout(() => setPanel('closed'), 2500);
    } catch {
      setError(pl.feedback.error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {panel !== 'closed' && (
        <div
          className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-80 overflow-hidden"
          style={{ animation: 'feedbackSlideUp 0.25s ease-out' }}
        >
          {panel === 'submitted' ? (
            <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <Check className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="font-semibold text-gray-800">{pl.feedback.thankYou}</p>
              <p className="text-sm text-gray-500">{pl.feedback.thankYouSub}</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                <span className="font-semibold text-gray-800 text-sm">{pl.feedback.panelTitle}</span>
                <button
                  onClick={close}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    {pl.feedback.ratingQuestion}
                  </p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="transition-transform hover:scale-110 active:scale-95"
                      >
                        <Star
                          className={`w-7 h-7 transition-colors ${
                            star <= (hoverRating || rating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    {pl.feedback.commentsLabel}
                  </p>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={pl.feedback.commentsPlaceholder}
                    rows={3}
                    className="w-full text-sm text-gray-700 placeholder-gray-400 border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-500">{error}</p>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                >
                  {submitting ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {submitting ? pl.feedback.sending : pl.feedback.submit}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <button
        onClick={panel === 'closed' ? open : close}
        className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-lg font-semibold text-sm transition-all duration-200 ${
          panel !== 'closed'
            ? 'bg-gray-700 text-white hover:bg-gray-800'
            : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-xl hover:-translate-y-0.5'
        }`}
      >
        <MessageSquare className="w-4 h-4" />
        {pl.feedback.buttonLabel}
      </button>

      <style>{`
        @keyframes feedbackSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
