const core = require('@actions/core');
const github = require('@actions/github');
const openai = require('openai');

async function run() {
    console.log('Starting the review process...');

    const githubToken = core.getInput('github-token');
    const openaiApiKey = core.getInput('openai-api-key');

    // Fetch the PR diff
    const octokit = github.getOctokit(githubToken);
    const context = github.context;

    if (!context.payload.pull_request) {
        core.setFailed('No pull request found.');
        return;
    }

    const { data: diff } = await octokit.rest.pulls.get({
        owner: context.repo.owner,
        repo: context.repo.repo,
        pull_number: context.payload.pull_request.number,
        mediaType: {
            format: 'diff'
        }
    });

    console.log('Diff fetched:', diff);
}

run();
