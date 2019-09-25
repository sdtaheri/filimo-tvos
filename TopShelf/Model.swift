//
//  Model.swift
//  TopShelf
//
//  Created by Saeed Taheri on 4/1/18.
//  Copyright © 2018 Filimo. All rights reserved.
//

import Foundation

struct ShelfResponse: Codable {
    var homepage: [Homepage]
    
    enum CodingKeys: String, CodingKey {
        case homepage
    }
}

struct Homepage: Codable {
    var category: Category
    var data: [MovieCompact]?
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        category = try container.decode(Category.self, forKey: .category)
		if let data = try? container.decodeIfPresent([MovieCompact].self, forKey: .data) {
            self.data = data
        } else {
            self.data = nil
        }
    }
    
    enum CodingKeys: String, CodingKey {
        case category
        case data
    }
}

struct Category: Codable {
    var id: String
    var title: String?
    var listType: String
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        title = try container.decode(String?.self, forKey: .title)
        listType = try container.decode(String.self, forKey: .listType)
        if let value = try? container.decode(Int.self, forKey: .id) {
            id = String(value)
        } else {
            id = try container.decode(String.self, forKey: .id)
        }
    }
    
    enum CodingKeys: String, CodingKey {
        case id
        case title
        case listType = "list_type"
    }
}

struct MovieCompact: Codable {
	struct Thumbplay: Codable {
		var imageURLString: String?
		
		enum CodingKeys: String, CodingKey {
			case imageURLString = "thumbplay_img_b"
		}
	}
	
    var id: String?
    var title: String?
	var description: String?
	var duration: Int
	var genre: String?
	private var hd: String?
    var thumbnailURLString: String?
	var thumbplay: Thumbplay?

	var isHD: Bool {
		guard let hd = hd, hd == "yes" else {
			return false
		}
		return true
	}
	
    enum CodingKeys: String, CodingKey {
        case id = "uid"
        case title = "movie_title"
		case description = "descr"
        case thumbnailURLString = "movie_img_b"
		case thumbplay
		case hd
		case duration = "duration_sec"
		case genre = "category_1"
    }
}

struct MovieDetailResponse: Codable {
	var movieDetail: MovieDetail
	
	enum CodingKeys: String, CodingKey {
		case movieDetail = "moviedetail"
	}
}

struct MovieDetail: Codable {
	var trailers: [Trailer]?
	var crew: [Crew]?
	
	enum CodingKeys: String, CodingKey {
		case trailers = "trailer"
		case crew
	}
}

struct Trailer: Codable {
	var fileURLString: String?
	
	enum CodingKeys: String, CodingKey {
		case fileURLString = "file_link"
	}
}

struct Crew: Codable {
	struct PostInfo: Codable {
		var title: String
		
		enum CodingKeys: String, CodingKey {
			case title = "title_fa"
		}
	}
	
	struct Profile: Codable {
		var nameFa: String?
		var nameEn: String?

		enum CodingKeys: String, CodingKey {
			case nameFa = "name_fa"
			case nameEn = "name_en"
		}

	}

	var postInfo: PostInfo
	var profiles: [Profile]
	
	enum CodingKeys: String, CodingKey {
		case postInfo = "post_info"
		case profiles = "profile"
	}
}

struct CarouselMovie {
	let info: MovieCompact
	var detail: MovieDetail? = nil
}
