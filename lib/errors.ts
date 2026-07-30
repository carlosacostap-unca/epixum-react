export function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function errorStatus(error: unknown) {
  if (typeof error !== 'object' || error === null || !('status' in error)) return undefined;
  return typeof error.status === 'number' ? error.status : undefined;
}

export function errorResponse(error: unknown) {
  if (typeof error !== 'object' || error === null || !('response' in error)) return undefined;
  return error.response;
}
