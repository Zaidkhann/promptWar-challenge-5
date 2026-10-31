import bcrypt from 'bcryptjs';
import { db, initDatabase } from './index';
import { AIService } from '../services/aiService';
import { Event } from '../types';

export async function seedDatabase(): Promise<void> {
  initDatabase();

  const demoEmail = 'organizer@celebraplan.com';
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(demoEmail) as { id: string } | undefined;

  let userId: string;

  if (existingUser) {
    userId = existingUser.id;
  } else {
    userId = 'usr_demo_organizer';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password123!', salt);

    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, created_at)
      VALUES (?, 'Demo Event Organizer', ?, ?, datetime('now'))
    `).run(userId, demoEmail, passwordHash);
  }

  // Check if events exist for this user
  const eventCount = db.prepare('SELECT COUNT(*) as count FROM events WHERE user_id = ?').get(userId) as { count: number };

  if (eventCount.count === 0) {
    console.log('Seeding initial events for Demo User...');

    // Event 1: Royal Wedding
    const event1Id = 'evt_wedding_demo';
    const weddingDate = new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0];
    const event1: Event = {
      id: event1Id,
      user_id: userId,
      name: "Arjun & Riya's Royal Palace Wedding",
      category: 'Wedding',
      event_date: weddingDate,
      location: 'Jaipur Palace Lawns, Rajasthan',
      guest_count: 150,
      total_budget: 1200000,
      theme: 'Royal Contemporary Regal',
      preferences: 'Gourmet banquet, live folk & acoustic musicians, candid photography, floral entrance',
      notes: 'Family members arriving 2 days in advance. Dedicated guest helpdesk needed.',
      ai_plan_status: 'generated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.prepare(`
      INSERT INTO events (id, user_id, name, category, event_date, location, guest_count, total_budget, preferences, theme, notes, ai_plan_status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      event1.id,
      event1.user_id,
      event1.name,
      event1.category,
      event1.event_date,
      event1.location,
      event1.guest_count,
      event1.total_budget,
      event1.preferences,
      event1.theme,
      event1.notes,
      event1.ai_plan_status
    );

    // Generate and apply AI plan for Event 1
    const plan1 = AIService.generateDeterministicDemoPlan(event1);
    AIService.applyPlanToEvent(event1Id, plan1, weddingDate);

    // Add real expenses for Event 1
    db.prepare(`
      INSERT INTO expenses (id, event_id, category, title, amount, paid_to, expense_date, status, notes, created_at, updated_at)
      VALUES 
      ('exp_w1', ?, 'Venue', 'Palace Lawns Advance Booking', 250000, 'Jaipur Palace Management', date('now', '-10 days'), 'paid', '50% advance', datetime('now'), datetime('now')),
      ('exp_w2', ?, 'Catering', 'Tasting & Raw Ingredient Advance', 150000, 'Royal Banquet Caterers', date('now', '-5 days'), 'paid', 'Menu finalized', datetime('now'), datetime('now')),
      ('exp_w3', ?, 'Photography', 'Lead Studio Advance', 40000, 'Lens & Moments Studios', date('now', '-2 days'), 'pending', 'Cinematography + candid photo', datetime('now'), datetime('now'))
    `).run(event1Id, event1Id, event1Id);

    // Event 2: Birthday Gala
    const event2Id = 'evt_birthday_demo';
    const bdayDate = new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0];
    const event2: Event = {
      id: event2Id,
      user_id: userId,
      name: "Aarav's 10th Superhero Birthday Bash",
      category: 'Birthday',
      event_date: bdayDate,
      location: 'Greenwood Club Lawn, Bhopal',
      guest_count: 50,
      total_budget: 60000,
      theme: 'Marvel Superhero Adventure',
      preferences: 'Interactive superhero costume photo booth, custom 3D cake, live magic show, kid-friendly snack bar',
      notes: 'Kids gift hampers to be distributed at exit.',
      ai_plan_status: 'generated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.prepare(`
      INSERT INTO events (id, user_id, name, category, event_date, location, guest_count, total_budget, preferences, theme, notes, ai_plan_status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      event2.id,
      event2.user_id,
      event2.name,
      event2.category,
      event2.event_date,
      event2.location,
      event2.guest_count,
      event2.total_budget,
      event2.preferences,
      event2.theme,
      event2.notes,
      event2.ai_plan_status
    );

    const plan2 = AIService.generateDeterministicDemoPlan(event2);
    AIService.applyPlanToEvent(event2Id, plan2, bdayDate);

    // Add real expenses for Event 2
    db.prepare(`
      INSERT INTO expenses (id, event_id, category, title, amount, paid_to, expense_date, status, notes, created_at, updated_at)
      VALUES 
      ('exp_b1', ?, 'Venue', 'Club Lawn Rental', 15000, 'Greenwood Club', date('now', '-3 days'), 'paid', 'Deposit confirmed', datetime('now'), datetime('now')),
      ('exp_b2', ?, 'Catering', 'Kids Mini Burgers & Cupcake Bar', 18000, 'Sweet Treats Bakery', date('now', '-1 days'), 'paid', '50 kids food pass', datetime('now'), datetime('now'))
    `).run(event2Id, event2Id);

    console.log('Seeded demo events successfully!');
  }
}

// Run seed if executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Database seeding finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeding error:', err);
      process.exit(1);
    });
}
