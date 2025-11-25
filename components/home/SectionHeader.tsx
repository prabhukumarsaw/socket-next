import { ChevronsRight } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  color?: string;
}

export const SectionHeader = ({ title, color = "blue" }: SectionHeaderProps) => {
  return (
    <div className="border-b-2 border-black mb-6 relative flex">
      <h3 className="text-sm font-bold uppercase text-Primary inline-block pb-1  -mb-[2px]">
        {title} 
      </h3><ChevronsRight />
    </div>
  );
};

export default SectionHeader;