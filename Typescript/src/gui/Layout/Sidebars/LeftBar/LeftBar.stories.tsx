import { StoryFn } from "@storybook/react";
import React from "react";
import Layout from "@/gui/Layout/Layout";
import { expect, userEvent, waitFor, within } from "storybook/test";

export default {
  title: "Getting Started/Layout/LeftBar",
  component: Layout,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
`The **LeftBar** is the left navigation bar.

## What it expects
- \`elements\`: main items shown in the sidebar.
- \`footerElements\`: optional items shown at the bottom.
- \`initialView\`: \`rail\` or \`expanded\`.
- \`header\`: optional title or icon shown at the top.
- \`brand\`: the app's mark (a logo, a QR) leading the header. Wrap it in a link and it navigates; it never expands the bar.

## Item types
- \`link\`: navigation item.
- \`menu\`: item with nested options.
- \`action\`: clickable action.

## Basic shape
~~~tsx
<LeftBar
  initialView="rail"
  header={{ title: 'Workspace', icon: 'apps' }}
  elements={[
    { type: 'link', props: { label: 'Dashboard', icon: 'dashboard' } },
    {
      type: 'menu',
      props: {
        label: 'Projects',
        icon: 'folder',
        items: [
          { label: 'Project A', icon: 'work' },
        ],
      },
    },
  ]}
  footerElements={[
    { type: 'link', props: { label: 'Settings', icon: 'settings' } },
    { type: 'action', props: { label: 'Help', icon: 'help' } },
  ]}
/>
~~~

## Views
- \`rail\`: compact icon view.
- \`expanded\`: full view with labels.
`,
      },
    },
  },
};

const Template: StoryFn<React.ComponentProps<typeof Layout>> = (args) => (
  <Layout {...args} />
);

export const RailView = Template.bind({});
RailView.args = {
  LeftBar: {
    initialView: "rail",
    header: { title: "Workspace", icon: "apps", iconColor: "var(--gui-primary)" },
    elements: [
      { type: "link", props: { label: "Dashboard", icon: "dashboard", iconColor: "var(--gui-primary)" } },
      { type: "link", props: { label: "Analytics", icon: "bar_chart", iconColor: "var(--gui-secondary)" } },
      {
        type: "menu",
        props: {
          label: "Projects",
          icon: "folder",
          iconColor: "var(--gui-warning)",
          items: [
            { label: "Project A", icon: "work", iconColor: "var(--gui-success)" },
            { label: "Project B", icon: "assignment", iconColor: "var(--gui-info)" },
          ],
        },
      },
    ],
    footerElements: [
      { type: "link", props: { label: "Settings", icon: "settings", iconColor: "var(--gui-primary)" } },
      { type: "action", props: { label: "Help", icon: "help", iconColor: "var(--gui-success)" } },
    ],
  },
};

export const ExpandedView = Template.bind({});
ExpandedView.args = {
  LeftBar: {
    ...(RailView.args?.LeftBar && typeof RailView.args.LeftBar === 'object' ? RailView.args.LeftBar : {}),
    initialView: "expanded",
  },
};

