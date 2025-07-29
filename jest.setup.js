import '@testing-library/jest-dom'

// Polyfills pour Node.js/Jest
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// Mock crypto pour les navigateurs
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => require('crypto').randomUUID(),
    getRandomValues: (arr) => require('crypto').randomFillSync(arr)
  }
});

// Mock PDFKit pour éviter les erreurs de dépendances natives
jest.mock('pdfkit', () => {
  const mockDoc = {
    fontSize: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    moveTo: jest.fn().mockReturnThis(),
    lineTo: jest.fn().mockReturnThis(),
    stroke: jest.fn().mockReturnThis(),
    end: jest.fn(),
    on: jest.fn((event, callback) => {
      if (event === 'end') {
        setTimeout(callback, 0);
      }
    })
  };
  
  return jest.fn().mockImplementation(() => mockDoc);
});

// Mock Prisma globalement pour tous les tests
const mockPrismaClient = {
  case: {
    findUnique: jest.fn().mockResolvedValue({
      id: 'test-case-id',
      reference: 'TEST-001',
      clientId: 'test-client-id',
      client: { name: 'Test Client' },
      debtor: { name: 'Test Debtor' }
    }),
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  invoice: {
    findUnique: jest.fn().mockResolvedValue({
      id: 'test-invoice-id',
      reference: 'FAC20250001',
      amount: 1000,
      vatAmount: 200,
      totalAmount: 1200,
      dueDate: new Date('2025-08-01'),
      status: 'PENDING',
      items: [{
        description: 'Test item',
        quantity: 1,
        unitPrice: 1000,
        vatRate: 20,
        total: 1000
      }],
      client: {
        name: 'Test Client',
        email: 'client@test.com',
        address: 'Test Address'
      },
      case: null
    }),
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  calendarEvent: {
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  document: {
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  communicationLog: {
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn()
  },
  $disconnect: jest.fn()
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrismaClient)
}));

// Mock NextAuth.js
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated'
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }) => children,
}))

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  })),
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}))

// Mock Prisma
jest.mock('./src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    case: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    $disconnect: jest.fn(),
  },
}))

// Mock Redis cache
jest.mock('./src/lib/redis', () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getJSON: jest.fn(),
    setJSON: jest.fn(),
  },
  CacheService: {
    getInstance: jest.fn(() => ({
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      getJSON: jest.fn(),
      setJSON: jest.fn(),
    })),
    generateCacheKey: jest.fn((type, id) => `test:${type}:${id}`),
  },
}))

// Mock Sentry
jest.mock('./src/lib/sentry', () => ({
  initSentry: jest.fn(),
  captureBusinessError: jest.fn(),
  traceCriticalOperation: jest.fn((name, operation) => operation()),
  monitorDatabaseQuery: jest.fn((name, operation) => operation()),
  monitorUserAction: jest.fn((name, userId, operation) => operation()),
}))

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
})
