# Goal of the session

We are going to have a large long discussion about this project. The point of this discussion is to have a clear road map and large-scale requirements decided. We're going to talk about the whole project so this session will probably clarify what needs to be built at a higher level. We don't need to get into the absolute details of every design tree, but we are going to clarify which modules will have what and what needs to be clarified in the future for each module. First please do a thorough exploration on what's currently implemented and what are the current requirements and ideas from which we are going to build it. For that please fetch open GitHub issues, @.mpx/REQUIREMENTS.md, @.mpx/VOCABULARY.md, @.mpx/ARCHITECTURE.md (not the usage of deep modules C:\_MP_projects\mpx-claude-code\skills\mp-execute\deep-modules.md), @README.md, @AGENTS.md, @package.json. This should represent the current state of the project. @.mpx/ROADMAP.md, @CAREER_RECOMMENDATIONS.md and @REFERENCES.md Should give you a good idea of what we are planning to build and projects from which we take inspiration. All the open source projects that we are planning to use or take inspiration from are stored locally in C:\_MP_github_cloned.

# Exploration

Feel free to fetch any config or other files to understand the setup and tech stack of the project (Feel free to suggest any possible improvements to the whole setup). Feel free to also look around our conventions, linting, formatting rules and of course feel free to do an exploration through the source code to see what actually is currently built. I think we have a lot implemented already; however not many things are wired up to the UI correctly or at all so the app is quite unusable right now. This is not an issue. We are going to clarify the future steps and requirements and continue iterating on this project. For any exploration you'll do, Please use subagents not to bloat the main context of this decision-making agent. Feel free to use as many exploration sub-agents as are practical. I would like you to go deeper into the projects in the GitHub cloned folder to fetch some technical details and implementation strategies from which we can take inspiration. We already did that shallowly and we have some overview in the references.md; however feel free to explore a lot more there

# Rewrite of previous project

This project was originally a rewrite of a previous project C:\_MP_projects\obsidian-tasks-dashboard-plugin. Please also do a thorough exploration there, and let's try to bring all the meaningful requirements from that project to this project as well. Especially, please explore the C:\_MP_projects\obsidian-tasks-dashboard-plugin\.mpx folder. Most of the requirements should still be documented there under specific epics. What the app does well is creating dashboards with the ability to create Git worktrees either via a quick button from loaded GitHub issues that are assigned to me for a specific repository, or a separate workflow to add an issue button. The issue then has a quick overview of the current state, including:

- state of the GitHub issue

- state of the PR

- state of the worktree

- state of the Git branch

These states are visualized via badges and each badge is clickable if it makes sense. So for example, clicking the GitHub issue badge in whatever state it is redirects the user to the GitHub issue on web, same with PR.

It assigns each issue a color, either automatically or through a user dialog, and that color is then assigned to each tool working with this specific issue. For example, VS Code, a terminal. This can generally translate into our app for visualization ideas. We are not going to work only with VS Code, but with other IDEs, and we are not going to just work with the Windows terminal, but with other platform terminals. What we can also take from this app is keyboard accessibility. Each action should be mapped to a specific keyboard shortcut. For example:

- creating new worktrees

- going to settings

- confirmation or cancellation via Enter or Escape key in dialogs and popups.

We support keyboard shortcuts whatever possible.

This Obsidian plugin also supports assigning a folder and a GitHub repository or many of them to each dashboard so that we can have quick access to opening the project's folder, opening the project in VS Code, opening the project in Terminal, opening GitHub page in browser, etc. Based on those being assigned, these buttons and links are either fully working or disabled. Or maybe if the folder is not assigned and I click on the folder button, it should open a dialog asking me to assign a folder. If I assign it, then the button becomes fully functional. We can take this idea as well.

# MPX Claude code

C:\_MP_projects\mpx-claude-code\ Our Grovekeeper project will heavily rely on this repository npx-claude-code. This is a set of skills agents hooks settings to control Claude code. Please also do exploration there so you know what is accessible and what this Grovekeeper app will basically be orchestrating. We are not going to rely only on Claude code but this will be the start. We will be using other providers and LLMs as well. The main skill used for almost every implementation is C:\_MP_projects\mpx-claude-code\skills\mp-execute\SKILL.md. Please study it in detail with all the references to understand our coding workflow. (As always do this exploration in a subagent)

# Visualization rendering library

C:\_MP_projects\low-poly-2d-trees One of the main points of this app is to have a nice visualization for the current state of issues, agents, sessions, etc. We created a whole library for a tree metaphor. This is the library and it should be taken as our tree rendering engine. Also this app is written in Svelte so we can take inspiration from there about some conventions.  

