import type { ModuleConfig } from '../shell/types';
import { M1 } from './M1';
import { M2 } from './M2';
import { M3 } from './M3';
import { M4 } from './M4';
import { M5, M6 } from './M5_M6';
import { M7, M8 } from './M7_M8';
import { M9, M10 } from './M9_M10';
import { M11, M12 } from './M11_M12';
import { M13, M14 } from './M13_M14';
import { M15, M16 } from './M15_M16';
import { M17, M18, M19 } from './M17_M18_M19';

export const MODULES: ModuleConfig[] = [
  M1, M2, M3, M4, M5, M6, M7, M8, M9, M10,
  M11, M12, M13, M14, M15, M16, M17, M18, M19,
];

export const MODULE_BY_ID: Record<string, ModuleConfig> = Object.fromEntries(
  MODULES.map(m => [m.id, m]),
);
