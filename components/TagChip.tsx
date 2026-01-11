import React from 'react';
import { Tag } from '../types';

interface TagChipProps {
  tag?: Tag | null;
  className?: string;
}

export const TagChip: React.FC<TagChipProps> = ({ tag, className }) => {
  if (!tag) return null;

  return (
    <span 
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter border ${className}`}
      style={{ 
        backgroundColor: `${tag.color}15`, 
        color: tag.color,
        borderColor: `${tag.color}30`
      }}
    >
      <span className="text-xs">{tag.icon}</span>
      {tag.name}
    </span>
  );
};