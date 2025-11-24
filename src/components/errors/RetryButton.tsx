import { useState, useEffect } from 'react';
import { RefreshCw, Loader2, X } from 'lucide-react';

interface RetryButtonProps {
  onRetry: () => void;
  isRetrying?: boolean;
  retryCount?: number;
  maxRetries?: number;
  autoRetryDelay?: number;
  onCancelAutoRetry?: () => void;
  disabled?: boolean;
  className?: string;
}

export default function RetryButton({
  onRetry,
  isRetrying = false,
  retryCount = 0,
  maxRetries = 3,
  autoRetryDelay,
  onCancelAutoRetry,
  disabled = false,
  className = '',
}: RetryButtonProps) {
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (autoRetryDelay && autoRetryDelay > 0 && !isRetrying) {
      setCountdown(Math.ceil(autoRetryDelay / 1000));

      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      const timeout = setTimeout(() => {
        onRetry();
      }, autoRetryDelay);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [autoRetryDelay, onRetry, isRetrying]);

  const handleCancelAutoRetry = () => {
    setCountdown(null);
    if (onCancelAutoRetry) {
      onCancelAutoRetry();
    }
  };

  const showRetryCount = retryCount > 0 && maxRetries > 0;

  if (countdown !== null) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          onClick={onRetry}
          disabled={disabled}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry now</span>
        </button>
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <span>or auto-retry in {countdown}s</span>
          <button
            onClick={handleCancelAutoRetry}
            className="p-1 hover:bg-neutral-100 rounded transition-colors"
            title="Cancel automatic retry"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onRetry}
      disabled={disabled || isRetrying}
      className={`flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isRetrying ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Retrying...</span>
        </>
      ) : (
        <>
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
          {showRetryCount && (
            <span className="ml-1 text-xs opacity-75">
              ({retryCount}/{maxRetries})
            </span>
          )}
        </>
      )}
    </button>
  );
}
