import { Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';
import {
  SymmetricCryptoAlgorithm,
  decryptSymmetricString,
  encryptSymmetricString,
  normalizeSymmetricAlgorithm,
} from './symmetric-crypto';

export interface WsCryptoEnvelope {
  encrypted: true;
  version: 'ws-crypto-v1';
  alg: SymmetricCryptoAlgorithm;
  keyId: string;
  iv: string;
  ciphertext: string;
}

const WS_CRYPTO_VERSION: WsCryptoEnvelope['version'] = 'ws-crypto-v1';

@Injectable({
  providedIn: 'root',
})
export class WsCryptoService {
  async encryptValue(value: unknown): Promise<WsCryptoEnvelope> {
    const encrypted = await encryptSymmetricString(
      JSON.stringify(value),
      environment.wsCryptoSecret,
      environment.wsCryptoAlgorithm,
    );

    return {
      encrypted: true,
      version: WS_CRYPTO_VERSION,
      ...encrypted,
    };
  }

  async decryptEnvelope(envelope: WsCryptoEnvelope): Promise<unknown> {
    if (!this.isEnvelope(envelope)) {
      return envelope;
    }

    return JSON.parse(await decryptSymmetricString(envelope, environment.wsCryptoSecret));
  }

  isEnvelope(value: unknown): value is WsCryptoEnvelope {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const candidate = value as Partial<WsCryptoEnvelope>;
    if (typeof candidate.alg !== 'string') {
      return false;
    }

    try {
      normalizeSymmetricAlgorithm(candidate.alg);
    } catch {
      return false;
    }

    return (
      candidate.encrypted === true &&
      candidate.version === WS_CRYPTO_VERSION &&
      typeof candidate.iv === 'string' &&
      typeof candidate.ciphertext === 'string'
    );
  }
}
