/**
 * tests/e2e/harness/docker-validator.js
 * Pure Node.js static analyzer for Dockerfile, deployment scripts, and deployment docs.
 * Zero external npm dependencies.
 */

'use strict';

/**
 * Parses and validates multi-stage Dockerfile for Cloud Run compliance
 */
function validateDockerfile(content) {
  const lines = String(content).split('\n').map(l => l.trim());

  const stages = [];
  let currentStage = null;
  let hasAlpine = false;
  let hasNpmCi = false;
  let copiesStandalone = false;
  let copiesStatic = false;
  let createsNonRootUser = false;
  let switchesToNonRoot = false;
  let setsPort8080 = false;
  let setsHost0000 = false;
  let exposesPort = false;
  let cmdNodeServer = false;

  for (const line of lines) {
    if (line.startsWith('#') || !line) continue;

    // Check stages: FROM node:...-alpine AS <stage>
    const fromMatch = line.match(/^FROM\s+([^\s]+)(?:\s+AS\s+([^\s]+))?/i);
    if (fromMatch) {
      const image = fromMatch[1];
      const stageName = fromMatch[2] || 'base';
      if (image.includes('alpine')) hasAlpine = true;
      currentStage = stageName.toLowerCase();
      stages.push(currentStage);
      continue;
    }

    if (/npm\s+ci/i.test(line)) {
      hasNpmCi = true;
    }

    if (/COPY\s+.*\.next\/standalone/i.test(line)) {
      copiesStandalone = true;
    }

    if (/COPY\s+.*\.next\/static/i.test(line)) {
      copiesStatic = true;
    }

    if (/addgroup.*1001|adduser.*1001|addgroup.*nodejs|adduser.*nextjs/i.test(line)) {
      createsNonRootUser = true;
    }

    if (/^USER\s+nextjs/i.test(line) || /^USER\s+1001/i.test(line)) {
      switchesToNonRoot = true;
    }

    if (/ENV\s+PORT(?:=|\s+)8080/i.test(line)) {
      setsPort8080 = true;
    }

    if (/ENV\s+HOSTNAME(?:=|\s+)(?:"0\.0\.0\.0"|0\.0\.0\.0)/i.test(line)) {
      setsHost0000 = true;
    }

    if (/^EXPOSE\s+8080/i.test(line)) {
      exposesPort = true;
    }

    if (/CMD\s+\[\s*"node"\s*,\s*"server\.js"\s*\]/i.test(line)) {
      cmdNodeServer = true;
    }
  }

  const isMultiStage = stages.length >= 2;

  return {
    isMultiStage,
    stages,
    stageCount: stages.length,
    hasAlpine,
    hasNpmCi,
    copiesStandalone,
    copiesStatic,
    createsNonRootUser,
    switchesToNonRoot,
    setsPort8080,
    setsHost0000,
    exposesPort,
    cmdNodeServer,
    isCompliant: isMultiStage && hasAlpine && copiesStandalone && switchesToNonRoot && setsPort8080 && cmdNodeServer
  };
}

/**
 * Validates deploy-cloudrun.sh syntax and parameters
 */
function validateCloudRunDeployScript(content) {
  const text = String(content);

  const hasShebang = /^#!\/(?:usr\/bin\/env\s+bash|bin\/bash|bin\/sh)/m.test(text);
  const hasSafeFlags = /set\s+-[a-zA-Z]*e[a-zA-Z]*/.test(text);
  const hasServiceName = /talha-masood-portfolio/i.test(text);
  const hasRegion = /europe-west3|us-central1|region/i.test(text);
  const enablesServices = /gcloud\s+services\s+enable/i.test(text);
  const deploysCloudRun = /gcloud\s+run\s+deploy/i.test(text);
  const usesPort8080 = /--port\s+8080|8080/.test(text);
  const allowsUnauthenticated = /--allow-unauthenticated/i.test(text);
  const setsPlatformManaged = /--platform\s+managed/i.test(text);

  return {
    hasShebang,
    hasSafeFlags,
    hasServiceName,
    hasRegion,
    enablesServices,
    deploysCloudRun,
    usesPort8080,
    allowsUnauthenticated,
    setsPlatformManaged,
    isCompliant: hasShebang && hasSafeFlags && hasServiceName && deploysCloudRun && usesPort8080
  };
}

/**
 * Validates cloudbuild.yaml
 */
function validateCloudBuildYaml(content) {
  const text = String(content);

  const hasSteps = /steps:\s*\n/i.test(text);
  const hasDockerBuild = /name:\s*['"]?gcr\.io\/cloud-builders\/docker['"]?|args:\s*\[.*build.*\]/i.test(text);
  const hasCloudRunDeploy = /gcloud.*run.*deploy|google\.com\/cloudsdktool\/cloud-sdk/i.test(text);
  const hasSubstitutions = /substitutions:\s*\n/i.test(text);

  return {
    hasSteps,
    hasDockerBuild,
    hasCloudRunDeploy,
    hasSubstitutions,
    isCompliant: hasSteps && (hasDockerBuild || hasCloudRunDeploy)
  };
}

/**
 * Validates README.md deployment guide
 */
function validateDeploymentReadme(content) {
  const text = String(content);

  const hasPrerequisites = /prerequisite|requirements/i.test(text);
  const hasLocalDev = /npm\s+run\s+dev/i.test(text);
  const hasDockerBuild = /docker\s+build/i.test(text);
  const hasDockerRun = /docker\s+run.*8080/i.test(text);
  const hasCloudRunDeploy = /gcloud\s+run\s+deploy|deploy-cloudrun\.sh/i.test(text);
  const hasAvatarReplacementDocs = /avatar|profile\s+(?:picture|image|photo)/i.test(text);

  return {
    hasPrerequisites,
    hasLocalDev,
    hasDockerBuild,
    hasDockerRun,
    hasCloudRunDeploy,
    hasAvatarReplacementDocs,
    isCompliant: hasPrerequisites && hasLocalDev && hasDockerBuild && hasCloudRunDeploy
  };
}

module.exports = {
  validateDockerfile,
  validateCloudRunDeployScript,
  validateCloudBuildYaml,
  validateDeploymentReadme
};
