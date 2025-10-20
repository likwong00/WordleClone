import { render, screen, fireEvent } from '@testing-library/react';
import { Keyboard } from './Keyboard';

describe('Keyboard component', () => {
  test('renders keyboard and responds to clicks', () => {
    const addChar = jest.fn();
    const backspace = jest.fn();
    const submitGuess = jest.fn();

    render(
      <Keyboard
        addChar={addChar}
        backspace={backspace}
        submitGuess={submitGuess}
      />
    );

    // find a letter key and click
    const keyQ = screen.getByText('Q');
    fireEvent.click(keyQ);
    expect(addChar).toHaveBeenCalledWith('q');

    // click enter
    const enter = screen.getByText(/ENTER/i);
    fireEvent.click(enter);
    expect(submitGuess).toHaveBeenCalled();

    // click backspace icon (button has aria-label)
    const back = screen.getByLabelText('Backspace');
    fireEvent.click(back);
    expect(backspace).toHaveBeenCalled();
  });
});
