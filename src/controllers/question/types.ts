interface BlockLabel {
  en: string;
  bn: string;
}

interface Block {
  label: BlockLabel;
  value: string;
}

export type DistrictBlocks = {
  [key: string]: Block[];
};
