//
//  Extensions.swift
//  Filimo
//
//  Created by Saeed Taheri on 9/25/19.
//  Copyright © 2019 Filimo. All rights reserved.
//

import Foundation
import TVServices

extension URL {
	static let homepage = URL(string: "https://www.filimo.com/etc/api/homepage/devicetype/site")!
	static func movieDetailURL(uuid: String) -> URL {
		return URL(string: "https://www.filimo.com/etc/api/moviedetail/uid/\(uuid)")!
	}
}

extension URLSession {
    func synchronousDataTask(urlrequest: URLRequest) -> (data: Data?, response: URLResponse?, error: Error?) {
        var data: Data?
        var response: URLResponse?
        var error: Error?

        let semaphore = DispatchSemaphore(value: 0)

        let dataTask = self.dataTask(with: urlrequest) {
            data = $0
            response = $1
            error = $2

            semaphore.signal()
        }
        dataTask.resume()

        _ = semaphore.wait(timeout: .distantFuture)

        return (data, response, error)
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
}

@available(tvOSApplicationExtension 13.0, *)
extension CarouselMovie {
	
	func makeCarouselItem() -> TVTopShelfCarouselItem {
		let item = TVTopShelfCarouselItem(identifier: info.id ?? UUID().uuidString)
		
		item.title = info.title?.persianDigits()
		item.summary = info.description?.persianDigits()
		item.genre = info.genre
		item.duration = TimeInterval(info.duration)
		if let trailerUrlString = detail?.trailers?.first?.fileURLString {
			item.previewVideoURL = URL(string: trailerUrlString)
		}
		if let thumbnail = info.thumbplay?.imageURLString ?? info.thumbnailURLString, let imageURL = URL(string: thumbnail) {
			item.setImageURL(imageURL, for: .screenScale1x)
			item.setImageURL(imageURL, for: .screenScale2x)
		}
		if let id = info.id {
			item.displayAction = URL(string: "filimo://\(id)/display").map { TVTopShelfAction(url: $0) }
			item.playAction = URL(string: "filimo://\(id)/play").map { TVTopShelfAction(url: $0) }
		}
		item.mediaOptions = makeCarouselMediaOptions()
		item.namedAttributes = makeCarouselNamedAttributes()
		
		return item
	}
	
	private func makeCarouselMediaOptions() -> TVTopShelfCarouselItem.MediaOptions {
		
		var result = TVTopShelfCarouselItem.MediaOptions()
		
		if info.isHD {
			result.formUnion(.videoResolutionHD)
		}
		
		return result
	}
	
	private func makeCarouselNamedAttributes() -> [TVTopShelfNamedAttribute] {
        var namedAttributes = [TVTopShelfNamedAttribute]()

		guard let crew = detail?.crew, !crew.isEmpty else {
			return namedAttributes
		}
		
		let directors = crew.filter {
			$0.postInfo.title == "کارگردان"
		}.compactMap {
			$0.profiles.first?.nameFa ?? $0.profiles.first?.nameEn
		}
		
		let actors = crew.filter {
			$0.postInfo.title.contains("بازیگر")
		}.compactMap {
			$0.profiles
		}.flatMap {
			$0
		}.compactMap {
			$0.nameFa ?? $0.nameEn
		}
						
		if !directors.isEmpty {
			namedAttributes.append(TVTopShelfNamedAttribute(name: "کارگردان", values: directors))
		}
		
		if !actors.isEmpty {
			namedAttributes.append(TVTopShelfNamedAttribute(name: "بازیگران", values: actors))
		}

        return namedAttributes
    }
}
