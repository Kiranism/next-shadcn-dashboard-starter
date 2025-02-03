# Database Migration Guide

This guide explains how to update your database schema using Prisma migrations and how to handle any issues that might arise during the process.

## Steps to Migrate the Database

1. **Update Your Schema**  
   Modify `schema.prisma` file with the new structure or changes you want to apply.

2. **Create a Manual Migration File**  
   In the `prisma/migrations` directory, create a new migration file with a timestamp and a descriptive name. For example:  
   `20250121000000_add_new_fields.sql`

3. **Deploy the Migration**  
   Run the following command to deploy your new migration to the database:  
   ```bash
   npx prisma migrate deploy


## Rollback a Failed Migration

If a migration fails, you can rollback the changes using the following command:

```bash
npx prisma migrate resolve --rolled-back "20250131000000_add_user_role"
```

## Mark a Migration as Applied

If you have successfully applied a migration, you can mark it as resolved using:

```bash
npx prisma migrate resolve --applied "20250131000000_add_user_role"
```

