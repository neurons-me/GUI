// The disposable monad the Cleaker stories that really claim, recover and sign in run against. Never a real gateway:
// start one with disposable infrastructure (temp state, this port, this root, nothing registered anywhere), e.g.
//   SEED=<random> ME_STATE_DIR=<scratch> PORT=18322 MONAD_SELF_IDENTITY=disposable-test.local \
//   MONAD_NETGET_DISABLED=1 npx tsx server.ts          (from modules/monad/Typescript)
export const DISPOSABLE_ORIGIN = "http://127.0.0.1:18322";
export const DISPOSABLE_ROOT_LABEL = "disposable-test.local";
