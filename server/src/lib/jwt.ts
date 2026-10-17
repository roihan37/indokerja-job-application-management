import jwt from 'jsonwebtoken';

const JWT_ISSUER = 'indokerja';
const JWT_AUDIENCE = 'indokerja-api';
const JWT_ALGORITHM = 'HS256';

export function signAccessToken(userId: string, secret: string) {
  return jwt.sign({}, secret, {
    algorithm: JWT_ALGORITHM,
    subject: userId,
    expiresIn: '1h',
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
}

export function verifyAccessToken(token: string, secret: string): string {
  const payload = jwt.verify(token, secret, {
    algorithms: [JWT_ALGORITHM],
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
  if (
    typeof payload === 'string' ||
    typeof payload.sub !== 'string' ||
    typeof payload.exp !== 'number'
  ) {
    throw new Error('Invalid access token claims');
  }
  return payload.sub;
}
