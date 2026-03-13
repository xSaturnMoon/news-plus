require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'amethyst'
  s.version        = package['version'] || '1.0.0'
  s.summary        = 'Amethyst iOS embedded module for Expo'
  s.author         = 'Obsidian OS'
  s.homepage       = 'https://github.com/AngelAuraMC/Amethyst-iOS'
  s.license        = 'MIT'
  s.source         = { git: '' }
  
  # Questo è il segreto per linkare Frameworks compilati senza impazzire col pbxproj
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.platforms = { :ios => '14.0' }
  s.swift_version  = '5.4'
  s.source_files = 'ios/**/*.{h,m,mm,swift}'
  
  # Istruisce CocoaPods a prendere il framework di Amethyst che compilerai in Xcode 
  # e integrarlo (Embed & Sign) dentro la tua app Expo
  s.vendored_frameworks = 'ios/Frameworks/Amethyst.framework'

  # Aggiungiamo dipendenze C++ essenziali per Minecraft/JVM
  s.library = 'c++'
end
