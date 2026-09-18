import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "cms"."enum_pages_blocks_hero_icon_key" AS ENUM('car', 'plane', 'fire', 'briefcase');
  CREATE TYPE "cms"."enum_pages_blocks_offer_preview_offers_state" AS ENUM('normal', 'cheapest', 'unavailable');
  CREATE TYPE "cms"."enum__pages_v_blocks_hero_icon_key" AS ENUM('car', 'plane', 'fire', 'briefcase');
  CREATE TYPE "cms"."enum__pages_v_blocks_offer_preview_offers_state" AS ENUM('normal', 'cheapest', 'unavailable');
  ALTER TABLE "cms"."pages_blocks_hero" ADD COLUMN "icon_key" "cms"."enum_pages_blocks_hero_icon_key";
  ALTER TABLE "cms"."pages_blocks_quote_form" ADD COLUMN "subheading" varchar;
  ALTER TABLE "cms"."pages_blocks_offer_preview_offers" ADD COLUMN "state" "cms"."enum_pages_blocks_offer_preview_offers_state" DEFAULT 'normal';
  ALTER TABLE "cms"."pages_blocks_offer_preview" ADD COLUMN "body" varchar;
  ALTER TABLE "cms"."pages_blocks_coverage_list" ADD COLUMN "intro" varchar;
  ALTER TABLE "cms"."_pages_v_blocks_hero" ADD COLUMN "icon_key" "cms"."enum__pages_v_blocks_hero_icon_key";
  ALTER TABLE "cms"."_pages_v_blocks_quote_form" ADD COLUMN "subheading" varchar;
  ALTER TABLE "cms"."_pages_v_blocks_offer_preview_offers" ADD COLUMN "state" "cms"."enum__pages_v_blocks_offer_preview_offers_state" DEFAULT 'normal';
  ALTER TABLE "cms"."_pages_v_blocks_offer_preview" ADD COLUMN "body" varchar;
  ALTER TABLE "cms"."_pages_v_blocks_coverage_list" ADD COLUMN "intro" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "cms"."pages_blocks_hero" DROP COLUMN "icon_key";
  ALTER TABLE "cms"."pages_blocks_quote_form" DROP COLUMN "subheading";
  ALTER TABLE "cms"."pages_blocks_offer_preview_offers" DROP COLUMN "state";
  ALTER TABLE "cms"."pages_blocks_offer_preview" DROP COLUMN "body";
  ALTER TABLE "cms"."pages_blocks_coverage_list" DROP COLUMN "intro";
  ALTER TABLE "cms"."_pages_v_blocks_hero" DROP COLUMN "icon_key";
  ALTER TABLE "cms"."_pages_v_blocks_quote_form" DROP COLUMN "subheading";
  ALTER TABLE "cms"."_pages_v_blocks_offer_preview_offers" DROP COLUMN "state";
  ALTER TABLE "cms"."_pages_v_blocks_offer_preview" DROP COLUMN "body";
  ALTER TABLE "cms"."_pages_v_blocks_coverage_list" DROP COLUMN "intro";
  DROP TYPE "cms"."enum_pages_blocks_hero_icon_key";
  DROP TYPE "cms"."enum_pages_blocks_offer_preview_offers_state";
  DROP TYPE "cms"."enum__pages_v_blocks_hero_icon_key";
  DROP TYPE "cms"."enum__pages_v_blocks_offer_preview_offers_state";`)
}
