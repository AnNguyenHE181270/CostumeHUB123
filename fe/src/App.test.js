import { render, screen } from '@testing-library/react';
import App from './App';
import { MemoryRouter } from 'react-router-dom';

describe('Màn hình Home (App Component)', () => {
  test('nên render thành công mà không có lỗi', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>);
  });
});
