import {request} from "obsidian";
import {GetRaindropsApiResponse, RaindropItm} from "./GetRaindropsApiResponse";
import {GetCollectionsApiResponse, RaindropCollection} from "./GetCollectionsApiResponse";

class Raindrop {
	private static readonly raindropIoBaseUrl = "https://api.raindrop.io/rest/v1";

	private static authToken = "";

	static setAuthToken(authToken: string) {
		Raindrop.authToken = (authToken || "").trim();
	}

	static async collections() {
		if (!Raindrop.authToken) {
			return Promise.reject("Abort as authToken is not set!")
		}

		let url = Raindrop.raindropIoBaseUrl + "/collections";
		const options = {
			url: url,
			headers: {
				'Authorization': 'Bearer ' + Raindrop.authToken
			}
		};
		// pagination wird hier nicht unterstützt
		return request(options)
			.then(result => {
				const res: GetCollectionsApiResponse = JSON.parse(result);
				return res.items || [];
			});
	}

	static async raindrops(collectionId: string) {
		if (!Raindrop.authToken) {
			return Promise.reject("Abort as authToken is not set!")
		}

		let raindrops: RaindropItm[] = [];
		let curPage = 0;
		let doContinue = true;

		do {
			let url = Raindrop.raindropIoBaseUrl + "/raindrops/" + collectionId + "?perpage=25&page=" + curPage;
			const options = {
				url: url,
				headers: {
					'Authorization': 'Bearer ' + Raindrop.authToken,
				}
			};
			const result = await request(options);
			const res: GetRaindropsApiResponse = JSON.parse(result);
			const itms = res.items || [];
			raindrops = raindrops.concat(itms);
			curPage++;
			doContinue = itms.length > 0
		} while (doContinue)
		return raindrops;
	}

	static async moveRaindropsToCollection(from: RaindropCollection, to: RaindropCollection) {
		if (!Raindrop.authToken) {
			return Promise.reject("Abort as authToken is not set!")
		}

		let url = Raindrop.raindropIoBaseUrl + "/raindrops/" + from._id;
		const options = {
			url: url,
			headers: {
				'Authorization': 'Bearer ' + Raindrop.authToken,
				"Content-Type": "application/json"
			},
			method: "PUT",
			body: JSON.stringify({
				"collection": {"$id": to._id}
			}),
			json: true
		};

		return request(options);
	}


	static async createCollection(title: string) {
		if (!Raindrop.authToken) {
			return Promise.reject("Abort as authToken is not set!")
		}

		let url = Raindrop.raindropIoBaseUrl + "/collection";
		const options = {
			url: url,
			headers: {
				'Authorization': 'Bearer ' + Raindrop.authToken,
				"Content-Type": "application/json"
			},
			method: "POST",
			body: JSON.stringify({
				"title": title
			}),
			json: true
		};

		return request(options);
	}

}

module.exports = Raindrop;
