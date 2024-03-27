# Roast My PR

This project is a GitHub Action that automatically reviews code by leaving comments on new pull requests. It uses the OpenAI API to access the Chat GPT model via JavaScript.

## Setup

1. First, you need to add your OpenAI API key to your repository secrets. You can do this by going to your repository settings, then the 'Secrets' tab, and adding a new secret with the name `OPENAI_API_KEY` and your OpenAI API key as the value.

2. Next, you need to add the GitHub Action to your repository. You can do this by creating a new file in the `.github/workflows` directory with the following content:

```yml
name: Roast My PR
on:
  pull_request:
    # Run this action whenever a pull request is created or updated
    types: [opened, synchronize]
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

3. (Optional) You can further customize the review experience so users can directly request reviews from a bot account like they would with a human reviewer.  You'll need a [user account](https://docs.github.com/en/get-started/learning-about-github/types-of-github-accounts#personal-accounts) for your bot, then save a personal access token for the bot account under `BOT_ACCOUNT_TOKEN`.  Then update your workflow as follows:

```yml
name: Roast My PR
on:
  pull_request:
    # Only run this action when a review is requested
    types: [review_requested]
concurrency:
  # Don't run this action on the same PR at the same time in case of multiple
  # review requests in quick succession that could cause duplicate reviews.
  group: ${{ github.workflow }}-${{ github.event.pull_request.number }}

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Roast My PR
      uses: ./
      with:
        github-token: ${{ secrets.BOT_ACCOUNT_TOKEN }}
        openai-api-key: ${{ secrets.OPENAI_API_KEY }}
        # Skip posting a review unless the account `github-token` belongs to has
        # a pending review request
        review-request: required
```

## License

This project is licensed under the terms of the MIT license.
