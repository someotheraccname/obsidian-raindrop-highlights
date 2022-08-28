export interface GetRaindropsApiResponse {
	result:       boolean;
	items?:       RaindropItm[] | null | undefined;
	count:        number;
	collectionId: number;
}

export interface RaindropItm {
	excerpt:      string;
	note:         string;
	type:         ItemType;
	cover:        string;
	tags:         string[];
	removed:      boolean;
	_id:          number;
	title:        string;
	collection:   Collection;
	link:         string;
	created:      string;
	lastUpdate:   string;
	important?:   boolean;
	media:        Media[];
	user:         Collection;
	highlights?:  Highlight[] | null | undefined;
	domain:       string;
	creatorRef:   CreatorRef;
	sort:         number;
	collectionId: number;
}

export interface Collection {
	$ref: Ref;
	$id:  number;
	$db:  string;
}

export enum Ref {
	Collections = "collections",
	Users = "users",
}

export interface CreatorRef {
	avatar: string;
	_id:    number;
	name:   string;
	email:  string;
}

export interface Highlight {
	note:       string;
	text:       string;
	created:    Date;
	lastUpdate: Date;
	creatorRef: number;
	_id:        string;
	color:      string | null | undefined;
}

export interface Media {
	type:        MediaType;
	link:        string;
	screenshot?: boolean;
}

export enum MediaType {
	Image = "image",
}

export enum ItemType {
	Article = "article",
	Audio = "audio",
	Link = "link",
	Video = "video",
}
