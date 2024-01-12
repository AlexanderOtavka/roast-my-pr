const core = require('@actions/core');
const github = require('@actions/github');
const openai = require('openai');

async function run() {
    console.log('Starting the review process...');

    const githubToken = core.getInput('github-token');
    const openaiApiKey = core.getInput('openai-api-key');

    // Fetch the PR diff
    const octokit = github.getOctokit(githubToken);
    const diff = await octokit.pulls.get({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        pull_number: github.context.payload.pull_request.number,
    });
    console.log('Diff:', diff.data);
}

run();
