/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { LogBox } from 'react-native';

AppRegistry.registerComponent(appName, () => App);
LogBox.ignoreLogs([
  'Text strings must be rendered within a <Text> component.',
  // Добавь другие паттерны ошибок, если они появятся и будут некритичными
]);
