import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('farm overview', () => {
 it('filters fields and selects one for the details and chart', async () => {
  const user = userEvent.setup();
  render(<App />);
  expect(screen.getByText('Sample data · not connected')).toBeTruthy();
  await user.click(screen.getByRole('button', { name: 'Wheat' }));
  expect(screen.getByRole('heading', { name: 'North wheat' })).toBeTruthy();
  const list = screen.getByRole('button', { name: /North wheat.*Wheat/ });
  await user.click(list);
  expect(screen.getByRole('heading', { name: 'North wheat' })).toBeTruthy();
  expect(screen.getByText('Sample score for North wheat')).toBeTruthy();
  expect(within(list).getByText('22 ha', { exact: false })).toBeTruthy();
  await user.click(screen.getByRole('button', { name: 'Year' }));
  expect(screen.getByRole('img', { name: /Year sample scores/ })).toBeTruthy();
  await user.click(within(screen.getByRole('group', { name: 'Illustrated field selection' })).getByRole('button', { name: /Sunflower field/ }));
  expect(screen.getByRole('button', { name: 'All', pressed: true })).toBeTruthy();
  expect(screen.getByText('Sample score for Sunflower field')).toBeTruthy();
  expect(screen.getByRole('img', { name: /Year sample scores:.*82/ })).toBeTruthy();
 });
});
