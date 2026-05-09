I like variant A and mostly E.
Let's make Assigned Issues a separate tab under the bottom panel of the workspace dashboard. What I like about option E:

- The tab has a small badge showing how many issues are suitable for linking. Suitable for linking means that the issue is assigned to me And is not closed or already linked in Grovekeeper I think we don't need anything like deleted. An issue can be either linked or unlinked in Grovekeeper. We can show already linked issues. Exactly as you displayed in the variant E, aka they will be dimmed. However, we don't need to see repository or status of that issue, so let's remove repo and status columns. All assigned issues will be already filtered by the repository, because they are only displayed in the workspace, and one workspace is always one GitHub repository. The status will be obvious because of the categories unlinked or linked. I like the option for selecting multiple issues and choosing some batch actions, like quick add selected issues with worktree or quick add selected. There is a great idea: let's have the checkboxes on the left and a selection bar similar to the one we already have in the issues tab of the workspace dashboard. However, we should also add the global checkbox to unselect or select all items, basically a standard behavior with three states: checked, unchecked, and Indeterminate.
- I definitely want to see the issue number and issue name in full if possible. I would like to see a PRD number. It should probably be a separate column before the issue number or maybe after it. Both the issue number and PRD number should be clickable with links to the respective GitHub issues.
- I definitely like seeing all the GitHub labels. Feel free to display as many of them as possible, and let's prioritize afk or hitl tags, then design needed and then everything else.
- We should use a table-like component for the list with sorting and filtering available, especially because of the PRD or issue numbers and filtering for labels. However, there's probably no reason not to support filtering and sorting for all available columns.
- In the rightmost position, we should have the quick actions for each issue: quick add to workspace and quick add to worktree. Similar to what we have in design variant A. These should be pinned to the right side of the table and always visible.

- We have a section of already linked. It's probably easier to make the selection of multiple issues common for both of these sections, linked and unlinked, and contextually filter out issues when we do batch actions that don't apply to the other category. For example, if I already have a few linked issues and I select two of them and then select two unlinked issues, pressing the quick add selected with worktree should only apply to the unlinked issues.

- We should definitely have a refresh button available for this page. I think we are creating something like a refresh indicator, so please take a look at what state it is in and feel free to use it if it's already done. Basically, we should be able to see when these data were last refreshed and maybe have some sort of polling so that we know when new data are available. However, we should also not abuse the GitHub API or whatever we're using for fetching that data.

- We should show as many issues as possible according to the filters and/or sorting. However, if it affects performance or if it requires more API calls or something like that, let's be aware of that and design this smartly. I would be fine with something like a "Load more" button or automatic loading after scrolling if it's really necessary. Otherwise, if it's fine, I would like to fetch up to 50 issues.

There are some circular dots between the checkbox and the issue number in the design variant-e.html. I would like these to be removed. I don't see any value in these circular dots.

The unlinked and linked section could be collapsible so that we can quickly hide the one that we don't want to see. Maybe already linked could be collapsed by default.

Clicking anywhere in the row except for the checkbox, issue or PRD numbers, and the title should result in selection of the row. Please investigate what table components we have available for Svelte. Prefer using shadcn-Svelte if available.

We should also introduce search bar so that we can filter the issues with full text search

We probably want to support Ctrl+A or Cmd+A to select all when there is focus in this tab.

Let's ditch the footer displayed in the variant E. We are not going to use the footer. This will be part of the bottom panel of the workspace dashboard, which currently doesn't have any footer.

Let's refine Variant E based on these suggestions. Let's see what components can be used, how to integrate the select selection bar, what component to use for the table, how to add a count badge inside the tabs switcher, and maybe we are getting a bit crowded in the tabs switcher, so for narrower sides we might consider creating something like automatic truncating of the last buttons on the narrower pages for that tab switcher.

From variant A, we probably only took the search input for filtering issues based on text and the action buttons at the end of the line of each issue line.
