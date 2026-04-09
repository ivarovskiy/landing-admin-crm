export function getJwtExpiresIn(): any {
  // TS: env -> string | undefined, а Jwt expects number | StringValue
  return process.env.JWT_EXPIRES_IN ?? '7d';
}