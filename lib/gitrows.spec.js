const Gitrows = require('./gitrows');
const Response = require('./response.js');

describe('Gitrows', () => {
  describe('constructor', () => {
    it('should initialize with default options', () => {
      const gitrows = new Gitrows({});
      expect(gitrows._cache).toEqual({});
      expect(gitrows.type).toBe(undefined);
      expect(gitrows.cacheTTL).toBe(5000);
    });

    it('should initialize with provided options', () => {
      const options = {
        ns: 'github',
        branch: 'main',
        message: 'Custom message',
        author: { name: "Custom Author", email: "custom@example.com" },
        csv: { delimiter: ";" },
        strict: true,
        default: { key: "value" }
      };
      const gitrows = new Gitrows(options);
      expect(gitrows.ns).toBe('github');
      expect(gitrows.branch).toBe('main');
      expect(gitrows.message).toBe('Custom message');
      expect(gitrows.author).toEqual({ name: "Custom Author", email: "custom@example.com" });
      expect(gitrows.csv).toEqual({ delimiter: ";" });
      expect(gitrows.strict).toBe(true);
      expect(gitrows.default).toEqual({ key: "value" });
    });

    it('should set custom cache TTL', () => {
      const gitrows = new Gitrows({ cacheTTL: 10000 });
      expect(gitrows.cacheTTL).toBe(10000);
    });
  });

  describe('reset', () => {
    it('should reset to default options', () => {
      const options = {
        ns: 'github',
        branch: 'main',
        message: 'Custom message',
        author: { name: "Custom Author", email: "custom@example.com" },
        csv: { delimiter: ";" },
        strict: true,
        default: { key: "value" }
      };
      const gitrows = new Gitrows(options);
      gitrows.reset();
      expect(gitrows.ns).toBe('github');
      expect(gitrows.branch).toBe('main');
      expect(gitrows.message).toBe('GitRowsPack API Post');
      expect(gitrows.author).toEqual({ name: "GitRowsPack", email: "s4nixd@gmail.com" });
      expect(gitrows.csv).toEqual({ delimiter: "," });
      expect(gitrows.strict).toBe(false);
      expect(gitrows.default).toBe(null);
    });
  });

  describe('pull', () => {
    it('should handle authentication headers for GitHub', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ content: 'test', sha: '123' })
      });

      const gitrows = new Gitrows({ user: 'testuser', token: 'testtoken' });
      await gitrows.pull('@github/owner/repo/file.json');

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'token testtoken'
          })
        })
      );
    });

    it('should reject with 400 for invalid path', async () => {
      const gitrows = new Gitrows({});
      await expect(gitrows.pull('')).rejects.toEqual(Response(400));
    });

    it('should handle GitLab API with branch parameter', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ content: 'test' })
      });

      const gitrows = new Gitrows({ ns: 'gitlab', branch: 'develop' });
      await gitrows.pull('@gitlab/owner/repo/file.json');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('?ref=develop'),
        expect.any(Object)
      );
    });
  });

  describe('push', () => {
    it('should reject without token', async () => {
      const gitrows = new Gitrows({});
      await expect(gitrows.push('path', {}, 'sha')).rejects.toEqual(Response(401));
    });

    it('should handle empty object arrays', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });

      const gitrows = new Gitrows({ token: 'test', ns: 'github' });
      await gitrows.push('@github/owner/repo/file.json', [], 'sha123');

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"content":""')
        })
      );
    });

    it('should include commit message with timestamp', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });

      const gitrows = new Gitrows({ token: 'test', message: 'Test' });
      await gitrows.push('@github/owner/repo/file.json', {}, 'sha');

      const callArgs = fetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.message).toMatch(/^Test\d+$/);
    });

    it('should handle GitLab-specific parameters', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });

      const gitrows = new Gitrows({
        token: 'test',
        ns: 'gitlab',
        author: { name: 'Test', email: 'test@test.com' }
      });
      await gitrows.push('@gitlab/owner/repo/file.json', {}, 'sha');

      const callArgs = fetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.encoding).toBe('base64');
      expect(body.author_name).toBe('Test');
      expect(body.author_email).toBe('test@test.com');
    });
  });

  describe('create', () => {
    it('should create a new file at the specified path', async () => {
      const mockResponse = Response(200);
      const mockPush = jest.fn().mockResolvedValue(mockResponse);
      Gitrows.prototype.push = mockPush;

      const gitrows = new Gitrows({ token: 'mock-token', ns: 'github' });
      const path = '/example/new-file';
      const obj = { key: 'value' };

      const response = await gitrows.create(path, obj);

      expect(mockPush).toHaveBeenCalledWith(path, obj, null, 'PUT');
      expect(response).toEqual(mockResponse);
    });

    it('should use POST method for GitLab', async () => {
      const mockPush = jest.fn().mockResolvedValue(Response(201));
      Gitrows.prototype.push = mockPush;

      const gitrows = new Gitrows({ token: 'test', ns: 'gitlab' });
      await gitrows.create('path', {});

      expect(mockPush).toHaveBeenCalledWith('path', {}, null, 'POST');
    });
  });

  describe('drop', () => {
    it('should delete a file at the specified path', async () => {
      const mockPullResponse = { sha: 'abc123' };
      const mockPull = jest.fn().mockResolvedValue(mockPullResponse);
      Gitrows.prototype.pull = mockPull;

      const mockPushResponse = Response(200);
      const mockPush = jest.fn().mockResolvedValue(mockPushResponse);
      Gitrows.prototype.push = mockPush;

      const gitrows = new Gitrows({ token: 'mock-token', ns: 'github' });
      const path = '/example/deleting-file';

      const response = await gitrows.drop(path);

      expect(mockPull).toHaveBeenCalledWith(path);
      expect(mockPush).toHaveBeenCalledWith(path, null, 'abc123', 'DELETE');
      expect(response).toEqual(mockPushResponse);
    });

    it('should handle GitLab deletion without SHA', async () => {
      const mockPush = jest.fn().mockResolvedValue(Response(204));
      Gitrows.prototype.push = mockPush;

      const gitrows = new Gitrows({ token: 'test', ns: 'gitlab' });
      await gitrows.drop('path');

      expect(mockPush).toHaveBeenCalledWith('path', null, null, 'DELETE');
    });
  });

  describe('put', () => {
    it('should append data to existing file', async () => {
      const mockPull = jest.fn().mockResolvedValue({
        content: Buffer.from(JSON.stringify([{ id: 1 }])).toString('base64'),
        sha: 'abc123'
      });
      Gitrows.prototype.pull = mockPull;

      const mockPush = jest.fn().mockResolvedValue(Response(200));
      Gitrows.prototype.push = mockPush;

      const gitrows = new Gitrows({ token: 'test' });
      await gitrows.put('path', { id: 2 });

      expect(mockPush).toHaveBeenCalledWith(
        'path',
        [{ id: 1 }, { id: 2 }],
        'abc123'
      );
    });

    it('should create new file if it doesn\'t exist', async () => {
      const mockPull = jest.fn().mockRejectedValue(Response(404));
      Gitrows.prototype.pull = mockPull;

      const mockPush = jest.fn().mockResolvedValue(Response(201));
      Gitrows.prototype.push = mockPush;

      const gitrows = new Gitrows({ token: 'test' });
      const data = { id: 1 };
      await gitrows.put('path', data);

      expect(mockPush).toHaveBeenCalledWith('path', data);
    });

    it('should apply column schema in strict mode', async () => {
      const mockPull = jest.fn().mockResolvedValue({
        content: Buffer.from(JSON.stringify([{ id: 1, name: 'test' }])).toString('base64'),
        sha: 'abc'
      });
      Gitrows.prototype.pull = mockPull;

      const mockPush = jest.fn().mockResolvedValue(Response(200));
      Gitrows.prototype.push = mockPush;

      const gitrows = new Gitrows({
        token: 'test',
        strict: true,
        columns: ['id', 'name'],
        default: null
      });
      await gitrows.put('path', { id: 2, extra: 'field' });

      const pushedData = mockPush.mock.calls[0][1];
      expect(pushedData[1]).toEqual({ id: 2, name: null });
      expect(pushedData[1].extra).toBeUndefined();
    });
  });

  describe('update', () => {
    it('should update matching records', async () => {
      const mockPull = jest.fn().mockResolvedValue({
        content: Buffer.from(JSON.stringify([
          { id: 1, name: 'John' },
          { id: 2, name: 'Jane' }
        ])).toString('base64'),
        sha: 'abc123'
      });
      Gitrows.prototype.pull = mockPull;

      const mockPush = jest.fn().mockResolvedValue(Response(202));
      Gitrows.prototype.push = mockPush;

      const gitrows = new Gitrows({ token: 'test' });
      await gitrows.update('path', { name: 'Updated' }, { id: 1 });

      const pushedData = mockPush.mock.calls[0][1];
      expect(pushedData[0].name).toBe('Updated');
      expect(pushedData[1].name).toBe('Jane');
    });

    it('should handle resource in path', async () => {
      const mockPull = jest.fn().mockResolvedValue({
        content: Buffer.from(JSON.stringify([{ id: 1 }])).toString('base64'),
        sha: 'abc'
      });
      Gitrows.prototype.pull = mockPull;

      const mockPush = jest.fn().mockResolvedValue(Response(202));
      Gitrows.prototype.push = mockPush;

      const gitrows = new Gitrows({ token: 'test' });
      await gitrows.update('@github/owner/repo/file.json/1', { name: 'Test' });

      expect(mockPush).toHaveBeenCalled();
    });
  });

  describe('replace', () => {
    it('should replace data at the specified path', async () => {
      const mockPullResponse = { sha: 'old-sha' };
      const mockPull = jest.fn().mockResolvedValue(mockPullResponse);
      Gitrows.prototype.pull = mockPull;

      const mockPushResponse = Response(202);
      const mockPush = jest.fn().mockResolvedValue(mockPushResponse);
      Gitrows.prototype.push = mockPush;

      const gitrows = new Gitrows({ token: 'mock-token', ns: 'github' });
      const path = '/example/existing-file';
      const data = { key: 'new-value' };

      const response = await gitrows.replace(path, data);

      expect(mockPull).toHaveBeenCalledWith(path);
      expect(mockPush).toHaveBeenCalledWith(path, data, 'old-sha');
      expect(response).toEqual(mockPushResponse);
    });
  });

  describe('delete', () => {
    it('should delete matching records', async () => {
      const mockPull = jest.fn().mockResolvedValue({
        content: Buffer.from(JSON.stringify([
          { id: 1, name: 'John' },
          { id: 2, name: 'Jane' },
          { id: 3, name: 'Bob' }
        ])).toString('base64'),
        sha: 'abc123'
      });
      Gitrows.prototype.pull = mockPull;

      const mockPush = jest.fn().mockResolvedValue(Response(204));
      Gitrows.prototype.push = mockPush;

      const gitrows = new Gitrows({ token: 'test' });
      await gitrows.delete('path', { name: 'Jane' });

      const pushedData = mockPush.mock.calls[0][1];
      expect(pushedData).toHaveLength(2);
      expect(pushedData.find(item => item.name === 'Jane')).toBeUndefined();
    });

    it('should return 304 if no query provided', async () => {
      const gitrows = new Gitrows({ token: 'test' });
      const result = await gitrows.delete('path');
      expect(result).toEqual(Response(304));
    });
  });

  describe('columns', () => {
    it('should return the columns of data at the specified path', async () => {
      const mockGetResponse = [
        { id: 1, name: 'John', age: 30 },
        { id: 2, name: 'Jane', age: 25 }
      ];
      const mockGet = jest.fn().mockResolvedValue(mockGetResponse);
      Gitrows.prototype.get = mockGet;

      const gitrows = new Gitrows({ token: 'mock-token', ns: 'github' });
      const path = '/example/existing-file';

      const response = await gitrows.columns(path);

      expect(mockGet).toHaveBeenCalledWith(path);
      expect(response).toEqual(['id', 'name', 'age']);
    });
  });

  describe('types', () => {
    it('should return the types of data at the specified path', async () => {
      const mockGetResponse = [
        { id: 1, name: 'John', age: 30 },
        { id: 2, name: 'Jane', age: 25 }
      ];
      const mockGet = jest.fn().mockResolvedValue(mockGetResponse);
      Gitrows.prototype.get = mockGet;

      const gitrows = new Gitrows({ token: 'mock-token', ns: 'github' });
      const path = '/example/existing-file';

      const response = await gitrows.types(path);

      expect(mockGet).toHaveBeenCalledWith(path, undefined);
      expect(response).toEqual({
        id: {
          "format": "int32",
          "type": "integer",
        },
        name: {
          "type": "string",
        },
        age: {
          "format": "int32",
          "type": "integer",
        }
      });
    });
  });

  describe('getDatabases', () => {
    it('should fetch all databases from a repository', async () => {
      const mockTreeData = {
        tree: [
          { path: 'db1', type: 'tree', sha: 'sha1' },
          { path: 'db2', type: 'tree', sha: 'sha2' },
          { path: 'file.txt', type: 'blob', sha: 'sha3' }
        ]
      };
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve(mockTreeData)
      });

      const gitrows = new Gitrows({ owner: 'testowner', branch: 'main' });
      const databases = await gitrows.getDatabases('testrepo');

      expect(databases).toEqual(['db1', 'db2']);
      expect(fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/testowner/testrepo/git/trees/main?recursive=1'
      );
    });

    it('should return SHA for specific database', async () => {
      const mockTreeData = {
        tree: [
          { path: 'db1', type: 'tree', sha: 'sha123' },
          { path: 'db2', type: 'tree', sha: 'sha456' }
        ]
      };
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve(mockTreeData)
      });

      const gitrows = new Gitrows({ owner: 'testowner', branch: 'main' });
      const sha = await gitrows.getDatabases('testrepo', 'db1');

      expect(sha).toBe('sha123');
    });
  });

  // FIXME: i should add more here
  // describe('getCollections', () => {
});
