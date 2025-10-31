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
    it.each([
      [{ name: 'mcp-server', version: '2.1.0' }],
      [{ name: 'test', version: '0.0.1' }],
      [{ name: 'production-server', version: '10.5.3' }],
    ])(
      'should create server with correct configuration and capabilities',
      (config: ServerConfig) => {
        mockServer.mockClear();
        registerHandlers.mockClear();

        const _server = createServer(config);

        expect(mockServer).toHaveBeenCalledWith(
          {
            name: config.name,
            version: config.version,
          },
          {
            capabilities: {
              resources: {},
              tools: {},
              prompts: {},
            },
          },
        );

        expect(registerHandlers).toHaveBeenCalledWith(mockServerInstance);
        expect(_server).toBe(mockServerInstance);
      },
    );
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

    describe('error handling', () => {
      it.each([
        [
          'connection failure',
          () => {
            const connectionError = new Error('Connection failed');
            mockServerInstance.connect.mockRejectedValue(connectionError);
          },
        ],
        [
          'server creation failure',
          () => {
            mockServer.mockImplementation(() => {
              throw new Error('Server creation failed');
            });
          },
        ],
        [
          'transport creation failure',
          () => {
            mockStdioServerTransport.mockImplementation(() => {
              throw new Error('Transport creation failed');
            });
          },
        ],
      ])(
        'should handle %s and exit with code 1',
        async (_errorType, setupError) => {
          const config: ServerConfig = {
            name: 'test-server',
            version: '1.0.0',
          };

          setupError();

          const mockExit = jest
            .spyOn(process, 'exit')
            .mockImplementation(() => {
              throw new Error('process.exit called');
            });

          await expect(startServer(config)).rejects.toThrow(
            'process.exit called',
          );
          expect(mockExit).toHaveBeenCalledWith(1);

          mockExit.mockRestore();
        },
      );
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
      expect(registerHandlers).toHaveBeenCalledWith(mockServerInstance);
    });

    describe('signal handlers', () => {
      it.each([
        ['SIGINT', 0],
        ['SIGTERM', 0],
      ])(
        'should register %s signal handler and exit with code %d',
        async (signal, exitCode) => {
          const config: ServerConfig = {
            name: 'test-server',
            version: '1.0.0',
          };

          const mockExit = jest
            .spyOn(process, 'exit')
            .mockImplementation(() => {
              throw new Error('process.exit called');
            });
          const mockOn = jest.spyOn(process, 'on');

          mockServerInstance.connect.mockImplementation(() => {
            process.emit(signal as NodeJS.Signals);
            return Promise.resolve(undefined);
          });

          await expect(startServer(config)).rejects.toThrow(
            'process.exit called',
          );

          expect(mockOn).toHaveBeenCalledWith(signal, expect.any(Function));
          expect(mockExit).toHaveBeenCalledWith(exitCode);

          mockExit.mockRestore();
          mockOn.mockRestore();
        },
      );
    });
  });
});
