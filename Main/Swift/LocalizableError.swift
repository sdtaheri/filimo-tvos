//
//  LocalizableError.swift
//  Filimo
//
//  Created by Saeed Taheri on 7/8/20.
//  Copyright © 2020 Filimo. All rights reserved.
//

import Foundation

struct LocalizableError {

	static func message(for error: Error) -> String {

		let nsError = error as NSError

		let tvmlKitDomain = "TVMLKitErrorDomain"

		let localizedKey: String
		switch (nsError.domain, nsError.code) {
		case (tvmlKitDomain, 3):
			localizedKey = NSLocalizedString("error_tvml_domain_code_3", comment: "")
		case (tvmlKitDomain, _):
			localizedKey = NSLocalizedString("error_tvml_domain_code_unknown", comment: "")
		default:
			localizedKey = NSLocalizedString("error_unknown", comment: "")
		}

		return localizedKey
	}
}
