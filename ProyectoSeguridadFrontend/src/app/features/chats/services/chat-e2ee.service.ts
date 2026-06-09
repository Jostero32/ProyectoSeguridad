import { Injectable } from '@angular/core';

import { CifradoPayload, E2eeAlgorithm } from '../models/message.model';

const DEFAULT_E2EE_ALGORITHM: E2eeAlgorithm = 'AES_GCM';
// Replace this derivation with per-device key agreement before production.
const KEY_NAMESPACE = 'cipherchat:e2ee:v1';

interface CipherContext {
  chatId: string;
  keyBytes: Uint8Array;
  keyId: string;
}

interface E2eeProvider {
  encrypt(plainText: string, context: CipherContext): Promise<Pick<CifradoPayload, 'iv' | 'ciphertext'>>;
  decrypt(payload: CifradoPayload, context: CipherContext): Promise<string>;
}

@Injectable({
  providedIn: 'root',
})
export class ChatE2eeService {
  private readonly encoder = new TextEncoder();
  private readonly decoder = new TextDecoder();
  private defaultAlgorithm: E2eeAlgorithm = DEFAULT_E2EE_ALGORITHM;

  private readonly providers: Record<E2eeAlgorithm, E2eeProvider> = {
    AES_GCM: {
      encrypt: (plainText, context) => this.encryptAesGcm(plainText, context),
      decrypt: (payload, context) => this.decryptAesGcm(payload, context),
    },
    DES_CBC: {
      encrypt: (plainText, context) => this.encryptDesCbc(plainText, context),
      decrypt: (payload, context) => this.decryptDesCbc(payload, context),
    },
    CHACHA20: {
      encrypt: (plainText, context) => this.encryptChaCha20(plainText, context),
      decrypt: (payload, context) => this.decryptChaCha20(payload, context),
    },
  };

  getDefaultAlgorithm(): E2eeAlgorithm {
    return this.defaultAlgorithm;
  }

  setDefaultAlgorithm(algorithm: E2eeAlgorithm): void {
    this.defaultAlgorithm = this.normalizeAlgorithm(algorithm);
  }

  async encryptText(chatId: string, plainText: string): Promise<CifradoPayload> {
    const algorithm = this.defaultAlgorithm;
    const context = await this.buildContext(chatId, algorithm);
    const encrypted = await this.providers[algorithm].encrypt(plainText, context);

    return {
      alg: algorithm,
      keyId: context.keyId,
      ...encrypted,
    };
  }

  async decryptText(chatId: string, payload: CifradoPayload): Promise<string> {
    const algorithm = this.normalizeAlgorithm(payload.alg);
    const context = await this.buildContext(chatId, algorithm);

    return this.providers[algorithm].decrypt(payload, context);
  }

  private async buildContext(chatId: string, algorithm: E2eeAlgorithm): Promise<CipherContext> {
    const keyBytes = await this.sha256(`${KEY_NAMESPACE}:${algorithm}:${chatId}`);

    return {
      chatId,
      keyBytes,
      keyId: bytesToBase64Url(keyBytes.slice(0, 9)),
    };
  }

  private normalizeAlgorithm(algorithm: string): E2eeAlgorithm {
    const normalized = algorithm.trim().toUpperCase();
    if (normalized === 'AES' || normalized === 'AES_GCM') {
      return 'AES_GCM';
    }

    if (normalized === 'DES' || normalized === 'DES_CBC') {
      return 'DES_CBC';
    }

    if (normalized === 'CHACHA20' || normalized === 'CHACHA20_POLY1305') {
      return 'CHACHA20';
    }

    throw new Error(`Algoritmo E2EE no soportado: ${algorithm}`);
  }

