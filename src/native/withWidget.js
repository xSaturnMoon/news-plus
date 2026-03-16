const {
    withXcodeProject,
    withEntitlementsPlist,
    IOSConfig,
} = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const APP_GROUP_ID = 'group.com.dshampoo.newsplus';
const WIDGET_TARGET_NAME = 'ReminderWidget';
const WIDGET_BUNDLE_ID = 'com.dshampoo.newsplus.ReminderWidget';

// Helper: return a new UUID-like string for xcode pbxproj
function generateUUID() {
    return 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'.replace(/X/g, () =>
        Math.floor(Math.random() * 16).toString(16).toUpperCase()
    );
}

function withWidget(config) {
    // 1. Add App Group entitlement to the main app
    config = withEntitlementsPlist(config, (config) => {
        const ent = config.modResults;
        if (!ent['com.apple.security.application-groups']) {
            ent['com.apple.security.application-groups'] = [];
        }
        if (!ent['com.apple.security.application-groups'].includes(APP_GROUP_ID)) {
            ent['com.apple.security.application-groups'].push(APP_GROUP_ID);
        }
        return config;
    });

    // 2. Add the widget extension target to the Xcode project
    config = withXcodeProject(config, (config) => {
        const xcodeProject = config.modResults;
        const projectRoot = config.modRequest.projectRoot;
        const iosDir = path.join(projectRoot, 'ios');
        const widgetDir = path.join(iosDir, WIDGET_TARGET_NAME);
        const sourceDir = path.join(projectRoot, 'targets', WIDGET_TARGET_NAME);

        // Skip if target already exists
        if (xcodeProject.pbxTargetByName(WIDGET_TARGET_NAME)) {
            console.log(`[withWidget] Target "${WIDGET_TARGET_NAME}" already exists, skipping.`);
            return config;
        }

        // Create the widget directory inside ios/
        fs.mkdirSync(widgetDir, { recursive: true });

        // Copy the Swift source file for widget
        const swiftSrc = path.join(sourceDir, `${WIDGET_TARGET_NAME}.swift`);
        const swiftDst = path.join(widgetDir, `${WIDGET_TARGET_NAME}.swift`);
        if (fs.existsSync(swiftSrc)) {
            fs.copyFileSync(swiftSrc, swiftDst);
        }

        // Copy AppGroupModule files to main project target
        const appProjectName = config.modRequest.projectName || 'newsplus';
        const appGroupDestDir = path.join(iosDir, appProjectName);
        try {
            const mSrc = path.join(projectRoot, 'src/native/AppGroupModule.m');
            const modSwiftSrc = path.join(projectRoot, 'src/native/AppGroupModule.swift');
            if (fs.existsSync(mSrc) && fs.existsSync(modSwiftSrc)) {
                fs.copyFileSync(mSrc, path.join(appGroupDestDir, 'AppGroupModule.m'));
                fs.copyFileSync(modSwiftSrc, path.join(appGroupDestDir, 'AppGroupModule.swift'));
                
                // Add to xcode project
                const groupKey = xcodeProject.findPBXGroupKey({ name: appProjectName });
                if (groupKey) {
                    xcodeProject.addSourceFile(`${appProjectName}/AppGroupModule.m`, null, groupKey);
                    xcodeProject.addSourceFile(`${appProjectName}/AppGroupModule.swift`, null, groupKey);
                }
            }
        } catch (e) {
            console.error('[withWidget] Failed to link AppGroupModule:', e);
        }

        // Write the widget's Info.plist
        const infoPlistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key><string>$(DEVELOPMENT_LANGUAGE)</string>
  <key>CFBundleDisplayName</key><string>Promemoria</string>
  <key>CFBundleExecutable</key><string>$(EXECUTABLE_NAME)</string>
  <key>CFBundleIdentifier</key><string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
  <key>CFBundleInfoDictionaryVersion</key><string>6.0</string>
  <key>CFBundleName</key><string>$(PRODUCT_NAME)</string>
  <key>CFBundlePackageType</key><string>$(PRODUCT_BUNDLE_PACKAGE_TYPE)</string>
  <key>CFBundleShortVersionString</key><string>$(MARKETING_VERSION)</string>
  <key>CFBundleVersion</key><string>$(CURRENT_PROJECT_VERSION)</string>
  <key>NSExtension</key>
  <dict>
    <key>NSExtensionPointIdentifier</key>
    <string>com.apple.widgetkit-extension</string>
  </dict>
</dict>
</plist>`;
        fs.writeFileSync(path.join(widgetDir, 'Info.plist'), infoPlistContent);

        // Write widget's entitlements file
        const entitlementsContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.application-groups</key>
  <array>
    <string>${APP_GROUP_ID}</string>
  </array>
</dict>
</plist>`;
        fs.writeFileSync(path.join(widgetDir, `${WIDGET_TARGET_NAME}.entitlements`), entitlementsContent);

        // --------------- Xcode project manipulation ---------------
        const proj = xcodeProject;

        // UUIDs for the new target
        const swiftFileUUID = generateUUID();
        const infoPlistUUID = generateUUID();
        const entitlementsUUID = generateUUID();
        const compileSourcesUUID = generateUUID();
        const frameworksBuildUUID = generateUUID();
        const resourcesBuildUUID = generateUUID();
        const debugConfigUUID = generateUUID();
        const releaseConfigUUID = generateUUID();
        const configListUUID = generateUUID();
        const targetUUID = generateUUID();
        const embedExtUUID = generateUUID();
        const embedExtItemUUID = generateUUID();
        const swiftBuildFileUUID = generateUUID();
        const widgetGroupUUID = generateUUID();

        // Build settings common to both configurations
        const buildSettingsBase = {
            ALWAYS_SEARCH_USER_PATHS: 'NO',
            CLANG_ANALYZER_NONNULL: 'YES',
            CLANG_ANALYZER_NUMBER_OBJECT_CONVERSION: 'YES_AGGRESSIVE',
            CODE_SIGN_STYLE: 'Automatic',
            CODE_SIGNING_ALLOWED: 'NO',
            CODE_SIGNING_REQUIRED: 'NO',
            CODE_SIGN_IDENTITY: '""',
            PRODUCT_BUNDLE_IDENTIFIER: WIDGET_BUNDLE_ID,
            PRODUCT_NAME: '$(TARGET_NAME)',
            SKIP_INSTALL: 'YES',
            SWIFT_VERSION: '5.0',
            TARGETED_DEVICE_FAMILY: '"1,2"',
            IPHONEOS_DEPLOYMENT_TARGET: '16.0',
            INFOPLIST_FILE: `${WIDGET_TARGET_NAME}/Info.plist`,
            CODE_SIGN_ENTITLEMENTS: `${WIDGET_TARGET_NAME}/${WIDGET_TARGET_NAME}.entitlements`,
            MARKETING_VERSION: '1.1.2',
            CURRENT_PROJECT_VERSION: '1',
        };

        // Add file references
        proj.pbxProject()['objects'][swiftFileUUID] = {
            isa: 'PBXFileReference',
            includeInIndex: 1,
            lastKnownFileType: 'sourcecode.swift',
            name: 'ReminderWidget.swift',
            path: 'ReminderWidget.swift',
            sourceTree: '"<group>"',
        };

        // Add compile sources build phase
        proj.pbxProject()['objects'][compileSourcesUUID] = {
            isa: 'PBXSourcesBuildPhase',
            buildActionMask: 2147483647,
            files: [`${swiftBuildFileUUID} /* ReminderWidget.swift in Sources */`],
            runOnlyForDeploymentPostprocessing: 0,
        };

        proj.pbxProject()['objects'][swiftBuildFileUUID] = {
            isa: 'PBXBuildFile',
            fileRef: swiftFileUUID,
            settings: {},
        };

        // Add frameworks build phase
        proj.pbxProject()['objects'][frameworksBuildUUID] = {
            isa: 'PBXFrameworksBuildPhase',
            buildActionMask: 2147483647,
            files: [],
            runOnlyForDeploymentPostprocessing: 0,
        };

        // Add resources build phase
        proj.pbxProject()['objects'][resourcesBuildUUID] = {
            isa: 'PBXResourcesBuildPhase',
            buildActionMask: 2147483647,
            files: [],
            runOnlyForDeploymentPostprocessing: 0,
        };

        // Add build configurations
        proj.pbxProject()['objects'][debugConfigUUID] = {
            isa: 'XCBuildConfiguration',
            buildSettings: { ...buildSettingsBase, DEBUG_INFORMATION_FORMAT: 'dwarf', SWIFT_OPTIMIZATION_LEVEL: '-Onone' },
            name: 'Debug',
        };
        proj.pbxProject()['objects'][releaseConfigUUID] = {
            isa: 'XCBuildConfiguration',
            buildSettings: { ...buildSettingsBase, DEBUG_INFORMATION_FORMAT: '"dwarf-with-dsym"' },
            name: 'Release',
        };

        // Add configuration list
        proj.pbxProject()['objects'][configListUUID] = {
            isa: 'XCConfigurationList',
            buildConfigurations: [
                `${debugConfigUUID} /* Debug */`,
                `${releaseConfigUUID} /* Release */`,
            ],
            defaultConfigurationIsVisible: 0,
            defaultConfigurationName: 'Release',
        };

        // Add the native target
        proj.pbxProject()['objects'][targetUUID] = {
            isa: 'PBXNativeTarget',
            buildConfigurationList: `${configListUUID} /* Build configuration list for PBXNativeTarget "${WIDGET_TARGET_NAME}" */`,
            buildPhases: [
                `${compileSourcesUUID} /* Sources */`,
                `${frameworksBuildUUID} /* Frameworks */`,
                `${resourcesBuildUUID} /* Resources */`,
            ],
            buildRules: [],
            dependencies: [],
            name: WIDGET_TARGET_NAME,
            productName: WIDGET_TARGET_NAME,
            productReference: swiftFileUUID,
            productType: '"com.apple.product-type.app-extension"',
        };

        // Register target in PBXProject targets
        const pbxProject = proj.pbxProjectSection();
        const projectKey = Object.keys(pbxProject)[0];
        pbxProject[projectKey].targets.push(`${targetUUID} /* ${WIDGET_TARGET_NAME} */`);

        // Add Embed App Extensions build phase to main target
        const appTarget = proj.pbxTargetByName(config.modRequest.projectName || 'newsplusd');
        if (appTarget) {
            const mainTargetKey = proj.findTargetKey(appTarget.name);
            const embedPhaseUUID = generateUUID();
            const embedBuildFileUUID = generateUUID();

            proj.pbxProject()['objects'][embedBuildFileUUID] = {
                isa: 'PBXBuildFile',
                fileRef: targetUUID,
                settings: { ATTRIBUTES: ['RemoveHeadersOnCopy'] },
            };

            proj.pbxProject()['objects'][embedPhaseUUID] = {
                isa: 'PBXCopyFilesBuildPhase',
                buildActionMask: 2147483647,
                dstPath: '""',
                dstSubfolderSpec: 13,
                files: [`${embedBuildFileUUID} /* ${WIDGET_TARGET_NAME} in Embed App Extensions */`],
                name: '"Embed App Extensions"',
                runOnlyForDeploymentPostprocessing: 0,
            };

            if (proj.pbxProject()['objects'][mainTargetKey]) {
                proj.pbxProject()['objects'][mainTargetKey].buildPhases.push(
                    `${embedPhaseUUID} /* Embed App Extensions */`
                );
            }
        }

        return config;
    });

    return config;
}

module.exports = withWidget;
