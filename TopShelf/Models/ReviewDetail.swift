//
//  ReviewDetail.swift
//  TopShelf
//
//  Created by Saeed Taheri on 7/22/20.
//  Copyright © 2020 Filimo. All rights reserved.
//

import Foundation

struct MovieDetailReview: Codable {
	struct Data: Codable {
		let trailer: Trailer?
		let actors: Crew?
		let cast: [Crew]?

		enum CodingKeys: String, CodingKey {
			case trailer = "aparatTrailer"
			case actors = "ActorCrewData"
			case cast = "OtherCrewData"
		}
	}

	let data: Data
}

struct Trailer: Codable {
	var fileURLString: String?

	enum CodingKeys: String, CodingKey {
		case fileURLString = "file_link"
	}
}

struct Crew: Codable {
	struct PostInfo: Codable {
		let title: String

		enum CodingKeys: String, CodingKey {
			case title = "title_fa"
		}
	}

	struct Profile: Codable {
		let nameFa: String?
		let nameEn: String?

		enum CodingKeys: String, CodingKey {
			case nameFa = "name_fa"
			case nameEn = "name_en"
		}

	}

	let postInfo: PostInfo
	let profiles: [Profile]

	enum CodingKeys: String, CodingKey {
		case postInfo = "post_info"
		case profiles = "profile"
	}
}
