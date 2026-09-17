#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/4ce2f6200b5a6b91dfee79eb90f05f4d1ef4eb9d515f491e8358968042b5b3ec/contract';
import startContract from '../../snapshots/4ce2f6200b5a6b91dfee79eb90f05f4d1ef4eb9d515f491e8358968042b5b3ec/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/6c21f398590011a22b701b4f0a16097ee220adba2e7ae0120a7485952766b72c/contract';
import endContract from '../../snapshots/6c21f398590011a22b701b4f0a16097ee220adba2e7ae0120a7485952766b72c/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'product',
        column: col('isActive', 'bool', {
          notNull: true,
          default: lit(true),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
