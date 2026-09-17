#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/3cea117ac5f53c36f64d0db8b3d8caa173f66be6312d6ef37f2f8dc67dac2bee/contract';
import startContract from '../../snapshots/3cea117ac5f53c36f64d0db8b3d8caa173f66be6312d6ef37f2f8dc67dac2bee/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/4ce2f6200b5a6b91dfee79eb90f05f4d1ef4eb9d515f491e8358968042b5b3ec/contract';
import endContract from '../../snapshots/4ce2f6200b5a6b91dfee79eb90f05f4d1ef4eb9d515f491e8358968042b5b3ec/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'productFeature',
        columns: [
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('label', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('position', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('productId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addColumn({
        schema: 'public',
        table: 'product',
        column: col('color', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'product',
        column: col('iconName', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'product',
        column: col('originalPrice', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'product',
        column: col('shortName', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.createIndex({
        schema: 'public',
        table: 'productFeature',
        index: 'productFeature_productId_idx_5858600a',
        columns: ['productId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'productFeature',
        foreignKey: {
          name: 'productFeature_productId_fkey',
          columns: ['productId'],
          references: { schema: 'public', table: 'product', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
