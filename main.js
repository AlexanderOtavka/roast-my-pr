const core = require('@actions/core');
const github = require('@actions/github');
const openai = require('openai');

async function run() {
    console.log('Starting the review process...');

    const githubToken = core.getInput('github-token');
    const openaiApiKey = core.getInput('openai-api-key');
    const promptTemplate = core.getInput('prompt-template');
    const maxDiffSize = 2000;

    const octokit = github.getOctokit(githubToken);
    const context = github.context;

    if (!context.payload.pull_request) {
        core.setFailed('No pull request found.');
        return;
    }
    const prNumber = context.payload.pull_request.number;

    // Fetch the main PR metadata including title, body, etc.
    const { data: pr } = await octokit.rest.pulls.get({
        owner: context.repo.owner,
        repo: context.repo.repo,
        pull_number: prNumber
    });

    // Fetch the git diff in text form
    const { data: diff } = await octokit.rest.pulls.get({
        owner: context.repo.owner,
        repo: context.repo.repo,
        pull_number: prNumber,
        mediaType: {
            format: 'diff'
        }
    });

    const shortDiff = diff.slice(0, maxDiffSize);

    if (diff.length > maxDiffSize) {
        console.log(`Diff size is ${diff.length} bytes, which is larger than the max size of ${maxDiffSize} bytes. Skipping review.`);
    }

    const prompt = promptTemplate
        .replace('{{pr.title}}', pr.title)
        .replace('{{pr.body}}', pr.body)
        .replace('{{pr.diff}}', shortDiff);
    
    console.log('Prompt:', prompt);

    const review = `
        # Prompt
        ${prompt}
    `

    // Post a comment to the PR with the review
    await octokit.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: prNumber,
        body: review
    });
}

run();
