'use strict';
/**
 * wa-carousel-kit — swipeable WhatsApp carousels ("sliders") for Baileys bots.
 *
 * - card() factories + a pure payload builder (testable without Baileys)
 * - sendCarousel() uploads card media through Baileys and relays the message
 * - sendMenu10() ships a ready 10-slide bot menu (Group, All, Owner,
 *   Download, Social, AI, Media, Fun, Tools, Information)
 * - fallbackChain(): carousel → buttons → plain text, for clients that
 *   cannot render carousels
 */

function bizNode() {
  return {
    tag: 'biz',
    attrs: {},
    content: [
      {
        tag: 'interactive',
        attrs: { type: 'native_flow', v: '1' },
        content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }],
      },
    ],
  };
}

const quickReply = (display_text, id) => ({
  name: 'quick_reply',
  buttonParamsJson: JSON.stringify({ display_text, id }),
});
const urlBtn = (display_text, url) => ({
  name: 'cta_url',
  buttonParamsJson: JSON.stringify({ display_text, url, merchant_url: url }),
});
const copyBtn = (display_text, copy_code) => ({
  name: 'cta_copy',
  buttonParamsJson: JSON.stringify({ display_text, id: 'copy', copy_code }),
});

// ─── card factory ───
// { title, desc, image?, video?, buttons? }
// image/video: Buffer | { url } | string URL. Media is uploaded by
// sendCarousel(); buildCarouselMessage() keeps a reference placeholder.
function card(opts = {}) {
  if (!opts.title && !opts.desc) throw new Error('wa-carousel-kit: a card needs at least a title or desc');
  return {
    title: opts.title || '',
    desc: opts.desc || '',
    image: opts.image,
    video: opts.video,
    buttons: opts.buttons || [],
  };
}

// Media kind of a card value, by extension or Buffer.
function mediaKind(value) {
  if (!value) return null;
  if (Buffer.isBuffer(value)) return 'image';
  const s = typeof value === 'string' ? value : value.url || '';
  if (/\.(gif|mp4|mov|webm)(\?|$)/i.test(s)) return 'video';
  if (/\.(jpe?g|png|webp)(\?|$)/i.test(s)) return 'image';
  return 'image';
}

// ─── pure payload builder ───
// headers: optional array parallel to cards with prepared media objects
// (the output of Baileys prepareWAMessageMedia). Without a header entry a
// card is sent text-only.
function buildCarouselMessage({ body = '', footer = '', cards = [], headers = [] } = {}) {
  if (!Array.isArray(cards) || !cards.length) throw new Error('wa-carousel-kit: at least one card is required');
  if (cards.length > 10) throw new Error(`wa-carousel-kit: WhatsApp carousels hold at most 10 cards (got ${cards.length})`);
  const built = cards.map((c, i) => ({
    header: headers[i] ? { hasMediaAttachment: true, ...headers[i] } : { hasMediaAttachment: false },
    body: { text: c.title || '' },
    footer: { text: c.desc || '' },
    nativeFlowMessage: { messageParamsJson: '{}', buttons: c.buttons || [] },
  }));
  return {
    message: {
      interactiveMessage: {
        header: { hasMediaAttachment: false },
        body: { text: body },
        footer: { text: footer },
        carouselMessage: { cards: built },
      },
    },
    additionalNodes: [bizNode()],
  };
}

// ─── full sender (Baileys) ───
async function sendCarousel(sock, jid, opts = {}) {
  if (!sock || typeof sock.relayMessage !== 'function') throw new Error('wa-carousel-kit: sock.relayMessage is required');
  if (!jid) throw new Error('wa-carousel-kit: jid is required');
  let baileys;
  try {
    baileys = require('@whiskeysockets/baileys');
  } catch {
    throw new Error('wa-carousel-kit: install @whiskeysockets/baileys to send carousels (builders work without it)');
  }
  const { generateWAMessageFromContent, prepareWAMessageMedia } = baileys;

  const headers = [];
  for (const c of opts.cards || []) {
    const media = c.video || c.image;
    if (!media) { headers.push(null); continue; }
    const src = typeof media === 'string' ? { url: media } : media;
    const kind = mediaKind(media);
    const prepared = await prepareWAMessageMedia(
      kind === 'video' ? { video: src, gifPlayback: /\.gif(\?|$)/i.test(typeof media === 'string' ? media : media.url || '') } : { image: src },
      { upload: sock.waUploadToServer }
    );
    headers.push(prepared);
  }

  const { message, additionalNodes } = buildCarouselMessage({ ...opts, headers: headers.map(h => h || undefined) });
  const msg = generateWAMessageFromContent(jid, message, {});
  await sock.relayMessage(jid, msg.message, { messageId: msg.key.id, additionalNodes });
  return msg;
}