  private async encryptAesGcm(
    plainText: string,
    context: CipherContext,
  ): Promise<Pick<CifradoPayload, 'iv' | 'ciphertext'>> {
    const iv = randomBytes(12);
    const cryptoKey = await crypto.subtle.importKey('raw', toArrayBuffer(context.keyBytes), 'AES-GCM', false, [
      'encrypt',
    ]);
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: toArrayBuffer(iv) },
      cryptoKey,
      toArrayBuffer(this.encoder.encode(plainText)),
    );

    return {
      iv: bytesToBase64(iv),
      ciphertext: bytesToBase64(new Uint8Array(encrypted)),
    };
  }

  private async decryptAesGcm(payload: CifradoPayload, context: CipherContext): Promise<string> {
    const iv = base64ToBytes(payload.iv);
    const ciphertext = base64ToBytes(payload.ciphertext);
    const cryptoKey = await crypto.subtle.importKey('raw', toArrayBuffer(context.keyBytes), 'AES-GCM', false, [
      'decrypt',
    ]);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: toArrayBuffer(iv) },
      cryptoKey,
      toArrayBuffer(ciphertext),
    );

    return this.decoder.decode(decrypted);
  }

  private async encryptDesCbc(
    plainText: string,
    context: CipherContext,
  ): Promise<Pick<CifradoPayload, 'iv' | 'ciphertext'>> {
    const iv = randomBytes(8);
    const encrypted = desCbcEncrypt(this.encoder.encode(plainText), context.keyBytes.slice(0, 8), iv);

    return {
      iv: bytesToBase64(iv),
      ciphertext: bytesToBase64(encrypted),
    };
  }

  private async decryptDesCbc(payload: CifradoPayload, context: CipherContext): Promise<string> {
    const iv = base64ToBytes(payload.iv);
    const ciphertext = base64ToBytes(payload.ciphertext);
    const decrypted = desCbcDecrypt(ciphertext, context.keyBytes.slice(0, 8), iv);

    return this.decoder.decode(decrypted);
  }

  private async encryptChaCha20(
    plainText: string,
    context: CipherContext,
  ): Promise<Pick<CifradoPayload, 'iv' | 'ciphertext'>> {
    const nonce = randomBytes(12);
    const encrypted = chacha20Xor(this.encoder.encode(plainText), context.keyBytes, nonce);

    return {
      iv: bytesToBase64(nonce),
      ciphertext: bytesToBase64(encrypted),
    };
  }

  private async decryptChaCha20(payload: CifradoPayload, context: CipherContext): Promise<string> {
    const nonce = base64ToBytes(payload.iv);
    const ciphertext = base64ToBytes(payload.ciphertext);
    const decrypted = chacha20Xor(ciphertext, context.keyBytes, nonce);

    return this.decoder.decode(decrypted);
  }

  private async sha256(value: string): Promise<Uint8Array> {
    const digest = await crypto.subtle.digest('SHA-256', toArrayBuffer(this.encoder.encode(value)));
    return new Uint8Array(digest);
  }
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  return copy.buffer;
}

function randomBytes(length: number): Uint8Array {
  const value = new Uint8Array(length);
  crypto.getRandomValues(value);
  return value;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const output = new Uint8Array(a.length + b.length);
  output.set(a, 0);
  output.set(b, a.length);
  return output;
}

function xorBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const output = new Uint8Array(a.length);
  for (let index = 0; index < a.length; index += 1) {
    output[index] = a[index] ^ b[index];
  }

  return output;
}

function pkcs7Pad(input: Uint8Array, blockSize: number): Uint8Array {
  const pad = blockSize - (input.length % blockSize || blockSize);
  const padLength = pad === 0 ? blockSize : pad;
  const padding = new Uint8Array(padLength).fill(padLength);
  return concatBytes(input, padding);
}

function pkcs7Unpad(input: Uint8Array, blockSize: number): Uint8Array {
  if (input.length === 0 || input.length % blockSize !== 0) {
    throw new Error('Padding PKCS7 invalido');
  }

  const padLength = input[input.length - 1];
  if (padLength < 1 || padLength > blockSize || padLength > input.length) {
    throw new Error('Padding PKCS7 invalido');
  }

  for (let index = input.length - padLength; index < input.length; index += 1) {
    if (input[index] !== padLength) {
      throw new Error('Padding PKCS7 invalido');
    }
  }

  return input.slice(0, input.length - padLength);
}

function desCbcEncrypt(input: Uint8Array, key: Uint8Array, iv: Uint8Array): Uint8Array {
  if (key.length !== 8 || iv.length !== 8) {
    throw new Error('DES_CBC requiere clave e IV de 8 bytes');
  }

  const padded = pkcs7Pad(input, 8);
  const output = new Uint8Array(padded.length);
  let previous = iv;

  for (let offset = 0; offset < padded.length; offset += 8) {
    const block = xorBytes(padded.slice(offset, offset + 8), previous);
    const encrypted = desBlock(block, key, true);
    output.set(encrypted, offset);
    previous = encrypted;
  }

  return output;
}

