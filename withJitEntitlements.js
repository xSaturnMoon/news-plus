const { withEntitlementsPlist } = require('@expo/config-plugins');

const withJitEntitlements = (config) => {
  return withEntitlementsPlist(config, (config) => {
    // Aggiunge i permessi JIT necessari per allocate memoria RWX (Read-Write-Execute)
    config.modResults['get-task-allow'] = true;
    config.modResults['dynamic-codesigning'] = true;
    // (Opzionale per App Store, ma essenziale per Sideloading puro)
    // config.modResults['com.apple.private.cs.debugger'] = true;
    return config;
  });
};

module.exports = withJitEntitlements;
