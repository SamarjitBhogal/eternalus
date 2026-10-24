import { describe, expect, it } from 'vitest';

import { ARCH_UNIT_PATH } from './archUnitPath';

type Point = readonly [number, number];

/** The vertices and control points of an absolute M/L/C/H/V/Z path, in order. */
function pointsOf(path: string): Point[] {
  const tokens = path.match(/[MLCHVZ]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  const points: Point[] = [];
  let command = '';
  let x = 0;
  let y = 0;
  for (let i = 0; i < tokens.length;) {
    const token = tokens[i] ?? '';
    if (/^[MLCHVZ]$/.test(token)) {
      command = token;
      i += 1;
      continue;
    }
    const value = Number(token);
    if (command === 'H') {
      x = value;
      i += 1;
    } else if (command === 'V') {
      y = value;
      i += 1;
    } else {
      x = value;
      y = Number(tokens[i + 1]);
      i += 2;
    }
    points.push([x, y]);
  }
  return points;
}

/**
 * Figma's own paths: node vectors (`use_figma` dumps of 58:271) in node space, and the exported
 * SVGs of 62:125 with their stroke offset `(dx, dy)` removed (spec §4.11 origins).
 */
const FIGMA_ARCHES: readonly {
  readonly node: string;
  readonly path: string;
  readonly width: number;
  readonly height: number;
  readonly dx: number;
  readonly dy: number;
}[] = [
  {
    node: '55:255 picked Legend art',
    path: 'M 313.7098083496094 659.459228515625 L 0.004004708491265774 659.459228515625 L 0.004004708491265774 191.83447265625 C 0.004004708491265774 191.83447265625 -0.9820365905761719 161.6727294921875 27.990663528442383 112.84381103515625 C 68.16427421569824 45.13752746582031 155.7310791015625 0 155.7310791015625 0 C 155.7310791015625 0 247.0191993713379 48.74852752685547 283.01629638671875 111.48968505859375 C 313.70981216430664 164.98696517944336 311.4555358886719 191.83447265625 311.4555358886719 191.83447265625 L 313.7098083496094 659.459228515625 Z',
    width: 313.7098083496094,
    height: 659.459228515625,
    dx: 0,
    dy: 0,
  },
  {
    node: '55:263 idle Legend frame',
    path: 'M 275.3388977050781 578.6630859375 L 0.003514879001710598 578.6630859375 L 0.003514879001710598 168.33115094006672 C 0.003514879001710598 168.33115094006672 -0.8619206752416417 141.86478097213612 24.56702954882768 99.0183240823922 C 59.826870162949504 39.60732963295688 136.68307193076132 0 136.68307193076132 0 C 136.68307193076132 0 216.8054412717944 42.77591600359342 248.39960995777693 97.83010419340349 C 275.3388977050781 144.77296377594527 273.3603406486864 168.33115094006672 273.3603406486864 168.33115094006672 L 275.3388977050781 578.6630859375 Z',
    width: 275.3388977050781,
    height: 578.6630859375,
    dx: 0,
    dy: 0,
  },
  {
    node: '61:8 picked refraction art',
    path: 'M 353.857177734375 697.6356201171875 L 0.004517215613446592 697.6356201171875 L 0.004517215613446592 202.93985663470883 C 0.004517215613446592 202.93985663470883 -1.1077138397467756 171.03203658123977 31.572800516485533 119.37639005385866 C 76.88767470540276 47.750559249968916 175.66094100250413 0 175.66094100250413 0 C 175.66094100250413 0 278.63176225059 51.5706017300686 319.23562868213514 117.94387311493831 C 353.8571820372624 174.53813486437036 351.314412192334 202.93985663470883 351.314412192334 202.93985663470883 L 353.857177734375 697.6356201171875 Z',
    width: 353.857177734375,
    height: 697.6356201171875,
    dx: 0,
    dy: 0,
  },
  {
    node: '58:351 picked shadow plate',
    path: 'M 336 695 L 0.004289257182396934 695 L 0.004289257182396934 202.17316906228612 C 0.004289257182396934 202.17316906228612 -1.0518141435700592 170.3858863156924 29.979497983055452 118.92539356605066 C 73.0075864409197 47.570157426420266 166.79631011644304 0 166.79631011644304 0 C 166.79631011644304 0 264.57078485637953 51.37577002053389 303.1256013642192 117.49828884325805 C 336 173.87874269061183 333.58553848915426 202.17316906228612 333.58553848915426 202.17316906228612 L 336 695 Z',
    width: 336,
    height: 695,
    dx: 0,
    dy: 0,
  },
  {
    node: '62:163 class card outer (card-frame-outer.svg)',
    path: 'M256 536.129H1.00326V156.758C1.00326 156.758 0.201748 132.289 23.7523 92.6757C56.4075 37.7475 127.586 1.12879 127.586 1.12879C127.586 1.12879 201.79 40.677 231.051 91.5771C256 134.978 254.168 156.758 254.168 156.758L256 536.129Z',
    width: 255,
    height: 535,
    dx: 1,
    dy: 1.129,
  },
  {
    node: '62:153 picked class card outer (card-frame-outer-selected.svg)',
    path: 'M288.338 603.976H1.00367V176.495C1.00367 176.495 0.100516 148.922 26.6377 104.285C63.4342 42.3914 143.64 1.12879 143.64 1.12879C143.64 1.12879 227.254 45.6924 260.225 103.047C288.338 151.952 286.273 176.495 286.273 176.495L288.338 603.976Z',
    width: 287.338,
    height: 602.847,
    dx: 1,
    dy: 1.129,
  },
  {
    node: '72:801 Legends-row mini outer (legend-frame-outer.svg)',
    path: 'M106 141.054H1.00134V41.7794C1.00134 41.7794 0.671308 35.3763 10.3686 25.0101C23.8149 10.6364 53.1238 1.05391 53.1238 1.05391C53.1238 1.05391 83.6784 11.403 95.7267 24.7226C106 36.0798 105.245 41.7794 105.245 41.7794L106 141.054Z',
    width: 105,
    height: 140,
    dx: 1,
    dy: 1.054,
  },
  {
    node: '72:802 Legends-row mini inner (legend-frame-inner.svg)',
    path: 'M100.5 135.528H0.501277V39.7987C0.501277 39.7987 0.18696 33.6242 9.42247 23.6282C22.2284 9.76786 50.1418 0.527618 50.1418 0.527618C50.1418 0.527618 79.2413 10.5071 90.716 23.351C100.5 34.3026 99.7814 39.7987 99.7814 39.7987L100.5 135.528Z',
    width: 100,
    height: 135,
    dx: 0.5,
    dy: 0.528,
  },
];

const TOLERANCE_PX = 0.001;

describe('ARCH_UNIT_PATH', () => {
  const unit = pointsOf(ARCH_UNIT_PATH);

  it('spans the unit box from the apex (y 0) to the flat bottom (y 1)', () => {
    expect(Math.min(...unit.map(([, y]) => y))).toBe(0);
    expect(Math.max(...unit.map(([, y]) => y))).toBe(1);
    expect(Math.max(...unit.map(([x]) => x))).toBe(1);
  });

  it.each(FIGMA_ARCHES)(
    'scaled to its box reproduces $node within 0.001 px',
    ({ path, width, height, dx, dy }) => {
      const figma = pointsOf(path).map(([x, y]): Point => [x - dx, y - dy]);
      expect(figma).toHaveLength(unit.length);
      const deviation = Math.max(
        ...figma.map(([x, y], i) => {
          const [ux = Number.NaN, uy = Number.NaN] = unit[i] ?? [];
          return Math.max(Math.abs(x - ux * width), Math.abs(y - uy * height));
        }),
      );
      expect(deviation).toBeLessThan(TOLERANCE_PX);
    },
  );
});
