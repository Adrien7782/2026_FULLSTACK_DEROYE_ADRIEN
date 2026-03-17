ALTER TABLE "Media"
ADD COLUMN "videoPath" TEXT,
ADD COLUMN "posterPath" TEXT,
ADD COLUMN "backdropPath" TEXT;

ALTER TABLE "Media"
DROP COLUMN "posterUrl",
DROP COLUMN "backdropUrl";
