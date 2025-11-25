export type PublicMenu = {
    id: string;
    name: string;
    slug: string;
    path?: string | null;
    parentId?: string | null;
    order: number;
    children: PublicMenu[];  
  };
  