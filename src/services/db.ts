import { DailyLog, UserProfile } from '../types/diet';
import { DEFAULT_PROFILE, generateSampleData } from './sampleData';

const DB_NAME = 'RoseDietTrackerDB';
const DB_VERSION = 1;
const LOGS_STORE = 'daily_logs';
const PROFILE_STORE = 'user_profile';

const LOCAL_STORAGE_LOGS_KEY = 'rose_diet_logs_v1';
const LOCAL_STORAGE_PROFILE_KEY = 'rose_diet_profile_v1';
const INITIALIZED_FLAG_KEY = 'rose_diet_initialized_v1';

class DatabaseService {
  private db: IDBDatabase | null = null;
  private isIndexedDBAvailable: boolean = true;

  constructor() {
    this.isIndexedDBAvailable = typeof window !== 'undefined' && 'indexedDB' in window;
  }

  public async open(): Promise<IDBDatabase | null> {
    if (this.db) return this.db;
    if (!this.isIndexedDBAvailable) return null;

    return new Promise((resolve) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(LOGS_STORE)) {
            db.createObjectStore(LOGS_STORE, { keyPath: 'date' });
          }
          if (!db.objectStoreNames.contains(PROFILE_STORE)) {
            db.createObjectStore(PROFILE_STORE, { keyPath: 'id' });
          }
        };

        request.onsuccess = (event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          resolve(this.db);
        };

