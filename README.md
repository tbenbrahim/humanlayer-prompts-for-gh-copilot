# Humanlayer Prompts

Install a curated set of Humanlayer Claude commands adapted for GitHub Copilot into a workspace.

This extension packages a selection of the [`humanlayer`](https://github.com/humanlayer/humanlayer) prompts adapted for GitHub Copilot. It focuses on practical development workflows such as researching a codebase, creating and implementing plans, debugging, committing changes, writing PR descriptions, creating handoffs, and resuming work from previous sessions.

## What It Installs

After installation, the extension can place bundled prompt and agent files into a workspace so they can be used as repository-scoped Copilot customizations.

- Prompt files for common engineering workflows
- Companion agents used by those prompts for focused research tasks
- A reusable setup path for teams that want to share the same Copilot workflow assets

`humanlayer` prompts and agents definitions are licensed under the [Apache 2.0 License](https://www.apache.org/licenses/LICENSE-2.0). and remain
copyright (c) 2024 , humanlayer Authors. This extension is not affiliated with or endorsed by Humanlayer, Inc. in any way.  
This adaptation is licensed under the same terms.

## Included Workflows

The bundle covers:

- Codebase research
- Plan creation and iteration
- Plan implementation
- Debugging support
- Commit preparation
- PR description generation
- Handoff creation and resume flows

## Bundled Prompts

| Prompt file                      | Purpose                                                                                                                                             |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hl_research_codebase.prompt.md` | Documents the current codebase as-is, using thoughts history as optional context and parallel research subagents for discovery.                     |
| `hl_create_plan.prompt.md`       | Builds an implementation plan interactively by reading requirements, researching the codebase, and drafting phased technical work.                  |
| `hl_iterate_plan.prompt.md`      | Updates an existing implementation plan in response to feedback, including extra research when the requested changes require it.                    |
| `hl_implement_plan.prompt.md`    | Executes an approved implementation plan from `thoughts/shared/plans`, verifies each phase, and pauses for manual confirmation when needed.         |
| `hl_debug.prompt.md`             | Investigates implementation or manual-testing issues by checking logs, database state, git state, and other runtime evidence without editing files. |
| `hl_commit.prompt.md`            | Reviews the current session changes, proposes commit grouping and messages, and creates commits only after user approval.                           |
| `hl_describe_pr.prompt.md`       | Generates a pull request description from repository templates, diffs, metadata, and verification steps, then syncs and updates the PR body.        |
| `hl_create_handoff.prompt.md`    | Produces a concise but thorough handoff document so work can be resumed accurately in a later session.                                              |
| `hl_resume_handoff.prompt.md`    | Resumes work from a handoff document by re-reading linked artifacts, validating current state, and rebuilding the next action plan.                 |

## Prompt Notes

- Several prompts rely on companion agents from `bundle/agents` for focused research work.
- The prompt content is adapted from the Humanlayer `.claude` workflow for GitHub Copilot usage.

## More Information

- [No Vibes Allowed: Solving Hard Problems in Complex Codebases – Dex Horthy, HumanLayer](https://www.youtube.com/watch?v=rmvDxxNubIg)
- [Everything We Got Wrong About Research-Plan-Implement - Dexter Horthy](https://www.youtube.com/watch?v=YwZR6tc7qYg)
