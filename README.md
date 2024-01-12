# Roast My PR

This project is a GitHub Action that automatically reviews code by leaving comments on new pull requests. It uses the OpenAI API to access the Chat GPT model via JavaScript.

## Setup

1. First, you need to add your OpenAI API key to your repository secrets. You can do this by going to your repository settings, then the 'Secrets' tab, and adding a new secret with the name `OPENAI_API_KEY` and your OpenAI API key as the value.

2. Next, you need to add the GitHub Action to your repository. You can do this by creating a new file in the `.github/workflows` directory with the following content:

```yml
name: Roast My PR
on: [pull_request]
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Roast My PR
      uses: ./
      with:
        github-token: ${{ secrets.GITHUB_TOKEN }}
        openai-api-key: ${{ secrets.OPENAI_API_KEY }}
```

This will trigger the action whenever a new pull request is created or updated.

## License

This project is licensed under the terms of the MIT license.
