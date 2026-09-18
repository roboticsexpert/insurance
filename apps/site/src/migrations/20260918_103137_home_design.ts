import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "cms"."enum_pages_blocks_product_grid_coming_soon_icon_key" AS ENUM('briefcase', 'car', 'plane', 'fire');
  CREATE TYPE "cms"."enum_pages_blocks_features_features_icon_key" AS ENUM('clock', 'tag', 'lock', 'check', 'car', 'plane', 'fire', 'briefcase');
  CREATE TYPE "cms"."enum_pages_blocks_faq_links_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "cms"."enum__pages_v_blocks_product_grid_coming_soon_icon_key" AS ENUM('briefcase', 'car', 'plane', 'fire');
  CREATE TYPE "cms"."enum__pages_v_blocks_features_features_icon_key" AS ENUM('clock', 'tag', 'lock', 'check', 'car', 'plane', 'fire', 'briefcase');
  CREATE TYPE "cms"."enum__pages_v_blocks_faq_links_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "cms"."enum_header_login_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "cms"."enum_footer_columns_nav_items_link_type" AS ENUM('reference', 'custom');
  CREATE TABLE "cms"."pages_blocks_hero_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar
  );
  
  CREATE TABLE "cms"."pages_blocks_product_grid_coming_soon" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"icon_key" "cms"."enum_pages_blocks_product_grid_coming_soon_icon_key" DEFAULT 'briefcase'
  );
  
  CREATE TABLE "cms"."pages_blocks_faq_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "cms"."enum_pages_blocks_faq_links_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_label" varchar
  );
  
  CREATE TABLE "cms"."_pages_v_blocks_hero_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "cms"."_pages_v_blocks_product_grid_coming_soon" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"icon_key" "cms"."enum__pages_v_blocks_product_grid_coming_soon_icon_key" DEFAULT 'briefcase',
  	"_uuid" varchar
  );
  
  CREATE TABLE "cms"."_pages_v_blocks_faq_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"link_type" "cms"."enum__pages_v_blocks_faq_links_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "cms"."header_login" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "cms"."enum_header_login_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_label" varchar NOT NULL
  );
  
  CREATE TABLE "cms"."footer_columns_nav_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "cms"."enum_footer_columns_nav_items_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_label" varchar NOT NULL
  );
  
  CREATE TABLE "cms"."footer_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL
  );
  
  ALTER TABLE "cms"."pages_blocks_features_features" ADD COLUMN "icon_key" "cms"."enum_pages_blocks_features_features_icon_key";
  ALTER TABLE "cms"."pages_blocks_features" ADD COLUMN "subheading" varchar;
  ALTER TABLE "cms"."pages_blocks_faq" ADD COLUMN "subheading" varchar;
  ALTER TABLE "cms"."pages_blocks_posts_list" ADD COLUMN "subheading" varchar;
  ALTER TABLE "cms"."_pages_v_blocks_features_features" ADD COLUMN "icon_key" "cms"."enum__pages_v_blocks_features_features_icon_key";
  ALTER TABLE "cms"."_pages_v_blocks_features" ADD COLUMN "subheading" varchar;
  ALTER TABLE "cms"."_pages_v_blocks_faq" ADD COLUMN "subheading" varchar;
  ALTER TABLE "cms"."_pages_v_blocks_posts_list" ADD COLUMN "subheading" varchar;
  ALTER TABLE "cms"."footer" ADD COLUMN "tagline" varchar;
  ALTER TABLE "cms"."footer" ADD COLUMN "support_phone" varchar;
  ALTER TABLE "cms"."footer" ADD COLUMN "support_email" varchar;
  ALTER TABLE "cms"."pages_blocks_hero_bullets" ADD CONSTRAINT "pages_blocks_hero_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."pages_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."pages_blocks_product_grid_coming_soon" ADD CONSTRAINT "pages_blocks_product_grid_coming_soon_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."pages_blocks_product_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."pages_blocks_faq_links" ADD CONSTRAINT "pages_blocks_faq_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."pages_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_pages_v_blocks_hero_bullets" ADD CONSTRAINT "_pages_v_blocks_hero_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_pages_v_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_pages_v_blocks_product_grid_coming_soon" ADD CONSTRAINT "_pages_v_blocks_product_grid_coming_soon_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_pages_v_blocks_product_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_pages_v_blocks_faq_links" ADD CONSTRAINT "_pages_v_blocks_faq_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_pages_v_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."header_login" ADD CONSTRAINT "header_login_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."header"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."footer_columns_nav_items" ADD CONSTRAINT "footer_columns_nav_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."footer_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."footer_columns" ADD CONSTRAINT "footer_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."footer"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_hero_bullets_order_idx" ON "cms"."pages_blocks_hero_bullets" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_bullets_parent_id_idx" ON "cms"."pages_blocks_hero_bullets" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_product_grid_coming_soon_order_idx" ON "cms"."pages_blocks_product_grid_coming_soon" USING btree ("_order");
  CREATE INDEX "pages_blocks_product_grid_coming_soon_parent_id_idx" ON "cms"."pages_blocks_product_grid_coming_soon" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faq_links_order_idx" ON "cms"."pages_blocks_faq_links" USING btree ("_order");
  CREATE INDEX "pages_blocks_faq_links_parent_id_idx" ON "cms"."pages_blocks_faq_links" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_hero_bullets_order_idx" ON "cms"."_pages_v_blocks_hero_bullets" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hero_bullets_parent_id_idx" ON "cms"."_pages_v_blocks_hero_bullets" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_product_grid_coming_soon_order_idx" ON "cms"."_pages_v_blocks_product_grid_coming_soon" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_product_grid_coming_soon_parent_id_idx" ON "cms"."_pages_v_blocks_product_grid_coming_soon" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_faq_links_order_idx" ON "cms"."_pages_v_blocks_faq_links" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_faq_links_parent_id_idx" ON "cms"."_pages_v_blocks_faq_links" USING btree ("_parent_id");
  CREATE INDEX "header_login_order_idx" ON "cms"."header_login" USING btree ("_order");
  CREATE INDEX "header_login_parent_id_idx" ON "cms"."header_login" USING btree ("_parent_id");
  CREATE INDEX "footer_columns_nav_items_order_idx" ON "cms"."footer_columns_nav_items" USING btree ("_order");
  CREATE INDEX "footer_columns_nav_items_parent_id_idx" ON "cms"."footer_columns_nav_items" USING btree ("_parent_id");
  CREATE INDEX "footer_columns_order_idx" ON "cms"."footer_columns" USING btree ("_order");
  CREATE INDEX "footer_columns_parent_id_idx" ON "cms"."footer_columns" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "cms"."pages_blocks_hero_bullets" CASCADE;
  DROP TABLE "cms"."pages_blocks_product_grid_coming_soon" CASCADE;
  DROP TABLE "cms"."pages_blocks_faq_links" CASCADE;
  DROP TABLE "cms"."_pages_v_blocks_hero_bullets" CASCADE;
  DROP TABLE "cms"."_pages_v_blocks_product_grid_coming_soon" CASCADE;
  DROP TABLE "cms"."_pages_v_blocks_faq_links" CASCADE;
  DROP TABLE "cms"."header_login" CASCADE;
  DROP TABLE "cms"."footer_columns_nav_items" CASCADE;
  DROP TABLE "cms"."footer_columns" CASCADE;
  ALTER TABLE "cms"."pages_blocks_features_features" DROP COLUMN "icon_key";
  ALTER TABLE "cms"."pages_blocks_features" DROP COLUMN "subheading";
  ALTER TABLE "cms"."pages_blocks_faq" DROP COLUMN "subheading";
  ALTER TABLE "cms"."pages_blocks_posts_list" DROP COLUMN "subheading";
  ALTER TABLE "cms"."_pages_v_blocks_features_features" DROP COLUMN "icon_key";
  ALTER TABLE "cms"."_pages_v_blocks_features" DROP COLUMN "subheading";
  ALTER TABLE "cms"."_pages_v_blocks_faq" DROP COLUMN "subheading";
  ALTER TABLE "cms"."_pages_v_blocks_posts_list" DROP COLUMN "subheading";
  ALTER TABLE "cms"."footer" DROP COLUMN "tagline";
  ALTER TABLE "cms"."footer" DROP COLUMN "support_phone";
  ALTER TABLE "cms"."footer" DROP COLUMN "support_email";
  DROP TYPE "cms"."enum_pages_blocks_product_grid_coming_soon_icon_key";
  DROP TYPE "cms"."enum_pages_blocks_features_features_icon_key";
  DROP TYPE "cms"."enum_pages_blocks_faq_links_link_type";
  DROP TYPE "cms"."enum__pages_v_blocks_product_grid_coming_soon_icon_key";
  DROP TYPE "cms"."enum__pages_v_blocks_features_features_icon_key";
  DROP TYPE "cms"."enum__pages_v_blocks_faq_links_link_type";
  DROP TYPE "cms"."enum_header_login_link_type";
  DROP TYPE "cms"."enum_footer_columns_nav_items_link_type";`)
}
