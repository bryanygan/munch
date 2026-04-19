import AsyncStorage from '@react-native-async-storage/async-storage';
import { Storage, StorageError } from '@/shared/utils/storage';

type V1 = { value: number; schemaVersion: 1 };

describe('Storage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('writes and reads a typed value', async () => {
    const storage = new Storage<V1>({
      key: 'test:v1',
      currentVersion: 1,
      defaultValue: { value: 0, schemaVersion: 1 },
      migrate: (raw) => raw as V1,
    });
    await storage.write({ value: 42, schemaVersion: 1 });
    expect(await storage.read()).toEqual({ value: 42, schemaVersion: 1 });
  });

  it('returns defaultValue when nothing is stored', async () => {
    const storage = new Storage<V1>({
      key: 'test:v1',
      currentVersion: 1,
      defaultValue: { value: 99, schemaVersion: 1 },
      migrate: (raw) => raw as V1,
    });
    expect(await storage.read()).toEqual({ value: 99, schemaVersion: 1 });
  });

  it('runs migrate when schemaVersion mismatches', async () => {
    await AsyncStorage.setItem('test:v1', JSON.stringify({ value: 7, schemaVersion: 0 }));
    const migrateSpy = jest.fn().mockReturnValue({ value: 7, schemaVersion: 1 });
    const storage = new Storage<V1>({
      key: 'test:v1', currentVersion: 1,
      defaultValue: { value: 0, schemaVersion: 1 },
      migrate: migrateSpy,
    });
    const result = await storage.read();
    expect(migrateSpy).toHaveBeenCalled();
    expect(result.schemaVersion).toBe(1);
  });

  it('resets to default when migrate throws', async () => {
    await AsyncStorage.setItem('test:v1', '{"corrupt":true}');
    const storage = new Storage<V1>({
      key: 'test:v1', currentVersion: 1,
      defaultValue: { value: -1, schemaVersion: 1 },
      migrate: () => { throw new Error('cannot migrate'); },
    });
    expect(await storage.read()).toEqual({ value: -1, schemaVersion: 1 });
  });

  it('clear removes the key', async () => {
    const storage = new Storage<V1>({
      key: 'test:v1', currentVersion: 1,
      defaultValue: { value: 0, schemaVersion: 1 },
      migrate: (raw) => raw as V1,
    });
    await storage.write({ value: 1, schemaVersion: 1 });
    await storage.clear();
    expect(await storage.read()).toEqual({ value: 0, schemaVersion: 1 });
  });
});
