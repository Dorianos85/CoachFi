declare module "node:sqlite" {
  interface DatabaseSyncOptions {
    enableForeignKeyConstraints?: boolean;
    readOnly?: boolean;
  }

  type SqlValue = string | number | bigint | null | Uint8Array;

  interface StatementSync {
    run(...params: SqlValue[]): { changes: number; lastInsertRowid: number | bigint };
    get(...params: SqlValue[]): unknown;
    all(...params: SqlValue[]): unknown[];
  }

  export class DatabaseSync {
    constructor(path: string, options?: DatabaseSyncOptions);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
