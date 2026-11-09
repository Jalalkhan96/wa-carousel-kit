<div align="center">

# 🎠 wa-carousel-kit

**Swipeable WhatsApp carousels ("sliders") for Baileys bots — cards, media, a ready 10-slide menu, and fallbacks.**

[![npm version](https://img.shields.io/npm/v/wa-carousel-kit.svg)](https://www.npmjs.com/package/wa-carousel-kit)
[![license](https://img.shields.io/npm/l/wa-carousel-kit.svg)](./LICENSE)

Made by **[TEAM ABIX](https://github.com/Jalalkhan96)**

</div>

---

## 📥 Install

```bash
npm install wa-carousel-kit
```

## 🚀 Quick start

```javascript
const C = require('wa-carousel-kit');

await C.sendCarousel(sock, jid, {
  body: '🔥 Top picks — swipe!',
  footer: 'My Bot',
  cards: [
    C.card({ title: 'Item 1', desc: 'best quality', image: 'https://x.dev/1.jpg',
             buttons: [C.quickReply('📥 Get', 'get_1'), C.urlBtn('🌐 Open', 'https://x.dev/1')] }),
    C.card({ title: 'Item 2', desc: 'new', video: 'https://x.dev/2.mp4',
             buttons: [C.quickReply('📥 Get', 'get_2')] }),
  ],
});
```

Card media can be a URL, a `{ url }` object or a Buffer. `.gif` / `.mp4`
cards are sent as video (GIFs with `gifPlayback`), images as images,
missing media degrades to a text-only card.

## 🤖 Ready-made 10-slide bot menu

The menu style proven in production bots — Group, All, Owner, Download,
Social, AI, Media, Fun, Tools, Information:

```javascript
await C.sendMenu10(sock, jid, {
  mediaMap: { group: 'https://x.dev/group.mp4', ai: 'https://x.dev/ai.jpg' },
});

// a tap comes back as button id "menu:-gcmenu" — map it to the command:
const cmd = C.commandForButtonId(tapId);   // '-gcmenu' → run it like a typed command
```

## 🛟 Fallback chain

Some clients can't render carousels. Degrade in order, automatically:

```javascript
await C.fallbackChain([
  () => C.sendCarousel(sock, jid, opts),
  () => sock.sendMessage(jid, { text: C.textMenu(opts) }),
]);
```

## 📖 API

- `card({ title, desc, image?, video?, buttons? })`
- `buildCarouselMessage({ body, footer, cards, headers? })` — pure builder, no Baileys needed
- `sendCarousel(sock, jid, opts)` / `sendSlider(...)` — uploads media + relays
- `MENU10`, `menuCards(mediaMap)`, `sendMenu10(sock, jid, opts)`
- `buttonIdFor(command)` / `commandForButtonId(id)` — `menu:` namespacing
- `fallbackChain(steps)`, `textMenu(opts)`, `mediaKind(value)`, `bizNode()`

**Limits enforced:** 1–10 cards (WhatsApp's own carousel limit).

## License

MIT © TEAM ABIX
