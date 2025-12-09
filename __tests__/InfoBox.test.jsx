import React from 'react';
import { render } from '@testing-library/react-native';
import InfoBox from '../components/InfoBox';

describe('InfoBox', () => {
  it('renders fallback title when none provided', () => {
    const { getByText } = render(<InfoBox />);
    expect(getByText('—')).toBeTruthy();
  });

  it('renders provided title and subtitle', () => {
    const { getByText, queryByText } = render(
      <InfoBox title="Total visits" subtitle="Last 24h" />
    );

    expect(getByText('Total visits')).toBeTruthy();
    expect(getByText('Last 24h')).toBeTruthy();
    expect(queryByText('—')).toBeNull();
  });
});
