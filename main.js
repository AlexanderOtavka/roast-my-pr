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
    const maxDiffLength = parseInt(core.getInput('max-diff-length'));
    const maxIndividualFileDiff = 8000;
    const reviewRequest = core.getInput('review-request');

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

    if (reviewRequest === "required") {
        // Check if the PR is requesting a review from the current user
        const { data: currentUser } = await octokit.rest.users.getAuthenticated();
        if (!pr.requested_reviewers?.some(reviewer => reviewer.login === currentUser.login)) {
            console.log(`No review requested for user: ${currentUser.login}. Skipping.`);
            return;
        }
    }

    // Fetch the git diff in text form
    const { data: files } = await octokit.rest.pulls.listFiles({
        owner: context.repo.owner,
        repo: context.repo.repo,
        pull_number: prNumber
    });

    let diff = "";
    for (const file of files) {
        const previousFilename = file.previous_filename || file.filename;
        diff += `diff --git a/${previousFilename} b/${file.filename}\n`;
        diff += `index ${file.sha} ${file.status}\n`;
        if (file.patch && file.patch.length <= maxIndividualFileDiff) {
            diff += `--- a/${previousFilename}\n`;
            diff += `+++ b/${file.filename}\n`;
            diff += file.patch + "\n\n";
        } else {
            diff += "[File diff too long. Skipping]\n\n";
        }

        if (diff.length > maxDiffLength) {
            diff = diff.slice(0, maxDiffLength);
            diff += "...\n\n[Diff too long. Truncated]"
            break;
        }
    }

    const userPrompt = userPromptTemplate
        .replace('{{pr.title}}', pr.title)
        .replace('{{pr.body}}', pr.body)
        .replace('{{pr.diff}}', diff);

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
    const reviewComment = `# Roast My PR: AI Code Review\n\n${review}`

    // Post a PR review comment
    await octokit.rest.pulls.createReview({
        owner: context.repo.owner,
        repo: context.repo.repo,
        pull_number: prNumber,
        body: reviewComment,
        event: "COMMENT"
    });
}

run();
