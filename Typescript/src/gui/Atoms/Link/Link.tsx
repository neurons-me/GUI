import { forwardRef } from 'react';
import { Link as MuiLink, LinkProps as MuiLinkProps } from '@mui/material';
import { Link as RouterLink, useInRouterContext } from 'react-router-dom';
import type { LinkProps as RouterLinkProps } from 'react-router-dom';

type GuiLinkProps = MuiLinkProps & { to?: RouterLinkProps['to'] };

/**
 * Safe Link wrapper for MUI + React Router
 */
const Link = forwardRef<HTMLAnchorElement, GuiLinkProps>(function Link(props, ref) {
  const { to, ...rest } = props;
  const inRouterContext = useInRouterContext();

  if (!to) return <MuiLink ref={ref} {...rest} />;

  if (!inRouterContext) {
    const href = typeof to === 'string' ? to : undefined;
    return <MuiLink href={href} ref={ref} {...rest} />;
  }

  // RouterLink is imported statically (this file already imports react-router-dom). It used to be a React.lazy created
  // during render: a NEW component on every render, so it suspended again each time. Under React Router 7 every
  // navigation is a transition, and a transition that keeps suspending never commits: with one of these on the page,
  // no navigation in the whole app ever rendered its new route (the URL changed, the page did not).
  return <MuiLink component={RouterLink} to={to} ref={ref} {...rest} />;
});

export default Link;
export type { GuiLinkProps as LinkProps };