// The facts of a local `.me` (what `<Me>` provides) read by address: `me://self:read/<path>`. No link, no network, no
// ledger. What it must not do: leak into another `.me`, pretend an object that is not a kernel is one, or turn "nothing
// there" / "not disclosed" into a value.
import assert from 'node:assert/strict';
import ME from 'this.me';
import { readAddress } from '../src/core/session/addressRead';

const fresh = () => new (ME as any)() as any;

async function main() {
  const local = fresh();
  local.bateria(80);
  local.profile.name('Ana');

  const r = await readAddress(local, 'me://self:read/bateria');
  assert.equal(r.status, 'public');
  assert.equal((r as any).value, 80);
  assert.equal((r as any).via, 'self');

  // the same fact under the other name the grammar has for it, and a nested path
  const viaLocal = await readAddress(local, 'me://local:read/profile.name');
  assert.equal(viaLocal.status, 'public');
  assert.equal((viaLocal as any).value, 'Ana');
  const slashed = await readAddress(local, 'me://self:read/profile/name');
  assert.equal((slashed as any).value, 'Ana');

  // it follows the kernel: no copy was taken
  local.bateria(75);
  assert.equal(((await readAddress(local, 'me://self:read/bateria')) as any).value, 75);

  // nothing there is `absent`, not a value
  assert.equal((await readAddress(local, 'me://self:read/nowhere.at.all')).status, 'absent');

  // under a secret scope the owner's kernel reads the value; what is lent is the public view, which does not
  local.wallet['_']('k-secret');
  local.wallet.note('hidden');
  assert.equal(local('wallet.note'), 'hidden', 'the owner still reads it through the kernel itself');
  const secret = await readAddress(local, 'me://self:read/wallet.note');
  assert.equal(secret.status, 'absent');
  assert.ok(!JSON.stringify(secret).includes('hidden'));
  const scope = await readAddress(local, 'me://self:read/wallet');
  assert.ok(!JSON.stringify(scope).includes('hidden') && !JSON.stringify(scope).includes('k-secret'));

  // a fact written after a read is seen by the next one (the view is rebuilt when the kernel changes)
  local.bateria(60);
  assert.equal(((await readAddress(local, 'me://self:read/bateria')) as any).value, 60);
  local.bateria(75);

  // another `.me` is another world
  const other = fresh();
  assert.equal((await readAddress(other, 'me://self:read/bateria')).status, 'absent');
  assert.equal(((await readAddress(local, 'me://self:read/bateria')) as any).value, 75);

  // an object that is only a registry key has no local `.me` to read
  const notKernel = await readAddress({}, 'me://self:read/bateria');
  assert.equal(notKernel.status, 'no_link');
  assert.equal(((await readAddress(null, 'me://self:read/bateria')) as any).status, 'no_link');

  // only reads, here as everywhere
  assert.equal((await readAddress(local, 'me://self:write/bateria')).status, 'invalid_expression');

  console.log('localFacts: ok');
}
main().catch((e) => { console.error(e); process.exit(1); });
