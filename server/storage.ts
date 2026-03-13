import { storms, drops, requests, type Storm, type InsertStorm, type Drop, type InsertDrop, type Request, type InsertRequest } from "@shared/schema";

export interface IStorage {
  // Storms
  getStorms(): Promise<Storm[]>;
  getStorm(id: number): Promise<Storm | undefined>;
  createStorm(storm: InsertStorm): Promise<Storm>;
  updateStorm(id: number, data: Partial<Storm>): Promise<Storm | undefined>;

  // Drops
  getDropsByStorm(stormId: number): Promise<Drop[]>;
  createDrop(drop: InsertDrop): Promise<Drop>;
  completeDrop(id: number): Promise<Drop | undefined>;

  // Requests
  getRequests(): Promise<Request[]>;
  getRequest(id: number): Promise<Request | undefined>;
  createRequest(req: InsertRequest): Promise<Request>;
  updateRequest(id: number, data: Partial<Request>): Promise<Request | undefined>;

  // Stats
  getStats(): Promise<{ totalStorms: number; activeStorms: number; totalDrops: number; totalParticipants: number; completedStorms: number }>;
}

export class MemStorage implements IStorage {
  private storms: Map<number, Storm> = new Map();
  private drops: Map<number, Drop> = new Map();
  private requests: Map<number, Request> = new Map();
  private stormIdCounter = 1;
  private dropIdCounter = 1;
  private requestIdCounter = 1;

  constructor() {
    this.seed();
  }

  private seed() {
    const now = new Date();
    const seedStorms: Storm[] = [
      {
        id: this.stormIdCounter++,
        title: "PRP House Fire Victims",
        description: "A family of five in the Portland/River Park area lost their home to a kitchen fire early Sunday morning. The Delgado family — parents and three children ages 4, 9, and 13 — escaped safely but lost everything. They need immediate housing support, clothing, meals, and help navigating Red Cross and FEMA paperwork. A temporary church shelter is available but they need a full community response.",
        location: "Portland / River Park, Louisville, KY",
        need: "emergency housing, clothing, meals, paperwork support",
        status: "active",
        stewardName: "Rev. Marcus Webb — Portland Community Church",
        stewardAvatar: null,
        participantCount: 22,
        dropCount: 17,
        targetDrops: 30,
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
        tags: ["fire", "housing", "crisis", "family"],
        urgency: "critical",
        verified: true,
      },
      {
        id: this.stormIdCounter++,
        title: "Backpack Food Drive",
        description: "Every Friday, 47 children at Breckinridge-Franklin Elementary go home without reliable food for the weekend. The school's backpack food program has run out of funding and supplies. We need non-perishable food items, peanut butter, breakfast bars, and juice boxes — enough to fill 47 backpacks every week for 8 weeks. Drop-off at the school office or contact the steward for pickup coordination.",
        location: "Breckinridge-Franklin Elementary, Louisville, KY",
        need: "non-perishable food, weekend meal kits, volunteer packers",
        status: "active",
        stewardName: "Ms. Tanya Greer — School Counselor",
        stewardAvatar: null,
        participantCount: 19,
        dropCount: 14,
        targetDrops: 25,
        createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(now.getTime() + 56 * 24 * 60 * 60 * 1000),
        tags: ["food", "children", "school", "weekly"],
        urgency: "high",
        verified: true,
      },
      {
        id: this.stormIdCounter++,
        title: "Mobile Nurse West End",
        description: "A coalition of nurses and nurse practitioners is organizing bi-weekly mobile health visits to homebound residents in the West End — specifically those without transportation or insurance who are managing chronic conditions like diabetes, hypertension, and wound care. We need volunteer drivers, donated medical supplies (blood pressure cuffs, glucose meters, wound care kits), and financial sponsors to cover supply costs. Our goal is 20 home visits per month.",
        location: "West End, Louisville, KY",
        need: "volunteer drivers, medical supplies, financial sponsors",
        status: "active",
        stewardName: "Nurse Practitioner Keisha Avant, MSN",
        stewardAvatar: null,
        participantCount: 11,
        dropCount: 7,
        targetDrops: 20,
        createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
        expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        tags: ["medical", "healthcare", "west-end", "chronic-care"],
        urgency: "high",
        verified: true,
      },
      {
        id: this.stormIdCounter++,
        title: "KJ's Law 2026",
        description: "KJ was a 16-year-old killed in a hit-and-run in the Newburg neighborhood. His family has been advocating for two years for a state law requiring stricter penalties for leaving the scene of a fatal accident — and it's finally moving through the Kentucky Legislature this session. The family needs community members to attend the upcoming committee hearing in Frankfort, write letters to their state representatives, and help cover travel and advocacy costs. This is the final push.",
        location: "Newburg, Louisville / Frankfort, KY",
        need: "legislative advocacy, hearing attendance, letter writing, travel support",
        status: "active",
        stewardName: "KJ's Family & Newburg Neighborhood Alliance",
        stewardAvatar: null,
        participantCount: 38,
        dropCount: 29,
        targetDrops: 40,
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        tags: ["advocacy", "legislation", "justice", "community"],
        urgency: "critical",
        verified: true,
      },
    ];

    seedStorms.forEach(s => this.storms.set(s.id, s));

    const seedDrops: Drop[] = [
      // PRP House Fire (storm 1)
      { id: this.dropIdCounter++, stormId: 1, actorName: "Carla T.", actorAvatar: null, action: "Bringing dinner Tuesday & Thursday this week", category: "meals", note: "Vegetarian and halal options available", completed: true, createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) },
      { id: this.dropIdCounter++, stormId: 1, actorName: "Mike S.", actorAvatar: null, action: "Dropping off clothing — kids sizes 4T, 9 and teen girls", category: "volunteer", note: "Will leave bags at church office Monday", completed: true, createdAt: new Date(now.getTime() - 20 * 60 * 60 * 1000) },
      { id: this.dropIdCounter++, stormId: 1, actorName: "Angela R.", actorAvatar: null, action: "Sitting with family for Red Cross application Saturday 10am", category: "volunteer", note: "I've helped with this process before", completed: false, createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000) },
      { id: this.dropIdCounter++, stormId: 1, actorName: "First Baptist Kitchen Team", actorAvatar: null, action: "Hot meals Monday, Wednesday, Friday for two weeks", category: "meals", note: "Will coordinate pickup times with Rev. Webb", completed: false, createdAt: new Date(now.getTime() - 10 * 60 * 60 * 1000) },