function desCbcDecrypt(input: Uint8Array, key: Uint8Array, iv: Uint8Array): Uint8Array {
  if (key.length !== 8 || iv.length !== 8 || input.length % 8 !== 0) {
    throw new Error('DES_CBC payload invalido');
  }

  const output = new Uint8Array(input.length);
  let previous = iv;

  for (let offset = 0; offset < input.length; offset += 8) {
    const block = input.slice(offset, offset + 8);
    const decrypted = desBlock(block, key, false);
    output.set(xorBytes(decrypted, previous), offset);
    previous = block;
  }

  return pkcs7Unpad(output, 8);
}

function desBlock(block: Uint8Array, key: Uint8Array, encrypt: boolean): Uint8Array {
  const subkeys = createDesSubkeys(key);
  const keys = encrypt ? subkeys : [...subkeys].reverse();
  const permuted = permute(bytesToBits(block), DES_IP);
  let left = permuted.slice(0, 32);
  let right = permuted.slice(32, 64);

  for (const subkey of keys) {
    const nextLeft = right;
    const round = desRound(right, subkey);
    right = xorBits(left, round);
    left = nextLeft;
  }

  return bitsToBytes(permute([...right, ...left], DES_FP));
}

function createDesSubkeys(key: Uint8Array): number[][] {
  const keyBits = permute(bytesToBits(key), DES_PC1);
  let left = keyBits.slice(0, 28);
  let right = keyBits.slice(28, 56);
  const subkeys: number[][] = [];

  for (let round = 0; round < 16; round += 1) {
    left = rotateLeft(left, DES_SHIFTS[round]);
    right = rotateLeft(right, DES_SHIFTS[round]);
    subkeys.push(permute([...left, ...right], DES_PC2));
  }

  return subkeys;
}

function desRound(right: number[], subkey: number[]): number[] {
  const expanded = permute(right, DES_E);
  const mixed = xorBits(expanded, subkey);
  const sboxOutput: number[] = [];

  for (let box = 0; box < 8; box += 1) {
    const chunk = mixed.slice(box * 6, box * 6 + 6);
    const row = (chunk[0] << 1) | chunk[5];
    const column = (chunk[1] << 3) | (chunk[2] << 2) | (chunk[3] << 1) | chunk[4];
    const value = DES_SBOXES[box][row][column];
    sboxOutput.push((value >> 3) & 1, (value >> 2) & 1, (value >> 1) & 1, value & 1);
  }

  return permute(sboxOutput, DES_P);
}

function bytesToBits(bytes: Uint8Array): number[] {
  const bits: number[] = [];
  for (const byte of bytes) {
    for (let bit = 7; bit >= 0; bit -= 1) {
      bits.push((byte >> bit) & 1);
    }
  }

  return bits;
}

function bitsToBytes(bits: number[]): Uint8Array {
  const bytes = new Uint8Array(bits.length / 8);
  for (let index = 0; index < bits.length; index += 8) {
    let value = 0;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value << 1) | bits[index + bit];
    }

    bytes[index / 8] = value;
  }

  return bytes;
}

function permute(bits: number[], table: readonly number[]): number[] {
  return table.map((position) => bits[position - 1]);
}

function xorBits(a: number[], b: number[]): number[] {
  return a.map((value, index) => value ^ b[index]);
}

function rotateLeft(bits: number[], shift: number): number[] {
  return [...bits.slice(shift), ...bits.slice(0, shift)];
}

function chacha20Xor(input: Uint8Array, key: Uint8Array, nonce: Uint8Array): Uint8Array {
  if (key.length !== 32 || nonce.length !== 12) {
    throw new Error('ChaCha20 requiere clave de 32 bytes y nonce de 12 bytes');
  }

  const output = new Uint8Array(input.length);
  let counter = 1;

  for (let offset = 0; offset < input.length; offset += 64) {
    const keyStream = chacha20Block(key, nonce, counter);
    const length = Math.min(64, input.length - offset);
    for (let index = 0; index < length; index += 1) {
      output[offset + index] = input[offset + index] ^ keyStream[index];
    }

    counter = (counter + 1) >>> 0;
  }

  return output;
}

