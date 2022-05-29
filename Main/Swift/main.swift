//
//  main.swift
//  TVMLCatalog
//
//  Created by Saeed Taheri on 3/21/18.
//  Copyright © 2018 Apple. All rights reserved.
//

import UIKit
import Foundation

UserDefaults.standard.set(["fa_IR"], forKey: "AppleLanguages")

_ = UIApplicationMain(
    CommandLine.argc,
    CommandLine.unsafeArgv,
    nil,
    NSStringFromClass(AppDelegate.self)
)
