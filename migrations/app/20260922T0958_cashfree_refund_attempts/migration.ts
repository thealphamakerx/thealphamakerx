#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/0bc2bf1b90c8b24faac344c105d0ac273d06f2a172f876730ec5661202c1699b/contract';
import endContract from '../../snapshots/0bc2bf1b90c8b24faac344c105d0ac273d06f2a172f876730ec5661202c1699b/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/d42c427e004b642cffbc192f67300bf47be3bf1b68c84ecb01313406d6b844b2/contract';
import startContract from '../../snapshots/d42c427e004b642cffbc192f67300bf47be3bf1b68c84ecb01313406d6b844b2/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'paymentRefund',
        column: col('paymentId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'paymentRefund',
        column: col('refundType', 'text', {
          notNull: true,
          default: lit('MERCHANT_INITIATED'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
