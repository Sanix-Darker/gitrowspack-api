const Gitrows = require('./gitrows');
const Response = require('./response.js');
const GitPath = require('./gitpath.js');

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

  // FIXME: properly mock test this
  // describe('pull', () => {
  //   it('should pull data from a specified path', async () => {
  //     // Mock fetch function to return a successful response
  //     global.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ data: 'mocked data' }) });

  //     const gitrows = new Gitrows({});
  //     const path = '/example/path';
  //     const data = await gitrows.pull(path);
  //     expect(fetch).toHaveBeenCalledWith(`https://api.github.com/repos/${path}`, { headers: {} });
  //     expect(data).toEqual({ data: 'mocked data' });
  //   });

    // it('should reject with a response error when fetch fails', async () => {
    //   // Mock fetch function to return an unsuccessful response
    //   global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });

    //   const gitrows = new Gitrows({});
    //   const path = '/example/path';

    //   await expect(gitrows.pull(path)).rejects.toEqual(Response(404));
    //   expect(fetch).toHaveBeenCalledWith(`https://api.github.com/repos/${path}`, { headers: {} });
    // });
  // });

// FIXME: properly mock test this
//   describe('push', () => {
//     it('should push data to a specified path', async () => {
//       // Mock fetch function to return a successful response
//       global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });

//       const gitrows = new Gitrows({ token: 'mock-token', ns: 'github' });
//       const path = '/example/path';
//       const obj = { key: 'value' };
//       const sha = 'mock-sha';

//       const response = await gitrows.push(path, obj, sha);

//       expect(fetch).toHaveBeenCalledWith(`https://api.github.com/repos/${path}`, {
//         method: 'PUT',
//         headers: { 'Content-Type': 'application/json', 'Authorization': 'token mock-token' },
//         body: JSON.stringify({ branch: 'main', content: 'content-as-base64-encoded-string', sha: 'mock-sha' })
//       });
//       expect(response).toEqual(Response(200));
//     });

//     it('should reject with a response error when fetch fails', async () => {
//       // Mock fetch function to return an unsuccessful response
//       global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 400 });

//       const gitrows = new Gitrows({ token: 'mock-token', ns: 'github' });
//       const path = '/example/path';
//       const obj = { key: 'value' };
//       const sha = 'mock-sha';

//       await expect(gitrows.push(path, obj, sha)).rejects.toEqual(Response(400));
//       expect(fetch).toHaveBeenCalledWith(`https://api.github.com/repos/${path}`, {
//         method: 'PUT',
//         headers: { 'Content-Type': 'application/json', 'Authorization': 'token mock-token' },
//         body: JSON.stringify({ branch: 'main', content: 'content-as-base64-encoded-string', sha: 'mock-sha' })
//       });
//     });
//   });

  describe('create', () => {
    it('should create a new file at the specified path', async () => {
      // Mock push method to return a successful response
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
  });

  describe('drop', () => {
    it('should delete a file at the specified path', async () => {
      // Mock pull method to return a successful response
      const mockPullResponse = Response(200);
      const mockPull = jest.fn().mockResolvedValue(mockPullResponse);
      Gitrows.prototype.pull = mockPull;

      // Mock push method to return a successful response
      const mockPushResponse = Response(200);
      const mockPush = jest.fn().mockResolvedValue(mockPushResponse);
      Gitrows.prototype.push = mockPush;

      const gitrows = new Gitrows({ token: 'mock-token', ns: 'github' });
      const path = '/example/deleting-file';

      const response = await gitrows.drop(path);

      expect(mockPull).toHaveBeenCalledWith(path);
      expect(mockPush).toHaveBeenCalledWith(path, null, undefined, 'DELETE');
      expect(response).toEqual(mockPushResponse);
    });
  });

// FIXME: properly mock this
//   describe('put', () => {
//     it('should push data to the specified path', async () => {
//       // Mock pull method to return a successful response
//       const mockPullResponse = Response(200);
//       const mockPull = jest.fn().mockResolvedValue(mockPullResponse);
//       Gitrows.prototype.pull = mockPull;

//       // Mock push method to return a successful response
//       const mockPushResponse = Response(200);
//       const mockPush = jest.fn().mockResolvedValue(mockPushResponse);
//       Gitrows.prototype.push = mockPush;

//       const gitrows = new Gitrows({ token: 'mock-token', ns: 'github' });
//       const path = '/example/new-file';
//       const data = { key: 'value' };

//       const response = await gitrows.put(path, data);

//       expect(mockPull).toHaveBeenCalledWith(path);
//       expect(mockPush).toHaveBeenCalledWith(path, data, 'mock-sha');
//       expect(response).toEqual(mockPushResponse);
//     });
//   });

  // FIXME: properly mock this
  // describe('update', () => {
  //   it('should update data at the specified path based on query', async () => {
  //     // Mock pull method to return a successful response
  //     const mockPullResponse = Response(200);
  //     const mockPull = jest.fn().mockResolvedValue(mockPullResponse);
  //     Gitrows.prototype.pull = mockPull;

  //     // Mock push method to return a successful response
  //     const mockPushResponse = Response(202);
  //     const mockPush = jest.fn().mockResolvedValue(mockPushResponse);
  //     Gitrows.prototype.push = mockPush;

  //     const gitrows = new Gitrows({ token: 'mock-token', ns: 'github' });
  //     const path = '/example/existing-file';
  //     const data = { key: 'new-value' };
  //     const query = { id: 123 };

  //     const response = await gitrows.update(path, data, query);

  //     expect(mockPull).toHaveBeenCalledWith(path);
  //     expect(mockPush).toHaveBeenCalledWith(path, expect.any(Array), 'mock-sha');
  //     expect(response).toEqual(mockPushResponse);
  //   });
  // });

  describe('replace', () => {
    it('should replace data at the specified path', async () => {
      // Mock pull method to return a successful response
      const mockPullResponse = Response(200);
      const mockPull = jest.fn().mockResolvedValue(mockPullResponse);
      Gitrows.prototype.pull = mockPull;

      // Mock push method to return a successful response
      const mockPushResponse = Response(202);
      const mockPush = jest.fn().mockResolvedValue(mockPushResponse);
      Gitrows.prototype.push = mockPush;

      const gitrows = new Gitrows({ token: 'mock-token', ns: 'github' });
      const path = '/example/existing-file';
      const data = { key: 'new-value' };

      const response = await gitrows.replace(path, data);

      expect(mockPull).toHaveBeenCalledWith(path);
      expect(mockPush).toHaveBeenCalledWith(path, data, undefined);
      expect(response).toEqual(mockPushResponse);
    });
  });

//   describe('delete', () => {
//     it('should delete data at the specified path based on query', async () => {
//       // Mock pull method to return a successful response
//       const mockPullResponse = Response(200);
//       const mockPull = jest.fn().mockResolvedValue(mockPullResponse);
//       Gitrows.prototype.pull = mockPull;

//       // Mock push method to return a successful response
//       const mockPushResponse = Response(204);
//       const mockPush = jest.fn().mockResolvedValue(mockPushResponse);
//       Gitrows.prototype.push = mockPush;

//       const gitrows = new Gitrows({ token: 'mock-token', ns: 'github' });
//       const path = '/example/existing-file';
//       const query = { id: 123 };

//       const response = await gitrows.delete(path, query);

//       expect(mockPull).toHaveBeenCalledWith(path);
//       expect(mockPush).toHaveBeenCalledWith(path, expect.any(Array), 'mock-sha');
//       expect(response).toEqual(mockPushResponse);
//     });
//   });

  describe('columns', () => {
    it('should return the columns of data at the specified path', async () => {
      // Mock get method to return a successful response
      const mockGetResponse = [{ id: 1, name: 'John', age: 30 }, { id: 2, name: 'Jane', age: 25 }];
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
      // Mock get method to return a successful response
      const mockGetResponse = [{ id: 1, name: 'John', age: 30 }, { id: 2, name: 'Jane', age: 25 }];
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
        name:  {
            "type": "string",
        },
        age: {
            "format": "int32",
            "type": "integer",
        }
      });
    });
  });

