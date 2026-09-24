#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/046fa86293c338403697ffbd0a730a4e310a1b384eb90e854e71e11a1e4d18d4/contract';
import endContract from '../../snapshots/046fa86293c338403697ffbd0a730a4e310a1b384eb90e854e71e11a1e4d18d4/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/d19c9f19cbaba3f5b29bd7cbf02bc55262801373a810747a80a0867c6c374f51/contract';
import startContract from '../../snapshots/d19c9f19cbaba3f5b29bd7cbf02bc55262801373a810747a80a0867c6c374f51/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'product',
        column: col('digitalFileSize', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'product',
        column: col('digitalFileUploadedAt', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-string@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'product',
        column: col('previewFileKey', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'product',
        column: col('previewFileName', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'product',
        column: col('previewFileSize', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'product',
        column: col('previewFileUploadedAt', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-string@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
