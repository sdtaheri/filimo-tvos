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
		let movies: MovieData
	}

	struct MovieData: Codable {
		let data: [VitrineMovie]
	}

    let data: [Datum]
}

struct VitrineMovie: Codable {

	struct Category: Codable {
		let title: String
	}

	struct Picture: Codable {
		let big: String?

		enum CodingKeys: String, CodingKey {
			case big = "movie_img_b"
		}
	}

	let uid: String
	let title: String
	let description: String?
	let categories: [Category]
	let picture: Picture?
	let isHD: Bool

    enum CodingKeys: String, CodingKey {
		case uid, categories
		case title = "movie_title"
		case description = "descr"
		case picture = "pic"
		case isHD = "HD"
    }
}
