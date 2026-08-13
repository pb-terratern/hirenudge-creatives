export function isAllowedOwner(email: string | null | undefined, allowlistedEmail: string): boolean {
  return Boolean(email && email.trim().toLocaleLowerCase("en-US") === allowlistedEmail.trim().toLocaleLowerCase("en-US"));
}
