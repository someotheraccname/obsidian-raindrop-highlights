export interface GetCollectionsApiResponse {
	result: boolean;
	items?: RaindropCollection[] | null | undefined;
}

export interface RaindropCollection {
	title:       string;
	description: string;
	public:      boolean;
	view:        string;
	count:       number;
	cover:       any[];
	expanded:    boolean;
	_id:         number;
	user:        User;
	creatorRef:  CreatorRef;
	lastAction:  Date;
	created:     Date;
	lastUpdate:  Date;
	sort:        number;
	slug:        string;
	access:      Access;
	author:      boolean;
}

export interface Access {
	for:       number;
	level:     number;
	root:      boolean;
	draggable: boolean;
}

export interface CreatorRef {
	_id:   number;
	name:  string;
	email: string;
}

export interface User {
	$ref: string;
	$id:  number;
	$db:  string;
}
