const GitPath = require('./gitpath');
describe('GitPath', () => {
  describe('parse()', () => {
    it('should parse a path', () => {
      const result = GitPath.parse('/path/to/file.json');
      expect(result).toEqual({
        valid: false,
        ns: undefined,
        owner: undefined,
        repo: "path",
        branch: undefined,
        path: 'to/file.json',
        type: 'json',
        resource: undefined
      });
    });

    it('should parse a GitHub URL', () => {
      const result = GitPath.parse('https://github.com/owner/repo/blob/main/path/to/file.yaml');
      expect(result).toEqual({
        valid: true,
        ns: 'github',
        owner: 'owner',
        repo: 'repo',
        branch: 'main',
        path: 'path/to/file.yaml',
        type: 'yaml',
      });
    });

    it('should parse a GitLab URL', () => {
      const result = GitPath.parse('https://gitlab.com/owner/repo/-/raw/main/path/to/file.csv');
      expect(result).toEqual({
        valid: true,
        ns: 'gitlab',
        owner: 'owner',
        repo: 'repo',
        branch: 'main',
        path: 'path/to/file.csv',
        type: 'csv',
      });
    });

    it('should return input object if already parsed', () => {
      const input = {
        path: 'path/to/file.json',
        type: 'json'
      };
      const result = GitPath.parse(input);
      expect(result).toBe(input);
    });
  });

  describe('toUrl()', () => {
    it('should fail generate a valid URL for an invalid/incomplete path', () => {
      const result = GitPath.toUrl('/path/to/file.yaml');
      expect(result).toBe(null);
    });

    it('should generate GitHub URL for a path', () => {
      const result = GitPath.toUrl({
        repo:'repo',
        owner: 'owner',
        ns: 'github',
        path: 'path/to/file.yaml',
        type: 'yaml'
      });
      expect(result).toBe('https://github.com/owner/repo/blob/master/path/to/file.yaml');
    });

    it('should generate GitLab URL for a path', () => {
      const result = GitPath.toUrl({
        repo:'repo',
        owner: 'owner',
        ns: 'gitlab',
        path: 'path/to/file.json',
        type: 'json'
      });
      expect(result).toBe('https://gitlab.com/owner/repo/-/blob/master/path/to/file.json');
    });

    it('should handle raw parameter', () => {
      const result = GitPath.toUrl({
        repo:'repo',
        owner: 'owner',
        ns: 'github',
        path: 'path/to/file.csv',
        type: 'csv'
      }, true);
      expect(result).toBe('https://raw.githubusercontent.com/owner/repo/master/path/to/file.csv');
    });

  });

  describe('toApi()', () => {
    it('should generate GitHub API URL for a path', () => {
      const result = GitPath.toApi({
        repo:'repo',
        owner: 'owner',
        ns: 'github',
        path: 'path/to/file.json',
        type: 'json'
      });
      expect(result).toBe('https://api.github.com/repos/owner/repo/contents/path/to/file.json');
    });

    it('should generate GitLab API URL for a path', () => {
      const result = GitPath.toApi({
        repo:'repo',
        owner: 'owner',
        ns: 'gitlab',
        path: 'path/to/file.yaml',
        type: 'yaml'
      });
      expect(result).toBe('https://gitlab.com/api/v4/projects/owner%2Frepo/repository/files/path%2Fto%2Ffile.yaml');
    });
  });

  describe('isValid()', () => {
    it('should return true for a valid object', () => {
      const obj = {
        ns: "github",
        owner: 'owner',
        repo: 'repo',
        path: 'path/to/file.json',
        type: 'json'
      };
      const result = GitPath.isValid(obj);
      expect(result).toBe(true);
    });

    it('should return false if type is invalid', () => {
      const obj = {
        ns: undefined,
        owner: 'owner',
        repo: 'repo',
        path: 'path/to/file.json',
        type: 'invalid'
      };
      const result = GitPath.isValid(obj);
      expect(result).toBe(false);
    });

    it('should return false if mandatory properties are missing', () => {
      const obj = {
        ns: undefined,
        owner: 'owner',
        repo: 'repo',
        type: 'json'
      };
      const result = GitPath.isValid(obj);
      expect(result).toBe(false);
    });
  });

  describe('isUrl()', () => {
    it('should return true for a valid URL', () => {
      const result = GitPath.isUrl('https://github.com/owner/repo/blob/main/path/to/file.yaml');
      expect(result).toBe(true);
    });

    it('should return false for an invalid URL', () => {
      const result = GitPath.isUrl('/path/to/file.yaml');
      expect(result).toBe(false);
    });
  });
});
