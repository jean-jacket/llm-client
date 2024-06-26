import { existsSync, readFileSync, writeFileSync } from 'fs';

import { type BaseArgs, BaseDB, type BaseOpOptions } from './base.js';
import type {
  DBQueryRequest,
  DBQueryResponse,
  DBUpsertRequest,
  DBUpsertResponse
} from './types.js';

export interface MemoryDBArgs {
  filename?: string;
}

export type DBState = Record<string, Record<string, DBUpsertRequest>>;

/**
 * MemoryDB: DB Service
 * @export
 */
export class MemoryDB extends BaseDB {
  private state: DBState;
  private filename?: string;

  constructor({ filename, tracer }: Readonly<MemoryDBArgs & BaseArgs> = {}) {
    super({ name: 'Memory', tracer });
    this.state = {};
    this.filename = filename;

    if (filename && existsSync(filename)) {
      this.load();
    }
  }

  override _upsert = async (
    req: Readonly<DBUpsertRequest>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _update?: boolean,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options?: Readonly<BaseOpOptions>
  ): Promise<DBUpsertResponse> => {
    if (!this.state[req.table]) {
      this.state[req.table] = {
        [req.id]: req
      };
    } else {
      const obj = this.state[req.table];
      if (!obj) {
        throw new Error('Table not found: ' + req.table);
      }
      obj[req.id] = req;
    }

    if (this.filename) {
      await this.save();
    }

    return { ids: [req.id] };
  };

  override _batchUpsert = async (
    batchReq: Readonly<DBUpsertRequest[]>,
    update?: boolean,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options?: Readonly<BaseOpOptions>
  ): Promise<DBUpsertResponse> => {
    const ids: string[] = [];
    for (const req of batchReq) {
      const res = await this.upsert(req, update);
      ids.push(...res.ids);
    }

    if (this.filename) {
      await this.save();
    }

    return { ids };
  };

  override _query = async (
    req: Readonly<DBQueryRequest>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options?: Readonly<BaseOpOptions>
  ): Promise<DBQueryResponse> => {
    const table = this.state[req.table];
    if (!table) {
      return { matches: [] };
    }

    const matches: DBQueryResponse['matches'] = [];

    Object.entries(table).forEach(([id, data]) => {
      if (req.values && data.values) {
        const score = distance(req.values, data.values);
        matches.push({ id: id, score: score, metadata: data.metadata });
      }
    });

    matches.sort((a, b) => a.score - b.score);
    if (req.limit) {
      matches.length = req.limit;
    }

    return { matches };
  };

  public save = async (fn = this.filename) => {
    if (!fn) {
      throw new Error('Filename not set');
    }
    writeFileSync(fn, JSON.stringify(this.state));
  };

  public load = async (fn = this.filename) => {
    if (!fn) {
      throw new Error('Filename not set');
    }
    const data = readFileSync(fn, 'utf8');
    const obj = JSON.parse(data);
    this.state = { ...this.state, ...obj };
  };

  public getDB = () => {
    return this.state;
  };

  public setDB = (state: DBState) => {
    this.state = state;
  };

  public clearDB = () => {
    this.state = {};
  };
}

const distance = (a: readonly number[], b: readonly number[]): number => {
  if (a.length !== b.length) {
    throw new Error('Vectors must be of the same length.');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  let zeroVectorA = true;
  let zeroVectorB = true;

  const vectorA = new Float64Array(a);
  const vectorB = new Float64Array(b);

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i]! * vectorB[i]!;
    normA += vectorA[i]! * vectorA[i]!;
    normB += vectorB[i]! * vectorB[i]!;
    if (vectorA[i] !== 0) zeroVectorA = false;
    if (vectorB[i] !== 0) zeroVectorB = false;
  }

  if (zeroVectorA || zeroVectorB) {
    return 1; // Return maximum distance if one vector is zero
  }

  const sqrtNormA = Math.sqrt(normA);
  const sqrtNormB = Math.sqrt(normB);
  const similarity = dotProduct / (sqrtNormA * sqrtNormB);
  return 1 - similarity; // Returning distance as 1 - cosine similarity.
};
