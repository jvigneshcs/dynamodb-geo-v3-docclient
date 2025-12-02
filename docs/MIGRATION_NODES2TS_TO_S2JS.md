# Migration Guide: nodes2ts → s2js

## Overview
This guide provides step-by-step instructions to migrate from `nodes2ts` to `s2js` for S2 geometry operations. The migration addresses security vulnerabilities found in `nodes2ts` transitive dependencies while maintaining functionality.

---

## Why Migrate?

### Issues with nodes2ts:
- ❌ Security vulnerabilities in dependencies (`dot-prop`, `got`, `update-notifier`)
- ⚠️ `npm audit fix` cannot resolve the issues
- 📦 Larger bundle size

### Benefits of s2js:
- ✅ No known security vulnerabilities
- ✅ Pure JavaScript implementation (no native bindings)
- ✅ Smaller bundle size
- ✅ Active maintenance
- ✅ TypeScript compatible
- ✅ Compatible API with nodes2ts

---

## Prerequisites

- Completed baseline test verification (Step 2)
- All existing tests passing except integration tests
- Clean git working directory

---

## Migration Steps

### Step 1: Install s2js

```bash
# Remove nodes2ts
npm uninstall nodes2ts

# Install s2js
npm install s2js

# Install type definitions if available
npm install --save-dev @types/s2js || true
```

### Step 2: Update package.json

Verify the changes in `package.json`:

```json
{
  "dependencies": {
    "@types/long": ">=3",
    "s2js": "^1.0.2"
  }
}
```

### Step 3: Update Import Statements

Update all files that import from `nodes2ts` to import from `s2js`.

#### Files to Update:
1. `src/GeoDataManager.ts`
2. `src/GeoDataManagerConfiguration.ts`
3. `src/model/Covering.ts`
4. `src/s2/S2Manager.ts`
5. `src/s2/S2Util.ts`

#### Import Changes:

**Before (nodes2ts):**
```typescript
import { S2LatLng, S2LatLngRect } from "nodes2ts";
import { S2RegionCoverer } from "nodes2ts";
import { S2Cell, S2LatLng } from "nodes2ts";
import { S2CellId } from "nodes2ts";
```

**After (s2js):**
```typescript
import { S2LatLng, S2LatLngRect } from "s2js";
import { S2RegionCoverer } from "s2js";
import { S2Cell, S2LatLng } from "s2js";
import { S2CellId } from "s2js";
```

### Step 4: API Compatibility Check

The following APIs should work identically between nodes2ts and s2js:

#### ✅ Compatible APIs:
- `S2LatLng.fromDegrees(lat, lng)`
- `S2Cell.fromLatLng(latLng)`
- `S2LatLngRect.fromLatLng(minLatLng, maxLatLng)`
- `S2RegionCoverer` constructor and methods
- `cell.id` property access
- `cellId.id` property (Long integer)

#### ⚠️ Potentially Different APIs:
- `latLng.getEarthDistance(other)` - May need testing
- Error handling behavior
- Performance characteristics

See `API_CHANGES_MIGRATION.md` for detailed API differences.

### Step 5: Rebuild Project

```bash
# Clean and rebuild
npm run clean
npm run build
```

### Step 6: Run Tests

```bash
# Run all tests
npm test
```

**Expected Results:**
- 12 passing (same as baseline)
- 2 pending (same as baseline)
- 2 failing (integration tests - expected without DynamoDB)

### Step 7: Verify Specific Functionality

Test the core S2 operations manually if needed:

```bash
node -e "
const { S2LatLng, S2Cell } = require('./dist/index');
const latLng = S2LatLng.fromDegrees(52.1, 2);
console.log('S2LatLng created:', latLng);
const cell = S2Cell.fromLatLng(latLng);
console.log('Geohash:', cell.id.id.toString());
"
```

### Step 8: Commit Changes

```bash
git add package.json package-lock.json src/
git commit -m "refactor: migrate from nodes2ts to s2js for security"
```

---

## Rollback Plan

If issues arise during migration:

### Option 1: Quick Rollback
```bash
git revert HEAD
npm install
npm run build
npm test
```

### Option 2: Manual Rollback
```bash
npm uninstall s2js
npm install nodes2ts@^2.0.0
# Revert all import changes
git checkout HEAD -- src/
npm run build
npm test
```

---

## Troubleshooting

### Issue: s2js not found after installation

**Solution:**
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Issue: TypeScript compilation errors

**Symptoms:** `Cannot find module 's2js'` or similar

