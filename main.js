const axios = require('axios');
const openai = require('openai');

async function run() {
    try {
        console.log('Starting the review process...');

        const githubToken = process.env.GITHUB_TOKEN;
        const openaiApiKey = process.env.OPENAI_API_KEY;
        const pullRequest = JSON.parse(process.env.GITHUB_EVENT_PATH);

        if (!pullRequest.pull_request) {
            console.log('The event payload did not contain a pull_request object');
            return;
        }

        const prNumber = pullRequest.pull_request.number;
        const repo = process.env.GITHUB_REPOSITORY;
        const owner = repo.split('/')[0];
        const repoName = repo.split('/')[1];

        const filesChangedResponse = await axios.get(`https://api.github.com/repos/${owner}/${repoName}/pulls/${prNumber}/files`, {
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        const filesChanged = filesChangedResponse.data.map(file => file.filename);

        for (const file of filesChanged) {
            const fileContentResponse = await axios.get(`https://api.github.com/repos/${owner}/${repoName}/contents/${file}`, {
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            const fileContent = Buffer.from(fileContentResponse.data.content, 'base64').toString('utf8');
            const prompt = `
                Review this code:
                ### File: ${file}\n\n${fileContent}
            `
            console.log("Sending prompt", prompt);

            const openaiResponse = await openai.Completion.create({
                engine: 'text-davinci-002',
                prompt,
                max_tokens: 60
            });

            const comment = openaiResponse.choices[0].text.trim();

            await axios.post(`https://api.github.com/repos/${owner}/${repoName}/issues/${prNumber}/comments`, {
                body: comment
            }, {
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
        }
    } catch (error) {
        console.error(`Error: ${error}`);
    }
}

run();
