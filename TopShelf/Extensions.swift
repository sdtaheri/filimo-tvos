//
//  Extensions.swift
//  Filimo
//
//  Created by Saeed Taheri on 9/25/19.
//  Copyright © 2019 Filimo. All rights reserved.
//

import UIKit

extension URL {
	static let vitrine = URL(string: Config.baseURL + "/movie/movie/list/tagid/1/")!

	static let specials = URL(string: Config.baseURL + "/movie/movie/list/tagid/thumbnailspecial/")!

	static func movieOneDetailURL(uuid: String) -> URL {
		return URL(string: Config.baseURL + "/movie/movie/one/uid/\(uuid)/")!
	}

	static func movieReviewDetailURL(uuid: String) -> URL {
		return URL(string: Config.baseURL + "/review/review/moviedetail/uid/\(uuid)/devicetype/appletv/")!
	}
}

extension String {
	func persianDigits() -> String {
		var str = self
		let formatter = NumberFormatter()
		formatter.locale = Locale(identifier: "fa")
		for i in 0..<10 {
			let number = NSNumber(integerLiteral: i)
			str = str.replacingOccurrences(of: number.stringValue, with: formatter.string(from: number)!)
		}
		return str
	}

	init?(htmlEncodedString: String?) {
		guard let data = htmlEncodedString?.data(using: .utf8) else {
			return nil
		}

		let options: [NSAttributedString.DocumentReadingOptionKey: Any] = [
			.documentType: NSAttributedString.DocumentType.html,
			.characterEncoding: String.Encoding.utf8.rawValue
		]

		guard let attributedString = try? NSAttributedString(data: data, options: options, documentAttributes: nil) else {
			return nil
		}

		self.init(attributedString.string)
	}
}

extension URLRequest {
	@discardableResult
	mutating func addAppHeaders() -> URLRequest {
		addValue("simple", forHTTPHeaderField: "JsonType")
		addValue("application/json", forHTTPHeaderField: "Content-Type")
		return self
	}
}

extension ListFormatter {
	static let persian: ListFormatter = {
		let formatter = ListFormatter()
		formatter.locale = Locale(identifier: "fa_IR")
		return formatter
	}()
}
