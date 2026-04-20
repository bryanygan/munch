import React from 'react';
import type { Dish } from '@/domain/dish/types';

type Props = {
  dish: Dish | null;
  onClose: () => void;
};

export const DetailsSheet: React.FC<Props> = () => null;
