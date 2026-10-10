import * as React from 'react';
import type { AddressRead, AddressReadOptions } from '@/core/session/addressRead';
import { useOptionalSeedSessionContext } from './SeedSessionProvider';

/**
 * An address read as state: `useAddress('me://self:read/bateria')`. It is `null` until the first answer (and when there
 * is no session provider above), then one of the `AddressRead` states, and it reads again when the local fact changes.
 *
 * `self` addresses follow the local `.me` through its runtime (writes made through `useMeAction` / `runtime.action`, or
 * announced with `runtime.notify()`; a value assigned straight onto the kernel is not noticed). An address in a ledger
 * is read once per change of the expression and is not pushed.
 */
export function useAddress(expression: string, options: Pick<AddressReadOptions, 'via'> = {}): AddressRead | null {
  const session = useOptionalSeedSessionContext();
  const readAddress = session?.readAddress;
  const subscribeAddress = session?.subscribeAddress;
  const [result, setResult] = React.useState<AddressRead | null>(null);
  const via = options.via ?? null;

  React.useEffect(() => {
    if (!readAddress || !subscribeAddress || !String(expression || '').trim()) {
      setResult(null);
      return undefined;
    }
    let alive = true;
    let turn = 0;
    const read = () => {
      const mine = ++turn;
      void readAddress(expression, via ? { via } : {}).then((next) => {
        if (alive && mine === turn) setResult(next);
      });
    };
    read();
    const subscription = subscribeAddress(expression, read);
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, [readAddress, subscribeAddress, expression, via]);

  return result;
}
