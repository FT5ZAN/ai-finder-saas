import { NextRequest } from 'next/server';
import { GET } from '@/app/api/tools/route';
import { getToolModel } from '@/models/tools';

// Mock the database connection
jest.mock('@/lib/db/websitedb', () => ({
  connectToolsDB: jest.fn().mockResolvedValue(undefined),
}));

// Mock the database models
jest.mock('@/models/tools', () => ({
  getToolModel: jest.fn(),
}));

jest.mock('@/lib/rateLimiter', () => ({
  rateLimiter: {
    consume: jest.fn().mockResolvedValue({ remainingPoints: 10 }),
  },
}));

const mockGetToolModel = getToolModel as jest.MockedFunction<typeof getToolModel>;

describe('Tools API', () => {
  let mockToolModel: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockToolModel = {
      find: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      countDocuments: jest.fn(),
    };

    mockGetToolModel.mockResolvedValue(mockToolModel);
  });

  describe('GET /api/tools', () => {
    it('should return all active tools', async () => {
      const mockTools = [
        {
          _id: '507f1f77bcf86cd799439011',
          title: 'Test Tool 1',
          logoUrl: 'https://example.com/logo1.png',
          websiteUrl: 'https://example.com/1',
          category: 'AI',
          about: 'Test tool 1 description',
          keywords: ['test', 'ai'],
          toolType: 'browser',
          likeCount: 10,
          saveCount: 5,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: '507f1f77bcf86cd799439012',
          title: 'Test Tool 2',
          logoUrl: 'https://example.com/logo2.png',
          websiteUrl: 'https://example.com/2',
          category: 'ML',
          about: 'Test tool 2 description',
          keywords: ['test', 'ml'],
          toolType: 'downloadable',
          likeCount: 20,
          saveCount: 10,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockToolModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockTools),
            }),
          }),
        }),
      });

      const request = new Request('http://localhost:3000/api/tools') as any;
      const response = await GET(request);
      const data = typeof response.body === 'string' ? JSON.parse(response.body) : await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.tools).toHaveLength(2);
      expect(data.tools[0].title).toBe('Test Tool 1');
      expect(data.tools[1].title).toBe('Test Tool 2');
    });

    it('should handle database errors gracefully', async () => {
      mockToolModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockRejectedValue(new Error('Database error')),
            }),
          }),
        }),
      });

      const request = new Request('http://localhost:3000/api/tools') as any;
      const response = await GET(request);
      const data = typeof response.body === 'string' ? JSON.parse(response.body) : await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to get tools');
      expect(data.details).toBe('Database error');
    });

    it('should filter tools by category when query parameter is provided', async () => {
      const mockTools = [
        {
          _id: '507f1f77bcf86cd799439011',
          title: 'AI Tool',
          logoUrl: 'https://example.com/logo1.png',
          websiteUrl: 'https://example.com/1',
          category: 'AI',
          about: 'AI tool description',
          keywords: ['ai'],
          toolType: 'browser',
          likeCount: 10,
          saveCount: 5,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockToolModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockTools),
            }),
          }),
        }),
      });

      const request = new Request('http://localhost:3000/api/tools?category=AI') as any;
      const response = await GET(request);
      const data = typeof response.body === 'string' ? JSON.parse(response.body) : await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.tools).toHaveLength(1);
      expect(data.tools[0].category).toBe('AI');
    });

    it('should search tools by title when search parameter is provided', async () => {
      const mockTools = [
        {
          _id: '507f1f77bcf86cd799439011',
          title: 'Searchable Tool',
          logoUrl: 'https://example.com/logo1.png',
          websiteUrl: 'https://example.com/1',
          category: 'AI',
          about: 'Searchable tool description',
          keywords: ['searchable'],
          toolType: 'browser',
          likeCount: 10,
          saveCount: 5,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockToolModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockTools),
            }),
          }),
        }),
      });

      const request = new Request('http://localhost:3000/api/tools?search=Searchable') as any;
      const response = await GET(request);
      const data = typeof response.body === 'string' ? JSON.parse(response.body) : await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.tools).toHaveLength(1);
      expect(data.tools[0].title).toBe('Searchable Tool');
    });
  });
}); 