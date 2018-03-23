//
//  main.swift
//  TVMLCatalog
//
//  Created by Saeed Taheri on 3/21/18.
//  Copyright © 2018 Apple. All rights reserved.
//

import UIKit
import Foundation

let defaults = UserDefaults.standard
defaults.set(["fa_IR"], forKey: "AppleLanguages")
defaults.synchronize()

UIView.appearance().semanticContentAttribute = .forceRightToLeft

UIApplicationMain(
    CommandLine.argc,
    UnsafeMutableRawPointer(CommandLine.unsafeArgv)
        .bindMemory(
            to: UnsafeMutablePointer<Int8>.self,
            capacity: Int(CommandLine.argc)),
    nil,
    NSStringFromClass(AppDelegate.self)
)