# Design

https://api.anthropic.com/v1/design/h/9xIOXwjzsfucJNjOP8zNVg?open_file=Grovekeeper+Design.html This is a link to a design made in Claude Design, which has a nice first iteration of planned design for this app. It includes design tokens like colors, typography, spacing, etc. It includes the quite extensive component (and component block) design including their states, some page design ideas and more.

It is not a complete design with all the edge cases resolved. It should serve as an inspiration. We should probably use the color system. We should take some other UI tokens from there, but we might want to leave some of those which are in practice. They're too hard to use and probably won't be used ever. It should be up to your decision; however, it should give us a good idea of our future UI library for this project. Most of the stuff could probably be taken from the design directly. We are using Svelte, tailwind and shadcn-Svelte on the frontend, so the design should be mapped to this architecture.  

We should keep storybook in mind. All of the basic components and component blocks should be designed in storybook as well and tested.

# Random Requirements

Here is a list of random requirements that I want to include in this app:

- Full translation into multiple languages. Let's start with English and Czech. English is the default. We will probably support Spanish, German, and other languages in the future and Diab should be prepared for such a change. I think we can and should use Paraglide. That is I think the Svelte default choice and we already have it in adjacent app low-poly-2d-trees. We can take inspiration from that setup.

- There will be a forest view where each tree represents one worktree and/or GitHub issue. There might be a center tree representing the PRD GitHub issue which will be larger than the other ones. There will also be a suitable metaphor for displaying how many issues are done versus open. For example we have a flowering stage and a fruiting stage of a tree. This PRD tree could for example use flowers as open issues and fruits for completed issues. Each of the smaller trees will represent one GitHub issue and its current state in that view. There will be one forest/PRD for the whole repository which will be one of the main views for an overview over the current work state. These trees should display blocking relationships between those issues. For example, issue 1 blocks issues 2 and 3, so the tree number 2 and 3 should be behind the tree for issue number 1 and should probably be displayed as disabled (There will be simulated depth in the forest with up to 10 rows). We should also have blocking relationships displayed with normal UI elements and not only with the tree metaphor. It should be displayed in the form of a tree. However not a rendered tree but a tree created from UI elements. For example, issue 1 on the left with two leading lines to issue number 2 and 3 which will be on the right and clearly dependent on the issue number 1

- Previously, we thought about tree states for things like:

- PR open

- PR merged

- issue open

- issue closed

- worktree active

- worktree pruned

- Git branch behind dev etc.

I think we didn't think about states like:

- NPM package is installed

- database running

- dev server opened

These should also be somehow represented in the app in issue overview in dashboard with multiple issues and/or in a single issue view.

- We also have AFK and HITL states for each issue. This should also be included in the above tree. Issues with AFK and unblocked are ready for execution and will be automatically fetched by some loop and executed autonomously.

There will be a dashboard for resolving HITL issues. All HITL issues should be sorted there maybe by most blocking or chronologically and the user is able to click some button to start grilling sessions to resolve the HITL questions and unblock the issues. This could even be smarter in a way that Some background agent will gather questions for each of these HIDL issues. Those will be displayed nicely in a UI for the user. The user can come to this app and answer any of these questions and then queue the answers for further HIDL processing by some background agent. This is a very important part of the app and it should be designed in a way that makes it easy to resolve HITL issues as much as possible. We want to minimize the time needed for the user to resolve these issues and get back to work.

- This workflow heavily relies on Git and GitHub so there will be some git/GitHub syncing functionality. We will be fetching GitHub issues, GitHub PR states, local and remote branch states, worktree states. There should also be buttons and actions in this app triggering issue and PR life cycle changes like committing, pushing, pulling syncing with base branch, resolving merge conflicts automatically via an agent, merging PR, resolving CI failures via an agent etc. All of this should be done by a suitable tool like GH CLI. We should later grill which actions we actually want to support and how it will work.

- We will have many views for GitHub stuff, like a view of issues assigned to me from which I can quickly start the workflow of creating a worktree, grilling if it's an HILT issue or execution if AFK. There will be a view for PRs which are active or closed, with their state and actions we can do with them right now. For example, one layout could be all the currently open PRs below each other. If they are in a mergeable state, definitely show the merge or squash and merge button. If there are conflicts in CI, we should add the resolve CI conflicts automatically. It should also support a log with all actions related to that PR, including the whole agentic session which created that PR, if there is, and maybe a summary of what was done in that session and in the GitHub Actions. We should have full control and visibility into each executed task. We just need to figure out where and how to display all of this information. We should also have a view for quickly being able to determine which worktree is active, which has some work to be done, and which is already fully resolved and can be pruned. Again, these actions should be easily triggerable by buttons. If the worktree is to be pruned, it should have that button right there, and also we should probably have a button to prune all inactive or dead worktrees.  

