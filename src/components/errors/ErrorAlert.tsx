import { useState } from 'react';
import { AlertCircle, AlertTriangle, Info, XCircle, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import type { AppError } from '../../lib/errors/AppError';
import { getErrorMessage } from '../../lib/errors/errorMessages';

interface ErrorAlertProps {
  error: AppError;
  onRetry?: () => void;
  onDismiss?: () => void;
  showTechnicalDetails?: boolean;
}

export default function ErrorAlert({ error, onRetry, onDismiss, showTechnicalDetails = true }: ErrorAlertProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const errorMessage = getErrorMessage(error.code);

  const getSeverityStyles = () => {
    switch (error.severity) {
      case 'critical':
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-900',
          icon: 'text-red-600',
          Icon: XCircle,
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-900',
          icon: 'text-yellow-600',
          Icon: AlertTriangle,
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-900',
          icon: 'text-blue-600',
          Icon: Info,
        };
      default:
        return {
          bg: 'bg-neutral-50',
          border: 'border-neutral-200',
          text: 'text-neutral-900',
          icon: 'text-neutral-600',
          Icon: AlertCircle,
        };
    }
  };

  const handleCopyErrorId = () => {
    navigator.clipboard.writeText(error.errorId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const styles = getSeverityStyles();
  const { Icon } = styles;

  return (
    <div className={`${styles.bg} ${styles.border} border rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${styles.icon} flex-shrink-0 mt-0.5`} />

        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-semibold ${styles.text} mb-1`}>
            {errorMessage.title}
          </h3>

          <p className={`text-sm ${styles.text} mb-3`}>
            {error.userMessage}
          </p>

          {error.recoverySuggestions.length > 0 && (
            <div className="mb-3">
              <p className={`text-xs font-medium ${styles.text} mb-2`}>What you can do:</p>
              <ul className={`text-xs ${styles.text} space-y-1 list-disc list-inside`}>
                {error.recoverySuggestions.map((suggestion, index) => (
                  <li key={index}>
                    <strong>{suggestion.action}:</strong> {suggestion.description}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 mb-2">
            {onRetry && error.isRetryable && (
              <button
                onClick={onRetry}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  error.severity === 'error'
                    ? 'bg-red-100 hover:bg-red-200 text-red-900'
                    : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-900'
                }`}
              >
                Try Again
              </button>
            )}

            {onDismiss && (
              <button
                onClick={onDismiss}
                className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                Dismiss
              </button>
            )}

            <button
              onClick={handleCopyErrorId}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
              title="Copy Error ID for support"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Error ID</span>
                </>
              )}
            </button>
          </div>

          {showTechnicalDetails && (
            <div className="mt-3 pt-3 border-t border-neutral-200">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`flex items-center gap-2 text-xs font-medium ${styles.text} hover:underline`}
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                Technical Details
              </button>

              {isExpanded && (
                <div className={`mt-2 p-3 bg-white rounded border ${styles.border}`}>
                  <dl className="space-y-2 text-xs">
                    <div>
                      <dt className="font-medium text-neutral-700">Error ID:</dt>
                      <dd className="font-mono text-neutral-600">{error.errorId}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-neutral-700">Error Code:</dt>
                      <dd className="font-mono text-neutral-600">{error.code}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-neutral-700">Message:</dt>
                      <dd className="text-neutral-600">{error.technicalMessage}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-neutral-700">Source:</dt>
                      <dd className="text-neutral-600">{error.source}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-neutral-700">Timestamp:</dt>
                      <dd className="text-neutral-600">{error.timestamp.toLocaleString()}</dd>
                    </div>
                    {errorMessage.technicalNote && (
                      <div>
                        <dt className="font-medium text-neutral-700">Note:</dt>
                        <dd className="text-neutral-600">{errorMessage.technicalNote}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
