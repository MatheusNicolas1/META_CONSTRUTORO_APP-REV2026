import React from 'react';

export default function TesteMinimo() {
  return React.createElement('div', { style: { padding: '40px', fontFamily: 'sans-serif' } },
    React.createElement('h1', null, 'Hello World - Teste Mínimo'),
    React.createElement('p', null, 'Se você está vendo isso, o React está funcionando.'),
    React.createElement('a', { href: '/teste-spline' }, 'Ir para página Spline')
  );
}
