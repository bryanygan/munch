import { DishRepository } from './repository';
import foodsData from '@/data/foods.json';
import type { Dish } from './types';

export const dishRepository = new DishRepository(foodsData as Dish[]);
