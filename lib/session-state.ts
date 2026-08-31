export function shouldShowWelcomeState(selectedSessionId: string | null) {
  return !selectedSessionId;
}
