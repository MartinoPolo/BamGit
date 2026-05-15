# Round 2 Variant Review — Raw User Feedback (2026-05-15)

Feedback on variants F (Veil), G (Refined Horizon), H (Radiant).

---

Make sure that hover state is defined for each of these mock-up cards. If it's not, then add it so it's clear what happens on hover in each state.
The PRD number in the top-left corner of the card should show only the number and the # symbol, not the PRD text itself. It is clear that it is a PRD.

I am considering that hovering over the PRD number should highlight all the cards under the same PRD, probably with some glow.
The priority badge should be split vertically by the bottom line of the preview view box if it sits at the bottom. Right now it sits completely inside the view box, and I want it to be only half inside.

I also want to add a third priority position option: preview top. In this mode, the priority badge would sit at the top, similar to the bottom one, and be split in half by the top border of the preview view box.

Commentary to each specific variant:
F: In the template image from another designer, the header color was actually quite light with dark text. [Image #6] This seems like a more suitable option for this variant. If possible, I'd like a slider that determines how far the gradient stretches toward the issue card so I can tweak it. For this option, I provided an example with a yellow header. If a darker color is selected, the text might be white in dark mode for this variant. The text should be automatically determined and always visible, and both dark and light colors should still be available for this variant. The PRD numbers are so gray they are basically not visible. They should match the title text color, maybe a bit dimmed but not as much as they are now. In all variants the buttons in the top right corner should be ghost buttons without background by default. The default background should be transparent and only appear on hover. If this is a conflict with the design brief or any resource used, please fix it in the document. The first line of the right part of the shoe card should not span across two lines. Please shorten the worktree name. It will never have structured nested content, so remove the group: grovekeeper-worktrees from the worktree name and refactor/ from the branch name. Then make sure that the text truncates rather than wrapping to multiple lines. The badge on that same line, like conflict or sync, should be right-aligned, pinned to the right side.

For all variants we should remove the executing session overlay. This will not be indicated by any glow. We should keep the error and HITL glows. These are good. The HITL might be called Needs Attention or Needs Input.
The adopt button should not have a plus icon on the left, which it currently has in variant G.
I previously said that when there is a colorized GitHub label in an assigned issue card, it should colorize the card itself. I don't see it currently. Maybe it's because The colorization of the background is maybe too subtle. I would especially want to see how it looks with the design needed orange tint. The switcher for priority position should also work for the assigned issues. We also have a case where we are displaying a blend or combination of two colorizing tags, and they should not be blue-green but blue-orange. The design needs a label (and maybe an import label) so I can see how the blue and orange tint blend in that case. In the previous requirement badge, I mentioned that I liked the style for a done issue: a transparent background with no borders. That way it doesn't even look like a card, and it feels kind of magical to me. I'd like to add this state for these variants as well. It can get an outline or border and some background on hover, but the default "done" state should look very abandoned. [Image #7]

G: Except for the PRD number not being visible in some cases, this is the most mature implementation. Trim down the worktree and branch names so they are on the same line, and correctly add that priority positioning to issue cards and slightly more visible tint based on colorizing github labels. We might be good to go with this one.

H: I think the issue with this implementation is the preview box content. The trees inside look weird, and the gradient they get isn't very nice. I'd like to implement something like an invariant line and tone down the content in the preview view box, since it feels too eye-catching right now. The buttons in the top right corner are weirdly small. We should be consistent about this and actually use button components we have, which have a standard size.

Based on this review, we should update the design brief and the issue card requirements. Let's save this prompt as raw content in the document next to them so we can always refer back to my raw requirements. Also I think that I already stated some of them in the previous raw prompting and they weren't met so please check that you actually understand my requirements. /mp-grill about Anything you need to clarify right now or any conflict that you see.

## Reference Images

- Image #6: Card with amber/yellow header — lighter header bg with dark text, ghost icon buttons, square preview, clean single-line worktree/branch
- Image #7: Done/archived card — transparent bg, no visible borders, all content heavily faded/muted, "Restore" button instead of normal actions. This is the desired default done state appearance.
