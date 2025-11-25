import {
  Geist,
  Geist_Mono,
  Instrument_Sans,
  Inter,
  Mulish,
  Noto_Sans_Mono,
  Noto_Sans_Devanagari
} from 'next/font/google';

import { cn } from '@/lib/utils';

const fontSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
});

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const fontInstrument = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument',
  display: 'swap',
});

const fontNotoMono = Noto_Sans_Mono({
  subsets: ['latin'],
  variable: '--font-noto-mono',
  display: 'swap',
});

const fontMullish = Mulish({
  subsets: ['latin'],
  variable: '--font-mullish',
  display: 'swap',
});

const fontInter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// Hindi font - optimized for Devanagari script (Hindi, Marathi, etc.)
const fontHindi = Noto_Sans_Devanagari({
  subsets: ['devanagari', 'latin'],
  variable: '--font-hindi',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  preload: true,
});

export const fontVariables = cn(
  fontSans.variable,
  fontMono.variable,
  fontInstrument.variable,
  fontNotoMono.variable,
  fontMullish.variable,
  fontInter.variable,
  fontHindi.variable
);
