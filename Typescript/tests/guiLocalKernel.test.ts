import assert from 'node:assert/strict';
import ME from 'this.me';
import { explainWithLocalKernel, getGuiLocalKernel, isGuiPath, setGuiLocalKernel } from '../src/runtime/guiLocalKernel';

async function main() {
  const me: any = new ME();
  me.GUI.window.location('http://localhost:5177');
  me.GUI.theme.id('seafoam');
  me.GUI.theme.mode('dark');
  me.other.thing(1);

  assert.equal(isGuiPath('GUI'), true);
  assert.equal(isGuiPath('GUI.theme.mode'), true);
  assert.equal(isGuiPath('GUIDE.x'), false);
  assert.equal(isGuiPath('users.jabellae'), false);

  // A leaf: the kernel's own answer.
  const leaf = await explainWithLocalKernel(me, 'GUI.theme.mode');
  assert.equal(leaf?.payload.value, 'dark');

  // A branch has no value of its own; what is written below it is its value.
  const root = await explainWithLocalKernel(me, 'GUI');
  assert.deepEqual(root?.payload.value, { window: { location: 'http://localhost:5177' }, theme: { id: 'seafoam', mode: 'dark' } });
  assert.deepEqual([...root!.payload.meta.leaves].sort(), ['GUI.theme.id', 'GUI.theme.mode', 'GUI.window.location']);
  const theme = await explainWithLocalKernel(me, 'GUI.theme');
  assert.deepEqual(theme?.payload.value, { id: 'seafoam', mode: 'dark' });

  // Not this kernel's business -> the caller asks the monad.
  assert.equal(await explainWithLocalKernel(me, 'users.jabellae'), null);
  assert.equal(await explainWithLocalKernel(me, 'other.thing'), null);
  assert.equal(await explainWithLocalKernel(null, 'GUI'), null);
  // A GUI branch with nothing written under it: nothing to say either.
  const empty: any = new ME();
  assert.equal(await explainWithLocalKernel(empty, 'GUI'), null);

  // The owner's kernel would hand back what is under a secret scope; Explain does not.
  me.GUI.vault['_']('k');
  me.GUI.vault.token('s3cret');
  const withSecret = await explainWithLocalKernel(me, 'GUI');
  assert.equal(JSON.stringify(withSecret).includes('s3cret'), false);
  assert.equal(JSON.stringify(withSecret?.payload.value).includes('vault'), false);
  for (const closed of ['GUI.vault', 'GUI.vault.token']) {
    const r = await explainWithLocalKernel(me, closed);
    assert.equal(r?.payload.value, null);
    assert.equal(r?.payload.meta.disclosure, 'closed');
    assert.equal(JSON.stringify(r).includes('s3cret'), false);
  }

  // Registry: set, get, clear only if still current.
  setGuiLocalKernel(me);
  assert.equal(getGuiLocalKernel(), me);
  const other: any = {};
  setGuiLocalKernel(null, other); // an older session's cleanup must not clear this one
  assert.equal(getGuiLocalKernel(), me);
  setGuiLocalKernel(null, me);
  assert.equal(getGuiLocalKernel(), null);

  console.log('guiLocalKernel.test.ts: all assertions passed');
}
main();
