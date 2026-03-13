import ExpoModulesCore
import UIKit

// ⚠️ Questo framework esisterà solo se prima compili Amethyst in Xcode 
// cambiando il target Mach-O da "Executable" a "Dynamic Library"
// import Amethyst 

public class AmethystModule: Module {
  public func definition() -> ModuleDefinition {
    Name("Amethyst")

    Function("presentAmethystLauncher") {
      DispatchQueue.main.async {
        // 1. Troviamo il ViewController root su cui gira la tua app Expo (Obsidian OS)
        guard let currentVC = self.appContext?.utilities?.currentViewController() else {
          print("[AmethystModule] Errore: UIViewController corrente non trovato.")
          return
        }
        
        // 2. Troviamo il bundle del framework Amethyst (dentro l'ipa)
        let bundlePath = Bundle.main.path(forResource: "Amethyst", ofType: "framework", inDirectory: "Frameworks")
        guard let bundlePath = bundlePath, let amethystBundle = Bundle(path: bundlePath) else {
          print("[AmethystModule] Errore: Il Framework 'Amethyst.framework' non è stato trovato nel bundle.")
          print("Assicurati che CocoaPods lo abbia embeddato correttamente.")
          return
        }
        
        // 3. Istanziamo la UI di partenza di Amethyst
        // Se Amethyst usa Storyboards (es. Main.storyboard):
        do {
            let storyboard = UIStoryboard(name: "Main", bundle: amethystBundle)
            if let rootVC = storyboard.instantiateInitialViewController() {
                // Lo lanciamo a schermo intero sopra il tuo React Native!
                rootVC.modalPresentationStyle = .fullScreen
                currentVC.present(rootVC, animated: true, completion: nil)
            } else {
                print("[AmethystModule] Errore: Board 'Main' trovato ma InitialViewController non settato in Xcode.")
            }
        } catch {
             // In alternativa, se usano SwiftUI o ViewControllers programmatici, chiama direttamente
             // le loro API pubbliche es: let launcherVC = Amethyst.LauncherViewController()
             print("[AmethystModule] Launch fallback (non-storyboard).")
        }
      }
    }
  }
}
