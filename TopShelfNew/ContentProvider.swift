//
//  ContentProvider.swift
//  TopShelfNew
//
//  Created by Saeed Taheri on 9/25/19.
//  Copyright © 2019 Filimo. All rights reserved.
//

import TVServices

class ContentProvider: TVTopShelfContentProvider {
	
	override func loadTopShelfContent(completionHandler: @escaping (TVTopShelfContent?) -> Void) {

		DispatchQueue.global().async { [weak self] in
			guard let self = self else {
				completionHandler(nil)
				return
			}
			self.fetchNewestItems { movies in
				let carouselItems = movies.compactMap { $0.makeCarouselItem() }
				let content = TVTopShelfCarouselContent(style: .details, items: carouselItems)
				completionHandler(content)
			}
		}
	}
	
}

extension ContentProvider {
	
	private func fetchNewestItems(completion: @escaping ([CarouselMovie]) -> Void) {
		var urlRequest = URLRequest(url: URL.homepage)
        urlRequest.httpMethod = "GET"

		guard let data = URLSession.shared.synchronousDataTask(urlrequest: urlRequest).data else {
			completion([])
			return
		}
		
		let compactMovies = extractMovieInfo(from: data)
		
		var items = compactMovies.map { CarouselMovie(info: $0) }

		for (index, movie) in compactMovies.enumerated() {
			var detailUrlRequest = URLRequest(url: URL.movieDetailURL(uuid: movie.id!))
			detailUrlRequest.httpMethod = "GET"
			
			let detailData = URLSession.shared.synchronousDataTask(urlrequest: detailUrlRequest).data
			if let detailData = detailData {
				let movieDetail = extractMovieDetail(from: detailData)
				items[index].detail = movieDetail
			}
		}
		
		completion(items)
	}
	
	private func extractMovieInfo(from data: Data) -> [MovieCompact] {
		do {
			
			let decoder = JSONDecoder()
			let shelfData = try decoder.decode(ShelfResponse.self, from: data)

			for homepage in shelfData.homepage {
				if let firstValuableItem = homepage.data {
					return Array(firstValuableItem.filter({ $0.id != nil }).prefix(10))
				} else {
					continue
				}
			}
			
		} catch {
			return []
		}
		
		return []
	}
	
	private func extractMovieDetail(from data: Data) -> MovieDetail? {
		do {
			let decoder = JSONDecoder()
			let detailResponse = try decoder.decode(MovieDetailResponse.self, from: data)
			
			return detailResponse.movieDetail
			
		} catch {
			return nil
		}
	}
}
