import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedStores1640000000002 implements MigrationInterface {
  name = 'SeedStores1640000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "store"`);
    
    await queryRunner.query(`ALTER SEQUENCE store_id_seq RESTART WITH 1`);

    // Insert seed data
    await queryRunner.query(`
      INSERT INTO "store" ("description") VALUES
        ('Loja Principal - Centro'),
        ('Loja Filial - Zona Norte'),
        ('Loja Filial - Zona Sul'),
        ('Loja Online')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "store"`);
    await queryRunner.query(`ALTER SEQUENCE store_id_seq RESTART WITH 1`);
  }
}