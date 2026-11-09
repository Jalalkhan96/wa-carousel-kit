'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const C = require('../index');

test('card factory + mediaKind detection', () => {
  const c = C.card({ title: 'T', desc: 'D', image: 'https://x.dev/a.jpg' });
  assert.strictEqual(c.title, 'T');
  assert.strictEqual(C.mediaKind('https://x.dev/a.jpg'), 'image');
  assert.strictEqual(C.mediaKind('https://x.dev/a.gif'), 'video');
  assert.strictEqual(C.mediaKind('https://x.dev/a.mp4'), 'video');
  assert.strictEqual(C.mediaKind(Buffer.from('x')), 'image');
  assert.strictEqual(C.mediaKind(null), null);
  assert.throws(() => C.card({}), /title or desc/);
});

test('buildCarouselMessage builds cards with buttons + biz node', () => {
  const { message, additionalNodes } = C.buildCarouselMessage({
    body: 'Swipe!',
    cards: [
      C.card({ title: 'One', desc: 'first', buttons: [C.quickReply('Open 1', 'open_1')] }),
      C.card({ title: 'Two', desc: 'second', buttons: [C.urlBtn('Site', 'https://x.dev')] }),
    ],
  });
  const cm = message.interactiveMessage.carouselMessage;
  assert.strictEqual(cm.cards.length, 2);
  assert.strictEqual(cm.cards[0].body.text, 'One');
  assert.strictEqual(cm.cards[0].nativeFlowMessage.buttons[0].name, 'quick_reply');
  assert.strictEqual(additionalNodes[0].tag, 'biz');
});

test('prepared headers attach media to cards', () => {
  const { message } = C.buildCarouselMessage({
    cards: [C.card({ title: 'Pic' })],
    headers: [{ imageMessage: { url: 'mmg' } }],
  });
  const h = message.interactiveMessage.carouselMessage.cards[0].header;
  assert.strictEqual(h.hasMediaAttachment, true);
  assert.ok(h.imageMessage);
});

test('carousel limits: 0 and 11 cards rejected', () => {
  assert.throws(() => C.buildCarouselMessage({ cards: [] }), /at least one/);
  const many = Array.from({ length: 11 }, (_, i) => C.card({ title: 'C' + i }));
  assert.throws(() => C.buildCarouselMessage({ cards: many }), /at most 10/);
});

test('MENU10 preset: 10 slides, namespaced button ids round-trip', () => {
  assert.strictEqual(C.MENU10.length, 10);
  const keys = C.MENU10.map(s => s.key);
  assert.deepStrictEqual(keys, ['group', 'all', 'owner', 'download', 'social', 'ai', 'media', 'fun', 'tools', 'info']);
  const cards = C.menuCards({ ai: 'https://x.dev/ai.mp4' });
  assert.strictEqual(cards.length, 10);
  const aiBtn = JSON.parse(cards[5].buttons[0].buttonParamsJson);
  assert.strictEqual(aiBtn.id, 'menu:-aimenu');
  assert.strictEqual(C.commandForButtonId(aiBtn.id), '-aimenu');
  assert.strictEqual(C.commandForButtonId('plain-text'), null);
  assert.strictEqual(C.commandForButtonId(null), null);
});

test('fallbackChain falls through failures to the first success', async () => {
  const order = [];
  const out = await C.fallbackChain([
    async () => { order.push(1); throw new Error('carousel unsupported'); },
    async () => { order.push(2); return 'buttons-ok'; },
    async () => { order.push(3); return 'text-ok'; },
  ]);
  assert.strictEqual(out, 'buttons-ok');
  assert.deepStrictEqual(order, [1, 2]);
  await assert.rejects(() => C.fallbackChain([async () => { throw new Error('nope'); }]), /nope/);
});

test('textMenu renders numbered fallback', () => {
  const text = C.textMenu({ body: 'Menu', cards: [C.card({ title: 'A', desc: 'alpha' }), C.card({ title: 'B' })] });
  assert.match(text, /Menu/);
  assert.match(text, /1\. A — alpha/);
  assert.match(text, /2\. B/);
});

test('sendSlider is an alias of sendCarousel', () => {
  assert.strictEqual(C.sendSlider, C.sendCarousel);
});
