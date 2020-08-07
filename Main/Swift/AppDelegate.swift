//
//  AppDelegate.swift
//  Filimo
//
//  Created by Saeed Taheri on 2/26/18.
//  Copyright © 2018 Filimo. All rights reserved.
//

import UIKit
import AVFoundation
import TVMLKit
import TVServices

final class AppDelegate: UIResponder, UIApplicationDelegate, TVApplicationControllerDelegate {
    
    var window: UIWindow?
    var appController: TVApplicationController?
	var appControllerContext: TVApplicationControllerContext?

    // MARK: Javascript Execution Helper
    
    func executeRemoteMethod(_ methodName: String, completion: @escaping (Bool) -> Void) {
        appController?.evaluate(inJavaScriptContext: { (context: JSContext) in
            let appObject : JSValue = context.objectForKeyedSubscript("App")
            
            if appObject.hasProperty(methodName) {
                appObject.invokeMethod(methodName, withArguments: [])
            }
            }, completion: completion)
    }
    
    // MARK: UIApplicationDelegate

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        window = UIWindow(frame: UIScreen.main.bounds)
        
        // Create the TVApplicationControllerContext for this application and set the properties that will be passed to the `App.onLaunch` function in JavaScript.
        appControllerContext = TVApplicationControllerContext()

        // The JavaScript URL is used to create the JavaScript context for your TVMLKit application. Although it is possible to separate your JavaScript into separate files, to help reduce the launch time of your application we recommend creating minified and compressed version of this resource. This will allow for the resource to be retrieved and UI presented to the user quickly.
        if let javaScriptURL = URL(string: Config.tvBootURL) {
            appControllerContext?.javaScriptApplicationURL = javaScriptURL
        }
        
        appControllerContext?.launchOptions["jsBaseURL"] = Config.tvBaseURL
        appControllerContext?.launchOptions["baseURL"] = Config.baseURL
        appControllerContext?.launchOptions["appName"] = Config.appNameFa
        
        if let launchOptions = launchOptions {
            for (kind, value) in launchOptions {
                appControllerContext?.launchOptions[kind.rawValue] = value
            }
        }

		let audioSession = AVAudioSession.sharedInstance()
		do {
			try audioSession.setCategory(.playback)
		} catch {
			print("Setting category to AVAudioSessionCategoryPlayback failed.")
		}
		if #available(tvOS 14.0, *) {
			appControllerContext?.supportsPictureInPicturePlayback = true
		}

		setupTVApplicationController()

        return true
    }
    
    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
        /*
         Request a JavaScript context from the `TVApplicationController` to pass the URL into JavaScript.
         */
        appController?.evaluate(inJavaScriptContext: { context in
            if let appObj = context.globalObject.objectForKeyedSubscript("App") {
                if appObj.hasProperty("onOpenURL") {
                    appObj.invokeMethod("onOpenURL", withArguments: [url.absoluteString])
                }
            }
        }, completion: nil)
        
        return true
    }
    
    func applicationWillResignActive(_ application: UIApplication) {
        executeRemoteMethod("onWillResignActive", completion: { (success: Bool) in
        })
    }
    
    func applicationDidEnterBackground(_ application: UIApplication) {
        executeRemoteMethod("onDidEnterBackground", completion: { (success: Bool) in
        })
		
		TVTopShelfContentProvider.topShelfContentDidChange()
    }
    
    func applicationWillEnterForeground(_ application: UIApplication) {
        executeRemoteMethod("onWillEnterForeground", completion: { (success: Bool) in
        })
    }
    
    func applicationDidBecomeActive(_ application: UIApplication) {
        executeRemoteMethod("onDidBecomeActive", completion: { (success: Bool) in
        })
    }
    
    func applicationWillTerminate(_ application: UIApplication) {
        executeRemoteMethod("onWillTerminate", completion: { (success: Bool) in
        })
    }
    
    // MARK: TVApplicationControllerDelegate
    
    func appController(_ appController: TVApplicationController, didFinishLaunching options: [String: Any]?) {
        print("\(#function) invoked with options: \(options ?? [:])")
    }
    
    func appController(_ appController: TVApplicationController, didFail error: Error) {
        print("\(#function) invoked with error: \(error)")
        
		let title = NSLocalizedString("error_launching_app",
									  comment: "Alert title shown when launching TVML app was problematic")

		let alertController = UIAlertController(title: title, message: LocalizableError.message(for: error), preferredStyle: .alert)

		alertController.addAction(UIAlertAction(title: NSLocalizedString("retry",
																		 comment: "Button title for trying again"),
												style: .default,
												handler: { _ in
													self.setupTVApplicationController()
												})
		)

        self.appController?.navigationController.present(alertController, animated: true, completion: nil)
    }
    
    func appController(_ appController: TVApplicationController, didStop options: [String: Any]?) {
        print("\(#function) invoked with options: \(options ?? [:])")
    }

	private func setupTVApplicationController() {
		guard let context = appControllerContext else {
			return
		}
		appController = TVApplicationController(context: context, window: window, delegate: self)
	}
}

