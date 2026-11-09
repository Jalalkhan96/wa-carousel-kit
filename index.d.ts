export interface WaButton { name: string; buttonParamsJson: string }
export interface CardOptions {
  title?: string; desc?: string;
  image?: any; video?: any; buttons?: WaButton[];
}
export interface MenuSlide { key: string; title: string; description: string; button: string; command: string }

export function bizNode(): object;
export function quickReply(display_text: string, id: string): WaButton;
export function urlBtn(display_text: string, url: string): WaButton;
export function copyBtn(display_text: string, copy_code: string): WaButton;
export function card(opts: CardOptions): Required<Omit<CardOptions, 'image' | 'video'>> & CardOptions;
export function mediaKind(value: any): 'image' | 'video' | null;
export function buildCarouselMessage(opts: { body?: string; footer?: string; cards: CardOptions[]; headers?: object[] }): { message: object; additionalNodes: object[] };
export function sendCarousel(sock: any, jid: string, opts: { body?: string; footer?: string; cards: CardOptions[] }): Promise<any>;
export const sendSlider: typeof sendCarousel;
export const MENU10: MenuSlide[];
export function menuCards(mediaMap?: Record<string, any>): CardOptions[];
export function sendMenu10(sock: any, jid: string, opts?: { body?: string; footer?: string; mediaMap?: Record<string, any> }): Promise<any>;
export const BUTTON_ID_PREFIX: string;
export function buttonIdFor(command: string): string;
export function commandForButtonId(buttonId?: string | null): string | null;
export function fallbackChain(steps: Array<() => Promise<any>>): Promise<any>;
export function textMenu(opts: { body?: string; cards: CardOptions[] }): string;
