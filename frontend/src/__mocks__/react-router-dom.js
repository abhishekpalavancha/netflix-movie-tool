const React = require('react');

module.exports = {
  useSearchParams: jest.fn(() => [new URLSearchParams(), jest.fn()]),
  MemoryRouter: ({ children }) => children,
  Link: ({ children, to }) => React.createElement('a', { href: to }, children),
  useNavigate: jest.fn(() => jest.fn()),
  useLocation: jest.fn(() => ({ pathname: '/', search: '' })),
  useParams: jest.fn(() => ({})),
};