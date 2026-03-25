-- AlterTable: add seriesDirPath to Media for series directory-based import and refresh
ALTER TABLE "Media" ADD COLUMN "seriesDirPath" TEXT;
