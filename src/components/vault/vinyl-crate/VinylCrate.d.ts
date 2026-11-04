import { ComponentType, ReactNode } from "react";

export interface VinylRecord {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  cover?: string;
  href?: string;
  cta?: string;
}

export interface VinylCrateProps {
  items: VinylRecord[];
  onSelect?: (item: VinylRecord, ctx: { event: React.MouseEvent }) => void;
  onChange?: (index: number, item: VinylRecord) => void;
  onOpen?: (item: VinylRecord) => void;
  onClose?: (item: VinylRecord) => void;
  defaultIndex?: number;
  eyebrow?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  wheel?: boolean;
  labels?: Record<string, string>;
}

declare const VinylCrate: ComponentType<VinylCrateProps>;
export default VinylCrate;

