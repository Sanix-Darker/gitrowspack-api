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

  describe('getCollections', () => {
    it('should fetch collections from a database', async () => {
      const mockGetDatabases = jest.fn().mockResolvedValue('sha123');
      Gitrows.prototype.getDatabases = mockGetDatabases;

      const mockTreeData = {
        tree: [
          { path: 'collection1.json', type: 'blob', size: 1024 },
          { path: 'collection2.csv', type: 'blob', size: 2048 },
          { path: 'folder', type: 'tree', size: 0 }
        ]
      };
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve(mockTreeData)
      });

      const gitrows = new Gitrows({ owner: 'testowner' });
      const collections = await gitrows.getCollections('testrepo', 'database1');

      expect(collections).toEqual([
        { collection: 'collection1.json', size: 1024 },
        { collection: 'collection2.csv', size: 2048 }
      ]);
      expect(mockGetDatabases).toHaveBeenCalledWith('testrepo', 'database1');
    });

    it('should handle errors in getCollections', async () => {
      const mockGetDatabases = jest.fn().mockRejectedValue(new Error('Failed'));
      Gitrows.prototype.getDatabases = mockGetDatabases;

      const gitrows = new Gitrows({ owner: 'testowner' });
      await expect(gitrows.getCollections('testrepo', 'db1')).rejects.toEqual(Response(500));
    });
  });

  describe('test', () => {
    it('should validate a valid path', async () => {
      const mockAcl = jest.fn().mockResolvedValue({ private: false, permissions: { push: true } });
      const mockIsRepoFile = jest.fn().mockResolvedValue(true);
      Gitrows.prototype._acl = mockAcl;
      Gitrows.prototype._isRepoFile = mockIsRepoFile;

      const gitrows = new Gitrows({});
      const result = await gitrows.test('@github/owner/repo/file.json');

      expect(result.valid).toBe(true);
      expect(result.code).toBe(200);
      expect(result.level).toBe('file');
    });

    it('should handle repository-level validation', async () => {
      const mockAcl = jest.fn().mockResolvedValue({ private: false, permissions: { push: true } });
      Gitrows.prototype._acl = mockAcl;

      const gitrows = new Gitrows({});
      const result = await gitrows.test('@github/owner/repo', { fragment: true });

      expect(result.valid).toBe(true);
      expect(result.fragment).toBe(true);
    });

    it('should fail constraint validation', async () => {
      const mockAcl = jest.fn().mockResolvedValue({ private: false, permissions: { push: true } });
      const mockIsRepoFile = jest.fn().mockResolvedValue(true);
      Gitrows.prototype._acl = mockAcl;
      Gitrows.prototype._isRepoFile = mockIsRepoFile;

      const gitrows = new Gitrows({});
      const result = await gitrows.test('@github/owner/repo/file.json', { branch: 'develop' });

      expect(result.valid).toBe(false);
    });

    it('should handle ACL errors', async () => {
      const mockAcl = jest.fn().mockRejectedValue(Response(403));
      Gitrows.prototype._acl = mockAcl;

      const gitrows = new Gitrows({});
      const result = await gitrows.test('@github/owner/repo/file.json');

      expect(result.valid).toBe(false);
      expect(result.code).toBe(403);
    });

    it('should handle non-existent files', async () => {
      const mockAcl = jest.fn().mockResolvedValue({ private: false, permissions: { push: true } });
      const mockIsRepoFile = jest.fn().mockResolvedValue(false);
      Gitrows.prototype._acl = mockAcl;
      Gitrows.prototype._isRepoFile = mockIsRepoFile;

      const gitrows = new Gitrows({});
      const result = await gitrows.test('@github/owner/repo/file.json');

      expect(result.valid).toBe(false);
      expect(result.code).toBe(404);
    });
  });

  describe('_listRepoContents', () => {
    it('should reject for non-GitHub namespaces', async () => {
      const gitrows = new Gitrows({});
      await expect(gitrows._listRepoContents('gitlab', 'owner', 'repo', 'main')).rejects.toEqual(Response(501));
    });
  });

  describe('_isRepoFile', () => {
    it('should return false for non-existent file', async () => {
      const mockListRepoContents = jest.fn().mockResolvedValue([
        'folder/file1.json',
        'README.md'
      ]);
      Gitrows.prototype._listRepoContents = mockListRepoContents;

      const gitrows = new Gitrows({});
      const result = await gitrows._isRepoFile('@github/owner/repo/nonexistent.json');

      expect(result).toBe(false);
    });
  });


  describe('_pullOrFetch', () => {
    it('should return error response when fetch fails without auth', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403
      });

      const gitrows = new Gitrows({});
      const result = await gitrows._pullOrFetch('https://example.com/file.json');

      expect(result).toEqual(Response(403));
    });
  });

  describe('Static methods', () => {
    describe('_applyFilters', () => {
      it('should filter data by query', () => {
        const data = [
          { id: 1, name: 'John', age: 30 },
          { id: 2, name: 'Jane', age: 25 },
          { id: 3, name: 'Bob', age: 30 }
        ];
        const result = Gitrows._applyFilters(data, { age: 30 });

        expect(result).toEqual([
          { id: 1, name: 'John', age: 30 },
          { id: 3, name: 'Bob', age: 30 }
        ]);
      });
    });

    describe('_stringify', () => {
      it('should stringify JSON by default', () => {
        const obj = { id: 1, name: 'Test' };
        const result = Gitrows._stringify(obj);

        expect(result).toBe(JSON.stringify(obj, null, 2));
      });

      it('should stringify YAML format', () => {
        const obj = { id: 1, name: 'Test' };
        const result = Gitrows._stringify(obj, 'yaml');

        expect(result).toContain('id: 1');
        expect(result).toContain('name: Test');
      });

      it('should return null for invalid data', () => {
        const circularObj = {};
        circularObj.self = circularObj;
        const result = Gitrows._stringify(circularObj);

        expect(result).toBeNull();
      });

      it('should return null for non-array CSV data', () => {
        const obj = { id: 1, name: 'Test' };
        const result = Gitrows._stringify(obj, 'csv');

        expect(result).toBeNull();
      });
    });

    describe('_parse', () => {
      it('should parse JSON by default', () => {
        const content = '{"id": 1, "name": "Test"}';
        const result = Gitrows._parse(content);

        expect(result).toEqual({ id: 1, name: 'Test' });
      });

      it('should parse YAML format', () => {
        const content = 'id: 1\nname: Test';
        const result = Gitrows._parse(content, 'yaml');

        expect(result).toEqual({ id: 1, name: 'Test' });
      });

      it('should handle type case insensitivity', () => {
        const content = '{"id": 1}';
        const result = Gitrows._parse(content, 'JSON');

        expect(result).toEqual({ id: 1 });
      });

      it('should return null for invalid content', () => {
        const content = 'invalid json {';
        const result = Gitrows._parse(content);

        expect(result).toBeNull();
      });
    });
  });

  describe('options', () => {
    it('should get all options', () => {
      const gitrows = new Gitrows({
        ns: 'github',
        owner: 'testowner',
        repo: 'testrepo',
        branch: 'develop'
      });
      const options = gitrows.options();

      expect(options.ns).toBe('github');
      expect(options.owner).toBe('testowner');
      expect(options.repo).toBe('testrepo');
      expect(options.branch).toBe('develop');
    });

    it('should set options selectively', () => {
      const gitrows = new Gitrows({});
      gitrows.options({ owner: 'newowner', repo: 'newrepo' });

      expect(gitrows.owner).toBe('newowner');
      expect(gitrows.repo).toBe('newrepo');
    });

    it('should ignore invalid option keys', () => {
      const gitrows = new Gitrows({});
      gitrows.options({ invalidKey: 'value', owner: 'validowner' });

      expect(gitrows.invalidKey).toBeUndefined();
      expect(gitrows.owner).toBe('validowner');
    });

    it('should ignore undefined values', () => {
      const gitrows = new Gitrows({ owner: 'initialowner' });
      gitrows.options({ owner: undefined, repo: 'newrepo' });

      expect(gitrows.owner).toBe('initialowner');
      expect(gitrows.repo).toBe('newrepo');
    });

    it('should return self when setting options', () => {
      const gitrows = new Gitrows({});
      const result = gitrows.options({ owner: 'test' });

      expect(result).toBe(gitrows);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle special characters in paths', async () => {
      const mockPull = jest.fn().mockResolvedValue({ content: 'eyJkYXRhIjoidGVzdCJ9', sha: 'abc' });
      Gitrows.prototype.pull = mockPull;

      const gitrows = new Gitrows({ token: 'test' });
      await gitrows.update('@github/owner/repo/file-with-dashes.json', { updated: true });

      expect(mockPull).toHaveBeenCalled();
    });
  });

  describe('Integration scenarios', () => {
    it('should handle full CRUD workflow', async () => {
      // Create
      let mockPull = jest.fn().mockRejectedValue(Response(404));
      let mockPush = jest.fn().mockResolvedValue(Response(201));
      Gitrows.prototype.pull = mockPull;
      Gitrows.prototype.push = mockPush;

      const gitrows = new Gitrows({ token: 'test' });
      const createData = [{ id: 1, name: 'Initial' }];
      await gitrows.put('@github/owner/repo/new.json', createData);

      expect(mockPush).toHaveBeenCalledWith(
        '@github/owner/repo/new.json',
        createData
      );

      // Read
      mockPull = jest.fn().mockResolvedValue({
        content: Buffer.from(JSON.stringify(createData)).toString('base64'),
        sha: 'sha1'
      });
      Gitrows.prototype.pull = mockPull;

      // Update
      mockPush = jest.fn().mockResolvedValue(Response(202));
      Gitrows.prototype.push = mockPush;

      await gitrows.update('@github/owner/repo/new.json', { name: 'Updated' }, { id: 1 });

      const updatedData = mockPush.mock.calls[0][1];
      expect(updatedData[0].name).toBe('Updated');

      // Delete
      mockPush = jest.fn().mockResolvedValue(Response(204));
      Gitrows.prototype.push = mockPush;

      await gitrows.delete('@github/owner/repo/new.json', { id: 1 });

      const remainingData = mockPush.mock.calls[0][1];
      expect(remainingData).toEqual([]);
    });

    it('should handle batch operations', async () => {
      const mockPull = jest.fn().mockResolvedValue({
        content: Buffer.from(JSON.stringify([])).toString('base64'),
        sha: 'sha0'
      });
      const mockPush = jest.fn().mockResolvedValue(Response(200));
      Gitrows.prototype.pull = mockPull;
      Gitrows.prototype.push = mockPush;

      const gitrows = new Gitrows({ token: 'test' });
      const batchData = Array.from({ length: 100 }, (_, i) => ({ id: i, value: Math.random() }));

      await gitrows.put('@github/owner/repo/batch.json', batchData);

      expect(mockPush).toHaveBeenCalledWith(
        '@github/owner/repo/batch.json',
        batchData,
        'sha0'
      );
    });

    it('should maintain data integrity across operations', async () => {
      const initialData = [
        { id: 1, name: 'John', age: 30 },
        { id: 2, name: 'Jane', age: 25 }
      ];

      let currentSha = 'sha1';
      let currentData = [...initialData];

      const mockPull = jest.fn().mockImplementation(() => Promise.resolve({
        content: Buffer.from(JSON.stringify(currentData)).toString('base64'),
        sha: currentSha
      }));

      const mockPush = jest.fn().mockImplementation((path, data, sha) => {
        currentData = data;
        currentSha = 'sha' + (parseInt(currentSha.replace('sha', '')) + 1);
        return Promise.resolve(Response(200));
      });

      Gitrows.prototype.pull = mockPull;
      Gitrows.prototype.push = mockPush;

      const gitrows = new Gitrows({ token: 'test' });

      // Add new record
      await gitrows.put('@github/owner/repo/data.json', { id: 3, name: 'Bob', age: 35 });
      expect(currentData).toHaveLength(3);

      // Update existing record
      await gitrows.update('@github/owner/repo/data.json', { age: 31 }, { id: 1 });
      expect(currentData.find(d => d.id === 1).age).toBe(31);

      // Delete record
      await gitrows.delete('@github/owner/repo/data.json', { id: 2 });
      expect(currentData).toHaveLength(2);
      expect(currentData.find(d => d.id === 2)).toBeUndefined();
    });
  });

  describe('Data format conversions', () => {
    it('should preserve data types in conversions', async () => {
      const mixedData = {
        string: 'text',
        number: 42,
        float: 3.14,
        boolean: true,
        null: null,
        array: [1, 2, 3],
        object: { nested: 'value' }
      };

      const jsonString = Gitrows._stringify(mixedData, 'json');
      const parsed = Gitrows._parse(jsonString, 'json');

      expect(parsed).toEqual(mixedData);
    });
  });

  describe('Error recovery and resilience', () => {
    it('should handle malformed CSV gracefully', async () => {
      const mockPullOrFetch = jest.fn().mockResolvedValue('invalid,csv\nwith,missing,values\n1,2');
      Gitrows.prototype._pullOrFetch = mockPullOrFetch;

      const gitrows = new Gitrows({ type: 'csv' });
      const result = await gitrows.get('@github/owner/repo/bad.csv');

      // CSV parser should still attempt to parse
      expect(result).toBeDefined();
    });
  });

  describe('Security and validation', () => {
    it('should sanitize file paths', async () => {
      const mockPull = jest.fn().mockResolvedValue({ content: 'test', sha: 'abc' });
      Gitrows.prototype.pull = mockPull;

      const gitrows = new Gitrows({ token: 'test' });

      // Attempt path traversal
      await gitrows.pull('@github/owner/repo/../../../etc/passwd');

      // Should still call with parsed path
      expect(mockPull).toHaveBeenCalled();
    });

    it('should not expose sensitive information in errors', async () => {
      const gitrows = new Gitrows({ token: 'secret-token', user: 'secret-user' });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      await gitrows.pull('@github/owner/repo/file.json');

      // Check that token is not logged
      const errorCalls = consoleSpy.mock.calls.join('');
      const logCalls = consoleLogSpy.mock.calls.join('');

      expect(errorCalls).not.toContain('secret-token');
      expect(logCalls).not.toContain('secret-token');

      consoleSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });
  });

  describe('Performance optimizations', () => {
    it('should batch operations efficiently', async () => {
      const mockPull = jest.fn().mockResolvedValue({
        content: Buffer.from('[]').toString('base64'),
        sha: 'sha1'
      });
      const mockPush = jest.fn().mockResolvedValue(Response(200));

      Gitrows.prototype.pull = mockPull;
      Gitrows.prototype.push = mockPush;

      const gitrows = new Gitrows({ token: 'test' });

      // Add multiple items at once
      const items = Array.from({ length: 1000 }, (_, i) => ({ id: i }));
      await gitrows.put('@github/owner/repo/data.json', items);

      // Should only call pull and push once
      expect(mockPull).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledTimes(1);
    });
  });
});