//   describe('getDatabases', () => {
//     it('should fetch the databases from a repository', async () => {
//       const mockResponse = [{ path: 'database1', size: 1024 }, { path: 'database2', size: 2048 }];
//       global.fetch = jest.fn().mockResolvedValue({ json: () => Promise.resolve(mockResponse) });

//       const gitrows = new Gitrows({ owner: 'mock-owner', branch: 'main' });
//       const repo = 'mock-repo';

//       const databases = await gitrows.getDatabases(repo);

//       expect(global.fetch).toHaveBeenCalledWith('https://api.github.com/repos/mock-owner/mock-repo/git/trees/main?recursive=1');
//       expect(databases).toEqual(['database1', 'database2']);
//     });

//     it('should fetch a specific database from a repository', async () => {
//       const mockResponse = [{ path: 'database1', size: 1024 }, { path: 'database2', size: 2048 }];
//       global.fetch = jest.fn().mockResolvedValue({ json: () => Promise.resolve(mockResponse) });

//       const gitrows = new Gitrows({ owner: 'mock-owner', branch: 'main' });
//       const repo = 'mock-repo';
//       const targetDatabase = 'database1';

//       const databaseSha = await gitrows.getDatabases(repo, targetDatabase);

//       expect(global.fetch).toHaveBeenCalledWith('https://api.github.com/repos/mock-owner/mock-repo/git/trees/main?recursive=1');
//       expect(databaseSha).toEqual(1024);
//     });
//   });

  // describe('getCollections', () => {
  //   it('should fetch the collections from a repository', async () => {
  //     const mockResponse = [{ path: 'collection1', size: 1024 }, { path: 'collection2', size: 2048 }];
  //     global.fetch = jest.fn().mockResolvedValue({ json: () => Promise.resolve(mockResponse) });

  //     const gitrows = new Gitrows({ owner: 'mock-owner', branch: 'main' });
  //     const repo = 'mock-repo';
  //     const collection = 'mock-collection';

  //     const collections = await gitrows.getCollections(repo, collection);

  //     expect(global.fetch).toHaveBeenCalledWith('https://api.github.com/repos/mock-owner/mock-repo/git/trees/main');
  //     expect(collections).toEqual([{ collection: 'collection1', size: 1024 }, { collection: 'collection2', size: 2048 }]);
  //   });
  // });
});
