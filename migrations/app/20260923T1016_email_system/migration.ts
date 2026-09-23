#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/4dcef1d303832e2aac98cee9863e83db7e3cf391b76b5979e894ffd5ced2684e/contract';
import startContract from '../../snapshots/4dcef1d303832e2aac98cee9863e83db7e3cf391b76b5979e894ffd5ced2684e/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/d19c9f19cbaba3f5b29bd7cbf02bc55262801373a810747a80a0867c6c374f51/contract';
import endContract from '../../snapshots/d19c9f19cbaba3f5b29bd7cbf02bc55262801373a810747a80a0867c6c374f51/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'appSetting',
        columns: [
          col('key', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('value', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['key'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'emailSuppression',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('reason', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['email'])],
      }),
      this.addColumn({
        schema: 'public',
        table: 'paymentEmail',
        column: col('deliveryStatus', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'paymentEmail',
        column: col('deliveryUpdatedAt', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-string@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'paymentEmail',
        column: col('lastError', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'paymentEmail',
        column: col('providerId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'paymentEmail',
        column: col('recipient', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'paymentEmail',
        column: col('sendAfter', 'timestamptz', {
          notNull: true,
          default: fn('now()'),
          codecRef: { codecId: 'pg/timestamptz-string@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'paymentEmail',
        column: col('skippedReason', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.createIndex({
        schema: 'public',
        table: 'paymentEmail',
        index: 'paymentEmail_providerId_idx_d1904c54',
        columns: ['providerId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'paymentEmail',
        index: 'paymentEmail_sentAt_sendAfter_idx_975609e5',
        columns: ['sentAt', 'sendAfter'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
