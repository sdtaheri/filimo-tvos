//
//  ServiceProvider.swift
//  TopShelf
//
//  Created by Saeed Taheri on 3/31/18.
//  Copyright © 2018 Filimo. All rights reserved.
//

import Foundation
import TVServices

final class ServiceProvider: NSObject, TVTopShelfProvider {

    //MARK: - Properties
    
    private let homepageURL = URL(string: "https://www.filimo.com/etc/api/homepage/devicetype/site")!
    private var items = [TVContentItem]()

    override init() {
        super.init()
    }
    
    // MARK: - TVTopShelfProvider protocol

    var topShelfStyle: TVTopShelfContentStyle {
        return .sectioned
    }

    var topShelfItems: [TVContentItem] {

        items = [TVContentItem]()
        let semaphore = DispatchSemaphore(value: 0)
        
        var urlRequest = URLRequest(url: homepageURL)
        urlRequest.httpMethod = "GET"
        
        URLSession.shared.dataTask(with: urlRequest) { [weak self] (data, response, error) in
            guard let data = data else {
                semaphore.signal()
                return
            }
            do {
                let decoder = JSONDecoder()
                let shelfData = try decoder.decode(ShelfResponse.self, from: data)
                
                var sectionItems = [TVContentItem]()
                var sectionName = ""
                
                for homepage in shelfData.homepage {
                    if let firstValuableItems = homepage.data {
                        sectionName = homepage.category.title ?? ""
                        sectionItems = firstValuableItems.filter({ $0.id != nil }).map() { compactMovie -> TVContentItem in
                            let item = TVContentItem(contentIdentifier: TVContentIdentifier(identifier: compactMovie.id!, container: nil))
                            item.title = compactMovie.title?.persianDigits() ?? ""
                            item.imageShape = .poster
                            if let thumbnail = compactMovie.thumbnailURLString, let imageURL = URL(string: thumbnail) {
                                item.setImageURL(imageURL, forTraits: .userInterfaceStyleLight)
                                item.setImageURL(imageURL, forTraits: .userInterfaceStyleDark)
                                item.setImageURL(imageURL, forTraits: .screenScale1x)
                                item.setImageURL(imageURL, forTraits: .screenScale2x)
                            }
                            item.displayURL = URL(string: "Filimo://\(compactMovie.id!)/display")
                            item.playURL = URL(string: "Filimo://\(compactMovie.id!)/play")
                            return item
                        }
                        break
                    } else {
                        continue
                    }
                }
                
                let section = TVContentItem(contentIdentifier: TVContentIdentifier(identifier: "TopShelf", container: nil))
                section.title = sectionName.persianDigits()
                section.topShelfItems = sectionItems
                
                self?.items = [section]
                
                semaphore.signal()
            } catch {
                semaphore.signal()
            }
        }.resume()
        
        let _ = semaphore.wait(timeout: .distantFuture)
        
        return items
    }

}
