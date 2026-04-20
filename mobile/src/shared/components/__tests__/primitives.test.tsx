import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Chip } from '@/shared/components/Chip';
import { Toggle } from '@/shared/components/Toggle';
import { ProgressBar } from '@/shared/components/ProgressBar';

describe('Chip', () => {
  it('renders label', () => {
    const { getByText } = render(<Chip label="spicy" />);
    expect(getByText('spicy')).toBeTruthy();
  });
});

describe('Toggle', () => {
  it('calls onValueChange when pressed', () => {
    const onChange = jest.fn();
    const { getByRole } = render(<Toggle value={false} onValueChange={onChange} />);
    fireEvent.press(getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe('ProgressBar', () => {
  it('renders', () => {
    const { toJSON } = render(<ProgressBar value={0.5} />);
    expect(toJSON()).toBeTruthy();
  });
});
