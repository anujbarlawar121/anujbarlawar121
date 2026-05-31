# Setup Guide

Repository creation on GitHub was not automated from this workspace because GitHub CLI access was not available here.

## Quick Start

1. Create a **public** GitHub repository with the exact same name as your GitHub username.
2. Copy every file from this folder into that repository.
3. Commit and push to the default branch, ideally `main`.
4. Open your GitHub profile page and confirm the README appears at the top.

## Important Personalization

1. If your GitHub username is **not** `anujbarlawar121`, replace `anujbarlawar121` everywhere in [README.md](./README.md).
2. Confirm the LinkedIn URL is correct:
   `https://in.linkedin.com/in/anuj-barlawar-4572a5290`
3. Replace or expand the Certifications section if you want only user-supplied credentials shown.
4. Pin your best repositories on the GitHub profile itself so the README and pinned repos reinforce each other.

## Enable the Snake Animation

1. Push the workflow files in `.github/workflows/`.
2. In your GitHub repository, go to `Settings` -> `Actions` -> `General`.
3. Make sure Actions are allowed.
4. In `Settings` -> `Actions` -> `Workflow permissions`, enable **Read and write permissions**.
5. Run the `Generate Contribution Snake` workflow once manually from the `Actions` tab.
6. After the first run, the `output` branch will be created automatically and the snake animation will appear in the README.

## Auto-Refresh Profile Cards

1. The `Refresh Profile Assets` workflow generates your stats card, language card, and trophy wall from the GitHub API.
2. It runs automatically on pushes, on a schedule, and when triggered manually.
3. If the cards ever look stale, open the `Actions` tab and run `Refresh Profile Assets`.

## Add a Live LeetCode Card Later

Replace the placeholder image inside the LeetCode section with:

```md
[![LeetCode Stats](https://leetcard.jacoblin.cool/YOUR_LEETCODE_USERNAME?theme=dark&font=Baloo_2&ext=heatmap)](https://leetcode.com/u/YOUR_LEETCODE_USERNAME/)
```

## Folder Structure

```text
.
|-- .github
|   `-- workflows
|       |-- profile-assets.yml
|       |-- profile-health.yml
|       `-- snake.yml
|-- assets
|   |-- divider.svg
|   |-- footer.svg
|   |-- generated
|   |   |-- github-stats.svg
|   |   |-- top-languages.svg
|   |   `-- trophy-wall.svg
|   |-- hero-banner.svg
|   |-- leetcode-placeholder.svg
|   |-- project-chatbots.svg
|   |-- project-ds.svg
|   |-- project-ml.svg
|   `-- project-rag.svg
|-- README.md
|-- scripts
|   `-- generate-profile-assets.mjs
`-- SETUP.md
```

## Recommended Final Checklist

- Confirm all badges and stats point to your correct GitHub username.
- Replace the LeetCode placeholder when you have a handle you want to show publicly.
- Keep the README focused on your strongest 3 to 5 finished projects.
- Update pinned repositories, bio, profile photo, and profile headline so they match the README branding.
- Re-run the snake workflow after major profile changes if you want to verify everything end to end.
