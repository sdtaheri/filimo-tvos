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
				DispatchQueue.main.async {
					let carouselItems = movies.compactMap { $0.makeCarouselItem() }
					let content = TVTopShelfCarouselContent(style: .details, items: carouselItems)
					completionHandler(content)
				}
			}
		}
	}
	
}

extension ContentProvider {
	
	private func fetchNewestItems(completion: @escaping ([CarouselMovie]) -> Void) {

		var urlRequest = URLRequest(url: URL.specials)
        urlRequest.httpMethod = "GET"
		urlRequest.addAppHeaders()

		URLSession.shared.dataTask(with: urlRequest) { [weak self] data, _, _ in

			guard let data = data else {
				completion([])
				return
			}

			let vitrineMovies = (self?.extractVitrineMovies(from: data) ?? []).prefix(8)

			var items = vitrineMovies.map { CarouselMovie(vitrineInfo: $0) }

			var remainingRequests = vitrineMovies.count * 2 {
				didSet {
					if remainingRequests <= 0 {
						completion(items)
					}
				}
			}

			for (index, movie) in vitrineMovies.enumerated() {

				var oneDetailUrlRequest = URLRequest(url: URL.movieOneDetailURL(uuid: movie.uid))
				oneDetailUrlRequest.httpMethod = "GET"
				oneDetailUrlRequest.addAppHeaders()

				URLSession.shared.dataTask(with: oneDetailUrlRequest) { oneDetailData, _, _ in

					if let oneDetailData = oneDetailData {
						let oneDetail = self?.extractMovieOneDetail(from: oneDetailData)
						items[index].oneDetail = oneDetail
					}

					remainingRequests -= 1
				}.resume()

				var reviewDetailUrlRequest = URLRequest(url: URL.movieReviewDetailURL(uuid: movie.uid))
				reviewDetailUrlRequest.httpMethod = "GET"
				reviewDetailUrlRequest.addAppHeaders()

				URLSession.shared.dataTask(with: reviewDetailUrlRequest) { reviewDetailData, _, _ in

					if let reviewDetailData = reviewDetailData {
						let reviewDetail = self?.extractMovieReviewDetail(from: reviewDetailData)
						items[index].reviewDetail = reviewDetail
					}

					remainingRequests -= 1
				}.resume()
			}

		}.resume()
	}
	
	private func extractVitrineMovies(from data: Data) -> [VitrineMovie] {
		do {
			let decoder = JSONDecoder()
			let vitrineResponse = try decoder.decode(VitrineResponse.self, from: data)

			return vitrineResponse.data.flatMap {
				$0.movies.data
			}
		} catch {
			print(error.localizedDescription)
			return []
		}
	}
	
	private func extractMovieOneDetail(from data: Data) -> MovieDetailGeneral? {
		do {
			let decoder = JSONDecoder()
			let detailResponse = try decoder.decode(MovieOneDetailResponse.self, from: data)
			return detailResponse.data.general
		} catch {
			print(error.localizedDescription)
			return nil
		}
	}

	private func extractMovieReviewDetail(from data: Data) -> MovieDetailReview? {
		do {
			let decoder = JSONDecoder()
			return try decoder.decode(MovieDetailReview.self, from: data)
		} catch {
			print(error.localizedDescription)
			return nil
		}
	}

}
