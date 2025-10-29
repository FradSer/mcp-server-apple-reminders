// Use global Jest functions to avoid extra dependencies
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { ServerConfig } from '../types/index.js';
import { createServer, startServer } from './server.js';

// Mock dependencies
jest.mock('@modelcontextprotocol/sdk/server/index.js');
jest.mock('@modelcontextprotocol/sdk/server/stdio.js');
jest.mock('./handlers.js', () => ({
  registerHandlers: jest.fn(),
}));

const mockServer = Server as jest.MockedClass<typeof Server>;
const mockStdioServerTransport = StdioServerTransport as jest.MockedClass<
  typeof StdioServerTransport
>;

// Import the mocked handler function
const { registerHandlers } = jest.requireMock('./handlers.js') as {
  registerHandlers: jest.MockedFunction<(server: unknown) => void>;
};
const mockRegisterHandlers = registerHandlers;

describe('Server Module', () => {
  let mockServerInstance: jest.Mocked<Server>;
  let mockTransportInstance: jest.Mocked<StdioServerTransport>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock server instance
    mockServerInstance = {
      connect: jest.fn(),
    } as unknown as jest.Mocked<Server>;

    // Mock transport instance
    mockTransportInstance = {} as jest.Mocked<StdioServerTransport>;

    mockServer.mockImplementation(() => mockServerInstance);
    mockStdioServerTransport.mockImplementation(() => mockTransportInstance);
  });

  describe('createServer', () => {
    test('should create server with correct configuration', () => {
      const config: ServerConfig = {
        name: 'test-server',
        version: '1.0.0',
      };

      const server = createServer(config);

      expect(mockServer).toHaveBeenCalledWith(
        {
          name: 'test-server',
          version: '1.0.0',
        },
        {
          capabilities: {
            resources: {},
            tools: {},
            prompts: {},
          },
        },
      );

      expect(mockRegisterHandlers).toHaveBeenCalledWith(mockServerInstance);
      expect(server).toBe(mockServerInstance);
    });

    test('should handle different server configurations', () => {
      const configs = [
        { name: 'mcp-server', version: '2.1.0' },
        { name: 'test', version: '0.0.1' },
        { name: 'production-server', version: '10.5.3' },
      ];

      configs.forEach((config) => {
        mockServer.mockClear();
        mockRegisterHandlers.mockClear();

        const _server = createServer(config);

        expect(mockServer).toHaveBeenCalledWith(
          {
            name: config.name,
            version: config.version,
          },
          expect.any(Object),
        );

        expect(mockRegisterHandlers).toHaveBeenCalledWith(mockServerInstance);
      });
    });

    test('should set up correct capabilities', () => {
      const config: ServerConfig = {
        name: 'test',
        version: '1.0.0',
      };

      createServer(config);

      expect(mockServer).toHaveBeenCalledWith(expect.any(Object), {
        capabilities: {
          resources: {},
          tools: {},
          prompts: {},
        },
      });
    });
  });

  describe('startServer', () => {
    test('should start server successfully', async () => {
      const config: ServerConfig = {
        name: 'test-server',
        version: '1.0.0',
      };

      mockServerInstance.connect.mockResolvedValue(undefined);

      await expect(startServer(config)).resolves.toBeUndefined();

      expect(mockServer).toHaveBeenCalled();
      expect(mockStdioServerTransport).toHaveBeenCalled();
      expect(mockServerInstance.connect).toHaveBeenCalledWith(
        mockTransportInstance,
      );
    });

    test('should handle server connection failure', async () => {
      const config: ServerConfig = {
        name: 'test-server',
        version: '1.0.0',
      };

      const connectionError = new Error('Connection failed');
      mockServerInstance.connect.mockRejectedValue(connectionError);

      // Mock process.exit to prevent actual exit
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      await expect(startServer(config)).rejects.toThrow('process.exit called');

      expect(mockServerInstance.connect).toHaveBeenCalled();
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });

    test('should create server and transport instances', async () => {
      const config: ServerConfig = {
        name: 'test-server',
        version: '1.0.0',
      };

      mockServerInstance.connect.mockResolvedValue(undefined);

      await startServer(config);

      expect(mockServer).toHaveBeenCalledTimes(1);
      expect(mockStdioServerTransport).toHaveBeenCalledTimes(1);
      expect(mockRegisterHandlers).toHaveBeenCalledWith(mockServerInstance);
    });

    test('should handle different error types during startup', async () => {
      const config: ServerConfig = {
        name: 'test-server',
        version: '1.0.0',
      };

      const errors = [
        new Error('Network error'),
        new TypeError('Type error'),
        'String error',
        { message: 'Object error' },
      ];

      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      for (const error of errors) {
        mockServerInstance.connect.mockRejectedValue(error);

        await expect(startServer(config)).rejects.toThrow(
          'process.exit called',
        );
        expect(mockExit).toHaveBeenCalledWith(1);

        mockExit.mockClear();
      }

      mockExit.mockRestore();
    });

    test('should log server startup progress', async () => {
      const config: ServerConfig = {
        name: 'mcp-server',
        version: '2.0.0',
      };

      mockServerInstance.connect.mockResolvedValue(undefined);

      await startServer(config);

      // Verify the server startup sequence
      expect(mockServer).toHaveBeenCalled();
      expect(mockStdioServerTransport).toHaveBeenCalled();
      expect(mockServerInstance.connect).toHaveBeenCalled();
    });

    test('should handle synchronous errors during server creation', async () => {
      const config: ServerConfig = {
        name: 'test-server',
        version: '1.0.0',
      };

      mockServer.mockImplementation(() => {
        throw new Error('Server creation failed');
      });

      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      await expect(startServer(config)).rejects.toThrow('process.exit called');

      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });

    test('should handle transport creation failure', async () => {
      const config: ServerConfig = {
        name: 'test-server',
        version: '1.0.0',
      };

      mockStdioServerTransport.mockImplementation(() => {
        throw new Error('Transport creation failed');
      });

      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      await expect(startServer(config)).rejects.toThrow('process.exit called');

      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });
  });
});
