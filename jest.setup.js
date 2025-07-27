import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: global.Request,
  NextResponse: {
    json: (data, options) => new global.Response(JSON.stringify(data), options),
  },
}));

// Mock Next.js image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || ''} />;
  },
}));

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }) => children,
  useUser: () => ({
    isSignedIn: false,
    user: null,
    isLoaded: true,
  }),
  useAuth: () => ({
    isSignedIn: false,
    userId: null,
    getToken: jest.fn(),
  }),
  SignInButton: ({ children }) => children,
  SignUpButton: ({ children }) => children,
  UserButton: () => <div data-testid="user-button">User Button</div>,
}));

// Mock Redux
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
  useDispatch: jest.fn(() => jest.fn()),
}));

// Mock styled-components
jest.mock('styled-components', () => {
  const React = require('react');
  
  const createStyledComponent = (tag) => {
    const Component = React.forwardRef((props, ref) => {
      const Tag = tag;
      return React.createElement(Tag, { ...props, ref });
    });
    
    // Create a function that returns the component
    const styledFunction = (strings, ...values) => Component;
    
    // Add methods to the function
    styledFunction.attrs = () => styledFunction;
    styledFunction.withConfig = () => styledFunction;
    styledFunction.displayName = `styled.${tag}`;
    
    return styledFunction;
  };
  
  const mockStyled = new Proxy({}, {
    get(target, prop) {
      if (prop === 'default') {
        return mockStyled;
      }
      return createStyledComponent(prop);
    }
  });
  
  return mockStyled;
});

// Mock Request and Response for tests
global.Request = class Request {
  constructor(url, options = {}) {
    Object.defineProperty(this, 'url', {
      value: url,
      writable: false,
      configurable: true
    });
    this.method = options.method || 'GET';
    this.headers = options.headers || {};
    this.body = options.body;
  }
};

global.Response = class Response {
  constructor(body, options = {}) {
    this.body = body;
    this.status = options.status || 200;
    this.statusText = options.statusText || 'OK';
    this.headers = new Map(Object.entries(options.headers || {}));
    this.ok = this.status >= 200 && this.status < 300;
  }
  
  json() {
    return Promise.resolve(this.body);
  }
  
  text() {
    return Promise.resolve(JSON.stringify(this.body));
  }
};

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }) => children,
  useInView: () => true,
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
  }),
}));

// Mock MongoDB modules
jest.mock('mongoose', () => ({
  default: {
    connect: jest.fn().mockResolvedValue(undefined),
    connection: {
      readyState: 1,
    },
    model: jest.fn(),
    Schema: jest.fn(),
    Types: {
      ObjectId: jest.fn(),
    },
  },
  connect: jest.fn().mockResolvedValue(undefined),
  connection: {
    readyState: 1,
  },
  model: jest.fn(),
  Schema: jest.fn(),
  Types: {
    ObjectId: jest.fn(),
  },
}));

jest.mock('mongodb', () => ({
  MongoClient: jest.fn(),
}));

// Mock environment variables
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'test_key';
process.env.CLERK_SECRET_KEY = 'test_secret';
process.env.MONGODB_URI = 'mongodb://test:27017/test';
process.env.IMAGEKIT_PUBLIC_KEY = 'test_key';
process.env.IMAGEKIT_PRIVATE_KEY = 'test_secret';
process.env.IMAGEKIT_URL_ENDPOINT = 'https://test.imagekit.io';
process.env.RAZORPAY_KEY_ID = 'test_key';
process.env.RAZORPAY_KEY_SECRET = 'test_secret';

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

global.matchMedia = jest.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));

// Suppress console errors in tests unless explicitly needed
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
}); 