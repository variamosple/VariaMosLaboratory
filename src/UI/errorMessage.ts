/** Message sent by the Laboratory backend for a failed request, or the fallback. */
export function errorMessage(error: any, fallback: string): string {
  return error?.response?.data?.message ?? fallback;
}

/** Problems listed by the backend when an experiment cannot become Ready. */
export function errorDetails(error: any): string[] {
  const details = error?.response?.data?.details;
  return Array.isArray(details) ? details : [];
}
