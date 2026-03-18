import { pl } from '../i18n/pl';

export interface ErrorMessageTemplate {
  title: string;
  description: string;
  actions: string[];
  technicalNote?: string;
}

export function getErrorMessage(code: string): ErrorMessageTemplate {
  const errors = pl.errors as Record<string, ErrorMessageTemplate | undefined>;
  const found = errors[code];
  if (found) return found;
  return pl.errors.default;
}
