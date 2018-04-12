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
        if let data = try container.decodeIfPresent([MovieCompact]?.self, forKey: .data) {
            self.data = data
        } else {
            self.data = nil
        }
        category = try container.decode(Category.self, forKey: .category)
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
    var id: String?
    var title: String?
    var thumbnailURLString: String
    
    enum CodingKeys: String, CodingKey {
        case id = "uid"
        case title = "movie_title"
        case thumbnailURLString = "movie_img_b"
    }
}