      // Backpack Food Drive (storm 2)
      { id: this.dropIdCounter++, stormId: 2, actorName: "The Kowalski Family", actorAvatar: null, action: "Donating 4 cases of peanut butter and crackers", category: "volunteer", note: "Will drop off Thursday morning", completed: true, createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
      { id: this.dropIdCounter++, stormId: 2, actorName: "Calvary Chapel Women's Group", actorAvatar: null, action: "Packing 47 backpacks every Thursday 4–6pm for 8 weeks", category: "volunteer", note: null, completed: false, createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
      { id: this.dropIdCounter++, stormId: 2, actorName: "DeShawn M.", actorAvatar: null, action: "$50 Kroger gift card for juice boxes and breakfast bars", category: "financial", note: null, completed: true, createdAt: new Date(now.getTime() - 36 * 60 * 60 * 1000) },

      // Mobile Nurse West End (storm 3)
      { id: this.dropIdCounter++, stormId: 3, actorName: "David K.", actorAvatar: null, action: "Driving every other Saturday for mobile visits", category: "transport", note: "I have a minivan — can fit supplies and 2 nurses", completed: false, createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
      { id: this.dropIdCounter++, stormId: 3, actorName: "Louisville Medical Supply Co.", actorAvatar: null, action: "Donating 10 blood pressure cuffs and 5 glucose meters", category: "volunteer", note: "Contact Keisha directly for pickup coordination", completed: false, createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000) },

      // KJ's Law (storm 4)
      { id: this.dropIdCounter++, stormId: 4, actorName: "Neighbors for Justice", actorAvatar: null, action: "Organizing carpool to Frankfort hearing — March 18th", category: "transport", note: "Leaving from Newburg Park & Ride at 8am", completed: false, createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) },
      { id: this.dropIdCounter++, stormId: 4, actorName: "Rev. Dana Hughes", actorAvatar: null, action: "Submitting letter to Rep. Thomas on behalf of congregation", category: "volunteer", note: null, completed: true, createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
      { id: this.dropIdCounter++, stormId: 4, actorName: "Patricia W.", actorAvatar: null, action: "$75 toward family travel costs for the Frankfort hearing", category: "financial", note: "Venmo or check — whatever is easiest for the family", completed: true, createdAt: new Date(now.getTime() - 18 * 60 * 60 * 1000) },
      { id: this.dropIdCounter++, stormId: 4, actorName: "LMPD Community Liaison", actorAvatar: null, action: "Attending committee hearing in official capacity in support", category: "volunteer", note: null, completed: false, createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000) },
    ];

