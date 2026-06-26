/**
 * store.js — Estado centralizado de la aplicación
 *
 * Patrón observable mínimo. Conceptualmente equivalente a
 * useState + useEffect (React) o reactive() (Vue).
 * Se puede sustituir por cualquier store de framework
 * sin tocar la capa de datos ni los componentes.
 */

const store = {
  _state: {
    projects:   [],   // array de objetos proyecto
    activeTag:  'all', // filtro activo
    loading:    false,
    error:      null,
  },

  _listeners: new Set(),

  /** Devuelve una copia del estado (inmutable externamente) */
  getState() {
    return { ...this._state };
  },

  /**
   * Actualiza el estado y notifica a todos los suscriptores.
   * @param {Partial<typeof this._state>} patch
   */
  setState(patch) {
    this._state = { ...this._state, ...patch };
    this._listeners.forEach(fn => fn(this._state));
  },

  /**
   * Suscribe una función al estado. Devuelve un unsubscribe.
   * @param {(state: object) => void} fn
   * @returns {() => void}
   */
  subscribe(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  },
};

export default store;
