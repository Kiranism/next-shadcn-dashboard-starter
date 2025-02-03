-- 1. Create the "user_roles" table
CREATE TABLE "user_roles" (
  "id" INTEGER NOT NULL,
  "roleName" TEXT NOT NULL,
  CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- 2. insert user roles.
INSERT INTO "user_roles" ("id", "roleName") VALUES
  (1, 'Author'),
  (2, 'Editor'),
  (3, 'Photographer');

-- 3. Add the "roleId" column to the "users" table.
-- We initially add it as nullable to avoid issues with existing data.
ALTER TABLE "users" ADD COLUMN "roleId" INTEGER;

-- 4. (Optional) Set a default value for existing rows.
-- Here we update any existing user to have the roleId of 1 ("Author").
UPDATE "users" SET "roleId" = 1 WHERE "roleId" IS NULL;

-- 5. Alter the "roleId" column to be NOT NULL.
ALTER TABLE "users" ALTER COLUMN "roleId" SET NOT NULL;

-- 6. Add the foreign key constraint linking "users"."roleId" to "user_roles"."id".
ALTER TABLE "users"
  ADD CONSTRAINT "FK_users_user_roles_roleId"
  FOREIGN KEY ("roleId")
  REFERENCES "user_roles"("id")
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;