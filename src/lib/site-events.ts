/** Cross-panel actions for the site workflow conveyor. */
export const DOWNLOAD_BOM_CSV_EVENT = 'smetoplan:download-bom-csv';
export const PRINT_BRIGADE_A4_EVENT = 'smetoplan:print-brigade-a4';
export { OPEN_QUOTE_EVENT } from '@/lib/rbu-spec';

export function dispatchSiteEvent(name: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(name));
}