// The app's mark leads the header and is its own link; the bar's arrow is a separate control on the bar's right border.
// Each does one thing: the brand navigates without expanding, the arrow expands without navigating. The link counts its
// own activations (and cancels the navigation) so the check never has to move the test page's URL.
let brandActivations = 0;
export const WithBrand = Template.bind({});
WithBrand.args = {
  LeftBar: {
    ...(RailView.args?.LeftBar && typeof RailView.args.LeftBar === 'object' ? RailView.args.LeftBar : {}),
    initialView: "rail",
    brand: (
      <a
        href="/brand-home"
        aria-label="Open the app home"
        onClick={(e) => { e.preventDefault(); brandActivations += 1; }}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", color: "inherit", textDecoration: "none", fontWeight: 700 }}
      >
        FT
      </a>
    ),
  },
};
WithBrand.play = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement);
  const user = userEvent.setup();
  brandActivations = 0;

  const brand = await canvas.findByRole("link", { name: "Open the app home" });
  const arrow = await canvas.findByRole("button", { name: "Expand sidebar" });
  // Two separate controls. The arrow is a tab INSIDE the bar, flush with its right border: nothing of it is outside the bar,
  // so it can never cover what sits beside the bar (the top bar's location label starts a few pixels past the border).
  expect(brand.contains(arrow)).toBe(false);
  const bar = canvasElement.querySelector("aside.LeftSidebar") as HTMLElement;
  const barRight = bar.getBoundingClientRect().right;
  const arrowRect = arrow.getBoundingClientRect();
  expect(arrowRect.right).toBeLessThanOrEqual(barRight + 0.5);
  expect(arrowRect.right).toBeGreaterThanOrEqual(barRight - 1.5);
  // The target is the tab plus a pixel and as tall as the header; what is drawn in it is a tall tab (19px wide, more than twice as tall).
  const headerRect = (canvasElement.querySelector('aside.LeftSidebar header') as HTMLElement).getBoundingClientRect();
  expect(arrowRect.width).toBeGreaterThanOrEqual(19);
  expect(arrowRect.width).toBeLessThanOrEqual(22);
  expect(arrowRect.height).toBeGreaterThanOrEqual(headerRect.height - 1);
  const tabRect = (arrow.querySelector(".gui-edge-handle") as HTMLElement).getBoundingClientRect();
  expect(tabRect.width).toBeGreaterThanOrEqual(18);
  expect(tabRect.width).toBeLessThanOrEqual(20);
  expect(tabRect.height).toBeGreaterThan(tabRect.width * 2);
  expect(tabRect.height).toBeLessThanOrEqual(headerRect.height);
  expect(tabRect.right).toBeLessThanOrEqual(barRight + 0.5);

  // The brand navigates and leaves the bar a rail.
  await user.click(brand);
  expect(brandActivations).toBe(1);
  expect(canvas.queryByRole("button", { name: "Collapse sidebar" })).toBeNull();
  expect(canvas.getByRole("button", { name: "Expand sidebar" })).toHaveAttribute("aria-expanded", "false");

  // The arrow expands the bar and does not activate the brand.
  await user.click(arrow);
  await waitFor(() => expect(canvas.getByRole("button", { name: "Collapse sidebar" })).toHaveAttribute("aria-expanded", "true"));
  expect(brandActivations).toBe(1);

  // Expanded: the header's text stops before the tab, and the header's own icon is not drawn next to the brand (one mark).
  const expandedHeader = canvasElement.querySelector("aside.LeftSidebar header") as HTMLElement;
  const expandedTab = (canvas.getByRole("button", { name: "Collapse sidebar" }).querySelector(".gui-edge-handle") as HTMLElement).getBoundingClientRect();
  const title = within(expandedHeader).getByText("Workspace").getBoundingClientRect();
  expect(title.right).toBeLessThanOrEqual(expandedTab.left);
  expect(within(expandedHeader).queryByText("apps")).toBeNull();

  // The brand is still the same link in the expanded bar and still only navigates.
  await user.click(canvas.getByRole("link", { name: "Open the app home" }));
  expect(brandActivations).toBe(2);
  expect(canvas.getByRole("button", { name: "Collapse sidebar" })).toBeInTheDocument();

  // Keyboard: Enter and Space on the arrow collapse and expand it again without activating the brand; Enter on the brand does.
  canvas.getByRole("button", { name: "Collapse sidebar" }).focus();
  await user.keyboard("{Enter}");
  await waitFor(() => expect(canvas.getByRole("button", { name: "Expand sidebar" })).toBeInTheDocument());
  canvas.getByRole("button", { name: "Expand sidebar" }).focus();
  await user.keyboard(" ");
  await waitFor(() => expect(canvas.getByRole("button", { name: "Collapse sidebar" })).toBeInTheDocument());
  expect(brandActivations).toBe(2);
  canvas.getByRole("link", { name: "Open the app home" }).focus();
  await user.keyboard("{Enter}");
  expect(brandActivations).toBe(3);
  expect(canvas.getByRole("button", { name: "Collapse sidebar" })).toBeInTheDocument();
};