function chacha20Block(key: Uint8Array, nonce: Uint8Array, counter: number): Uint8Array {
  const state = new Uint32Array(16);
  state[0] = 0x61707865;
  state[1] = 0x3320646e;
  state[2] = 0x79622d32;
  state[3] = 0x6b206574;

  for (let index = 0; index < 8; index += 1) {
    state[4 + index] = readUint32Le(key, index * 4);
  }

  state[12] = counter;
  state[13] = readUint32Le(nonce, 0);
  state[14] = readUint32Le(nonce, 4);
  state[15] = readUint32Le(nonce, 8);

  const working = new Uint32Array(state);
  for (let round = 0; round < 10; round += 1) {
    quarterRound(working, 0, 4, 8, 12);
    quarterRound(working, 1, 5, 9, 13);
    quarterRound(working, 2, 6, 10, 14);
    quarterRound(working, 3, 7, 11, 15);
    quarterRound(working, 0, 5, 10, 15);
    quarterRound(working, 1, 6, 11, 12);
    quarterRound(working, 2, 7, 8, 13);
    quarterRound(working, 3, 4, 9, 14);
  }

  for (let index = 0; index < 16; index += 1) {
    working[index] = (working[index] + state[index]) >>> 0;
  }

  const output = new Uint8Array(64);
  for (let index = 0; index < 16; index += 1) {
    writeUint32Le(output, index * 4, working[index]);
  }

  return output;
}

function quarterRound(state: Uint32Array, a: number, b: number, c: number, d: number): void {
  state[a] = (state[a] + state[b]) >>> 0;
  state[d] = rotateLeft32(state[d] ^ state[a], 16);
  state[c] = (state[c] + state[d]) >>> 0;
  state[b] = rotateLeft32(state[b] ^ state[c], 12);
  state[a] = (state[a] + state[b]) >>> 0;
  state[d] = rotateLeft32(state[d] ^ state[a], 8);
  state[c] = (state[c] + state[d]) >>> 0;
  state[b] = rotateLeft32(state[b] ^ state[c], 7);
}

function rotateLeft32(value: number, shift: number): number {
  return ((value << shift) | (value >>> (32 - shift))) >>> 0;
}

function readUint32Le(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] |
      (bytes[offset + 1] << 8) |
      (bytes[offset + 2] << 16) |
      (bytes[offset + 3] << 24)) >>>
    0
  );
}

function writeUint32Le(bytes: Uint8Array, offset: number, value: number): void {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
  bytes[offset + 2] = (value >>> 16) & 0xff;
  bytes[offset + 3] = (value >>> 24) & 0xff;
}

const DES_IP = [
  58, 50, 42, 34, 26, 18, 10, 2, 60, 52, 44, 36, 28, 20, 12, 4, 62, 54, 46, 38, 30, 22, 14, 6,
  64, 56, 48, 40, 32, 24, 16, 8, 57, 49, 41, 33, 25, 17, 9, 1, 59, 51, 43, 35, 27, 19, 11, 3,
  61, 53, 45, 37, 29, 21, 13, 5, 63, 55, 47, 39, 31, 23, 15, 7,
] as const;

const DES_FP = [
  40, 8, 48, 16, 56, 24, 64, 32, 39, 7, 47, 15, 55, 23, 63, 31, 38, 6, 46, 14, 54, 22, 62,
  30, 37, 5, 45, 13, 53, 21, 61, 29, 36, 4, 44, 12, 52, 20, 60, 28, 35, 3, 43, 11, 51, 19,
  59, 27, 34, 2, 42, 10, 50, 18, 58, 26, 33, 1, 41, 9, 49, 17, 57, 25,
] as const;

const DES_E = [
  32, 1, 2, 3, 4, 5, 4, 5, 6, 7, 8, 9, 8, 9, 10, 11, 12, 13, 12, 13, 14, 15, 16, 17, 16,
  17, 18, 19, 20, 21, 20, 21, 22, 23, 24, 25, 24, 25, 26, 27, 28, 29, 28, 29, 30, 31, 32, 1,
] as const;

const DES_P = [
  16, 7, 20, 21, 29, 12, 28, 17, 1, 15, 23, 26, 5, 18, 31, 10, 2, 8, 24, 14, 32, 27, 3, 9,
  19, 13, 30, 6, 22, 11, 4, 25,
] as const;

const DES_PC1 = [
  57, 49, 41, 33, 25, 17, 9, 1, 58, 50, 42, 34, 26, 18, 10, 2, 59, 51, 43, 35, 27, 19, 11, 3,
  60, 52, 44, 36, 63, 55, 47, 39, 31, 23, 15, 7, 62, 54, 46, 38, 30, 22, 14, 6, 61, 53, 45,
  37, 29, 21, 13, 5, 28, 20, 12, 4,
] as const;

