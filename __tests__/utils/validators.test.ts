import { isValidMongoUri } from '@/utils/validators';

describe('Validators', () => {
  describe('isValidMongoUri', () => {
    it('should validate correct MongoDB URIs', () => {
      expect(isValidMongoUri('mongodb://localhost:27017/test')).toBe(true);
      expect(isValidMongoUri('mongodb+srv://user:pass@cluster.mongodb.net/test')).toBe(true);
      expect(isValidMongoUri('mongodb://user:pass@localhost:27017/test')).toBe(true);
    });

    it('should reject invalid MongoDB URIs', () => {
      expect(isValidMongoUri('not-a-mongo-uri')).toBe(false);
      expect(isValidMongoUri('http://example.com')).toBe(false);
      expect(isValidMongoUri('')).toBe(false);
      expect(isValidMongoUri('mongodb://')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isValidMongoUri('mongodb://localhost')).toBe(true);
      expect(isValidMongoUri('mongodb+srv://cluster.mongodb.net')).toBe(true);
    });
  });
}); 