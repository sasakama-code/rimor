// Mock React module for testing
module.exports = {
  Component: class Component {
    constructor(props) {
      this.props = props;
    }
    render() {}
  },
  useState: () => [null, () => {}],
  useEffect: () => {},
  useContext: () => {},
  createContext: () => ({}),
  createElement: () => ({}),
  Fragment: {},
  StrictMode: {},
  Suspense: {},
  lazy: () => {},
  memo: () => {},
  forwardRef: () => {},
  useRef: () => ({}),
  useMemo: () => {},
  useCallback: () => {},
  useReducer: () => [null, () => {}],
  useImperativeHandle: () => {},
  useLayoutEffect: () => {},
  useDebugValue: () => {},
  useDeferredValue: () => {},
  useTransition: () => [false, () => {}],
  useId: () => 'id',
  useSyncExternalStore: () => {},
  useInsertionEffect: () => {},
};