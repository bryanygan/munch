import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SwipeCard } from '@/features/discover/SwipeCard';
import type { Dish } from '@/domain/dish/types';

const testDish: Dish = {
  id: 'mango_sticky_rice',
  name: 'Mango Sticky Rice',
  description: 'Sweet coconut-infused sticky rice with mango.',
  country: 'TH',
  cuisine_region: 'southeast_asian',
  flavor: { sweet: 4.5, sour: 1, salty: 0.5, bitter: 0, umami: 0, heat: 0, richness: 3 },
  textures: ['chewy', 'creamy'],
  meal_types: ['dessert'],
  temperature: 'cold',
  typical_time: 'any',
  contains: {
    gluten: false, dairy: false, seafood: false, nuts: false,
    eggs: false, pork: false, beef: false, alcohol: false,
  },
  diet_compatible: ['vegan', 'vegetarian'],
  price_tier: 2,
  prep_complexity: 'medium',
  popularity: 4,
  image_url: 'https://example.com/mango.jpg',
  image_thumbhash: '',
  tags: ['coconut', 'rice'],
};

describe('SwipeCard', () => {
  it('renders dish name and description', () => {
    const { getByText } = render(
      <SwipeCard
        dish={testDish}
        onSwipe={jest.fn()}
        onPressDetails={jest.fn()}
        interactive
      />
    );
    expect(getByText('Mango Sticky Rice')).toBeTruthy();
  });

  it('renders price as dollar signs matching price tier', () => {
    const { getByText } = render(
      <SwipeCard
        dish={testDish}
        onSwipe={jest.fn()}
        onPressDetails={jest.fn()}
        interactive
      />
    );
    expect(getByText('$$')).toBeTruthy();
  });

  it('fires onPressDetails when "View details" is tapped', () => {
    const onPressDetails = jest.fn();
    const { getByText } = render(
      <SwipeCard
        dish={testDish}
        onSwipe={jest.fn()}
        onPressDetails={onPressDetails}
        interactive
      />
    );
    fireEvent.press(getByText('View details ›'));
    expect(onPressDetails).toHaveBeenCalledTimes(1);
  });

  it('shows SPICY tag when dish has heat >= 3', () => {
    const spicyDish = { ...testDish, flavor: { ...testDish.flavor, heat: 4 } };
    const { getByText } = render(
      <SwipeCard
        dish={spicyDish}
        onSwipe={jest.fn()}
        onPressDetails={jest.fn()}
        interactive
      />
    );
    expect(getByText('SPICY')).toBeTruthy();
  });

  it('does not show SPICY tag when heat < 3', () => {
    const { queryByText } = render(
      <SwipeCard
        dish={testDish}
        onSwipe={jest.fn()}
        onPressDetails={jest.fn()}
        interactive
      />
    );
    expect(queryByText('SPICY')).toBeNull();
  });

  it('shows DAIRY tag when dish contains dairy', () => {
    const dairyDish = {
      ...testDish,
      contains: { ...testDish.contains, dairy: true },
    };
    const { getByText } = render(
      <SwipeCard
        dish={dairyDish}
        onSwipe={jest.fn()}
        onPressDetails={jest.fn()}
        interactive
      />
    );
    expect(getByText('DAIRY')).toBeTruthy();
  });

  it('shows GLUTEN tag when dish contains gluten', () => {
    const glutenDish = {
      ...testDish,
      contains: { ...testDish.contains, gluten: true },
    };
    const { getByText } = render(
      <SwipeCard
        dish={glutenDish}
        onSwipe={jest.fn()}
        onPressDetails={jest.fn()}
        interactive
      />
    );
    expect(getByText('GLUTEN')).toBeTruthy();
  });

  it('shows no dietary tags for a dish with none applicable', () => {
    const { queryByText } = render(
      <SwipeCard
        dish={testDish}
        onSwipe={jest.fn()}
        onPressDetails={jest.fn()}
        interactive
      />
    );
    expect(queryByText('SPICY')).toBeNull();
    expect(queryByText('DAIRY')).toBeNull();
    expect(queryByText('GLUTEN')).toBeNull();
  });

  it('has accessible label describing the dish', () => {
    const { getByLabelText } = render(
      <SwipeCard
        dish={testDish}
        onSwipe={jest.fn()}
        onPressDetails={jest.fn()}
        interactive
      />
    );
    // Label format from SwipeCard: "{name} from {country}. {description} Price tier {tier}."
    // RNTL getByLabelText accepts string or RegExp, not a function matcher.
    expect(getByLabelText(/Mango Sticky Rice.*TH.*Price tier 2/)).toBeTruthy();
  });
});
