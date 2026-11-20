-- AlterTable
ALTER TABLE "runs" ADD COLUMN     "client" VARCHAR(24);

ALTER TABLE "runs" ADD CONSTRAINT "runs_client_check" CHECK ("client" ~ '^(blink|webkit|gecko|other)-[0-9]{1,3}-(mobile|desktop)$');
