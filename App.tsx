import React from 'react';
import { Provider } from 'react-redux';
import { StatusBar } from 'react-native';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <AppNavigator />
    </Provider>
  );
};

export default App;
