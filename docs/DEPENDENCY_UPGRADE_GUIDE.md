# Dependency Upgrade Guide

## Overview
This guide provides step-by-step instructions to upgrade all package dependencies to their latest versions and rebuild the distribution folder for the `dynamodb-geo-v3-document-client` project.

---

## Prerequisites

- **Node.js**: Version 18+ recommended (current TypeScript config targets ES2024)
- **npm**: Latest version (run `npm install -g npm@latest`)
- **Git**: For committing changes incrementally
- **DynamoDB Local** (optional): For running tests after upgrade

---

## Step 1: Backup and Preparation

### 1.1 Create a backup branch
```bash
git checkout -b upgrade-dependencies
git push -u origin upgrade-dependencies
```

### 1.2 Ensure clean working directory
```bash
git status
# Commit or stash any uncommitted changes
```

### 1.3 Document current state
```bash
npm list --depth=0 > pre-upgrade-dependencies.txt
```

---

## Step 2: Update npm and Clear Caches

### 2.1 Update npm to latest
```bash
npm install -g npm@latest
npm --version
```

### 2.2 Clear npm cache
```bash
npm cache clean --force
```

### 2.3 Remove existing dependencies
```bash
rm -rf node_modules
rm package-lock.json
```

---

## Step 3: Upgrade Dependencies

### 3.1 Check for outdated packages
```bash
npm outdated
```

### 3.2 Update devDependencies (safer to start here)

**Option A: Automatic update (use with caution)**
```bash
npm update --save-dev
```

**Option B: Manual update (recommended for control)**

Edit `package.json` and update versions:

```json
"devDependencies": {
  "@types/chai": "^5.2.2",
  "@types/mocha": "^10.0.12",
  "@types/node": "^22.13.15",
  "chai": "^5.2.1",
  "mocha": "^11.1.2",
  "ts-node": "^10.9.3",
  "typescript": "^5.8.3"
}
```

Then run:
```bash
npm install
```

### 3.3 Update production dependencies

Check for `s2js` updates:
```bash
npm view s2js versions
npm view s2js version
```

**Current status (as of Dec 2025):**
- `@types/long`: Latest is `4.0.2`

If newer version exists, update `package.json`:
```json
"dependencies": {
  "@types/long": "^4.0.2",
    "long": "^5.3.2",
    "s2js": "^1.43.6"
}
```

Then run:
```bash
npm install
```

### 3.4 Fix security vulnerabilities

Check for vulnerabilities:
```bash
npm audit
```

```bash
npm ls dot-prop
npm ls got
```
If vulnerabilities are found in indirect dependencies (like `dot-prop`, `got` via `update-notifier`):

**Option A: Automatic fix (recommended)**
```bash
npm audit fix
```

