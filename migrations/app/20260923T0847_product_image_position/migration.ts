#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/4dcef1d303832e2aac98cee9863e83db7e3cf391b76b5979e894ffd5ced2684e/contract';
import endContract from '../../snapshots/4dcef1d303832e2aac98cee9863e83db7e3cf391b76b5979e894ffd5ced2684e/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/80da7947e88d7587ae8f76654da6f44aeeada6f6d34b730797dd192a83efe383/contract';
import startContract from '../../snapshots/80da7947e88d7587ae8f76654da6f44aeeada6f6d34b730797dd192a83efe383/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'productImage',
        column: col('position', 'int4', {
          notNull: true,
          default: lit(0),
          codecRef: { codecId: 'pg/int4@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
