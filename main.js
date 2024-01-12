const core = require('@actions/core');
const github = require('@actions/github');
const { OpenAI } = require('openai');

async function run() {
    console.log('Starting the review process...');

    const githubToken = core.getInput('github-token');
    const openaiApiKey = core.getInput('openai-api-key');
    const openaiModel = core.getInput('openai-model');
    const systemPrompt = core.getInput('system-prompt');
    const userPromptTemplate = core.getInput('user-prompt-template');
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

    const userPrompt = userPromptTemplate
        .replace('{{pr.title}}', pr.title)
        .replace('{{pr.body}}', pr.body)
        .replace('{{pr.diff}}', shortDiff);

    console.log("Prompting OpenAI with the following prompt:")
    console.log("System:\n", systemPrompt);
    console.log("User:\n", userPrompt);
    const openaiClient = new OpenAI({ apiKey: openaiApiKey });
    const completion = await openaiClient.chat.completions.create({
        model: openaiModel,
        messages: [
            { role: "system", content: systemPrompt},
            { role: "user", content: userPrompt }
        ]
    });

    const review = completion.choices[0].message.content;
    const reviewComment = `# AI Code Review\n\n${review}`

    // Post a comment to the PR with the review
    await octokit.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: prNumber,
        body: reviewComment
    });
}

run();
