# Installation Guide for TypeScript Projects

This guide explains how to use the `dynamodb-geo-v3-docclient` package in your TypeScript project using three different methods.

---

## Table of Contents

1. [Option 1: NPM Package (Recommended for Production)](#option-1-npm-package-recommended-for-production)
2. [Option 2: GitHub Releases with .tgz File](#option-2-github-releases-with-tgz-file)
3. [Option 3: Direct GitHub Dependency](#option-3-direct-github-dependency)
4. [TypeScript Configuration](#typescript-configuration)
5. [Usage Examples](#usage-examples)
6. [Troubleshooting](#troubleshooting)

---

## Option 1: NPM Package (Recommended for Production)

### Future Reference - When Published to NPM

Once this package is published to npm registry, this will be the simplest and recommended installation method.

### 1.1 Installation

```bash
npm install dynamodb-geo-v3-document-client
```

Or with Yarn:
```bash
yarn add dynamodb-geo-v3-document-client
```

### 1.2 Install Peer Dependencies

```bash
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
```

### 1.3 TypeScript Configuration

TypeScript should automatically detect the type definitions. No additional configuration needed.

### 1.4 Import in Your Project

```typescript
import {
  GeoDataManager,
  GeoDataManagerConfiguration,
  GeoTableUtil
} from 'dynamodb-geo-v3-document-client';
```

---

## Option 2: GitHub Releases with .tgz File

This method allows you to install the package from a `.tgz` file hosted on GitHub Releases.

### 2.1 Setup GitHub Actions to Generate .tgz

Create `.github/workflows/release.yml` in your repository:

```yaml
name: Release Package

on:
  push:
    tags:
      - 'v*.*.*'  # Triggers on version tags like v1.2.0
  workflow_dispatch:  # Allows manual trigger

jobs:
  build-and-release:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build package
        run: npm run build
      
      - name: Create package tarball
        run: |
          npm pack
          PKG_NAME=$(npm pack --dry-run 2>&1 | tail -1)
          echo "PACKAGE_FILE=$PKG_NAME" >> $GITHUB_ENV
      
      - name: Create Release
        id: create_release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref_name }}
          release_name: Release ${{ github.ref_name }}
          draft: false
          prerelease: false
      
      - name: Upload Release Asset
        uses: actions/upload-release-asset@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          upload_url: ${{ steps.create_release.outputs.upload_url }}
          asset_path: ./${{ env.PACKAGE_FILE }}
          asset_name: ${{ env.PACKAGE_FILE }}
          asset_content_type: application/gzip
```

### 2.2 Trigger a Release

**Option A: Create a Git Tag**
```bash
# Update version in package.json first
npm version patch  # or minor, or major

# Push the tag
git push origin v1.2.0  # Replace with your version
```

**Option B: Manual Trigger**
- Go to GitHub Actions tab
- Select "Release Package" workflow
- Click "Run workflow"

### 2.3 Install from GitHub Release

After the release is created, users can install from the `.tgz` file URL:

```bash
npm install https://github.com/jvigneshcs/dynamodb-geo-v3-docclient/releases/download/v1.2.0/dynamodb-geo-v3-document-client-1.2.0.tgz
```

Or add to `package.json`:

```json
{
  "dependencies": {
    "dynamodb-geo-v3-document-client": "https://github.com/jvigneshcs/dynamodb-geo-v3-docclient/releases/download/v1.2.0/dynamodb-geo-v3-document-client-1.2.0.tgz"
  }
}
```

### 2.4 Update to New Version

To update to a newer release:

```bash
npm install https://github.com/jvigneshcs/dynamodb-geo-v3-docclient/releases/download/v1.3.0/dynamodb-geo-v3-document-client-1.3.0.tgz
```

Or update the URL in `package.json` and run `npm install`.

---

## Option 3: Direct GitHub Dependency

Install directly from the GitHub repository. This requires the `dist/` folder to be committed.

### 3.1 Ensure dist/ Folder is Committed

**Important**: By default, `dist/` is in `.gitignore`. You need to commit it for this method to work.

**Option A: Remove dist from .gitignore** (Recommended for this use case)

Edit `.gitignore` and remove or comment out:
```gitignore
# dist/  # Commented out to allow GitHub dependency installation
```

Then commit the dist folder:
```bash
npm run build
git add dist/
git commit -m "build: add dist folder for GitHub dependency support"
git push
```

**Option B: Use a separate branch for distribution**

```bash
# Create a distribution branch
git checkout -b dist-branch

# Remove dist from .gitignore
sed -i.bak '/^dist\/$/d' .gitignore

# Build and commit
npm run build
git add dist/ .gitignore
git commit -m "build: add dist folder for distribution"
git push origin dist-branch
```

### 3.2 Install from GitHub Repository

**Install from specific branch:**
```bash
npm install github:jvigneshcs/dynamodb-geo-v3-docclient#upgrade-dependencies
```

**Install from specific commit:**
```bash
npm install github:jvigneshcs/dynamodb-geo-v3-docclient#abc1234
```

**Install from specific tag:**
```bash
npm install github:jvigneshcs/dynamodb-geo-v3-docclient#v1.2.0
```

### 3.3 Add to package.json

```json
{
  "dependencies": {
    "dynamodb-geo-v3-document-client": "github:jvigneshcs/dynamodb-geo-v3-docclient#upgrade-dependencies"
  }
}
```

### 3.4 Install Peer Dependencies

```bash
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
```

### 3.5 Update to Latest

```bash
npm update dynamodb-geo-v3-document-client
```

Or to force reinstall:
```bash
npm uninstall dynamodb-geo-v3-document-client
npm install github:jvigneshcs/dynamodb-geo-v3-docclient#upgrade-dependencies
```

---

## TypeScript Configuration

### Required TypeScript Settings

Ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "strict": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "lib": ["ES2020"]
  }
}
```

### Type Definitions

The package includes TypeScript declaration files (`.d.ts`). TypeScript will automatically use them.

---

## Usage Examples

### Basic Setup

```typescript
import { DynamoDBClient, Endpoint } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import {
  GeoDataManager,
  GeoDataManagerConfiguration,
  GeoTableUtil
} from 'dynamodb-geo-v3-document-client';

// Initialize DynamoDB Client
const ddbClient = new DynamoDBClient({
  region: 'us-east-1',
  endpoint: new Endpoint('http://localhost:8000') // For local development
});

const docClient = DynamoDBDocumentClient.from(ddbClient);

// Configure Geo Manager
const config = new GeoDataManagerConfiguration(docClient, 'MyGeoTable');
config.hashKeyLength = 3; // Adjust based on your needs

const geoManager = new GeoDataManager(config);
```

### Create Table

```typescript
async function createGeoTable() {
  const createTableInput = GeoTableUtil.getCreateTableRequest(config);
  
  // Customize provisioned throughput
  createTableInput.ProvisionedThroughput = {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5
  };

  await ddbClient.send(new CreateTableCommand(createTableInput));
  console.log('Geospatial table created successfully');
}
```

### Put Point

```typescript
async function addLocation() {
  await geoManager.putPoint({
    RangeKeyValue: 'location-001',
    GeoPoint: {
      latitude: 37.7749,
      longitude: -122.4194
    },
    PutItemInput: {
      Item: {
        name: 'San Francisco',
        type: 'city',
        population: 883305
      }
    }
  });
  console.log('Location added successfully');
}
```

### Query Radius

```typescript
async function findNearbyLocations() {
  const results = await geoManager.queryRadius({
    RadiusInMeter: 50000, // 50km
    CenterPoint: {
      latitude: 37.7749,
      longitude: -122.4194
    }
  });
  
  console.log(`Found ${results.length} locations within 50km`);
  return results;
}
```

### Update Point

```typescript
async function updateLocation() {
  await geoManager.updatePoint({
    RangeKeyValue: 'location-001',
    GeoPoint: {
      latitude: 37.7749,
      longitude: -122.4194
    },
    UpdateItemInput: {
      UpdateExpression: 'SET #n = :name, population = :pop',
      ExpressionAttributeNames: {
        '#n': 'name'
      },
      ExpressionAttributeValues: {
        ':name': 'San Francisco City',
        ':pop': 900000
      }
    }
  });
  console.log('Location updated successfully');
}
```

### Query Rectangle

```typescript
async function findLocationsInArea() {
  const results = await geoManager.queryRectangle({
    MinPoint: {
      latitude: 37.7,
      longitude: -122.5
    },
    MaxPoint: {
      latitude: 37.8,
      longitude: -122.3
    }
  });
  
  console.log(`Found ${results.length} locations in rectangle`);
  return results;
}
```

### Delete Point

```typescript
async function removeLocation() {
  await geoManager.deletePoint({
    RangeKeyValue: 'location-001',
    GeoPoint: {
      latitude: 37.7749,
      longitude: -122.4194
    }
  });
  console.log('Location deleted successfully');
}
```

---

## Comparison of Installation Methods

| Method | Pros | Cons | Best For |
|--------|------|------|----------|
| **NPM Package** | ✅ Simple installation<br>✅ Semantic versioning<br>✅ Fast install<br>✅ CDN caching | ❌ Requires npm publish access<br>❌ Package must be published | Production applications |
| **GitHub Release .tgz** | ✅ No npm publish needed<br>✅ Version control via releases<br>✅ Installable URL<br>✅ Automation friendly | ❌ Manual release process<br>❌ Longer URLs<br>❌ Requires GitHub Actions setup | Pre-release testing, private packages |
| **Direct GitHub** | ✅ Always latest code<br>✅ No release needed<br>✅ Simple setup | ❌ Requires dist/ in repo<br>❌ Slower install<br>❌ Less predictable versions | Development, testing, quick prototypes |

---

## Troubleshooting

### Issue: Module not found

**Solution**: Ensure peer dependencies are installed:
```bash
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
```

### Issue: TypeScript cannot find types

**Solution**: Check that `node_modules` includes the `.d.ts` files:
```bash
ls node_modules/dynamodb-geo-v3-document-client/dist/*.d.ts
```

If missing, the package may not have been built. Try reinstalling.

### Issue: GitHub dependency fails to install

**Error**: `npm ERR! 404 Not Found - GET https://github.com/...`

**Solution**: 
1. Ensure the repository is public, or you have access
2. Verify the branch/tag/commit exists
3. Check that `dist/` folder is committed (for Option 3)

### Issue: GitHub dependency doesn't update

**Solution**: Force reinstall:
```bash
npm uninstall dynamodb-geo-v3-document-client
npm cache clean --force
npm install github:jvigneshcs/dynamodb-geo-v3-docclient#upgrade-dependencies
```

### Issue: .tgz URL returns 404

**Solution**:
1. Verify the release exists on GitHub
2. Check the exact filename in the release assets
3. Ensure the URL format is correct:
   ```
   https://github.com/OWNER/REPO/releases/download/TAG/FILENAME.tgz
   ```

### Issue: Cannot update protected attributes (geohash, geoJson)

**Error**: `Cannot update protected attribute: geohash`

**Solution**: This is expected behavior. The `geohash` and `geoJson` attributes are auto-generated. Update other attributes only:

```typescript
// ❌ Wrong - trying to update geohash
UpdateExpression: 'SET geohash = :hash'

// ✅ Correct - update other attributes
UpdateExpression: 'SET name = :name, description = :desc'
```

If you need to change coordinates, delete the old point and create a new one.

---

## Recommendations

### For Production Applications
Use **Option 1 (NPM Package)** once published. It's the most reliable and performant.

### For Internal/Private Projects
Use **Option 2 (GitHub Release .tgz)** for controlled versioning without npm publishing.

### For Development/Testing
Use **Option 3 (Direct GitHub)** for quick iteration, but switch to a stable method before production.

---

## Additional Resources

- [npm Documentation - Installing from GitHub](https://docs.npmjs.com/cli/v10/commands/npm-install#github)
- [GitHub Actions - Creating Releases](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#release)
- [AWS SDK v3 Documentation](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/)
- [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html)

---

## Summary

This package can be installed in three ways:

1. **NPM Package** (future) - Standard npm install
2. **GitHub Release .tgz** - Install from release assets with automated builds
3. **Direct GitHub** - Install from repository with committed dist/ folder

All methods work with TypeScript and include full type definitions. Choose the method that best fits your workflow and deployment requirements.
