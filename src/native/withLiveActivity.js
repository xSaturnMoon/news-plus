const { withInfoPlist, withEntitlementsPlist } = require('@expo/config-plugins');

const withLiveActivity = (config) => {
    // 1. Abilitiamo le Live Activities nel Info.plist
    config = withInfoPlist(config, (config) => {
        config.modResults.NSSupportsLiveActivities = true;
        config.modResults.NSSupportsLiveActivitiesFrequentUpdates = true;
        return config;
    });

    // 2. Aggiungiamo le Entitlements necessarie
    config = withEntitlementsPlist(config, (config) => {
        config.modResults['com.apple.developer.shared-with-you.live-activities'] = true;
        return config;
    });

    return config;
};

module.exports = withLiveActivity;
