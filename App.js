import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { OSProvider } from './src/hooks/useOS';
import { OSContainer } from './src/components/OSContainer';

import { SettingsProvider } from './src/context/SettingsContext';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SettingsProvider>
        <OSProvider>
          <OSContainer />
        </OSProvider>
      </SettingsProvider>
    </GestureHandlerRootView>
  );
}
