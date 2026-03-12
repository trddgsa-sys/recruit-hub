#!/usr/bin/env node
/**
 * RecruitHub — Railway Deployment Script
 * Run: node railway-deploy.js
 */

const RAILWAY_TOKEN = '31bcb290-80e9-4ab1-bf1c-04af778a2237';
const GITHUB_REPO = 'trddgsa-sys/recruit-hub';

function log(msg) { console.log(`→  ${msg}`); }
function ok(msg)  { console.log(`✅ ${msg}`); }
function err(msg) { console.error(`❌ ${msg}`); process.exit(1); }

async function gql(query, variables = {}) {
  const res = await fetch('https://backboard.railway.app/graphql/v2', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RAILWAY_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) {
    console.error('Railway API errors:', JSON.stringify(json.errors, null, 2));
  }
  return json;
}

async function main() {
  console.log('\n🚂 RecruitHub Railway Deployment\n' + '─'.repeat(40));

  // 1. Verify token
  log('Verifying Railway token...');
  const meRes = await gql(`query { me { id name email } }`);
  if (!meRes.data?.me?.id) err('Railway token invalid. Check the token and try again.');
  ok(`Logged in as: ${meRes.data.me.name} (${meRes.data.me.email})`);

  // 2. Get workspace ID from me
  log('Fetching workspace...');
  const meFullRes = await gql(`
    query {
      me {
        id
        teams { edges { node { id name } } }
      }
    }
  `);
  const teamId = meFullRes.data?.me?.teams?.edges?.[0]?.node?.id;
  const teamName = meFullRes.data?.me?.teams?.edges?.[0]?.node?.name;
  if (!teamId) err('Could not fetch workspace/team: ' + JSON.stringify(meFullRes));
  ok(`Workspace: ${teamName} (${teamId})`);

  // 3. Create project
  log('Creating Railway project...');
  const projectRes = await gql(`
    mutation($teamId: String!) {
      projectCreate(input: {
        name: "recruit-hub"
        defaultEnvironmentName: "production"
        teamId: $teamId
      }) {
        id
        name
        environments { edges { node { id name } } }
      }
    }
  `, { teamId });

  const project = projectRes.data?.projectCreate;
  if (!project?.id) err('Failed to create Railway project: ' + JSON.stringify(projectRes));
  const projectId = project.id;
  const environmentId = project.environments.edges[0]?.node?.id;
  if (!environmentId) err('Could not get environment ID');
  ok(`Project created: ${project.name} (${projectId})`);
  ok(`Environment: ${project.environments.edges[0]?.node?.name} (${environmentId})`);

  // 3. Create PostgreSQL database service
  log('Provisioning PostgreSQL database...');
  const pgRes = await gql(`
    mutation($projectId: String!) {
      serviceCreate(input: {
        projectId: $projectId
        name: "postgres"
      }) { id name }
    }
  `, { projectId });

  // Deploy Postgres image via variables
  const pgServiceId = pgRes.data?.serviceCreate?.id;
  if (pgServiceId) {
    ok(`PostgreSQL service: ${pgServiceId}`);

    // Use Railway's Postgres template
    await gql(`
      mutation($serviceId: String!, $environmentId: String!) {
        serviceInstanceUpdate(
          serviceId: $serviceId
          environmentId: $environmentId
          input: { source: { image: "ghcr.io/railwayapp-templates/postgres-ssl:edge" } }
        )
      }
    `, { serviceId: pgServiceId, environmentId });
  }

  // 4. Create app service from GitHub
  log(`Linking GitHub repo: ${GITHUB_REPO}...`);
  const appRes = await gql(`
    mutation($projectId: String!) {
      serviceCreate(input: {
        projectId: $projectId
        name: "recruit-hub-app"
        source: { repo: "${GITHUB_REPO}" }
      }) { id name }
    }
  `, { projectId });

  const appServiceId = appRes.data?.serviceCreate?.id;
  if (!appServiceId) {
    log('⚠ Could not auto-link GitHub repo via API (needs OAuth). Will set up manually below.');
  } else {
    ok(`App service created: ${appServiceId}`);

    // 5. Set build and start commands
    log('Configuring build settings...');
    await gql(`
      mutation($serviceId: String!, $environmentId: String!) {
        serviceInstanceUpdate(
          serviceId: $serviceId
          environmentId: $environmentId
          input: {
            buildCommand: "npm install && npx prisma generate && npm run build"
            startCommand: "npx prisma migrate deploy && npm run db:seed && npm start"
          }
        )
      }
    `, { serviceId: appServiceId, environmentId });
    ok('Build commands configured');

    // 6. Set environment variables
    log('Setting environment variables...');
    const NEXTAUTH_SECRET = Array.from({length: 40}, () =>
      Math.random().toString(36)[2] || '0').join('');

    const envVars = [
      ['NEXTAUTH_SECRET', NEXTAUTH_SECRET],
      ['NEXTAUTH_URL', 'https://recruit-hub-app.up.railway.app'],
      ['NEXT_PUBLIC_APP_URL', 'https://recruit-hub-app.up.railway.app'],
      ['NEXT_PUBLIC_APP_NAME', 'RecruitHub'],
      ['NODE_ENV', 'production'],
      ['NEXT_TELEMETRY_DISABLED', '1'],
    ];

    for (const [name, value] of envVars) {
      await gql(`
        mutation($projectId: String!, $serviceId: String!, $environmentId: String!, $name: String!, $value: String!) {
          variableUpsert(input: {
            projectId: $projectId
            serviceId: $serviceId
            environmentId: $environmentId
            name: $name
            value: $value
          })
        }
      `, { projectId, serviceId: appServiceId, environmentId, name, value });
    }
    ok('Environment variables set');

    // 7. Trigger deployment
    log('Triggering deployment...');
    const deployRes = await gql(`
      mutation($serviceId: String!, $environmentId: String!) {
        serviceInstanceDeploy(serviceId: $serviceId, environmentId: $environmentId)
      }
    `, { serviceId: appServiceId, environmentId });
    ok('Deployment triggered!');
  }

  // Final summary
  console.log('\n' + '═'.repeat(50));
  console.log('🎉  RAILWAY SETUP COMPLETE!\n');
  console.log(`🔗  Project URL: https://railway.app/project/${projectId}`);
  console.log('\n📋  Open that URL and complete these steps:');
  console.log('   1. Click the Postgres service → "Connect" tab');
  console.log('      Copy the DATABASE_URL variable');
  console.log('   2. Click the app service → "Variables" tab');
  console.log('      Add: DATABASE_URL = <paste from step 1>');
  console.log('   3. If GitHub repo not auto-linked:');
  console.log('      App service → Settings → Source → Connect GitHub repo');
  console.log('      Select: trddgsa-sys/recruit-hub');
  console.log('   4. Click "Deploy" — live in ~4 minutes!');
  console.log('\n🔑  After deployment, login with:');
  console.log('   Admin:     admin@recruithub.com / Admin123!');
  console.log('   Recruiter: recruiter@recruithub.com / Recruit123!');
  console.log('   Candidate: candidate@recruithub.com / Candidate123!');
  console.log('   Referral code: REC-DEMO01');
  console.log('\n' + '═'.repeat(50) + '\n');
}

main().catch(e => {
  console.error('\n❌ Error:', e.message);
  process.exit(1);
});