        request.onerror = () => {
          console.warn('IndexedDB failed to open, falling back to LocalStorage.');
          this.isIndexedDBAvailable = false;
          resolve(null);
        };
      } catch (err) {
        console.warn('IndexedDB error:', err);
        this.isIndexedDBAvailable = false;
        resolve(null);
      }
    });
  }

  public async initDatabase(): Promise<{ profile: UserProfile; logs: DailyLog[] }> {
    const isAlreadyInitialized = localStorage.getItem(INITIALIZED_FLAG_KEY) === 'true';
    const existingProfile = await this.getProfile();
    const existingLogs = await this.getAllLogs();

    if (isAlreadyInitialized) {
      // User has already set up the app or explicitly reset it. Do NOT re-seed sample data!
      const profile = existingProfile || DEFAULT_PROFILE;
      return { profile, logs: existingLogs };
    }

    // First time ever opening app: seed with initial sample data
    const profile = existingProfile || DEFAULT_PROFILE;
    const sampleLogs = existingLogs.length > 0 ? existingLogs : generateSampleData();

    await this.saveProfile(profile);
    for (const log of sampleLogs) {
      await this.saveLog(log);
    }
    localStorage.setItem(INITIALIZED_FLAG_KEY, 'true');

    return { profile, logs: sampleLogs };
  }

  public async getProfile(): Promise<UserProfile | null> {
    const db = await this.open();
    if (db) {
      return new Promise((resolve) => {
        try {
          const transaction = db.transaction(PROFILE_STORE, 'readonly');
          const store = transaction.objectStore(PROFILE_STORE);
          const request = store.get('main_profile');

          request.onsuccess = () => {
            if (request.result && request.result.data) {
              resolve(request.result.data as UserProfile);
            } else {
              // Check local storage fallback
              const fallback = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
              resolve(fallback ? JSON.parse(fallback) : null);
            }
          };

          request.onerror = () => {
            const fallback = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
            resolve(fallback ? JSON.parse(fallback) : null);
          };
        } catch {
          const fallback = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
          resolve(fallback ? JSON.parse(fallback) : null);
        }
      });
    }

    // LocalStorage fallback
    const raw = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  public async saveProfile(profile: UserProfile): Promise<void> {
    // Keep local storage synced as instant cache/backup
    try {
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.warn('LocalStorage error saving profile:', e);
    }

    const db = await this.open();
    if (db) {
      return new Promise((resolve, reject) => {
        try {
          const transaction = db.transaction(PROFILE_STORE, 'readwrite');
          const store = transaction.objectStore(PROFILE_STORE);
          const request = store.put({ id: 'main_profile', data: profile });
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        } catch (err) {
          reject(err);
        }
      });
    }
  }

  public async getAllLogs(): Promise<DailyLog[]> {
    const db = await this.open();
    if (db) {
      return new Promise((resolve) => {
        try {
          const transaction = db.transaction(LOGS_STORE, 'readonly');
          const store = transaction.objectStore(LOGS_STORE);
          const request = store.getAll();

          request.onsuccess = () => {
            const list = (request.result || []) as DailyLog[];
            list.sort((a, b) => a.date.localeCompare(b.date));
            if (list.length === 0) {
              // Try localstorage fallback
              const fallback = localStorage.getItem(LOCAL_STORAGE_LOGS_KEY);
              if (fallback) {
                const parsed = JSON.parse(fallback) as DailyLog[];
                parsed.sort((a, b) => a.date.localeCompare(b.date));
                resolve(parsed);
                return;
              }
            }
            resolve(list);
          };

          request.onerror = () => {
            const fallback = localStorage.getItem(LOCAL_STORAGE_LOGS_KEY);
            resolve(fallback ? JSON.parse(fallback) : []);
          };
        } catch {
          const fallback = localStorage.getItem(LOCAL_STORAGE_LOGS_KEY);
          resolve(fallback ? JSON.parse(fallback) : []);
        }
      });
    }

    const raw = localStorage.getItem(LOCAL_STORAGE_LOGS_KEY);
    const list = raw ? (JSON.parse(raw) as DailyLog[]) : [];
    list.sort((a, b) => a.date.localeCompare(b.date));
    return list;
  }

  public async getLog(date: string): Promise<DailyLog | null> {
    const db = await this.open();
    if (db) {
      return new Promise((resolve) => {
        try {
          const transaction = db.transaction(LOGS_STORE, 'readonly');
          const store = transaction.objectStore(LOGS_STORE);
          const request = store.get(date);

          request.onsuccess = () => {
            resolve((request.result as DailyLog) || null);
          };

          request.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      });
    }

    const all = await this.getAllLogs();
    return all.find((l) => l.date === date) || null;
  }

  public async saveLog(log: DailyLog): Promise<void> {
    // Sync into local storage
    try {
      const all = await this.getAllLogs();
      const idx = all.findIndex((l) => l.date === log.date);
      if (idx >= 0) {
        all[idx] = log;
      } else {
        all.push(log);
      }
      all.sort((a, b) => a.date.localeCompare(b.date));
      localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify(all));
    } catch (e) {
      console.warn('LocalStorage error saving log:', e);
    }

    const db = await this.open();
    if (db) {
      return new Promise((resolve, reject) => {
        try {
          const transaction = db.transaction(LOGS_STORE, 'readwrite');
          const store = transaction.objectStore(LOGS_STORE);
          const request = store.put(log);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        } catch (err) {
          reject(err);
        }
      });
    }
  }

  public async deleteLog(date: string): Promise<void> {
    try {
      const all = await this.getAllLogs();
      const filtered = all.filter((l) => l.date !== date);
      localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.warn('LocalStorage error deleting log:', e);
    }

    const db = await this.open();
    if (db) {
      return new Promise((resolve, reject) => {
        try {
          const transaction = db.transaction(LOGS_STORE, 'readwrite');
          const store = transaction.objectStore(LOGS_STORE);
          const request = store.delete(date);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        } catch (err) {
          reject(err);
        }
      });
    }
  }

  public async exportJSON(): Promise<string> {
    const profile = await this.getProfile();
    const logs = await this.getAllLogs();
    const payload = {
      app: 'JCDiet',
      version: 1,
      exportedAt: new Date().toISOString(),
      profile: profile || DEFAULT_PROFILE,
      logs,
    };
    return JSON.stringify(payload, null, 2);
  }

  public async exportCSV(): Promise<string> {
    const logs = await this.getAllLogs();
    const headers = [
      'Date',
      'Weight (Morning)',
      'Weight (Evening)',
      'Calories Consumed',
      'Protein (g)',
      'Carbs (g)',
      'Fat (g)',
      'Water (ml)',
      'Calories Burned',
      'Waist (cm/in)',
      'Hips (cm/in)',
      'Adherence (1-5)',
      'Notes',
      'Meal Breakdown',
      'Meal Pictures (Photo Data / URIs)',
    ];

    const rows = logs.map((l) => {
      const totalCalories = l.meals.reduce((sum, m) => sum + (m.calories || 0), 0);
      const totalProtein = l.meals.reduce((sum, m) => sum + (m.protein || 0), 0);
      const totalCarbs = l.meals.reduce((sum, m) => sum + (m.carbs || 0), 0);
      const totalFat = l.meals.reduce((sum, m) => sum + (m.fat || 0), 0);

      const mealDescriptions = l.meals
        .map((m) => `[${m.type.toUpperCase()}] ${m.name} (${m.calories} kcal)`)
        .join('; ');

      const mealPhotos = l.meals
        .filter((m) => Boolean(m.photoUrl))
        .map((m) => `${m.name}: ${m.photoUrl}`)
        .join(' | ');

      return [
        l.date,
        l.weight !== undefined ? l.weight : '',
        l.weightEvening !== undefined ? l.weightEvening : '',
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
        l.waterIntake || '',
        l.caloriesBurned || '',
        l.measurements?.waist || '',
        l.measurements?.hips || '',
        l.dietAdherence || '',
        `"${(l.notes || '').replace(/"/g, '""')}"`,
        `"${mealDescriptions.replace(/"/g, '""')}"`,
        `"${mealPhotos.replace(/"/g, '""')}"`,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Dedicated meal-by-meal spreadsheet where each meal has its own row
   * and a direct 'Meal Picture' column.
   */
  public async exportMealsCSV(): Promise<string> {
    const logs = await this.getAllLogs();
    const headers = [
      'Date',
      'Meal Type',
      'Meal Name',
      'Calories (kcal)',
      'Protein (g)',
      'Carbs (g)',
      'Fat (g)',
      'Time',
      'Meal Notes',
      'Meal Picture (Data URL)',
    ];

    const rows: string[] = [];

    logs.forEach((log) => {
      log.meals.forEach((meal) => {
        rows.push(
          [
            log.date,
            meal.type,
            `"${meal.name.replace(/"/g, '""')}"`,
            meal.calories,
            meal.protein,
            meal.carbs,
            meal.fat,
            meal.time || '',
            `"${(meal.notes || '').replace(/"/g, '""')}"`,
            `"${(meal.photoUrl || '').replace(/"/g, '""')}"`,
          ].join(',')
        );
      });
    });

    return [headers.join(','), ...rows].join('\n');
  }

  public async importJSON(jsonString: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonString);
      if (!data || !Array.isArray(data.logs)) {
        throw new Error('Invalid backup format');
      }

      if (data.profile) {
        await this.saveProfile(data.profile);
      }

      for (const log of data.logs) {
        if (log.date) {
          await this.saveLog(log);
        }
      }
      localStorage.setItem(INITIALIZED_FLAG_KEY, 'true');

      return true;
    } catch (err) {
      console.error('Import failed:', err);
      return false;
    }
  }

  public async resetAll(): Promise<void> {
    // Keep initialized flag true so it stays empty and does not re-seed sample data!
    localStorage.setItem(INITIALIZED_FLAG_KEY, 'true');
    localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify([]));

    const db = await this.open();
    if (db) {
      return new Promise((resolve) => {
        try {
          const txLogs = db.transaction(LOGS_STORE, 'readwrite');
          txLogs.objectStore(LOGS_STORE).clear();

          txLogs.oncomplete = () => resolve();
          txLogs.onerror = () => resolve();
        } catch {
          resolve();
        }
      });
    }
  }

  public async reloadSampleData(): Promise<{ profile: UserProfile; logs: DailyLog[] }> {
    await this.resetAll();
    const profile = DEFAULT_PROFILE;
    const logs = generateSampleData();
    await this.saveProfile(profile);
    for (const log of logs) {
      await this.saveLog(log);
    }
    localStorage.setItem(INITIALIZED_FLAG_KEY, 'true');
    return { profile, logs };
  }
}

export const dbService = new DatabaseService();
