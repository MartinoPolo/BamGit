# Round 3 Variant Review — Raw User Feedback (2026-05-15)

Feedback on regenerated variants F, G, H (round 2). Final polish round.

---

For all variants: We should introduce new positions for the Priority badge:
- At the bottom, fully inside the preview box (like in one of the previous versions)
- At the top, a little bit below the top of the preview box
- At all four corners (top-left, top-right, bottom-left, and bottom-right)
Each position should have a small padding from the borders of the preview box to the Priority badge.

Variant F: I think the header color saturation should also be tweakable with a slider. Right now the colors are too dark, and it doesn't work well with the black text on some cards. I'd like to be able to adjust the gradient range the way we do now, and also adjust the color saturation like we do in Variant G. For the label tint, I'm happy with 20-25%. That would be my goal.

When two colors define the colorization of an assigned issue, they should be two distinct colors, possibly one coming from the left and one from the right, and not blended across the full width.

In cases where we have a design needed and an assigned issue, the issue card should be orange on the left and blue on the right. The colors should come together and blend somewhere in the middle but it should be clear that it comes from orange and blue on the sides.

The more pressing issue is that I would like two variants for the priority badge. I will give you a couple of images showing how the priority badge looks in another design, and we should create a second variant based on those. [Images #10-13] It basically has a darker background with consistent text color representing the level of priority. Similarly we also have the status badges having a similar format, as you can see on the following image. [Image #14] The executing state badge looks amazing in this case. I'm not sure whether it's because it also plays well with the similar-colored background, or if this badge looks good anywhere.

I'm saying this because we need to decide whether the executing badge will always be this green, or if it follows the header color. I think the first option is that each state will have a defined color similar to the priorities.

We need to create a new variant for these badges, maybe for our badge component. I want to see how it looks in the design of issue cards, so please create another toggle or switcher that switches between those variants. The previous thing applies of course for all of the variants that we have: F, G, H.

Variant G: This variant looks really good overall, except for the rings around issues when they're hovered. This is probably because of the PRD. What I actually want is for the ring to appear only when we hover over the PRD number itself, and for it to show which other issues are under that PRD. Another thing worth improving in this version is the header color for the colorized variant in assigned issues. Because of the label color, when there is a "design needed" label, the header should be significantly more orange than it is right now. And again if there are multiple colors like orange and blue because of the labels, the left part of the issue header should be orange and the right part blue.

Variant H: The main problem with this variant is the preview view box. It should not have any gradient. I think it should match the dark color of the background gradient. That way it will look like it's cut out of the background, and it will create a nice glow around it because of the background. Please make the preview box non-transparent and use a dark color. It could have a very subtle gradient, but it definitely shouldn't be transparent and shouldn't follow the radial intensity behind it. Make sure that the z-index on priority badges is set up correctly because currently it is cut out on the borders of the view box.

## Reference Images

- Image #10: "HIGH" badge — dark olive bg, gold/yellow text. Rectangular rounded corners.
- Image #11: "CRITICAL" badge — dark red bg, red/coral text. Rectangular.
- Image #12: "HIGH" badge in header — dark navy bg, blue text. Rectangular. Next to quick-action buttons.
- Image #13: "CRITICAL" badge — dark teal bg, pink/coral text. Larger, prominent.
- Image #14: "EXECUTING" session badge — green dot + green text on dark green/transparent bg. Beautiful integration with green header. Each state has its own defined color.
