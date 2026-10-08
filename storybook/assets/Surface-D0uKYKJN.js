import{i as c,a as v,j as m,z as t}from"./iframe-q72FflWy.js";import{P as f}from"./Paper-C4cHEfmg.js";const n=c.forwardRef((l,i)=>{const{variant:a="default",color:b,elevation:s,sx:r,...d}=l,e=v(),o=a==="default"||a==="elevation"?"solid":a==="outlined"?"outline":a,u=o==="outline"?"outlined":"elevation",p=()=>{switch(o){case"outline":return{border:`1px solid ${e.palette.divider}`};case"glass":return{backgroundColor:t(e.palette.background.paper,.6),backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",border:`1px solid ${t(e.palette.divider,.6)}`,boxShadow:"none","@supports not (backdrop-filter: blur(12px))":{backgroundColor:t(e.palette.background.paper,.9)}};case"card":return{backgroundColor:e.palette.background.paper,borderRadius:e.shape.borderRadius,boxShadow:e.shadows[2]};case"solid":return{backgroundColor:e.palette.background.paper};default:return{}}};return m.jsx(f,{ref:i,variant:u,elevation:s,sx:[p(),...Array.isArray(r)?r:r?[r]:[]],...d})});n.displayName="Surface";n.__docgenInfo={description:`Surface
-------
A visual container primitive.
Acts as a thin wrapper around MUI's Paper.
Supports elevation, variant, square, and sx overrides.`,methods:[],displayName:"Surface",props:{variant:{required:!1,tsType:{name:"union",raw:`| 'default'
| 'elevation'
| 'solid'
| 'outline'
| 'outlined'
| 'glass'
| 'card'`,elements:[{name:"literal",value:"'default'"},{name:"literal",value:"'elevation'"},{name:"literal",value:"'solid'"},{name:"literal",value:"'outline'"},{name:"literal",value:"'outlined'"},{name:"literal",value:"'glass'"},{name:"literal",value:"'card'"}]},description:"Visual style for the surface.\n`default`/`elevation` map to the standard solid paper surface."},color:{required:!1,tsType:{name:"unknown"},description:""}},composes:["Omit"]};export{n as S};
