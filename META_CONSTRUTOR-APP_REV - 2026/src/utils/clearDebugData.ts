// Utility para limpar dados de debug que podem estar causando problemas
export const clearAllDebugData = () => {
  // Limpar localStorage completamente
  // localStorage.clear(); // COMMENTED OUT: Caused session loss on reload

  // Remover qualquer elemento de debug que possa estar no DOM
  const debugElements = document.querySelectorAll('[class*="debug"], [class*="Auth Debug"], [id*="debug"]');
  debugElements.forEach(element => {
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  });

};

// Executar limpeza imediatamente
clearAllDebugData();