**Solution 1:** Check if s2js is properly installed
```bash
npm ls s2js
```

**Solution 2:** Install type definitions manually
```bash
# Create custom type definitions if needed
mkdir -p types/s2js
cat > types/s2js/index.d.ts << 'EOF'
declare module 's2js' {
  export class S2LatLng {
    static fromDegrees(lat: number, lng: number): S2LatLng;
    getEarthDistance(other: S2LatLng): number;
  }
  
  export class S2Cell {
    static fromLatLng(latLng: S2LatLng): S2Cell;
    id: S2CellId;
  }
  
  export class S2CellId {
    id: any; // Long
  }
  
  export class S2LatLngRect {
    static fromLatLng(lo: S2LatLng, hi: S2LatLng): S2LatLngRect;
  }
  
  export class S2RegionCoverer {
    getCoveringCells(region: S2LatLngRect): S2CellId[];
  }
}
EOF
```

Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "typeRoots": ["./types", "./node_modules/@types"]
  }
}
```

### Issue: Tests failing with different geohash values

**Symptoms:** `generateGeohash` tests fail with different output

**Solution:** This indicates an API difference in how s2js calculates cell IDs.

Check the actual vs expected values:
```bash
npm test -- --grep "generateGeoHash"
```

If values are consistently different, you may need to:
1. Update test expectations
2. Verify the s2js implementation matches your requirements
3. Consider using a different S2 library (@radarlabs/s2)

### Issue: getEarthDistance returns different values

**Symptoms:** Distance calculations don't match expected values

**Solution:** 
- Check if s2js uses the same Earth radius constant
- Verify the distance calculation algorithm
- Add tolerance to distance assertions in tests

```typescript
// Instead of exact match
expect(distance).to.equal(1000);

// Use approximate match
expect(distance).to.be.closeTo(1000, 10); // ±10 meter tolerance
```

### Issue: S2RegionCoverer behavior differs

**Symptoms:** Different number of cells returned or different cell IDs

**Solution:**
1. Check s2js documentation for configuration options
2. Verify min/max level settings match
3. Test with known coordinates and compare results

```typescript
const coverer = new S2RegionCoverer();
// May need to set options:
// coverer.minLevel = ...
// coverer.maxLevel = ...
```

---

## Verification Checklist

After migration, verify:

- [ ] All imports updated to use `s2js`
- [ ] `npm install` completes without errors
- [ ] `npm audit` shows 0 vulnerabilities
- [ ] `npm run build` completes successfully
- [ ] `npm test` shows 12 passing tests
- [ ] Geohash generation produces correct values
- [ ] Hash key generation works correctly
- [ ] No TypeScript compilation errors
- [ ] No runtime errors in test output
- [ ] Package size decreased (check with `npm pack --dry-run`)

---

## Post-Migration Tasks

1. **Update Documentation**
   - Update README.md to mention s2js instead of nodes2ts
   - Update any API documentation

2. **Performance Testing**
   - Benchmark geohash generation performance
   - Compare query performance with production workloads
   - Monitor memory usage

3. **Version Bump**
   - Consider bumping package version (minor or patch)
   - Update CHANGELOG with migration notes

4. **Notify Users**
   - If published package, add migration guide to release notes
   - Mention breaking changes if API differs

---

## Alternative S2 Libraries

If s2js doesn't work, consider these alternatives:

### 1. @radarlabs/s2
```bash
npm install @radarlabs/s2
```
- Most actively maintained
- Similar API to nodes2ts
- Well-documented

### 2. s2-geometry
```bash
npm install s2-geometry
```
- Simpler API
- Lighter weight
- May require more code changes

---

## Resources

- [s2js on npm](https://www.npmjs.com/package/s2js)
- [S2 Geometry Library](http://s2geometry.io/)
- [Google S2 Documentation](https://s2geometry.io/)
- [Original nodes2ts](https://www.npmjs.com/package/nodes2ts)

---

## Support

If you encounter issues not covered in this guide:

1. Check existing tests for examples
2. Review s2js documentation
3. Compare with nodes2ts source code
4. Test with simple examples first
5. File an issue if you find bugs

---

## Summary

This migration replaces nodes2ts with s2js to eliminate security vulnerabilities while maintaining S2 geometry functionality. The migration should be straightforward due to API compatibility, but thorough testing is essential to ensure correctness.

**Estimated Time:** 30-60 minutes  
**Difficulty:** Medium  
**Risk Level:** Medium (test thoroughly)
