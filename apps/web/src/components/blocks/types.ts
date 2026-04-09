import type { ReactElement } from "react";

export type BlockModel = {
  id: string;
  type: string;
  variant: string;
  order: number;
  data: any;
};

export type BlockComponent = (props: { data: any }) => ReactElement | null;