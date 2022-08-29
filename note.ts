export namespace EsJsTemplates {

	const FRONT_MATTER: string = "---\n" +
		"tags: [" +
		"<% raindrop.tags.forEach(function(tag){ %>" +
		"\"#<%= tag %>\"," +
		"<% }); %>" +
		"]\n" +
		"---\n"

	export const OBS_NOTE_TEMPLATE: string =
		FRONT_MATTER +
		"<div class='fm-sep'>&nbsp;</div>" +
		"<div class='meta-container'>" +
		"<div>source</div><div><a href='<%= raindrop.link %>'><%= raindrop.domain %></a></div>" +
		"<div>raindrop</div><div><a href='https://app.raindrop.io/my/0/item/<%= raindrop._id %>/cache'>link</a></div>" +
		"<div>imported</div><div><%= imported %>h</div>" +
		"<div>updated</div><div><%= lastUpdate %>h</div>" +
		"<div>created</div><div><%= created %>h</div>" +
		"</div>" +

		"<% if (raindrop.excerpt) { %>" +
		"<div class='container'>" +
		"    <header><a href='<%= raindrop.link %>'><%= raindrop.title %></a></header>" +
		"    <article><a href='<%= raindrop.link %>'><img src='<%= raindrop.cover %>' alt=''/></a></article>" +
		"    <aside><%= raindrop.excerpt %></aside>" +
		"</div>" +
		"<% } else { %>" +
		"<div class='simple-container'>" +
		"    <header class='simple-header'><a href='<%= raindrop.link %>'><%= raindrop.title %></a></header>" +
		"    <article class='simple-article'><a href='<%= raindrop.link %>'><img src='<%= raindrop.cover %>' alt=''/></a></article>" +
		"</div>" +
		"<% } %>" +

		"<% if (raindrop.highlights.length > 0) { %>" +
		"<h2>Highlights</h2>" +
		"<div>" +
		"    <% raindrop.highlights.forEach(function(highlight){ %>" +
		" <% highlight.color = highlight.color || 'yellow' %>" +
		"<blockquote class='<%=highlight.color%>'>" +
		"<p><%= highlight.text %></p>" +
		"<% if (highlight.note) { %>" +
		"<p class='highlight-note'>Notiz: <%= highlight.note %></p>" +
		"    <% } %>" +
		"</blockquote>" +
		"    <% }); %>" +
		"</div>" +
		"<% } %>" +
		"";
}