// Slider is the word most bot devs use for the same thing.
const sendSlider = sendCarousel;

// ─── ready-made 10-slide bot menu ───
const MENU10 = [
  { key: 'group', title: '👥 GROUP MENU', description: 'Powerful group administration and moderation tools.', button: '📋 GROUP MENU', command: '-gcmenu' },
  { key: 'all', title: '📚 ALL MENU', description: 'View all available bot commands and features.', button: '📖 ALL MENU', command: '-allmenu' },
  { key: 'owner', title: '👑 OWNER MENU', description: 'Owner-only bot management and configuration controls.', button: '👑 OWNER MENU', command: '-ownermenu' },
  { key: 'download', title: '📥 DOWNLOAD MENU', description: 'Download supported media and content from available platforms.', button: '📥 DOWNLOAD MENU', command: '-dlmenu' },
  { key: 'social', title: '🌐 SOCIAL MENU', description: 'Search and work with supported social media platforms.', button: '🌐 SOCIAL MENU', command: '-socialmenu' },
  { key: 'ai', title: '🤖 AI MENU', description: 'AI-powered tools, assistants and intelligent features.', button: '🧠 AI MENU', command: '-aimenu' },
  { key: 'media', title: '🎨 MEDIA MENU', description: 'Convert, edit and process images, videos, GIFs, stickers and audio.', button: '🎨 MEDIA MENU', command: '-mediamenu' },
  { key: 'fun', title: '🎮 FUN MENU', description: 'Games, entertainment, reactions, anime and fun commands.', button: '🎮 FUN MENU', command: '-funmenu' },
  { key: 'tools', title: '🛠️ TOOLS MENU', description: 'Useful utilities, converters and everyday tools.', button: '🛠️ TOOLS MENU', command: '-toolsmenu' },
  { key: 'info', title: 'ℹ️ INFORMATION', description: 'Bot information, status, help and useful information.', button: 'ℹ️ INFO MENU', command: '-infomenu' },
];

const BUTTON_ID_PREFIX = 'menu:';
const buttonIdFor = (command) => `${BUTTON_ID_PREFIX}${command}`;
const commandForButtonId = (buttonId) =>
  buttonId && buttonId.startsWith(BUTTON_ID_PREFIX) ? buttonId.slice(BUTTON_ID_PREFIX.length) : null;

// menuCards(mediaMap): mediaMap = { group: <image/video>, ai: <...>, ... }
function menuCards(mediaMap = {}) {
  return MENU10.map(s => card({
    title: s.title,
    desc: s.description,
    image: mediaMap[s.key],
    buttons: [quickReply(s.button, buttonIdFor(s.command))],
  }));
}

async function sendMenu10(sock, jid, { body = '🤖 *Bot Menu* — swipe the cards!', footer = '', mediaMap = {} } = {}) {
  return sendCarousel(sock, jid, { body, footer, cards: menuCards(mediaMap) });
}

// ─── fallback chain ───
// Tries carousel, then a buttons message, then plain text. Each sender is
// injected so the chain is fully testable and framework-free.
//   await fallbackChain([
//     () => sendCarousel(sock, jid, opts),
//     () => sock.sendMessage(jid, { text: textMenu(opts) }),
//   ]);
async function fallbackChain(steps) {
  let lastErr;
  for (const step of steps) {
    try { return await step(); } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('wa-carousel-kit: fallbackChain needs at least one step');
}

// Plain-text rendering of the same cards (last-resort fallback).
function textMenu({ body = '', cards = [] } = {}) {
  const lines = cards.map((c, i) => `${i + 1}. ${c.title}${c.desc ? ` — ${c.desc}` : ''}`);
  return [body, ...lines].filter(Boolean).join('\n');
}

module.exports = {
  bizNode,
  quickReply,
  urlBtn,
  copyBtn,
  card,
  mediaKind,
  buildCarouselMessage,
  sendCarousel,
  sendSlider,
  MENU10,
  menuCards,
  sendMenu10,
  BUTTON_ID_PREFIX,
  buttonIdFor,
  commandForButtonId,
  fallbackChain,
  textMenu,
};