**Option B: Force fix (if automatic fix doesn't resolve)**
```bash
npm audit fix --force
```

**Note**: The vulnerabilities in `dot-prop`, `got`, and `update-notifier` are likely from build tools, not runtime dependencies. They won't affect the published package, but should still be fixed for development security.

### 3.5 Update peerDependencies

Check latest AWS SDK v3 versions:
```bash
npm view @aws-sdk/client-dynamodb version
npm view @aws-sdk/lib-dynamodb version
```

Update `package.json`:
```json
"peerDependencies": {
  "@aws-sdk/client-dynamodb": "^3.x.x",
  "@aws-sdk/lib-dynamodb": "^3.x.x"
}
```

**Note**: Peer dependencies are installed by the consumer, but you should test with latest versions.

### 3.5 Install peer dependencies for testing
```bash
npm install --save-dev @aws-sdk/client-dynamodb@latest @aws-sdk/lib-dynamodb@latest
```

---

## Step 4: Fix Known Issues

### 4.1 Update production dependencies

Change in `package.json`:
```json
"dependencies": {
  "@types/long": "^4.0.2",
  "s2js": "^1.43.6"
}
```

### 4.2 Add Node.js engine specification

Add to `package.json`:
```json
"engines": {
  "node": ">=18.0.0",
  "npm": ">=9.0.0"
}
```

### 4.3 Reinstall with updated versions
```bash
npm install
```

---

## Step 5: Clean and Rebuild Distribution

### 5.1 Clean existing dist folder
```bash
npm run clean
```

Or manually:
```bash
rm -rf dist
```

### 5.2 Build TypeScript
```bash
npm run build
```

This runs `tsc -d` which:
- Compiles TypeScript to JavaScript
- Generates `.d.ts` declaration files
- Outputs to `dist/` folder

### 5.3 Verify dist structure
```bash
ls -la dist/
```

Expected output:
```
dist/
├── index.js
├── index.d.ts
├── GeoDataManager.js
├── GeoDataManager.d.ts
├── GeoDataManagerConfiguration.js
├── GeoDataManagerConfiguration.d.ts
├── types.js
├── types.d.ts
├── dynamodb/
├── model/
├── s2/
└── util/
```

---

## Step 6: Run Tests

### 6.1 Run unit tests
```bash
npm test
```

### 6.2 Run integration tests (requires DynamoDB Local)

**Start DynamoDB Local:**
```bash
# Download and run DynamoDB Local on port 8000
# See: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html
```

**Run tests:**
```bash
npm test
```

### 6.3 Fix any test failures

If tests fail, common issues:
- **TypeScript compilation errors**: Check for breaking changes in TypeScript 5.8+
- **AWS SDK API changes**: Review AWS SDK v3 changelog
- **Mocha/Chai API changes**: Check Chai v5 migration guide
- **Module resolution issues**: May need to adjust `tsconfig.json`

---

## Step 7: Verify Package Integrity

### 7.1 Test local installation
```bash
npm pack
# This creates a .tgz file

# In a test directory:
mkdir /tmp/test-package
cd /tmp/test-package
npm init -y
npm install /path/to/dynamodb-geo-v3-document-client-1.1.1.tgz
```

### 7.2 Test basic import
Create `/tmp/test-package/test.js`:
```javascript
const { GeoDataManagerConfiguration, GeoDataManager } = require('dynamodb-geo-v3-document-client');
console.log('Import successful:', typeof GeoDataManager);
```

Run:
```bash
node test.js
```

---

## Step 8: Document Changes

### 8.1 Create dependency report
```bash
npm list --depth=0 > post-upgrade-dependencies.txt
```

### 8.2 Compare changes
```bash
diff pre-upgrade-dependencies.txt post-upgrade-dependencies.txt
```

### 8.3 Update CHANGELOG (if exists)
Document breaking changes and upgrade notes.

### 8.4 Update README (if needed)
Update any version requirements or installation instructions.

---

## Step 9: Commit and Push

### 9.1 Review changes
```bash
git status
git diff package.json
```

### 9.2 Commit incrementally
```bash
git add package.json package-lock.json
git commit -m "chore: upgrade dependencies to latest versions"

git add dist/
git commit -m "build: rebuild dist with upgraded dependencies"

git add README.md CHANGELOG.md  # if modified
git commit -m "docs: update version requirements"
```

### 9.3 Push changes
```bash
git push origin upgrade-dependencies
```

---

## Step 10: Advanced Upgrade Options

### 10.1 Use npm-check-updates for aggressive updates

Install globally:
```bash
npm install -g npm-check-updates
```

Check for updates:
```bash
ncu
```

Update all to latest:
```bash
ncu -u
npm install
```

### 10.2 Check for security vulnerabilities
```bash
npm audit
npm audit fix
```

### 10.3 Check for deprecated packages
```bash
npm deprecate --help
npm outdated
```

---

## Troubleshooting

### Issue: TypeScript compilation errors after upgrade

**Solution**: Check TypeScript 5.8+ breaking changes:
```bash
# Downgrade TypeScript if needed
npm install --save-dev typescript@5.7.0
```

### Issue: Module resolution errors

**Solution**: Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true
  }
}
```

### Issue: Chai v5 ESM/CJS issues

**Solution**: Chai v5 is ESM-first. For CommonJS projects:
```bash
npm install --save-dev chai@4.5.0
```

### Issue: AWS SDK peer dependency warnings

**Solution**: Ensure consuming projects install compatible AWS SDK versions:
```bash
npm install @aws-sdk/client-dynamodb@^3.758.0 @aws-sdk/lib-dynamodb@^3.758.0
```

### Issue: Tests fail with DynamoDB connection errors

**Solution**: Ensure DynamoDB Local is running:
```bash
# Check if running on port 8000
curl http://127.0.0.1:8000
```

---

## Rollback Plan

If critical issues arise:

### Option 1: Revert commit
```bash
git revert HEAD
git push
```

### Option 2: Restore from backup
```bash
git checkout master
git branch -D upgrade-dependencies
```

### Option 3: Restore specific files
```bash
git checkout master -- package.json package-lock.json
npm install
npm run build
```

---

## Post-Upgrade Checklist

- [ ] All dependencies updated
- [ ] `package-lock.json` regenerated
- [ ] `dist/` folder rebuilt successfully
- [ ] All tests passing
- [ ] No security vulnerabilities (`npm audit`)
- [ ] Package can be imported correctly
- [ ] Documentation updated
- [ ] Changes committed and pushed
- [ ] CI/CD pipeline passes (CircleCI)
- [ ] Version bumped (if publishing)

---

## Publishing New Version (Optional)

If you want to publish the updated package:

### 1. Bump version
```bash
npm version patch  # or minor, or major
```

### 2. Verify package contents
```bash
npm pack --dry-run
```

### 3. Publish to npm
```bash
npm publish
```

---

## Additional Considerations

### Migrate Deprecated DynamoDB APIs (Future Work)

The codebase uses deprecated DynamoDB v2 API patterns:
- `KeyConditions` → should migrate to `KeyConditionExpression`
- `AttributeUpdates` → should migrate to `UpdateExpression`

These still work in AWS SDK v3 but may be removed in future versions. Consider creating a separate migration task.

### Fix CircleCI Configuration

The `circle.yml` references `yarn.lock` but the project uses npm. Either:
- Switch to Yarn: `yarn install`, commit `yarn.lock`
- Update `circle.yml` to use npm: replace `yarn` commands with `npm`

---

## Resources

- [npm Documentation](https://docs.npmjs.com/)
- [TypeScript 5.8 Release Notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-8.html)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/)
- [Mocha Documentation](https://mochajs.org/)
- [Chai v5 Migration Guide](https://github.com/chaijs/chai/releases/tag/v5.0.0)
- [Semantic Versioning](https://semver.org/)

---

## Summary

This guide provides a comprehensive, step-by-step approach to upgrading dependencies safely. Follow the steps sequentially, test thoroughly at each stage, and maintain good version control practices. The incremental approach allows you to identify and fix issues early in the upgrade process.
