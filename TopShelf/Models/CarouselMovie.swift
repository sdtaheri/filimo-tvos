//
//  CarouselMovie.swift
//  TopShelf
//
//  Created by Saeed Taheri on 4/1/18.
//  Copyright © 2018 Filimo. All rights reserved.
//

import Foundation
import TVServices

struct CarouselMovie {
	let vitrineInfo: VitrineMovie
	var oneDetail: MovieDetailGeneral?
	var reviewDetail: MovieDetailReview?
}

extension CarouselMovie {
	func makeCarouselItem() -> TVTopShelfCarouselItem {
		let item = TVTopShelfCarouselItem(identifier: vitrineInfo.uid)

		item.title = vitrineInfo.title.persianDigits()
		item.summary = String(htmlEncodedString: oneDetail?.description)?.persianDigits()

		if let categories = oneDetail?.categories {
			item.genre = ListFormatter.persian.string(from: categories.compactMap { $0.title })
		}

		if let duration = oneDetail?.duration.value {
			item.duration = TimeInterval(duration)
		}

		if let trailerUrlString = reviewDetail?.data.trailer?.fileURLString {
			item.previewVideoURL = URL(string: trailerUrlString)
		}

		if let cover = vitrineInfo.poster?.big ?? vitrineInfo.picture?.big,
			let imageURL = URL(string: cover) {
			print(imageURL)
			item.setImageURL(imageURL, for: .screenScale1x)
			item.setImageURL(imageURL, for: .screenScale2x)
		}

		item.displayAction = URL(string: "\(Config.scheme)://\(vitrineInfo.uid)/display").map { TVTopShelfAction(url: $0) }
		item.playAction = URL(string: "\(Config.scheme)://\(vitrineInfo.uid)/play").map { TVTopShelfAction(url: $0) }

		item.mediaOptions = makeCarouselMediaOptions()
		item.namedAttributes = makeCarouselNamedAttributes()

		return item;
	}

	private func makeCarouselMediaOptions() -> TVTopShelfCarouselItem.MediaOptions {
		var result = TVTopShelfCarouselItem.MediaOptions()

		if vitrineInfo.isHD {
			result.formUnion(.videoResolutionHD)
		}

		return result
	}

	private func makeCarouselNamedAttributes() -> [TVTopShelfNamedAttribute] {
		var namedAttributes = [TVTopShelfNamedAttribute]()

		if let directors = oneDetail?.directors?.compactMap({ $0.name }), !directors.isEmpty {
			namedAttributes.append(TVTopShelfNamedAttribute(name: "کارگردان", values: directors))
		}

		let actorsResult = reviewDetail?.data.actors?.profiles.compactMap {
			$0
		}.compactMap {
			$0.nameFa ?? $0.nameEn
		}

		if let actors = actorsResult, !actors.isEmpty {
			namedAttributes.append(TVTopShelfNamedAttribute(name: "بازیگران", values: actors))
		}

		return namedAttributes
	}
}
