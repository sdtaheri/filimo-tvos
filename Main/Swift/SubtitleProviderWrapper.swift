//
//  SubtitleProviderWrapper.swift
//  Filimo
//
//  Created by Saeed Taheri on 3/11/22.
//  Copyright © 2022 Filimo. All rights reserved.
//

import JavaScriptCore
import SubtitleProvider

@objc protocol SubtitleProviderProtocol: JSExport {
	static func createWith(
		url: String,
		subtitles: [[String: String]]
	) -> SubtitleProviderWrapper

	func prepareM3U8() -> JSValue
}

@objc public class SubtitleProviderWrapper: NSObject, SubtitleProviderProtocol {
	private let merger = SubtitleProvider()
	private let url: String
	private let subtitles: [Subtitle]

	private override init() {
		self.url = ""
		self.subtitles = []
	}

	required init(url: String, subtitles: [Subtitle]) {
		self.url = url
		self.subtitles = subtitles
	}

	static func createWith(url: String, subtitles: [[String : String]]) -> SubtitleProviderWrapper {
		let mappedSubtitles: [Subtitle] = subtitles.compactMap { dic in
			guard let url = dic["url"] else {
				return nil
			}
			let languageCode = dic["lang"] ?? "en"
			let isDefault = dic["isDefault"] == "true"

			return Subtitle(
				languageCode: languageCode,
				url: url,
				isDefault: isDefault
			)
		}

		return SubtitleProviderWrapper(
			url: url,
			subtitles: mappedSubtitles
		)
	}

	func prepareM3U8() -> JSValue {
		guard let context = JSContext.current() else { fatalError("No runtime") }

		return JSValue(newPromiseIn: context) { [weak self] resolve, reject in
			self?.fetchWatchUrl { result in
				resolve?.call(withArguments: [result])
			}
		}
	}

	private func fetchWatchUrl(completion: @escaping (String) -> Void) {
		Task {
			let result = await merger.m3u8WithSubtitles(subtitles, originalM3U8: url)
			DispatchQueue.main.async {
				completion(result)
			}
		}
	}
}