    seedDrops.forEach(d => this.drops.set(d.id, d));

    const seedRequests: Request[] = [
      { id: this.requestIdCounter++, name: "Anonymous", description: "Single mom, three kids, recently laid off. Need help with utilities and food for 2 weeks while job searching. Lights could be cut off by end of month.", location: "Portland, Louisville", needCategory: "financial", urgency: "high", contactEmail: null, status: "pending", stewardNote: null, createdAt: new Date(now.getTime() - 30 * 60 * 1000) },
      { id: this.requestIdCounter++, name: "Community Referral", description: "Elderly man with no family nearby, recently released from hospital after a stroke. Needs daily check-in calls and help managing medications for the next 3 weeks.", location: "Okolona, Louisville", needCategory: "emotional", urgency: "critical", contactEmail: null, status: "pending", stewardNote: null, createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
    ];

    seedRequests.forEach(r => this.requests.set(r.id, r));
  }

  async getStorms(): Promise<Storm[]> {
    return Array.from(this.storms.values()).sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async getStorm(id: number): Promise<Storm | undefined> {
    return this.storms.get(id);
  }

  async createStorm(storm: InsertStorm): Promise<Storm> {
    const newStorm: Storm = { ...storm, id: this.stormIdCounter++, createdAt: new Date(), participantCount: 0, dropCount: 0 } as Storm;
    this.storms.set(newStorm.id, newStorm);
    return newStorm;
  }

  async updateStorm(id: number, data: Partial<Storm>): Promise<Storm | undefined> {
    const storm = this.storms.get(id);
    if (!storm) return undefined;
    const updated = { ...storm, ...data };
    this.storms.set(id, updated);
    return updated;
  }

  async getDropsByStorm(stormId: number): Promise<Drop[]> {
    return Array.from(this.drops.values()).filter(d => d.stormId === stormId);
  }

  async createDrop(drop: InsertDrop): Promise<Drop> {
    const newDrop: Drop = { ...drop, id: this.dropIdCounter++, createdAt: new Date() } as Drop;
    this.drops.set(newDrop.id, newDrop);
    // Update storm counts
    const storm = this.storms.get(drop.stormId);
    if (storm) {
      this.storms.set(storm.id, { ...storm, dropCount: storm.dropCount + 1, participantCount: storm.participantCount + 1 });
    }
    return newDrop;
  }

  async completeDrop(id: number): Promise<Drop | undefined> {
    const drop = this.drops.get(id);
    if (!drop) return undefined;
    const updated = { ...drop, completed: true };
    this.drops.set(id, updated);
    return updated;
  }

  async getRequests(): Promise<Request[]> {
    return Array.from(this.requests.values()).sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async getRequest(id: number): Promise<Request | undefined> {
    return this.requests.get(id);
  }

  async createRequest(req: InsertRequest): Promise<Request> {
    const newReq: Request = { ...req, id: this.requestIdCounter++, createdAt: new Date() } as Request;
    this.requests.set(newReq.id, newReq);
    return newReq;
  }

  async updateRequest(id: number, data: Partial<Request>): Promise<Request | undefined> {
    const req = this.requests.get(id);
    if (!req) return undefined;
    const updated = { ...req, ...data };
    this.requests.set(id, updated);
    return updated;
  }

  async getStats() {
    const allStorms = Array.from(this.storms.values());
    const allDrops = Array.from(this.drops.values());
    return {
      totalStorms: allStorms.length,
      activeStorms: allStorms.filter(s => s.status === "active").length,
      completedStorms: allStorms.filter(s => s.status === "completed").length,
      totalDrops: allDrops.length,
      totalParticipants: allStorms.reduce((sum, s) => sum + s.participantCount, 0),
    };
  }
}

export const storage = new MemStorage();
