import { edgePost } from './edgeClient';

export type VerifyPrizeResponse = {
  valid: boolean;
  message?: string;
  [key: string]: unknown;
};

export function verifyPrize(code: string) {
  return edgePost<VerifyPrizeResponse>('verify-prize', { code: code.toUpperCase() });
}
