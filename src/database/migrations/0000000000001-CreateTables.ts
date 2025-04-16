import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTables1640000000001 implements MigrationInterface {
  name = 'CreateTables1640000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "store" (
        "id" SERIAL PRIMARY KEY,
        "description" character varying(100) NOT NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "product" (
        "id" SERIAL PRIMARY KEY,
        "description" character varying(60) NOT NULL, 
        "image" bytea NULL,
        "cost" decimal(13,3)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "product_store" (
        "id" SERIAL PRIMARY KEY,
        "productId" integer NOT NULL,
        "storeId" integer NOT NULL,
        "salePrice" decimal(13,3) NOT NULL,
        CONSTRAINT "FK_product_store_product" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_product_store_store" FOREIGN KEY ("storeId") REFERENCES "store"("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_product_store_unique" 
      ON "product_store" ("productId", "storeId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_product_store_unique"`);
    await queryRunner.query(`DROP TABLE "product_store"`);
    await queryRunner.query(`DROP TABLE "product"`);
    await queryRunner.query(`DROP TABLE "store"`);
  }
}