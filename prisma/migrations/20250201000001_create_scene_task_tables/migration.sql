BEGIN;

-- 1. Create the enum type for SceneTaskStatus if it doesn't already exist.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'scenetaskstatus'
  ) THEN
    CREATE TYPE "SceneTaskStatus" AS ENUM (
      'PENDING', 
      'ASSIGNED', 
      'IN_PROGRESS', 
      'COMPLETED', 
      'REJECTED',
      'DELETED'
    );
  END IF;
END
$$;

-- 2. Create the Scene table.
CREATE TABLE "scenes" (
  "id" TEXT NOT NULL, -- Your application will generate a cuid value.
  "name" TEXT NOT NULL,
  "dialogue" TEXT,  -- Merged field for scene character lines and voice line.
  "duration" DOUBLE PRECISION NOT NULL,  -- Duration in seconds (e.g., 1.77)
  "size" INTEGER NOT NULL,  -- Size of the scene (for example, file size in bytes)
  "resolution" TEXT,  -- e.g., "1920x1080"
  "startTime" DOUBLE PRECISION NOT NULL,  -- e.g., 2.01 (start time in the original video)
  "endTime" DOUBLE PRECISION NOT NULL,    -- e.g., 4.55 (end time in the original video)
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "Scene_pkey" PRIMARY KEY ("id")
);

-- 3. Create the scene_tasks table.
CREATE TABLE "scene_tasks" (
  "id" TEXT NOT NULL,  -- Application-generated cuid
  "description" TEXT,  -- Optional description for the task
  "videoUrl" TEXT,     -- URL or path to the scene clip
  "sceneNumber" INTEGER,  -- Identifier or order of the scene in the video
  "status" "SceneTaskStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "createdByUserId" TEXT NOT NULL,  -- The editor who created the task
  "assignedToUserId" TEXT,          -- The photographer (if assigned)
  "sceneId" TEXT,               -- Optional link to detailed scene metadata
  CONSTRAINT "SceneTask_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FK_SceneTask_createdBy" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT "FK_SceneTask_assignedTo" FOREIGN KEY ("assignedToUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
  CONSTRAINT "FK_SceneTask_scene" FOREIGN KEY ("sceneId") REFERENCES "scenes"("id") ON DELETE SET NULL ON UPDATE NO ACTION
);

COMMIT;