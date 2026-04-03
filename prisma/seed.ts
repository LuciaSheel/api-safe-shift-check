/**
 * Database Seed Script
 * Populates the database with initial demo data.
 * Run with: npm run db:seed
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('Seeding database...');

  // ── System Settings ────────────────────────────────────────────────
  await prisma.systemSettings.upsert({
    where: { Id: 'settings-001' },
    create: {
      Id: 'settings-001',
      CheckInIntervalMinutes: 15,
      ResponseTimeoutSeconds: 60,
      EscalationDelayMinutes: 5,
      EnableSmsNotifications: true,
      EnableEmailNotifications: true,
      EnablePushNotifications: true,
      EmergencyNumber: '911',
      NonEmergencyNumber: '250-766-2288',
    },
    update: {},
  });

  // ── Users ──────────────────────────────────────────────────────────
  const DEMO_HASH = await bcrypt.hash(process.env.SEED_DEMO_PASSWORD ?? 'demo123', 10);
  const ADMIN_HASH = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD ?? 'admin123', 10);

  const users = [
    { Id: 'user-001', Email: 'sarah.johnson@example.com', Password: DEMO_HASH, FirstName: 'Sarah', LastName: 'Johnson', Role: 'Cleaner', Phone: '+1 (555) 123-4567', IsActive: true, AssignedBackupContactIds: ['user-006', 'user-007'], AssignedWorkerIds: [] },
    { Id: 'user-002', Email: 'mike.chen@example.com', Password: DEMO_HASH, FirstName: 'Mike', LastName: 'Chen', Role: 'Cleaner', Phone: '+1 (555) 234-5678', IsActive: true, AssignedBackupContactIds: ['user-006', 'user-008'], AssignedWorkerIds: [] },
    { Id: 'user-003', Email: 'emma.wilson@example.com', Password: DEMO_HASH, FirstName: 'Emma', LastName: 'Wilson', Role: 'Booker', Phone: '+1 (555) 345-6789', IsActive: true, AssignedBackupContactIds: ['user-007', 'user-006'], AssignedWorkerIds: [] },
    { Id: 'user-004', Email: 'james.brown@example.com', Password: DEMO_HASH, FirstName: 'James', LastName: 'Brown', Role: 'Booker', Phone: '+1 (555) 456-7890', IsActive: true, AssignedBackupContactIds: ['user-007', 'user-008'], AssignedWorkerIds: [] },
    { Id: 'user-005', Email: 'lisa.martinez@example.com', Password: DEMO_HASH, FirstName: 'Lisa', LastName: 'Martinez', Role: 'Director', Phone: '+1 (555) 567-8901', IsActive: false, AssignedBackupContactIds: [], AssignedWorkerIds: [] },
    { Id: 'user-006', Email: 'david.taylor@example.com', Password: DEMO_HASH, FirstName: 'David', LastName: 'Taylor', Role: 'Director', Phone: '+1 (555) 678-9012', IsActive: true, AssignedBackupContactIds: [], AssignedWorkerIds: ['user-001', 'user-002', 'user-005'] },
    { Id: 'user-007', Email: 'jennifer.garcia@example.com', Password: DEMO_HASH, FirstName: 'Jennifer', LastName: 'Garcia', Role: 'Director', Phone: '+1 (555) 789-0123', IsActive: true, AssignedBackupContactIds: [], AssignedWorkerIds: ['user-003', 'user-004'] },
    { Id: 'user-008', Email: 'robert.anderson@example.com', Password: DEMO_HASH, FirstName: 'Robert', LastName: 'Anderson', Role: 'Director', Phone: '+1 (555) 890-1234', IsActive: true, TeamId: 'team-001', AssignedBackupContactIds: [], AssignedWorkerIds: [] },
    { Id: 'user-009', Email: 'maria.rodriguez@example.com', Password: DEMO_HASH, FirstName: 'Maria', LastName: 'Rodriguez', Role: 'Director', Phone: '+1 (555) 901-2345', IsActive: true, TeamId: 'team-002', AssignedBackupContactIds: [], AssignedWorkerIds: [] },
    { Id: 'user-010', Email: 'admin@safeonshift.com', Password: ADMIN_HASH, FirstName: 'System', LastName: 'Administrator', Role: 'Administrator', Phone: '+1 (555) 000-0000', IsActive: true, AssignedBackupContactIds: [], AssignedWorkerIds: [] },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { Id: u.Id },
      create: u,
      update: {},
    });
  }

  // ── Locations ──────────────────────────────────────────────────────
  const locations = [
    { Id: 'loc-001', Name: 'Downtown Community Hall', Address: '123 Main Street, Downtown', Latitude: 40.7128, Longitude: -74.006, IsActive: true },
    { Id: 'loc-002', Name: 'Riverside Recreation Center', Address: '456 River Road, Riverside', Latitude: 40.7282, Longitude: -73.9942, IsActive: true },
    { Id: 'loc-003', Name: 'Northside Community Center', Address: '789 North Avenue, Northside', Latitude: 40.7589, Longitude: -73.9851, IsActive: true },
    { Id: 'loc-004', Name: 'Eastside Youth Center', Address: '321 East Boulevard, Eastside', Latitude: 40.7484, Longitude: -73.9857, IsActive: true },
    { Id: 'loc-005', Name: 'Westbrook Senior Center', Address: '654 West Street, Westbrook', Latitude: 40.7614, Longitude: -73.9776, IsActive: false },
  ];

  for (const l of locations) {
    await prisma.location.upsert({
      where: { Id: l.Id },
      create: l,
      update: {},
    });
  }

  // ── Teams ──────────────────────────────────────────────────────────
  const teams = [
    { Id: 'team-001', Name: 'Downtown Team', ManagerId: 'user-008', MemberIds: ['user-001', 'user-002', 'user-006'] },
    { Id: 'team-002', Name: 'Community Outreach', ManagerId: 'user-009', MemberIds: ['user-003', 'user-004', 'user-007'] },
  ];

  for (const t of teams) {
    await prisma.team.upsert({
      where: { Id: t.Id },
      create: t,
      update: {},
    });
  }

  console.log('✅ Database seeded successfully.');
  console.log('');
  console.log('Demo accounts (see README for login details):');
  console.log('  Cleaner    → sarah.johnson@example.com');
  console.log('  Booker     → emma.wilson@example.com');
  console.log('  Director   → david.taylor@example.com');
  console.log('  Admin      → admin@safeonshift.com');
}

main()
  .catch(e => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
