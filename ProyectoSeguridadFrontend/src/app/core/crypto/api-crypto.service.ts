import { Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';
import {
  SymmetricCryptoAlgorithm,
  decryptSymmetricString,
  encryptSymmetricString,
  normalizeSymmetricAlgorithm,
} from './symmetric-crypto';

// Wire format: JSON field names are base64(fieldName), values of 'version' and 'alg' are also base64.
// Must stay in sync with ApiCryptoEnvelope.java and ApiCryptoService.java on the backend.
const F = {
  enc: 'ZW5jcnlwdGVk',       // base64('encrypted')
  ver: 'dmVyc2lvbg',          // base64('version')
  alg: 'YWxn',                // base64('alg')
  kid: 'a2V5SWQ',             // base64('keyId')
  iv:  'aXY',                 // base64('iv')
  ct:  'Y2lwaGVydGV4dA',      // base64('ciphertext')
} as const;

// base64('api-crypto-v1') — must match ApiCryptoService.VERSION in the backend
const API_CRYPTO_VERSION = 'YXBpLWNyeXB0by12MQ==';

export type ApiCryptoEnvelope = {
  ZW5jcnlwdGVk: true;          // encrypted
  dmVyc2lvbg: string;           // version (base64)
  YWxn: string;                 // alg name (base64)
  a2V5SWQ: string;              // keyId
  aXY: string;                  // iv
  Y2lwaGVydGV4dA: string;       // ciphertext
};

@Injectable({
  providedIn: 'root',
})
export class ApiCryptoService {
  readonly headerName = 'X-Api-Crypto';
  readonly version    = API_CRYPTO_VERSION;

  async encryptValue(value: unknown): Promise<ApiCryptoEnvelope> {
    const encrypted = await encryptSymmetricString(
      JSON.stringify(value),
      environment.apiCryptoSecret,
      environment.apiCryptoAlgorithm,
    );

    return {
      [F.enc]: true,
      [F.ver]: API_CRYPTO_VERSION,
      [F.alg]: btoa(encrypted.alg),    // base64-encode the algorithm name
      [F.kid]: encrypted.keyId,
      [F.iv]:  encrypted.iv,
      [F.ct]:  encrypted.ciphertext,
    } as ApiCryptoEnvelope;
  }

  async decryptEnvelope(envelope: ApiCryptoEnvelope): Promise<unknown> {
    if (!this.isEnvelope(envelope)) {
      return envelope;
    }

    const algDecoded = atob(envelope[F.alg]) as SymmetricCryptoAlgorithm;

    return JSON.parse(
      await decryptSymmetricString(
        { alg: algDecoded, iv: envelope[F.iv], ciphertext: envelope[F.ct] },
        environment.apiCryptoSecret,
      ),
    );
  }

  async decryptEnvelopeIfNeeded<T>(value: unknown): Promise<T> {
    return (await this.decryptEnvelope(value as ApiCryptoEnvelope)) as T;
  }

  isEnvelope(value: unknown): value is ApiCryptoEnvelope {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const c = value as Partial<Record<string, unknown>>;

    if (c[F.enc] !== true || c[F.ver] !== API_CRYPTO_VERSION) {
      return false;
    }

    if (typeof c[F.alg] !== 'string') {
      return false;
    }

    try {
      normalizeSymmetricAlgorithm(atob(c[F.alg] as string));
    } catch {
      return false;
    }

    return typeof c[F.iv] === 'string' && typeof c[F.ct] === 'string';
  }
}
