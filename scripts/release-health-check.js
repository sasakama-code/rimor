#!/usr/bin/env node

/**
 * Release Health Dashboard
 * リリース後の健全性を監視し、問題を早期発見するためのダッシュボード
 */

const https = require('https');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Color utility functions
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(color, text) {
  return `${colors[color]}${text}${colors.reset}`;
}

// GitHub API client
class GitHubAPI {
  constructor(token, owner, repo) {
    this.token = token;
    this.owner = owner;
    this.repo = repo;
    this.baseUrl = 'api.github.com';
  }

  async request(path) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.baseUrl,
        port: 443,
        path: path,
        method: 'GET',
        headers: {
          'Authorization': `token ${this.token}`,
          'User-Agent': 'Rimor-Health-Dashboard',
          'Accept': 'application/vnd.github.v3+json'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error(`JSON parse error: ${error.message}`));
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  async getLatestRelease() {
    return this.request(`/repos/${this.owner}/${this.repo}/releases/latest`);
  }

  async getRecentIssues() {
    return this.request(`/repos/${this.owner}/${this.repo}/issues?state=open&sort=created&direction=desc&per_page=10`);
  }

  async getWorkflowRuns(workflowId = 'release.yml') {
    return this.request(`/repos/${this.owner}/${this.repo}/actions/workflows/${workflowId}/runs?per_page=5`);
  }
}

// npm Registry API client
class NPMRegistryAPI {
  constructor(packageName) {
    this.packageName = packageName;
    this.baseUrl = 'registry.npmjs.org';
  }

  async request(path) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.baseUrl,
        port: 443,
        path: path,
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error(`JSON parse error: ${error.message}`));
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  async getPackageInfo() {
    return this.request(`/${this.packageName}`);
  }

  async getDownloadStats() {
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    return this.request(`/-/api/v1/downloads/range/${lastWeek}:${today}/${this.packageName}`);
  }
}

// Health Check Runner
class ReleaseHealthDashboard {
  constructor() {
    this.packageName = 'rimor';
    this.repoOwner = 'sasakama-code';
    this.repoName = 'rimor';
    this.github = null;
    this.npm = new NPMRegistryAPI(this.packageName);
    
    if (process.env.GITHUB_TOKEN) {
      this.github = new GitHubAPI(process.env.GITHUB_TOKEN, this.repoOwner, this.repoName);
    }
  }

  async checkNPMHealth() {
    console.log(colorize('blue', '\n📦 NPM Package Health'));
    console.log('========================');

    try {
      const packageInfo = await this.npm.getPackageInfo();
      const latestVersion = packageInfo['dist-tags'].latest;
      const publishTime = packageInfo.time[latestVersion];
      const publishDate = new Date(publishTime);
      const daysSincePublish = Math.floor((Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24));

      console.log(colorize('green', '✅ Package Status: Available'));
      console.log(`📋 Latest Version: ${latestVersion}`);
      console.log(`📅 Published: ${publishDate.toLocaleString()} (${daysSincePublish} days ago)`);
      console.log(`📄 Description: ${packageInfo.description}`);
      console.log(`⚖️ License: ${packageInfo.license || 'Not specified'}`);
      
      // Version distribution
      const versions = Object.keys(packageInfo.versions);
      console.log(`📊 Total Versions: ${versions.length}`);
      
      // Dependencies analysis
      const latestVersionInfo = packageInfo.versions[latestVersion];
      const depCount = latestVersionInfo.dependencies ? Object.keys(latestVersionInfo.dependencies).length : 0;
      const devDepCount = latestVersionInfo.devDependencies ? Object.keys(latestVersionInfo.devDependencies).length : 0;
      
      console.log(`🔗 Dependencies: ${depCount} production, ${devDepCount} development`);
      
      return { status: 'healthy', version: latestVersion, publishDate };
    } catch (error) {
      console.log(colorize('red', '❌ Package Status: Error'));
      console.log(`🚨 Error: ${error.message}`);
      return { status: 'unhealthy', error: error.message };
    }
  }

