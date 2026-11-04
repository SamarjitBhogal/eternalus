/**
 * Whether `userAgent` (`navigator.userAgent`) is an Apple device's, where Cmd (Meta) takes the
 * place of Ctrl (DEC-118). iPhone and iPad user agents say "like Mac OS X", so one check covers
 * them. `main.tsx` is the only caller.
 */
export function isAppleUserAgent(userAgent: string): boolean {
  return userAgent.includes('Mac');
}
