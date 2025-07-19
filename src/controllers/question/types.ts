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

export interface Question {
  id: string;
  index: number;
  label_en: string;
  label_bn: string;
  option_key: string | null;
  is_optional: boolean;
  type: string;
}
