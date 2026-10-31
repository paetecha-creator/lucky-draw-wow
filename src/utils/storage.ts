import { AttendeeRegistration, EmployeeRoster, LuckyDrawRecord, PartyConfig, Prize } from '../types/party';
import { INITIAL_PRIZES, INITIAL_ROSTER } from '../data/mockEmployees';

const STORAGE_KEYS = {
  ROSTER: 'party_employee_roster_v1',
  REGISTRATIONS: 'party_attendee_registrations_v1',
  PRIZES: 'party_prizes_v1',
  LUCKY_WINNERS: 'party_lucky_winners_v1',
  CONFIG: 'party_config_v1',
  ACTIVE_REGISTRATION_ID: 'party_my_registration_id_v1',
};

const DEFAULT_CONFIG: PartyConfig = {
  eventName: 'งานเลี้ยงสังสรรค์ (Party Celebration)',
  eventDate: 'วันงานเลี้ยงสังสรรค์ | 18:00 น. เป็นต้นไป',
  eventVenue: 'ห้องจัดเลี้ยง (Grand Ballroom)',
  themeColor: 'pastel-rainbow',
  isRegistrationOpen: true,
  blockedGroups: ['ผู้บริหาร/กรรมการ'],
  autoBlockPreviousWinners: true,
  isVipTriggerActive: false,
  vipActivePrizeId: 'PRIZE-01',
};

// Create a BroadcastChannel for instantaneous multi-tab real-time sync
const SYNC_CHANNEL_NAME = 'party_realtime_sync_channel';
let channel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
  } catch (e) {
    console.warn('BroadcastChannel not available', e);
  }
}

export function broadcastEvent(
  type: 'REGISTRATION_ADDED' | 'LUCKY_DRAW_WON' | 'CONFIG_UPDATED' | 'ROSTER_UPDATED' | 'VIP_TRIGGER_REQUESTED',
  payload?: unknown
) {
  if (channel) {
    channel.postMessage({ type, payload, timestamp: Date.now() });
  }
}

export function subscribeToBroadcast(callback: (event: { type: string; payload?: unknown; timestamp: number }) => void) {
  if (!channel) return () => {};
  const handler = (e: MessageEvent) => {
    callback(e.data);
  };
  channel.addEventListener('message', handler);
  return () => {
    channel?.removeEventListener('message', handler);
  };
}

export const StorageService = {
  // ROSTER
  getRoster(): EmployeeRoster[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ROSTER);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    // Set default initial roster
    localStorage.setItem(STORAGE_KEYS.ROSTER, JSON.stringify(INITIAL_ROSTER));
    return INITIAL_ROSTER;
  },

  setRoster(roster: EmployeeRoster[]) {
    localStorage.setItem(STORAGE_KEYS.ROSTER, JSON.stringify(roster));
    broadcastEvent('ROSTER_UPDATED', roster);
  },

  // REGISTRATIONS
  getRegistrations(): AttendeeRegistration[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    return [];
  },

  addRegistration(registration: AttendeeRegistration) {
    const list = this.getRegistrations();
    // check duplicate by employeeId
    const existingIndex = list.findIndex((r) => r.employeeId.toUpperCase() === registration.employeeId.toUpperCase());
    if (existingIndex >= 0) {
      list[existingIndex] = registration;
    } else {
      list.unshift(registration);
    }
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(list));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_REGISTRATION_ID, registration.id);
    broadcastEvent('REGISTRATION_ADDED', registration);
  },

  getMyRegistrationId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_REGISTRATION_ID);
  },

  setMyRegistrationId(id: string) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_REGISTRATION_ID, id);
  },

  // PRIZES
  getPrizes(): Prize[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRIZES);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    localStorage.setItem(STORAGE_KEYS.PRIZES, JSON.stringify(INITIAL_PRIZES));
    return INITIAL_PRIZES;
  },

  setPrizes(prizes: Prize[]) {
    localStorage.setItem(STORAGE_KEYS.PRIZES, JSON.stringify(prizes));
    broadcastEvent('CONFIG_UPDATED');
  },

  // LUCKY WINNERS
  getLuckyWinners(): LuckyDrawRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LUCKY_WINNERS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    return [];
  },

  addLuckyWinner(record: LuckyDrawRecord) {
    const list = this.getLuckyWinners();
    list.unshift(record);
    localStorage.setItem(STORAGE_KEYS.LUCKY_WINNERS, JSON.stringify(list));

    // Decrement prize remaining count
    const prizes = this.getPrizes();
    const targetPrize = prizes.find((p) => p.id === record.prizeId);
    if (targetPrize && targetPrize.remaining > 0) {
      targetPrize.remaining -= 1;
      this.setPrizes(prizes);
    }

    broadcastEvent('LUCKY_DRAW_WON', record);
  },

  deleteLuckyWinner(winnerRecordId: string) {
    const list = this.getLuckyWinners();
    const removed = list.find((w) => w.id === winnerRecordId);
    const updated = list.filter((w) => w.id !== winnerRecordId);
    localStorage.setItem(STORAGE_KEYS.LUCKY_WINNERS, JSON.stringify(updated));

    if (removed) {
      const prizes = this.getPrizes();
      const targetPrize = prizes.find((p) => p.id === removed.prizeId);
      if (targetPrize) {
        targetPrize.remaining = Math.min(targetPrize.quantity, targetPrize.remaining + 1);
        this.setPrizes(prizes);
      }
    }

    broadcastEvent('LUCKY_DRAW_WON');
  },

  resetAllLuckyDraws() {
    localStorage.setItem(STORAGE_KEYS.LUCKY_WINNERS, JSON.stringify([]));
    // Reset prize remaining
    const prizes = this.getPrizes();
    prizes.forEach((p) => {
      p.remaining = p.quantity;
    });
    this.setPrizes(prizes);
    broadcastEvent('LUCKY_DRAW_WON');
  },

  // CONFIG
  getConfig(): PartyConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (data) {
        const parsed: PartyConfig = JSON.parse(data);
        if (
          parsed.eventName?.includes('NEON GALA') ||
          parsed.eventName?.includes('PASTEL GALA') ||
          !parsed.eventName
        ) {
          parsed.eventName = DEFAULT_CONFIG.eventName;
          parsed.eventDate = DEFAULT_CONFIG.eventDate;
          parsed.eventVenue = DEFAULT_CONFIG.eventVenue;
          localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(parsed));
        }
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(DEFAULT_CONFIG));
    return DEFAULT_CONFIG;
  },

  setConfig(config: PartyConfig) {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    broadcastEvent('CONFIG_UPDATED', config);
  },

  // Reset entire event data to defaults
  resetToDefault() {
    localStorage.setItem(STORAGE_KEYS.ROSTER, JSON.stringify(INITIAL_ROSTER));
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PRIZES, JSON.stringify(INITIAL_PRIZES));
    localStorage.setItem(STORAGE_KEYS.LUCKY_WINNERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(DEFAULT_CONFIG));
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_REGISTRATION_ID);
    broadcastEvent('CONFIG_UPDATED');
  },
};
