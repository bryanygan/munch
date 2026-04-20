import AsyncStorage from '@react-native-async-storage/async-storage';

export class StorageError extends Error {}

export type StorageConfig<T extends { schemaVersion: number }> = {
  key: string;
  currentVersion: T['schemaVersion'];
  defaultValue: T;
  /** Transform arbitrary stored data into the current schema. Throw to reset. */
  migrate: (raw: unknown) => T;
};

export class Storage<T extends { schemaVersion: number }> {
  constructor(private readonly config: StorageConfig<T>) {}

  async read(): Promise<T> {
    const { key, currentVersion, defaultValue, migrate } = this.config;
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return defaultValue;
    try {
      const parsed = JSON.parse(raw) as { schemaVersion?: number };
      if (parsed?.schemaVersion === currentVersion) return parsed as T;
      const migrated = migrate(parsed);
      await AsyncStorage.setItem(key, JSON.stringify(migrated));
      return migrated;
    } catch {
      // Corrupt data or migration failed — reset to default
      await AsyncStorage.removeItem(key);
      return defaultValue;
    }
  }

  async write(value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(this.config.key, JSON.stringify(value));
    } catch (err) {
      // Retry once then give up silently (UI should not block on persistence)
      try {
        await AsyncStorage.setItem(this.config.key, JSON.stringify(value));
      } catch {
        console.warn(`[Storage] write failed for key ${this.config.key}`);
      }
    }
  }

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(this.config.key);
  }
}
