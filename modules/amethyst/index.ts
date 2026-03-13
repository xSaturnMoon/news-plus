import { requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

let AmethystNative: any = null;

try {
  if (Platform.OS === 'ios') {
    AmethystNative = requireNativeModule('Amethyst');
  }
} catch (e) {
  console.warn("⚠️ AmethystNative Module non trovato. Funzionerà solo nella build compilata iOS.");
}

/**
 * Lancia l'intera UI nativa di Amethyst (Minecraft) 
 * in overlay sopra l'OS Obsidian
 */
export function launchAmethyst(): void {
  if (AmethystNative && AmethystNative.presentAmethystLauncher) {
    AmethystNative.presentAmethystLauncher();
  } else {
    console.error("Errore: Modulo nativo Amethyst non disponibile.");
    alert("Minecraft (Amethyst) module is only available in the compiled native iOS build.");
  }
}
