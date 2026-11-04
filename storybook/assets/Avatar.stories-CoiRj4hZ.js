import{A as o}from"./Avatar-Dost7fiL.js";import"./Avatar-B3DduiUj.js";import"./iframe-CWBlVoSh.js";import"./preload-helper-Dp1pzeXC.js";import"./createSvgIcon-dmWuGQpH.js";import"./useSlot-JA-NOEOp.js";import"./resolveComponentProps-DrUC3lMZ.js";import"./useForkRef-q9ZWwCIp.js";const u={title:"Atoms/Avatar",component:o,tags:["autodocs"],parameters:{layout:"centered",docs:{description:{component:`
The **Avatar** atom is a wrapper around MUI's \`Avatar\` for displaying user profile pictures, initials, or icons.

---
## Features
- Displays initials, an image, or an icon.
- Supports different variants: \`circular\` (default), \`rounded\`, \`square\`.
- Image avatars can have an \`alt\` text for accessibility.
- Fully themeable and stylable via the \`sx\` prop.

---
## Key Props
- \`children\`: For displaying characters (initials) or an icon.
- \`src\`: The URL of the image to display.
- \`alt\`: Alternative text for the image.
- \`variant?: 'circular' | 'rounded' | 'square'\`.
- \`sx?: object\`: For custom styling.

---
## Basic usage (React)
~~~tsx
import { Avatar, Stack } from '@/gui/atoms';

<Stack spacing={2} direction="row">
  <Avatar>AB</Avatar>
  <Avatar alt="User Name" src="/path/to/image.jpg" />
  <Avatar variant="square">SQ</Avatar>
</Stack>
~~~

---
## Declarative JSON / Config usage
The resolver can instantiate an Avatar from a JSON spec.

~~~json
{
  "type": "Avatar",
  "props": {
    "alt": "User Name",
    "src": "https://i.pravatar.cc/150?img=32"
  }
}
~~~
`}}},argTypes:{variant:{control:{type:"select"},options:["circular","rounded","square"]},alt:{control:"text"},src:{control:"text"},children:{control:"text"}}},a={args:{children:"AB"}};var r,t,e;a.parameters={...a.parameters,docs:{...(r=a.parameters)==null?void 0:r.docs,source:{originalSource:`{
  args: {
    children: 'AB'
  }
}`,...(e=(t=a.parameters)==null?void 0:t.docs)==null?void 0:e.source}}};const v=["Variants"];export{a as Variants,v as __namedExportsOrder,u as default};