  async checkDownloadStats() {
    console.log(colorize('blue', '\n📈 Download Statistics'));
    console.log('======================');

    try {
      const stats = await this.npm.getDownloadStats();
      const totalDownloads = stats.downloads.reduce((sum, day) => sum + day.downloads, 0);
      const dailyAverage = Math.round(totalDownloads / stats.downloads.length);
      
      console.log(colorize('green', '✅ Download Data: Available'));
      console.log(`📊 Last 7 days total: ${totalDownloads} downloads`);
      console.log(`📅 Daily average: ${dailyAverage} downloads`);
      
      // Trend analysis
      const recent3Days = stats.downloads.slice(-3).reduce((sum, day) => sum + day.downloads, 0);
      const previous3Days = stats.downloads.slice(-6, -3).reduce((sum, day) => sum + day.downloads, 0);
      const trend = recent3Days > previous3Days ? '📈 Increasing' : 
                   recent3Days < previous3Days ? '📉 Decreasing' : '➡️ Stable';
      
      console.log(`📊 Recent trend: ${trend}`);
      
      return { status: 'healthy', totalDownloads, dailyAverage, trend };
    } catch (error) {
      console.log(colorize('yellow', '⚠️ Download Data: Limited'));
      console.log(`🔍 Reason: ${error.message}`);
      return { status: 'limited', error: error.message };
    }
  }

  async checkGitHubHealth() {
    if (!this.github) {
      console.log(colorize('yellow', '\n⚠️ GitHub Health Check Skipped'));
      console.log('Reason: GITHUB_TOKEN not provided');
      return { status: 'skipped' };
    }

    console.log(colorize('blue', '\n🐙 GitHub Repository Health'));
    console.log('=============================');

    try {
      // Latest release check
      const latestRelease = await this.github.getLatestRelease();
      const releaseDate = new Date(latestRelease.published_at);
      const daysSinceRelease = Math.floor((Date.now() - releaseDate.getTime()) / (1000 * 60 * 60 * 24));
      
      console.log(colorize('green', '✅ Latest Release: Available'));
      console.log(`🏷️ Version: ${latestRelease.tag_name}`);
      console.log(`📅 Published: ${releaseDate.toLocaleString()} (${daysSinceRelease} days ago)`);
      console.log(`📄 Title: ${latestRelease.name}`);

      // Recent issues check
      const issues = await this.github.getRecentIssues();
      const openIssuesCount = issues.length;
      const recentBugs = issues.filter(issue => 
        issue.labels.some(label => label.name.toLowerCase().includes('bug'))
      ).length;
      
      console.log(`🐛 Open Issues: ${openIssuesCount} total, ${recentBugs} potential bugs`);
      
      if (recentBugs > 0) {
        console.log(colorize('yellow', '⚠️ Recent bug reports detected'));
        issues.slice(0, 3).forEach(issue => {
          console.log(`  - ${issue.title} (#${issue.number})`);
        });
      }

      // Workflow health
      const workflows = await this.github.getWorkflowRuns();
      const recentRuns = workflows.workflow_runs.slice(0, 5);
      const successfulRuns = recentRuns.filter(run => run.conclusion === 'success').length;
      const failureRate = ((recentRuns.length - successfulRuns) / recentRuns.length * 100).toFixed(1);
      
      console.log(`🔄 Recent Workflows: ${successfulRuns}/${recentRuns.length} successful`);
      console.log(`📊 Failure Rate: ${failureRate}%`);
      
      if (failureRate > 20) {
        console.log(colorize('red', '🚨 High workflow failure rate detected'));
      }

      return { 
        status: 'healthy', 
        version: latestRelease.tag_name, 
        openIssues: openIssuesCount, 
        recentBugs,
        failureRate: parseFloat(failureRate)
      };
    } catch (error) {
      console.log(colorize('red', '❌ GitHub Status: Error'));
      console.log(`🚨 Error: ${error.message}`);
      return { status: 'unhealthy', error: error.message };
    }
  }

