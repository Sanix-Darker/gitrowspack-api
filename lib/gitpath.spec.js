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
        resource: undefined
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
        resource: undefined
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

    it('should parse shorthand notation', () => {
      const result = GitPath.parse('@github/owner/repo/path/to/file.json');
      expect(result.ns).toBe('github');
      expect(result.owner).toBe('owner');
      expect(result.repo).toBe('repo');
      expect(result.path).toBe('path/to/file.json');
    });

    it('should parse with branch specified', () => {
      const result = GitPath.parse('@github/owner/repo#develop/path/to/file.json');
      expect(result.branch).toBe('develop');
    });
  });

  describe('fromUrl()', () => {
    it('should convert GitHub URL to path notation', () => {
      const result = GitPath.fromUrl('https://github.com/owner/repo/blob/main/path/to/file.json');
      expect(result).toBe('@github/owner/repo:main/path/to/file.json');
    });

    it('should handle master branch without branch notation', () => {
      const result = GitPath.fromUrl('https://github.com/owner/repo/blob/master/path/to/file.json');
      expect(result).toBe('@github/owner/repo/path/to/file.json');
    });

    it('should return null for invalid URL', () => {
      const result = GitPath.fromUrl('not-a-url');
      expect(result).toBe(null);
    });
  });

  describe('toUrl()', () => {
    it('should fail generate a valid URL for an invalid/incomplete path', () => {
      const result = GitPath.toUrl('/path/to/file.yaml');
      expect(result).toBe(null);
    });

    it('should generate GitHub URL for a path', () => {
      const result = GitPath.toUrl({
        repo: 'repo',
        owner: 'owner',
        ns: 'github',
        path: 'path/to/file.yaml',
        type: 'yaml'
      });
      expect(result).toBe('https://github.com/owner/repo/blob/master/path/to/file.yaml');
    });

    it('should generate GitLab URL for a path', () => {
      const result = GitPath.toUrl({
        repo: 'repo',
        owner: 'owner',
        ns: 'gitlab',
        path: 'path/to/file.json',
        type: 'json'
      });
      expect(result).toBe('https://gitlab.com/owner/repo/-/blob/master/path/to/file.json');
    });

    it('should handle raw parameter', () => {
      const result = GitPath.toUrl({
        repo: 'repo',
        owner: 'owner',
        ns: 'github',
        path: 'path/to/file.csv',
        type: 'csv'
      }, true);
      expect(result).toBe('https://raw.githubusercontent.com/owner/repo/master/path/to/file.csv');
    });

    it('should handle GitLab raw URLs', () => {
      const result = GitPath.toUrl({
        repo: 'repo',
        owner: 'owner',
        ns: 'gitlab',
        path: 'path/to/file.json',
        type: 'json'
      }, true);
      expect(result).toBe('https://gitlab.com/owner/repo/-/raw/master/path/to/file.json');
    });

    it('should use provided branch', () => {
      const result = GitPath.toUrl({
        repo: 'repo',
        owner: 'owner',
        ns: 'github',
        branch: 'develop',
        path: 'path/to/file.json',
        type: 'json'
      });
      expect(result).toBe('https://github.com/owner/repo/blob/develop/path/to/file.json');
    });
  });

  describe('toApi()', () => {
    it('should generate GitHub API URL for a path', () => {
      const result = GitPath.toApi({
        repo: 'repo',
        owner: 'owner',
        ns: 'github',
        path: 'path/to/file.json',
        type: 'json'
      });
      expect(result).toBe('https://api.github.com/repos/owner/repo/contents/path/to/file.json');
    });

    it('should generate GitLab API URL for a path', () => {
      const result = GitPath.toApi({
        repo: 'repo',
        owner: 'owner',
        ns: 'gitlab',
        path: 'path/to/file.yaml',
        type: 'yaml'
      });
      expect(result).toBe('https://gitlab.com/api/v4/projects/owner%2Frepo/repository/files/path%2Fto%2Ffile.yaml');
    });

    it('should handle special characters in GitLab paths', () => {
      const result = GitPath.toApi({
        repo: 'my-repo',
        owner: 'my-owner',
        ns: 'gitlab',
        path: 'path/with spaces/file.json',
        type: 'json'
      });
      expect(result).toContain('my-owner%2Fmy-repo');
      expect(result).toContain('path%2Fwith%20spaces%2Ffile.json');
    });

    it('should return null for invalid path', () => {
      const result = GitPath.toApi({ path: 'test.json' });
      expect(result).toBe(null);
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
        ns: 'github',
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

    it('should accept yaml, json, and csv types', () => {
      ['yaml', 'json', 'csv', 'YAML', 'JSON', 'CSV'].forEach(type => {
        const obj = {
          ns: 'github',
          owner: 'owner',
          repo: 'repo',
          path: 'file.' + type.toLowerCase(),
          type: type
        };
        expect(GitPath.isValid(obj)).toBe(true);
      });
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

    it('should validate various URL formats', () => {
      expect(GitPath.isUrl('http://example.com')).toBe(true);
      expect(GitPath.isUrl('https://example.com/path')).toBe(true);
      expect(GitPath.isUrl('ftp://files.example.com')).toBe(true);
      expect(GitPath.isUrl('not a url')).toBe(false);
      expect(GitPath.isUrl('javascript:alert(1)')).toBe(false);
    });
  });
});
