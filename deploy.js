#!/usr/bin/env node
/**
 * RecruitHub — Automated GitHub + Railway Deployment Script
 * Run: node deploy.js
 * Requires: Node.js 18+ (uses native fetch)
 */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const RAILWAY_TOKEN = process.env.RAILWAY_TOKEN || '';
const REPO_NAME = 'recruit-hub';

const fs = require('fs');
const path = require('path');

// ─── Helpers ────────────────────────────────────────────────────────────────

function log(msg, emoji = '→') { console.log(`${emoji}  ${msg}`); }
function ok(msg) { console.log(`✅ ${msg}`); }
function err(msg) { console.error(`❌ ${msg}`); process.exit(1); }

async function github(endpoint, method = 'GET', body = null) {
  const res = await fetch(`https://api.github.com${endpoint}`, {
    method,
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'RecruitHub-Deploy/1.0',
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok && res.status !== 422) {
    console.error('GitHub API error:', JSON.stringify(data));
  }
  return { status: res.status, data };
}

async function railway(query, variables = {}) {
  const res = await fetch('https://backboard.railway.app/graphql/v2', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RAILWAY_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

// ─── Collect all project files ──────────────────────────────────────────────

function getAllFiles(dir, base = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.next', '.git', 'dist'].includes(entry.name)) continue;
      files.push(...getAllFiles(full, rel));
    } else {
      files.push({ path: rel, fullPath: full });
    }
  }
  return files;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🚀 RecruitHub Deployment Script\n' + '─'.repeat(40));

  // 1. Get GitHub username
  log('Authenticating with GitHub...');
  const { data: user } = await github('/user');
  if (!user.login) err('GitHub token invalid or expired');
  ok(`Authenticated as: ${user.login}`);
  const owner = user.login;

  // 2. Verify repo exists (create it manually on github.com/new first)
  log(`Checking repo: ${owner}/${REPO_NAME}...`);
  const { status: checkStatus, data: repoCheck } = await github(`/repos/${owner}/${REPO_NAME}`);
  let repoUrl;
  if (checkStatus === 200) {
    ok(`Repo found: ${repoCheck.html_url}`);
    repoUrl = repoCheck.html_url;
  } else {
    console.log('\n⚠️  Repo not found. Please:');
    console.log(`   1. Go to https://github.com/new`);
    console.log(`   2. Name it: ${REPO_NAME}`);
    console.log(`   3. Leave it empty (no README)`);
    console.log(`   4. Click "Create repository"`);
    console.log(`   5. Run this script again\n`);
    process.exit(1);
  }

  // 3. Collect all files
  log('Collecting project files...');
  const projectDir = __dirname;
  const files = getAllFiles(projectDir).filter(f => f.path !== 'deploy.js');
  ok(`Found ${files.length} files to push`);

  // 4. Create blobs for each file
  log('Uploading files to GitHub (this takes ~30s)...');
  const treeItems = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    process.stdout.write(`\r   Uploading: [${i + 1}/${files.length}] ${file.path.padEnd(60)}`);

    const content = fs.readFileSync(file.fullPath);
    const isText = isTextFile(file.path);

    let blobData;
    if (isText) {
      blobData = { content: content.toString('utf8'), encoding: 'utf-8' };
    } else {
      blobData = { content: content.toString('base64'), encoding: 'base64' };
    }

    const { data: blob } = await github(`/repos/${owner}/${REPO_NAME}/git/blobs`, 'POST', blobData);
    if (!blob.sha) {
      console.warn(`\n   ⚠ Could not create blob for ${file.path}`);
      continue;
    }

    treeItems.push({
      path: file.path,
      mode: '100644',
      type: 'blob',
      sha: blob.sha,
    });
  }
  console.log('\n');
  ok(`Uploaded ${treeItems.length} files`);

  // 5. Create tree
  log('Creating git tree...');
  const { data: tree } = await github(`/repos/${owner}/${REPO_NAME}/git/trees`, 'POST', {
    tree: treeItems,
  });
  if (!tree.sha) err('Failed to create git tree');
  ok(`Tree: ${tree.sha.slice(0, 7)}`);

  // 6. Create commit
  log('Creating commit...');
  const { data: commit } = await github(`/repos/${owner}/${REPO_NAME}/git/commits`, 'POST', {
    message: 'feat: initial RecruitHub implementation\n\nFull-stack recruitment platform with referral code system,\nATS pipeline, analytics dashboards, and role-based access.',
    tree: tree.sha,
    parents: [],
  });
  if (!commit.sha) err('Failed to create commit');
  ok(`Commit: ${commit.sha.slice(0, 7)}`);

  // 7. Create main branch
  log('Creating main branch...');
  await github(`/repos/${owner}/${REPO_NAME}/git/refs`, 'POST', {
    ref: 'refs/heads/main',
    sha: commit.sha,
  });
  ok(`Code pushed to ${repoUrl}`);

  // ─── Railway Deployment ────────────────────────────────────────────────────

  console.log('\n🚂 Railway Deployment\n' + '─'.repeat(40));

  // 8. Create Railway project
  log('Creating Railway project...');
  const projectResult = await railway(`
    mutation {
      projectCreate(input: { name: "recruit-hub", defaultEnvironmentName: "production" }) {
        id
        name
        defaultEnvironment { id name }
      }
    }
  `);

  if (projectResult.errors) {
    console.warn('Railway project creation error:', JSON.stringify(projectResult.errors));
    err('Railway token may be invalid or project already exists. Check railway.app');
  }

  const project = projectResult.data?.projectCreate;
  const projectId = project?.id;
  const environmentId = project?.defaultEnvironment?.id;
  ok(`Project created: ${project?.name} (${projectId})`);

  // 9. Create PostgreSQL service
  log('Provisioning PostgreSQL...');
  const pgResult = await railway(`
    mutation($projectId: String!, $environmentId: String!) {
      serviceCreate(input: {
        projectId: $projectId
        name: "postgres"
        source: { image: "postgres:16-alpine" }
      }) {
        id name
      }
    }
  `, { projectId, environmentId });

  const pgServiceId = pgResult.data?.serviceCreate?.id;
  ok(`PostgreSQL service: ${pgServiceId}`);

  // 10. Create app service from GitHub
  log(`Linking GitHub repo ${owner}/${REPO_NAME} to Railway...`);
  const appResult = await railway(`
    mutation($projectId: String!, $owner: String!, $repo: String!) {
      serviceCreate(input: {
        projectId: $projectId
        name: "recruit-hub"
        source: {
          repo: $repo
        }
      }) {
        id name
      }
    }
  `, { projectId, owner, repo: `${owner}/${REPO_NAME}` });

  const appServiceId = appResult.data?.serviceCreate?.id;
  if (!appServiceId) {
    log('Note: Service may need to be connected manually via Railway dashboard');
  } else {
    ok(`App service created: ${appServiceId}`);
  }

  // 11. Set environment variables
  log('Setting environment variables...');
  const NEXTAUTH_SECRET = Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 36).toString(36)).join('');

  const envVars = [
    ['NEXTAUTH_SECRET', NEXTAUTH_SECRET],
    ['NEXTAUTH_URL', 'https://recruit-hub.up.railway.app'],
    ['NEXT_PUBLIC_APP_URL', 'https://recruit-hub.up.railway.app'],
    ['NEXT_PUBLIC_APP_NAME', 'RecruitHub'],
    ['NODE_ENV', 'production'],
  ];

  for (const [name, value] of envVars) {
    await railway(`
      mutation($serviceId: String!, $environmentId: String!, $name: String!, $value: String!) {
        variableUpsert(input: {
          serviceId: $serviceId
          environmentId: $environmentId
          name: $name
          value: $value
        })
      }
    `, { serviceId: appServiceId ?? '', environmentId, name, value });
  }
  ok('Environment variables set');

  // ─── Done ─────────────────────────────────────────────────────────────────

  console.log('\n' + '═'.repeat(50));
  console.log('🎉  DEPLOYMENT INITIATED!\n');
  console.log(`📦  GitHub:  ${repoUrl}`);
  console.log(`🚂  Railway: https://railway.app/project/${projectId}`);
  console.log('\n📋  Final steps (Railway dashboard):');
  console.log('   1. Go to your Railway project');
  console.log('   2. Connect the GitHub repo to the app service if not auto-connected');
  console.log('   3. Link DATABASE_URL from the Postgres service to the app service');
  console.log('   4. Open app service → Settings → Build Command:');
  console.log('      npm install && npx prisma generate && npm run build');
  console.log('   5. Start Command:');
  console.log('      npx prisma migrate deploy && npm run db:seed && npm start');
  console.log('\n🔑  Seeded credentials (after first deploy):');
  console.log('   Admin:     admin@recruithub.com     / Admin123!');
  console.log('   Recruiter: recruiter@recruithub.com / Recruit123!');
  console.log('   Candidate: candidate@recruithub.com / Candidate123!');
  console.log('   Referral code: REC-DEMO01');
  console.log('\n' + '═'.repeat(50) + '\n');
}

function isTextFile(filePath) {
  const textExtensions = [
    '.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.css',
    '.html', '.yml', '.yaml', '.env', '.gitignore', '.sql',
    '.prisma', '.txt', '.sh', '.toml', '.lock'
  ];
  const ext = path.extname(filePath).toLowerCase();
  return textExtensions.includes(ext) ||
    ['Dockerfile', '.gitignore', '.env.example'].includes(path.basename(filePath));
}

main().catch((e) => {
  console.error('\n❌ Deployment failed:', e.message);
  process.exit(1);
});
