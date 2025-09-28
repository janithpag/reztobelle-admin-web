'use client';

import { UserManagement } from '@/components/user-management';

export default function UsersPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground">
          Manage user registrations and account status
        </p>
      </div>
      
      <UserManagement />
    </div>
  );
}