  async checkInstallationHealth() {
    console.log(colorize('blue', '\n🔧 Installation Health'));
    console.log('======================');

    try {
      // Check if rimor can be installed globally
      console.log('📥 Testing global installation...');
      await execAsync('npm install -g rimor --dry-run');
      console.log(colorize('green', '✅ Global Installation: OK'));

      // Check if CLI is functional (use local build for testing)
      console.log('🔧 Testing CLI functionality...');
      const { stdout: versionOutput } = await execAsync('node dist/index.js --version');
      const version = versionOutput.trim();
      console.log(`📋 CLI Version: ${version}`);

      await execAsync('node dist/index.js --help > /dev/null');
      console.log(colorize('green', '✅ CLI Help Command: OK'));

      // Basic functionality test
      console.log('🧪 Testing basic analysis...');
      await execAsync('mkdir -p /tmp/rimor-health-test');
      await execAsync('echo "console.log(\'test\');" > /tmp/rimor-health-test/test.js');
      await execAsync('node dist/index.js analyze /tmp/rimor-health-test');
      await execAsync('rm -rf /tmp/rimor-health-test');
      console.log(colorize('green', '✅ Basic Analysis: OK'));

      return { status: 'healthy', version };
    } catch (error) {
      console.log(colorize('red', '❌ Installation Health: Error'));
      console.log(`🚨 Error: ${error.message}`);
      return { status: 'unhealthy', error: error.message };
    }
  }

  async generateHealthSummary(results) {
    console.log(colorize('cyan', '\n🏥 Release Health Summary'));
    console.log('===========================');

    let overallHealth = 'healthy';
    let criticalIssues = 0;
    let warnings = 0;

    // Analyze each component
    Object.entries(results).forEach(([component, result]) => {
      if (result.status === 'unhealthy') {
        overallHealth = 'unhealthy';
        criticalIssues++;
      } else if (result.status === 'limited' || result.status === 'skipped') {
        warnings++;
      }
    });

    // Overall status
    if (overallHealth === 'healthy' && warnings === 0) {
      console.log(colorize('green', '🎉 Overall Health: EXCELLENT'));
    } else if (overallHealth === 'healthy') {
      console.log(colorize('yellow', '⚠️ Overall Health: GOOD (with warnings)'));
    } else {
      console.log(colorize('red', '🚨 Overall Health: CRITICAL ISSUES DETECTED'));
    }

    console.log(`📊 Component Status: ${Object.keys(results).length} checked`);
    console.log(`🚨 Critical Issues: ${criticalIssues}`);
    console.log(`⚠️ Warnings: ${warnings}`);

    // Recommendations
    console.log(colorize('blue', '\n💡 Recommendations:'));
    
    if (criticalIssues > 0) {
      console.log('🚨 URGENT: Address critical issues immediately');
      console.log('1. Review error messages above');
      console.log('2. Check package availability and functionality');
      console.log('3. Verify CI/CD pipeline status');
    } else if (warnings > 0) {
      console.log('📋 Consider addressing warnings for optimal health');
    } else {
      console.log('✅ All systems operational - no action required');
    }

    console.log(colorize('blue', '\n🔗 Useful Commands:'));
    console.log('npm view rimor                  # Check package info');
    console.log('npm install -g rimor@latest     # Install latest version');
    console.log('rimor --version                 # Verify installation');
    console.log('gh workflow list                # Check GitHub Actions');
    
    return {
      overallHealth,
      criticalIssues,
      warnings,
      components: Object.keys(results).length
    };
  }

  async run() {
    console.log(colorize('bright', '🏥 Rimor Release Health Dashboard'));
    console.log(colorize('bright', '==================================='));
    console.log(`⏰ Health check started at: ${new Date().toLocaleString()}`);

    const results = {};

    // Run all health checks
    results.npm = await this.checkNPMHealth();
    results.downloads = await this.checkDownloadStats();
    results.github = await this.checkGitHubHealth();
    results.installation = await this.checkInstallationHealth();

    // Generate summary
    const summary = await this.generateHealthSummary(results);

    console.log(colorize('blue', '\n📋 Next Steps:'));
    console.log('🔄 Run this check regularly: npm run health-check');
    console.log('📊 Set up monitoring: cron job or GitHub Actions schedule');
    console.log('🚨 Alert setup: integrate with monitoring systems');

    // Exit with appropriate code
    process.exit(summary.criticalIssues > 0 ? 1 : 0);
  }
}

// Script execution
if (require.main === module) {
  const dashboard = new ReleaseHealthDashboard();
  dashboard.run().catch(error => {
    console.error(colorize('red', `🚨 Health check failed: ${error.message}`));
    process.exit(1);
  });
}

module.exports = { ReleaseHealthDashboard };