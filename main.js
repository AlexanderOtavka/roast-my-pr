const core = require('@actions/core');
const github = require('@actions/github');
const openai = require('openai');

async function run() {
    console.log('Starting the review process...');

    const githubToken = core.getInput('github-token');
    const openaiApiKey = core.getInput('openai-api-key');

    const octokit = github.getOctokit(githubToken);
    const context = github.context;

    if (!context.payload.pull_request) {
        core.setFailed('No pull request found.');
        return;
    }

    // Fetch the main PR comment
    const { data: pr } = await octokit.rest.pulls.get({
        owner: context.repo.owner,
        repo: context.repo.repo,
        pull_number: context.payload.pull_request.number
    });
    const prComment = pr.body;
    console.log("PR comment", prComment);
    console.log("PR", pr);

    // Fetch the git diff in text form
    const { data: diff } = await octokit.rest.pulls.get({
        owner: context.repo.owner,
        repo: context.repo.repo,
        pull_number: context.payload.pull_request.number,
        mediaType: {
            format: 'diff'
        }
    });

}

run();
