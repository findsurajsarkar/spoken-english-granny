/* Public key for checking signed activation links (made by scripts/make-admin-key.mjs).
 * Safe to publish: it can only CHECK links. The private key that MAKES links stays with the owner. */
export const ACTIVATION_PUBLIC_KEY: JsonWebKey = {"kty":"EC","crv":"P-256","x":"yK0aoCKXHgN4Z0k4QMjQBivgH-5tHjFYdR-pibEV3zU","y":"RQnOtM6-_AOBg_gkT4dw_u-X3Va6HURstrBLYcRW6bw"};
