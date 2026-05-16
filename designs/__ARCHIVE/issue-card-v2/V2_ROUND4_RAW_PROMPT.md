# Round 4 Variant Review — Raw User Feedback (2026-05-15)

Final fixes before spec finalization.

---

PRD number should also be a clickable link which opens the PRD github issue.

Make sure the style B badge looks the same across all variants as it does in variant F. In other words, it should have no border and affect both the priority and the state badge. In variants G and H, these rules are not being met correctly.

Can you increase the color saturation even more on Variant F? Even at 100%, I would still like the header to be a bit brighter. If that is not possible, it is okay. Just tell me.

Variant G and H: The header color for "Design needed" in assigned issues is not orange enough and is more green. I would like an orange-blue color when both "Design needed" and "Import" are present as GitHub labels. [Image #17] And orange only header for a case where only design needed is present.

Looking at variant G, I changed my mind about the priority badge for style B not having a border. I would like this to be a third badge variant, style C, which looks like style B in variant G. We will have three styles:
- Style A: The original one
- Style B: The style corresponding to style B in variant F (no border, dark bg + colored text)
- Style C: Variant G's current style B (dark bg + colored text + border)

Implement these requirements and we will have three complete variants. We will finalize the requirements and proceed with a complete specification of all states, including all light mode states. First, let's record the decisions, update the docs, and update the current mockups.

One more thing: when I hover over the PRD, all PRD issues should be highlighted. We chose a ring-style highlight that should appear on all issues for that PRD, including the one being hovered over.

This is currently broken in variant F, where only the other issues are highlighted with the ring. The ring should have a slightly larger offset and a slightly larger size so it's visible even on selected cards. Increase it by about 25%. Make sure that the highlight with ring works in all variants F, G, and H.

## Reference Images

- Image #17: Ghost card "Migration wizard improvements" with "Design needed" (orange) + "import" (blue) + "migration" (gray) labels. The header has a GREEN tint which is WRONG — should be orange-blue split. Shows the issue with ghost card label colorization in G/H.