- We should support quite extensive metrics and statistics about AI usage (tool cals, shell commands, mcp servers called, skills used, tokens consumed and cost by agent, by session, by tool, by project, by PRD, daily, weekly, monthly etc.) codeburn repo should be a great inspiration for this. Statisctics and maybe achievements like You used mp-execute skill 10 times. You resolved 5 HITL issues. You had 3 merge conflicts resolved by an agent, you planted and grew 10 trees. You planted and grew 50 trees.

- Keyboard shortcuts for every action wherever practival. Shortcuts in tooltips or next to action. Settings to assign custom shortcuts.

- If we are assigning colors to each issue, they should not be gray, because gray is reserved for some disabled states and usually is a bad UI, especially around text like inside VS code. We can take the issue color palette that we have in obsidian plugin but remove all gray colors

- In the app, we should give the user also quick access to AI agent memories, instructions (AGENTS.md, CLAUDE.md), skills, hooks, rules, mcp servers etc. There should be an overview of each of these with a button to open that file or folder to tweak these. It should also have an "Open in editor" button like in VS Code or the default app for editing text on that platform. For skills and any file with front matter, we should also display that in the UI directly in the app, like a quick summary for those skills, agents, etc. This should be a separate page like AI settings or provider settings with multiple tabs for each of these categories. It should find all locations like user folder, project folder, .claude folders etc. For memories which are gathered from multiple locations, we should also display something like a tree of discoverability. For example, memory number 1 is discovered from the project folder, memory number 2 is discovered from the user folder, memory number 3 is discovered from the .claude folder. Or maybe a view to see all memories with information on the side from where the memory was gathered.

- We are often converting GitHub issues into worktrees, which then translate into the worktree and branch name. We should be smart about this and remove any filler words like conventional commit which often appears there. The branch and worktree name should only include the issue number and quick description. It should have a maximum number of words and characters so it's not extremely long. For example 5 words and 50 characters.

- In the Obsidian plugin, I currently have it set up in a way that worktrees from each project in, for example, the mp-projects folder go into the worktrees folder, but that is stupid. Each project should have its own worktrees folder.

- In the app, we should be able to add random ideas or random requirements quickly, so probably Open a quick text box, paste the idea there, and it will be appended to something like RAW_REQUIREMENTS.md.

- We will be controlling some long chats, like, for example, the Claude Code CLI output. Currently, it is sometimes difficult to see what was the latest response, the latest user prompt. The UI should have quick move buttons to these starts of response and/or start of prompt, and maybe anything before the last prompt should be grayed out or have a different style.

- Another issue in Claude Code CLI is that when I get answers from really long grilling sessions or questions, I have to scroll up to see the first question and then scroll down to actually see the input box. This can't happen in the app. We should have a nice chat UI where the input box is always accessible and visible.

- We should deterministically display all sub-agents and/or tools used in this session and not rely on any AI summary. We will probably be parsing JSON output or log from the whole session, so we should have access to all the information.

- We should also have a robust notification system which will trigger some sounds and/or flashing with the app whenever user interaction is required. We can go even further and make all the sounds configurable, and then I would like to use C:\_MP_github_cloned\peon-ping repo to add the funny warcraft sounds from there.

# Grilling

We should use /mp-grill-me skill to come to a common conclusion on any topic that you are uncertain about. Feel free to ask me any question.

# Summary

The point of this whole session is to brainstorm around the ideas, refine some of the requirements in detail especially on a higher level, and divide the future work into PRDs and then create those PRDs as github issues using template from /mp-requirements-to-prd. Each PRD should have a complete list of stuff to explore, take inspiration from, and implement. We should be very specific in that PRD so that during future sessions when we will be grilling requirements for each PRD, we have all the references in one place. You should specifically mention repositories or even specific files from which to take inspiration and where each part might be handled well or what each PRD issue relates to So that each PRD is a full standalone description of tasks to be done in that phase.

At the end, we should also update all our main documentation accordingly, specifically ARCHITECTURE.md, REQUIREMENTS.md, ROADMAP.md, README.md, possibly VOCABULARY.md and if needed, any open github issues
