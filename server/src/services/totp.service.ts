import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

export function generateSecret(email: string): { secret: string; otpauthUrl: string } {
  const secretObj = speakeasy.generateSecret({
    name: `SecureAuth:${email}`,
    length: 20,
  });
  return {
    secret: secretObj.base32 || '',
    otpauthUrl: secretObj.otpauth_url || '',
  };
}

export async function generateQrCode(otpauthUrl: string): Promise<string> {
  return qrcode.toDataURL(otpauthUrl);
}

export function verifyCode(secret: string, code: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: code,
    window: 1,
  });
}
