import { render, screen, fireEvent } from '@testing-library/react';
import { Settings } from './Settings';

describe('Settings component', () => {
  test('apply calls setConfig and onClose when input is valid', () => {
    const setConfig = jest.fn();
    const reset = jest.fn();
    const onClose = jest.fn();

    render(<Settings maxGuesses={6} setConfig={setConfig} reset={reset} onClose={onClose} />);

    const input = screen.getByLabelText(/Max guesses/i);
    fireEvent.change(input, { target: { value: '8' } });

    const apply = screen.getByText(/Apply/i);
    fireEvent.click(apply);

    expect(setConfig).toHaveBeenCalledWith({ maxGuesses: 8, words: undefined });
    expect(reset).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  test('shows validation message and disables apply on invalid input', () => {
    const setConfig = jest.fn();
    const reset = jest.fn();

    render(<Settings maxGuesses={6} setConfig={setConfig} reset={reset} />);

    const input = screen.getByLabelText(/Max guesses/i);
    fireEvent.change(input, { target: { value: '' } });

    const apply = screen.getByText(/Apply/i);
    expect(apply).toBeDisabled();

    // show validation message after touched
    fireEvent.change(input, { target: { value: '' } });
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/Please enter a number between 1 and 10/i);
  });
});