const DES_PC2 = [
  14, 17, 11, 24, 1, 5, 3, 28, 15, 6, 21, 10, 23, 19, 12, 4, 26, 8, 16, 7, 27, 20, 13, 2,
  41, 52, 31, 37, 47, 55, 30, 40, 51, 45, 33, 48, 44, 49, 39, 56, 34, 53, 46, 42, 50, 36, 29,
  32,
] as const;

const DES_SHIFTS = [1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1] as const;

const DES_SBOXES = [
  [
    [14, 4, 13, 1, 2, 15, 11, 8, 3, 10, 6, 12, 5, 9, 0, 7],
    [0, 15, 7, 4, 14, 2, 13, 1, 10, 6, 12, 11, 9, 5, 3, 8],
    [4, 1, 14, 8, 13, 6, 2, 11, 15, 12, 9, 7, 3, 10, 5, 0],
    [15, 12, 8, 2, 4, 9, 1, 7, 5, 11, 3, 14, 10, 0, 6, 13],
  ],
  [
    [15, 1, 8, 14, 6, 11, 3, 4, 9, 7, 2, 13, 12, 0, 5, 10],
    [3, 13, 4, 7, 15, 2, 8, 14, 12, 0, 1, 10, 6, 9, 11, 5],
    [0, 14, 7, 11, 10, 4, 13, 1, 5, 8, 12, 6, 9, 3, 2, 15],
    [13, 8, 10, 1, 3, 15, 4, 2, 11, 6, 7, 12, 0, 5, 14, 9],
  ],
  [
    [10, 0, 9, 14, 6, 3, 15, 5, 1, 13, 12, 7, 11, 4, 2, 8],
    [13, 7, 0, 9, 3, 4, 6, 10, 2, 8, 5, 14, 12, 11, 15, 1],
    [13, 6, 4, 9, 8, 15, 3, 0, 11, 1, 2, 12, 5, 10, 14, 7],
    [1, 10, 13, 0, 6, 9, 8, 7, 4, 15, 14, 3, 11, 5, 2, 12],
  ],
  [
    [7, 13, 14, 3, 0, 6, 9, 10, 1, 2, 8, 5, 11, 12, 4, 15],
    [13, 8, 11, 5, 6, 15, 0, 3, 4, 7, 2, 12, 1, 10, 14, 9],
    [10, 6, 9, 0, 12, 11, 7, 13, 15, 1, 3, 14, 5, 2, 8, 4],
    [3, 15, 0, 6, 10, 1, 13, 8, 9, 4, 5, 11, 12, 7, 2, 14],
  ],
  [
    [2, 12, 4, 1, 7, 10, 11, 6, 8, 5, 3, 15, 13, 0, 14, 9],
    [14, 11, 2, 12, 4, 7, 13, 1, 5, 0, 15, 10, 3, 9, 8, 6],
    [4, 2, 1, 11, 10, 13, 7, 8, 15, 9, 12, 5, 6, 3, 0, 14],
    [11, 8, 12, 7, 1, 14, 2, 13, 6, 15, 0, 9, 10, 4, 5, 3],
  ],
  [
    [12, 1, 10, 15, 9, 2, 6, 8, 0, 13, 3, 4, 14, 7, 5, 11],
    [10, 15, 4, 2, 7, 12, 9, 5, 6, 1, 13, 14, 0, 11, 3, 8],
    [9, 14, 15, 5, 2, 8, 12, 3, 7, 0, 4, 10, 1, 13, 11, 6],
    [4, 3, 2, 12, 9, 5, 15, 10, 11, 14, 1, 7, 6, 0, 8, 13],
  ],
  [
    [4, 11, 2, 14, 15, 0, 8, 13, 3, 12, 9, 7, 5, 10, 6, 1],
    [13, 0, 11, 7, 4, 9, 1, 10, 14, 3, 5, 12, 2, 15, 8, 6],
    [1, 4, 11, 13, 12, 3, 7, 14, 10, 15, 6, 8, 0, 5, 9, 2],
    [6, 11, 13, 8, 1, 4, 10, 7, 9, 5, 0, 15, 14, 2, 3, 12],
  ],
  [
    [13, 2, 8, 4, 6, 15, 11, 1, 10, 9, 3, 14, 5, 0, 12, 7],
    [1, 15, 13, 8, 10, 3, 7, 4, 12, 5, 6, 11, 0, 14, 9, 2],
    [7, 11, 4, 1, 9, 12, 14, 2, 0, 6, 10, 13, 15, 3, 5, 8],
    [2, 1, 14, 7, 4, 10, 8, 13, 15, 12, 9, 0, 3, 5, 6, 11],
  ],
] as const;
