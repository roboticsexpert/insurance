import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "cms"."enum_pages_blocks_features_columns" ADD VALUE IF NOT EXISTS '5';
  ALTER TYPE "cms"."enum__pages_v_blocks_features_columns" ADD VALUE IF NOT EXISTS '5';
  ALTER TABLE "cms"."pages_blocks_offer_preview" ADD COLUMN "panel_label" varchar DEFAULT 'پیشنهادها';
  ALTER TABLE "cms"."_pages_v_blocks_offer_preview" ADD COLUMN "panel_label" varchar DEFAULT 'پیشنهادها';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "cms"."pages_blocks_features" ALTER COLUMN "columns" SET DATA TYPE text;
  ALTER TABLE "cms"."pages_blocks_features" ALTER COLUMN "columns" SET DEFAULT '3'::text;
  DROP TYPE "cms"."enum_pages_blocks_features_columns";
  CREATE TYPE "cms"."enum_pages_blocks_features_columns" AS ENUM('2', '3', '4');
  ALTER TABLE "cms"."pages_blocks_features" ALTER COLUMN "columns" SET DEFAULT '3'::"cms"."enum_pages_blocks_features_columns";
  ALTER TABLE "cms"."pages_blocks_features" ALTER COLUMN "columns" SET DATA TYPE "cms"."enum_pages_blocks_features_columns" USING "columns"::"cms"."enum_pages_blocks_features_columns";
  ALTER TABLE "cms"."_pages_v_blocks_features" ALTER COLUMN "columns" SET DATA TYPE text;
  ALTER TABLE "cms"."_pages_v_blocks_features" ALTER COLUMN "columns" SET DEFAULT '3'::text;
  DROP TYPE "cms"."enum__pages_v_blocks_features_columns";
  CREATE TYPE "cms"."enum__pages_v_blocks_features_columns" AS ENUM('2', '3', '4');
  ALTER TABLE "cms"."_pages_v_blocks_features" ALTER COLUMN "columns" SET DEFAULT '3'::"cms"."enum__pages_v_blocks_features_columns";
  ALTER TABLE "cms"."_pages_v_blocks_features" ALTER COLUMN "columns" SET DATA TYPE "cms"."enum__pages_v_blocks_features_columns" USING "columns"::"cms"."enum__pages_v_blocks_features_columns";
  ALTER TABLE "cms"."pages_blocks_offer_preview" DROP COLUMN "panel_label";
  ALTER TABLE "cms"."_pages_v_blocks_offer_preview" DROP COLUMN "panel_label";`)
}
