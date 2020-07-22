//
//  Config.swift
//  Filimo
//
//  Created by Saeed Taheri on 7/1/20.
//  Copyright © 2020 Filimo. All rights reserved.
//

import Foundation

struct Config {

	private static func infoForKey(_ key: String) -> String? {
		   return (Bundle.main.infoDictionary?[key] as? String)?
			   .replacingOccurrences(of: "\\", with: "")
	}

	// tvBaseURL points to a server on your local machine. To create a local server for testing purposes, use the following command inside Javascript folder from the Terminal app: ruby -run -ehttpd . -p9001. See NSAppTransportSecurity for information on using a non-secure server.
	static let tvBaseURL: String = {
		#if DEBUG
			return "http://localhost:9001/"
		#else
			return "https://filimo.saeedtaheri.com/"
		#endif
	}()

	static let baseURL = infoForKey("ST Base URL")! + "fa/v1"

	static let tvBootURL = "\(tvBaseURL)/Application.js"

	static let appNameFa = infoForKey("ST App Name Localized")!

	static let scheme = infoForKey("ST Scheme")!
}
