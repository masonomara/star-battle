import { createRequire } from 'node:module';
import { Coord } from './types';

const _req = createRequire(import.meta.url);
const wasmCounting = _req('../../pkg/dlx.js') as {
  compute_counting_flow(
    size:                 number,
    axisNeeded:           Int32Array,
    regionStarsNeeded:    Int32Array,
    unknownsByAxisFlat:   Int32Array,
    unknownCoordsFlat:    Int32Array,
    unknownCoordOffsets:  Int32Array,
  ): Int32Array;
  has_counting_violation(
    size:               number,
    axisNeeded:         Int32Array,
    regionStarsNeeded:  Int32Array,
    unknownsByAxisFlat: Int32Array,
  ): boolean;
};

// ── Types ──────────────────────────────────────────────────────────────

export type CountingFlowRegionInfo = {
  starsNeeded: number;
  unknownsByAxis: number[];
  unknownCoords: Coord[];
};

export type CountingFlowInput = {
  size: number;
  axisNeeded: number[];
  regionInfos: CountingFlowRegionInfo[];
};

export type TightSetContrib = {
  maxContrib: number;
  starsNeeded: number;
  unknownCoords: Coord[];
};

export type TightSetInfo = {
  mask: number;
  regionContribs: TightSetContrib[];
};

export type CountingFlowResult = {
  feasible: boolean;
  tightSets: TightSetInfo[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function flattenInput(size: number, regionInfos: CountingFlowRegionInfo[]) {
  const R = regionInfos.length;
  const regionStarsNeeded   = new Int32Array(R);
  const unknownsByAxisFlat  = new Int32Array(R * size);
  const unknownCoordOffsets = new Int32Array(R + 1);

  let totalCoords = 0;
  for (const ri of regionInfos) totalCoords += ri.unknownCoords.length;
  const unknownCoordsFlat = new Int32Array(totalCoords * 2);

  let pos = 0;
  for (let i = 0; i < R; i++) {
    const ri = regionInfos[i];
    regionStarsNeeded[i] = ri.starsNeeded;
    for (let j = 0; j < size; j++) unknownsByAxisFlat[i * size + j] = ri.unknownsByAxis[j];
    unknownCoordOffsets[i] = pos;
    for (const [r, c] of ri.unknownCoords) {
      unknownCoordsFlat[pos * 2]     = r;
      unknownCoordsFlat[pos * 2 + 1] = c;
      pos++;
    }
  }
  unknownCoordOffsets[R] = pos;
  return { regionStarsNeeded, unknownsByAxisFlat, unknownCoordsFlat, unknownCoordOffsets };
}

function parseFlat(flat: Int32Array): CountingFlowResult {
  let i = 0;
  const feasible = flat[i++] === 1;
  const numTs    = flat[i++];
  const tightSets: TightSetInfo[] = [];
  for (let t = 0; t < numTs; t++) {
    const mask        = flat[i++];
    const numContribs = flat[i++];
    const regionContribs: TightSetContrib[] = [];
    for (let c = 0; c < numContribs; c++) {
      const maxContrib  = flat[i++];
      const starsNeeded = flat[i++];
      const numCoords   = flat[i++];
      const unknownCoords: Coord[] = [];
      for (let k = 0; k < numCoords; k++) {
        const r = flat[i++];
        const c2 = flat[i++];
        unknownCoords.push([r, c2]);
      }
      regionContribs.push({ maxContrib, starsNeeded, unknownCoords });
    }
    tightSets.push({ mask, regionContribs });
  }
  return { feasible, tightSets };
}

// ── Public API ────────────────────────────────────────────────────────────────

export function hasCountingViolation(input: CountingFlowInput): boolean {
  const { size, axisNeeded, regionInfos } = input;

  for (const ri of regionInfos) {
    if (ri.starsNeeded > 0) {
      let total = 0;
      for (let i = 0; i < size; i++) total += ri.unknownsByAxis[i];
      if (total < ri.starsNeeded) return true;
    }
  }
  let totalDemand = 0;
  for (let i = 0; i < size; i++) {
    if (axisNeeded[i] < 0) return true;
    totalDemand += axisNeeded[i];
  }
  if (totalDemand === 0) return false;

  const axisNeededArr = Int32Array.from(axisNeeded);
  const { regionStarsNeeded, unknownsByAxisFlat } = flattenInput(size, regionInfos);
  return wasmCounting.has_counting_violation(size, axisNeededArr, regionStarsNeeded, unknownsByAxisFlat);
}

export function computeCountingFlow(input: CountingFlowInput): CountingFlowResult {
  const { size, axisNeeded, regionInfos } = input;

  let totalDemand = 0;
  for (let i = 0; i < size; i++) totalDemand += axisNeeded[i];
  if (totalDemand === 0) return { feasible: true, tightSets: [] };

  const axisNeededArr = Int32Array.from(axisNeeded);
  const { regionStarsNeeded, unknownsByAxisFlat, unknownCoordsFlat, unknownCoordOffsets } =
    flattenInput(size, regionInfos);

  const flat = wasmCounting.compute_counting_flow(
    size, axisNeededArr, regionStarsNeeded, unknownsByAxisFlat,
    unknownCoordsFlat, unknownCoordOffsets,
  );
  return parseFlat(flat);
}
