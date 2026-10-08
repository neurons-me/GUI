import{D as B}from"./iframe-q72FflWy.js";import"./preload-helper-Dp1pzeXC.js";const D={title:"Molecules/Code/CodeBlock",component:B,tags:["autodocs"],args:{language:"html",variant:"dark",title:"index.html",showLineNumbers:!1,wrapLongLines:!0,showCopyButton:!0,code:`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>this.GUI</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`}},e={name:"Default"},t={name:"With Title",args:{title:"bootstrap.html"}},n={name:"TypeScript",args:{language:"ts",title:"gui-tools.ts",code:`export const guiToolsLeftSidebarConfig = {
  initialView: 'rail' as const,
  elements: [
    { type: 'link', props: { label: 'Home', icon: 'home', href: 'https://neurons-me.github.io/' } },
    { type: 'link', props: { label: 'Themes', icon: 'palette', href: 'https://neurons-me.github.io/this.GUI/themes/' } },
  ],
};`}},o={name:"Light Variant",args:{variant:"light",language:"bash",title:"terminal",code:`npm run build
npm run build-storybook`}},a={name:"With Line Numbers",args:{showLineNumbers:!0,language:"json",title:"package.json",code:`{
  "name": "this.gui",
  "version": "1.0.0",
  "private": false
}`}},r={name:"No Copy Button",args:{showCopyButton:!1}},s={name:"Wrap Long Lines",args:{wrapLongLines:!0,language:"txt",title:"notes.txt",code:"This is a very long line intended to demonstrate wrapping behavior in CodeBlock. If wrapping is enabled, it should continue on the next visual line instead of forcing horizontal scrolling forever."}},I=["Default","WithTitle","TypeScript","LightVariant","WithLineNumbers","NoCopyButton","WrapLongLines"];var i,l,p;e.parameters={...e.parameters,docs:{...(i=e.parameters)==null?void 0:i.docs,source:{originalSource:`{
  name: 'Default'
}`,...(p=(l=e.parameters)==null?void 0:l.docs)==null?void 0:p.source}}};var c,m,u;t.parameters={...t.parameters,docs:{...(c=t.parameters)==null?void 0:c.docs,source:{originalSource:`{
  name: 'With Title',
  args: {
    title: 'bootstrap.html'
  }
}`,...(u=(m=t.parameters)==null?void 0:m.docs)==null?void 0:u.source}}};var g,d,h;n.parameters={...n.parameters,docs:{...(g=n.parameters)==null?void 0:g.docs,source:{originalSource:`{
  name: 'TypeScript',
  args: {
    language: 'ts',
    title: 'gui-tools.ts',
    code: \`export const guiToolsLeftSidebarConfig = {
  initialView: 'rail' as const,
  elements: [
    { type: 'link', props: { label: 'Home', icon: 'home', href: 'https://neurons-me.github.io/' } },
    { type: 'link', props: { label: 'Themes', icon: 'palette', href: 'https://neurons-me.github.io/this.GUI/themes/' } },
  ],
};\`
  }
}`,...(h=(d=n.parameters)==null?void 0:d.docs)==null?void 0:h.source}}};var b,f,L;o.parameters={...o.parameters,docs:{...(b=o.parameters)==null?void 0:b.docs,source:{originalSource:`{
  name: 'Light Variant',
  args: {
    variant: 'light',
    language: 'bash',
    title: 'terminal',
    code: \`npm run build
npm run build-storybook\`
  }
}`,...(L=(f=o.parameters)==null?void 0:f.docs)==null?void 0:L.source}}};var y,v,w;a.parameters={...a.parameters,docs:{...(y=a.parameters)==null?void 0:y.docs,source:{originalSource:`{
  name: 'With Line Numbers',
  args: {
    showLineNumbers: true,
    language: 'json',
    title: 'package.json',
    code: \`{
  "name": "this.gui",
  "version": "1.0.0",
  "private": false
}\`
  }
}`,...(w=(v=a.parameters)==null?void 0:v.docs)==null?void 0:w.source}}};var T,C,k;r.parameters={...r.parameters,docs:{...(T=r.parameters)==null?void 0:T.docs,source:{originalSource:`{
  name: 'No Copy Button',
  args: {
    showCopyButton: false
  }
}`,...(k=(C=r.parameters)==null?void 0:C.docs)==null?void 0:k.source}}};var S,W,x;s.parameters={...s.parameters,docs:{...(S=s.parameters)==null?void 0:S.docs,source:{originalSource:`{
  name: 'Wrap Long Lines',
  args: {
    wrapLongLines: true,
    language: 'txt',
    title: 'notes.txt',
    code: \`This is a very long line intended to demonstrate wrapping behavior in CodeBlock. If wrapping is enabled, it should continue on the next visual line instead of forcing horizontal scrolling forever.\`
  }
}`,...(x=(W=s.parameters)==null?void 0:W.docs)==null?void 0:x.source}}};export{e as Default,o as LightVariant,r as NoCopyButton,n as TypeScript,a as WithLineNumbers,t as WithTitle,s as WrapLongLines,I as __namedExportsOrder,D as default};
