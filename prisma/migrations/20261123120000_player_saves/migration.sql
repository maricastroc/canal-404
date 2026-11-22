-- AlterTable
ALTER TABLE "players" ADD COLUMN     "recovery_at" TIMESTAMPTZ(3);

-- CreateTable
CREATE TABLE "player_saves" (
    "player_id" UUID NOT NULL,
    "data" JSONB NOT NULL,
    "saved_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_saves_pkey" PRIMARY KEY ("player_id")
);

-- AddForeignKey
ALTER TABLE "player_saves" ADD CONSTRAINT "player_saves_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "player_saves" ADD CONSTRAINT "player_saves_data_check" CHECK (jsonb_typeof("data") = 'object' AND octet_length("data"::text) <= 65536);
