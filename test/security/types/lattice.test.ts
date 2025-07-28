// v0.8.0で削除された機能のテスト
// SecurityLattice等のエクスポートは削除されています

describe.skip('SecurityLattice (v0.7.0機能 - 削除済み)', () => {
  let lattice: any; // SecurityLatticeは削除されています

  beforeEach(() => {
    // lattice = createSecurityLattice();
  });

  describe('createSecurityLattice', () => {
    it('should create a security lattice with default levels', () => {
      expect(lattice).toBeDefined();
      expect(lattice.levels).toBeDefined();
      expect(lattice.levels).toContain('public');
      expect(lattice.levels).toContain('private');
      expect(lattice.levels).toContain('confidential');
    });

    it('should create lattice with custom levels', () => {
      const customLattice = createSecurityLattice([
        'low',
        'medium',
        'high',
        'top-secret'
      ]);
      
      expect(customLattice.levels).toHaveLength(4);
      expect(customLattice.levels).toContain('top-secret');
    });
  });

  describe('compareSecurityLevels', () => {
    it('should correctly compare security levels', () => {
      expect(compareSecurityLevels('public', 'private')).toBe(-1);
      expect(compareSecurityLevels('private', 'public')).toBe(1);
      expect(compareSecurityLevels('public', 'public')).toBe(0);
    });

    it('should handle confidential level comparisons', () => {
      expect(compareSecurityLevels('public', 'confidential')).toBe(-1);
      expect(compareSecurityLevels('private', 'confidential')).toBe(-1);
      expect(compareSecurityLevels('confidential', 'private')).toBe(1);
    });
  });

  describe('LatticeOperations', () => {
    let operations: LatticeOperations;

    beforeEach(() => {
      operations = new LatticeOperations(lattice);
    });

    describe('join', () => {
      it('should compute least upper bound', () => {
        expect(operations.join('public', 'private')).toBe('private');
        expect(operations.join('private', 'confidential')).toBe('confidential');
        expect(operations.join('public', 'public')).toBe('public');
      });

      it('should be commutative', () => {
        expect(operations.join('public', 'private')).toBe(
          operations.join('private', 'public')
        );
      });
    });

    describe('meet', () => {
      it('should compute greatest lower bound', () => {
        expect(operations.meet('public', 'private')).toBe('public');
        expect(operations.meet('private', 'confidential')).toBe('private');
        expect(operations.meet('confidential', 'confidential')).toBe('confidential');
      });

      it('should be commutative', () => {
        expect(operations.meet('private', 'confidential')).toBe(
          operations.meet('confidential', 'private')
        );
      });
    });

    describe('canFlow', () => {
      it('should allow information flow from lower to higher levels', () => {
        expect(operations.canFlow('public', 'private')).toBe(true);
        expect(operations.canFlow('public', 'confidential')).toBe(true);
        expect(operations.canFlow('private', 'confidential')).toBe(true);
      });

      it('should prevent information flow from higher to lower levels', () => {
        expect(operations.canFlow('private', 'public')).toBe(false);
        expect(operations.canFlow('confidential', 'public')).toBe(false);
        expect(operations.canFlow('confidential', 'private')).toBe(false);
      });

      it('should allow flow between same levels', () => {
        expect(operations.canFlow('public', 'public')).toBe(true);
        expect(operations.canFlow('private', 'private')).toBe(true);
      });
    });

    describe('isSubset', () => {
      it('should check subset relationships', () => {
        expect(operations.isSubset('public', 'private')).toBe(true);
        expect(operations.isSubset('private', 'public')).toBe(false);
        expect(operations.isSubset('public', 'public')).toBe(true);
      });
    });
  });

  describe('SecurityLevel', () => {
    it('should create security level with metadata', () => {
      const level: SecurityLevel = {
        name: 'restricted',
        rank: 3,
        description: 'Restricted access level',
        allowedOperations: ['read'],
        deniedOperations: ['write', 'delete']
      };
      
      expect(level.name).toBe('restricted');
      expect(level.rank).toBe(3);
      expect(level.allowedOperations).toContain('read');
      expect(level.deniedOperations).toContain('write');
    });
  });

  describe('edge cases', () => {
    it('should handle empty lattice', () => {
      const emptyLattice = createSecurityLattice([]);
      expect(emptyLattice.levels).toHaveLength(0);
    });

    it('should handle single level lattice', () => {
      const singleLattice = createSecurityLattice(['only']);
      const ops = new LatticeOperations(singleLattice);
      
      expect(ops.join('only', 'only')).toBe('only');
      expect(ops.meet('only', 'only')).toBe('only');
      expect(ops.canFlow('only', 'only')).toBe(true);
    });

    it('should handle unknown levels gracefully', () => {
      expect(() => operations.join('public', 'unknown')).toThrow();
      expect(() => operations.meet('unknown', 'private')).toThrow();
      expect(() => operations.canFlow('unknown', 'public')).toThrow();
    });
  });
});
