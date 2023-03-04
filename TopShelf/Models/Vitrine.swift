//
//  Vitrine.swift
//  TopShelf
//
//  Created by Saeed Taheri on 7/22/20.
//  Copyright © 2020 Filimo. All rights reserved.
//

import Foundation

struct VitrineResponse: Codable {
	struct Datum: Codable {
		let linkKey: String?
		let movies: MovieData

		enum CodingKeys: String, CodingKey {
			case movies
			case linkKey = "link_key"
		}
	}

	struct MovieData: Codable {
		let data: [VitrineMovie]
	}

	let data: [Datum]
}

struct VitrineMovie: Codable {
	struct Picture: Codable {
		let big: String?

		enum CodingKeys: String, CodingKey {
			case big = "movie_img_b"
		}
	}

	struct Poster: Codable {
		let big: String?
		let medium: String?

		enum CodingKeys: String, CodingKey {
			case big = "thumbplay_img_b"
			case medium = "thumbplay_img_m"
		}
	}

	let uid: String
	let title: String
	let picture: Picture?
	let poster: Poster?
	let isHD: Bool

	enum CodingKeys: String, CodingKey {
		case uid
		case title = "movie_title"
		case picture = "pic"
		case poster = "thumbplay"
		case isHD = "HD"
	}
}
