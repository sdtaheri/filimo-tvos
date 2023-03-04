//
//  OneDetail.swift
//  TopShelf
//
//  Created by Saeed Taheri on 7/22/20.
//  Copyright © 2020 Filimo. All rights reserved.
//

import Foundation

struct MovieOneDetailResponse: Codable {
	struct Data: Codable {
		let general: MovieDetailGeneral

		enum CodingKeys: String, CodingKey {
			case general = "General"
		}
	}

	let data: Data
}

struct MovieDetailGeneral: Codable {
	struct Category: Codable {
		let title: String
	}
	
	struct Director: Codable {
		let name: String
	}

	struct Duration: Codable {
		let value: Int
	}

	let directors: [Director]?
	let duration: Duration
	let categories: [Category]
	let description: String?

	enum CodingKeys: String, CodingKey {
		case directors = "director"
		case description = "descr"
		case duration, categories
	}
}
